const FEED_URL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

const rippleBand = document.querySelector("#rippleBand");
const eventList = document.querySelector("#eventList");
const headerBadge = document.querySelector(".header__badge");
const eventCountEl = document.querySelector("#eventCount");
const maxMagnitudeEl = document.querySelector("#maxMagnitude");
const maxLocationEl = document.querySelector("#maxLocation");
const latestAgoEl = document.querySelector("#latestAgo");
const latestLocationEl = document.querySelector("#latestLocation");

const RELATIVE_TIME = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const NUMBER_FORMAT = new Intl.NumberFormat("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const TIME_FORMAT = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
});

function timeAgo(timestamp) {
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.round(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return RELATIVE_TIME.format(-diffMinutes, "minute");
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return RELATIVE_TIME.format(-diffHours, "hour");
  const diffDays = Math.round(diffHours / 24);
  return RELATIVE_TIME.format(-diffDays, "day");
}

function getMagnitudeBand(mag) {
  if (mag >= 6) return "major";
  if (mag >= 4) return "strong";
  if (mag >= 2) return "light";
  return "micro";
}

function createRipple(feature) {
  const { mag, place, time } = feature.properties;
  const depth = feature.geometry?.coordinates?.[2] ?? null;
  const band = getMagnitudeBand(mag);

  const ripple = document.createElement("div");
  ripple.className = "ripple";
  ripple.dataset.band = band;
  ripple.dataset.mag = `M${NUMBER_FORMAT.format(mag)}`;
  ripple.setAttribute(
    "aria-label",
    `${NUMBER_FORMAT.format(mag)} magnitude at ${place ?? "unknown location"}, ${timeAgo(time)}`
  );

  const width = Math.min(200, Math.max(70, mag * 26 + 42));
  ripple.style.setProperty("--pulse", `${width}px`);

  if (typeof depth === "number") {
    const glowOpacity = depth <= 35 ? 0.75 : depth <= 70 ? 0.55 : 0.35;
    ripple.style.setProperty("--glow", `rgba(240, 143, 46, ${glowOpacity})`);
  }

  rippleBand.appendChild(ripple);
}

function createCard(feature) {
  const { mag, place, time, url } = feature.properties;
  const depth = feature.geometry?.coordinates?.[2] ?? null;
  const band = getMagnitudeBand(mag);

  const card = document.createElement("article");
  card.className = "quake-card";

  const title = document.createElement("h3");
  title.className = "quake-card__title";
  title.textContent = place ?? "Uncatalogued epicenter";

  const meta = document.createElement("div");
  meta.className = "quake-card__meta";

  const magBadge = document.createElement("span");
  magBadge.className = "meta-badge";
  magBadge.dataset.band = band;
  magBadge.textContent = `M ${NUMBER_FORMAT.format(mag)}`;

  const timeSpan = document.createElement("span");
  timeSpan.innerHTML = `🕑 <span>${timeAgo(time)}</span>`;

  const regionSpan = document.createElement("span");
  regionSpan.innerHTML = `📍 <span>${place?.split(" of ").pop() ?? "Unknown region"}</span>`;

  meta.append(magBadge, timeSpan, regionSpan);

  card.append(title, meta);

  if (typeof depth === "number") {
    const depthEl = document.createElement("p");
    depthEl.className = "quake-card__depth";
    depthEl.textContent = `Estimated depth: ${depth.toFixed(1)} km`;
    card.append(depthEl);
  }

  const wave = document.createElement("div");
  wave.className = "quake-card__wave";
  wave.style.transform = `scaleX(${Math.min(1.4, Math.max(0.45, mag / 5))})`;
  wave.setAttribute("aria-hidden", "true");

  const link = document.createElement("a");
  link.className = "quake-card__link";
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = "View on USGS";

  link.insertAdjacentHTML("beforeend", "<span aria-hidden=\"true\">↗</span>");

  card.append(wave, link);
  return card;
}

async function loadData() {
  try {
    const response = await fetch(FEED_URL, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`USGS feed returned ${response.status}`);
    }

    const data = await response.json();
    const features = (data.features ?? []).filter((feature) => typeof feature.properties?.mag === "number");

    if (!features.length) {
      rippleBand.innerHTML = "<p class=\"panorama__placeholder\">No seismic activity detected in the past day.</p>";
      eventList.innerHTML = "<p class=\"grid__placeholder\">The feed is quiet right now. Check back soon for fresh ripples.</p>";
      eventList.setAttribute("aria-busy", "false");
      return;
    }

    const sortedByMag = [...features].sort((a, b) => b.properties.mag - a.properties.mag);
    const sortedByTime = [...features].sort((a, b) => b.properties.time - a.properties.time);

    const rippleSample = sortedByMag.slice(0, 16);
    rippleBand.innerHTML = "";
    rippleSample.forEach(createRipple);

    const latest = sortedByTime[0];
    const strongest = sortedByMag[0];

    eventCountEl.textContent = features.length.toString();
    maxMagnitudeEl.textContent = NUMBER_FORMAT.format(strongest.properties.mag);
    maxLocationEl.textContent = strongest.properties.place ?? "Unknown";
    latestAgoEl.textContent = timeAgo(latest.properties.time);
    latestLocationEl.textContent = latest.properties.place ?? "Unknown";

    if (typeof data.metadata?.generated === "number") {
      const generatedAt = new Date(data.metadata.generated);
      headerBadge.textContent = `Updated ${TIME_FORMAT.format(generatedAt)} UTC`;
    }

    eventList.innerHTML = "";
    const slice = sortedByTime.slice(0, 18);
    slice.forEach((feature) => {
      const card = createCard(feature);
      eventList.appendChild(card);
    });
    eventList.setAttribute("aria-busy", "false");
  } catch (error) {
    console.error("Failed to load USGS feed", error);
    rippleBand.innerHTML = "<p class=\"panorama__placeholder\">Unable to reach the USGS feed.</p>";
    eventList.innerHTML = "<p class=\"grid__placeholder\">We couldn’t fetch the quake cards. Please retry in a moment.</p>";
    headerBadge.textContent = "Feed offline";
    eventList.setAttribute("aria-busy", "false");
  }
}

loadData();

const REFRESH_INTERVAL = 5 * 60 * 1000;
setInterval(loadData, REFRESH_INTERVAL);
