const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");
const searchForm = document.getElementById("search-form");
const locateBtn = document.getElementById("locate-btn");

const map = L.map("map", {
  center: [20, 0],
  zoom: 2,
  worldCopyJump: true,
  zoomControl: false,
  minZoom: 2,
});

L.control.zoom({ position: "bottomright" }).addTo(map);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const markerLayer = L.layerGroup().addTo(map);
const userLayer = L.layerGroup().addTo(map);

function setStatus(message = "") {
  statusEl.textContent = message;
}

function resetResults() {
  resultsEl.innerHTML = "";
  const heading = document.createElement("h2");
  heading.textContent = "Recent spots";
  resultsEl.appendChild(heading);
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = "Search for a place to see results here.";
  resultsEl.appendChild(empty);
}

resetResults();

function createPopup(label, subtitle) {
  const wrapper = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = label;
  const detail = document.createElement("div");
  detail.textContent = subtitle ?? "";
  wrapper.appendChild(title);
  wrapper.appendChild(detail);
  return wrapper;
}

function focusOnLocation({ lat, lon, label, subtitle }) {
  markerLayer.clearLayers();
  const marker = L.marker([lat, lon]).addTo(markerLayer);
  const popup = createPopup(label, subtitle);
  marker.bindPopup(popup).openPopup();
  map.setView([lat, lon], 13, { animate: true });
}

function renderResults(locations, query) {
  resultsEl.innerHTML = "";
  const heading = document.createElement("h2");
  heading.textContent = locations.length ? "Search results" : "No results";
  resultsEl.appendChild(heading);

  if (!locations.length) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = `No matches for "${query}". Try another name or add a city.`;
    resultsEl.appendChild(empty);
    return;
  }

  locations.slice(0, 5).forEach((location) => {
    const { display_name, lat, lon } = location;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "result-item";

    const title = document.createElement("strong");
    title.textContent = location.namedetails?.name ?? display_name.split(",")[0];
    const detail = document.createElement("span");
    detail.textContent = display_name;

    button.appendChild(title);
    button.appendChild(detail);

    button.addEventListener("click", () => {
      focusOnLocation({
        lat: Number(lat),
        lon: Number(lon),
        label: title.textContent,
        subtitle: display_name,
      });
      setStatus(`Centered on ${display_name}.`);
    });

    button.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        button.click();
      }
    });

    resultsEl.appendChild(button);
  });
}

async function searchPlaces(query) {
  setStatus(`Searching for "${query}"...`);
  try {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "5");
    url.searchParams.set("addressdetails", "1");
    url.searchParams.set("namedetails", "1");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Search request failed (${response.status})`);
    }

    const locations = await response.json();
    if (!Array.isArray(locations)) {
      throw new Error("Unexpected response format.");
    }

    renderResults(locations, query);
    if (locations.length) {
      const first = locations[0];
      focusOnLocation({
        lat: Number(first.lat),
        lon: Number(first.lon),
        label: first.namedetails?.name ?? first.display_name.split(",")[0],
        subtitle: first.display_name,
      });
      setStatus(`Showing top results for "${query}".`);
    } else {
      map.setView([20, 0], 2);
      setStatus(`Couldn't find matches for "${query}".`);
    }
  } catch (error) {
    console.error(error);
    setStatus("Something went wrong while searching. Please try again.");
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(searchForm);
  const query = formData.get("query").trim();
  if (!query) {
    setStatus("Enter a place to search.");
    return;
  }
  searchPlaces(query);
});

locateBtn.addEventListener("click", () => {
  if (!navigator.geolocation) {
    setStatus("Geolocation isn't supported in this browser.");
    return;
  }

  setStatus("Locating you...");
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude, accuracy } = position.coords;
      userLayer.clearLayers();
      const marker = L.circleMarker([latitude, longitude], {
        radius: 10,
        color: "#ff7844",
        fillColor: "#ff7844",
        fillOpacity: 0.6,
        weight: 2,
      }).addTo(userLayer);
      const accuracyCircle = L.circle([latitude, longitude], {
        radius: accuracy,
        color: "#f0b29a",
        weight: 1,
        fillOpacity: 0.1,
      }).addTo(userLayer);
      marker.bindPopup(createPopup("You are here", `Accuracy ±${Math.round(accuracy)} m`)).openPopup();
      map.fitBounds(accuracyCircle.getBounds(), { maxZoom: 15 });
      setStatus("Centered on your location.");
    },
    (error) => {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          setStatus("Location request was denied.");
          break;
        case error.POSITION_UNAVAILABLE:
          setStatus("Location information is unavailable.");
          break;
        case error.TIMEOUT:
          setStatus("Location request timed out. Try again.");
          break;
        default:
          setStatus("Couldn't retrieve your location.");
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    }
  );
});

// Provide keyboard shortcut for quick focus on the map
window.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "m") {
    event.preventDefault();
    document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "center" });
  }
});
