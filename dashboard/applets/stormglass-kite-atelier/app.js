const frameInputs = document.querySelectorAll('input[name="frame"]');
const paletteSelect = document.getElementById("paletteSelect");
const pathSelect = document.getElementById("pathSelect");
const thermalSlider = document.getElementById("thermalIntensity");
const gustSlider = document.getElementById("gustPulse");
const thermalReadout = document.getElementById("thermalReadout");
const gustReadout = document.getElementById("gustReadout");
const launchButton = document.getElementById("launchButton");
const addThermalButton = document.getElementById("addThermal");
const kiteField = document.getElementById("kiteField");
const thermalColumns = document.getElementById("thermalColumns");
const performanceLog = document.getElementById("performanceLog");
const skyStatus = document.getElementById("skyStatus");

let kiteCount = 0;
let thermalCount = 0;

const paletteDescriptions = {
  sunspill: "Sunspill Amber",
  tidalglass: "Tidal Glass",
  auroramist: "Aurora Mist",
  emberveil: "Ember Veil",
};

const frameLabels = {
  diamond: "Diamond Crest",
  winged: "Winged Delta",
  dragon: "Dragon Arc",
};

const pathDescriptions = {
  spiral: "Spiral Climb",
  drift: "Lantern Drift",
  cascade: "Cascade Sweep",
};

function getSelectedFrame() {
  const checked = Array.from(frameInputs).find((input) => input.checked);
  return checked ? checked.value : "diamond";
}

function updateThermalStatus() {
  const thermalValue = Number(thermalSlider.value);
  const gustValue = Number(gustSlider.value);
  thermalReadout.textContent = `${thermalValue}%`;
  gustReadout.textContent = `${gustValue}s`;
  document.documentElement.style.setProperty("--gust-cycle", `${gustValue}s`);

  const description = thermalValue > 80
    ? "Thermals roaring"
    : thermalValue > 55
      ? "Thermals humming"
      : thermalValue > 30
        ? "Thermals murmuring"
        : "Thermals resting";

  skyStatus.textContent = `${description} at ${thermalValue}%. Gust cadence set to ${gustValue} seconds.`;

  const gustDuration = Math.max(10, gustValue + 6);
  kiteField.querySelectorAll(".kite").forEach((kite) => {
    kite.style.setProperty("--path-duration", `${gustDuration}s`);
  });

  Array.from(thermalColumns.children).forEach((column) => {
    const height = 120 + thermalValue * 2.2;
    column.style.height = `${height}px`;
    column.style.opacity = (0.3 + thermalValue / 200).toFixed(2);
  });
}

function recordEvent(message) {
  const entry = document.createElement("li");
  const label = document.createElement("span");
  label.textContent = message;
  const timestamp = document.createElement("span");
  timestamp.className = "log__time";
  timestamp.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  entry.append(label, timestamp);
  performanceLog.prepend(entry);
  while (performanceLog.children.length > 10) {
    performanceLog.removeChild(performanceLog.lastElementChild);
  }
}

function createKiteElement({ frame, palette, path }) {
  const kite = document.createElement("div");
  kite.className = `kite kite--${frame}`;
  kite.dataset.palette = palette;
  kite.dataset.path = path;
  kite.textContent = `Kite ${String.fromCharCode(65 + ((kiteCount - 1) % 26))}`;
  const gustDuration = Math.max(10, Number(gustSlider.value) + 6);
  kite.style.setProperty("--path-duration", `${gustDuration}s`);
  kite.style.animationDelay = `-${Math.random() * (gustDuration / 2)}s`;
  kite.style.top = "0";
  kite.style.left = "0";
  return kite;
}

function launchKite() {
  kiteCount += 1;
  const frame = getSelectedFrame();
  const palette = paletteSelect.value;
  const path = pathSelect.value;
  const kite = createKiteElement({ frame, palette, path });
  kiteField.appendChild(kite);

  const entry = `${frameLabels[frame]} in ${paletteDescriptions[palette]} charts a ${pathDescriptions[path].toLowerCase()}.`;
  recordEvent(entry);
}

function createThermalColumn() {
  const column = document.createElement("div");
  column.className = "thermal";
  const thermalValue = Number(thermalSlider.value);
  column.style.height = `${120 + thermalValue * 2.2}px`;
  column.style.opacity = (0.3 + thermalValue / 200).toFixed(2);
  column.style.animationDelay = `-${Math.random() * Number(gustSlider.value)}s`;
  return column;
}

function addThermalColumn() {
  if (thermalColumns.children.length >= 5) {
    thermalColumns.removeChild(thermalColumns.firstElementChild);
  }
  thermalCount += 1;
  const column = createThermalColumn();
  thermalColumns.appendChild(column);
  recordEvent(`Thermal column ${thermalCount} swells to guide the fleet.`);
}

launchButton.addEventListener("click", () => {
  launchKite();
});

addThermalButton.addEventListener("click", () => {
  addThermalColumn();
});

[thermalSlider, gustSlider].forEach((slider) => {
  slider.addEventListener("input", updateThermalStatus);
});

function seedThermals() {
  for (let i = 0; i < 3; i += 1) {
    const column = createThermalColumn();
    column.style.opacity = (0.25 + i * 0.1).toFixed(2);
    thermalColumns.appendChild(column);
  }
}

function seedKites() {
  const seedData = [
    { frame: "diamond", palette: "sunspill", path: "spiral" },
    { frame: "winged", palette: "tidalglass", path: "drift" },
    { frame: "dragon", palette: "auroramist", path: "cascade" },
  ];

  seedData.forEach((data) => {
    kiteCount += 1;
    const kite = createKiteElement(data);
    kite.style.animationDelay = `-${Math.random() * 8}s`;
    kiteField.appendChild(kite);
  });

  recordEvent("Resident trio lifts off to map the breeze lanes.");
}

seedThermals();
seedKites();
updateThermalStatus();
