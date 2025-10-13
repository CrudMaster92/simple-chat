const state = {
  score: 1240000,
  multiplier: 2.4,
  ball: 2,
  stability: 92,
  missionProgress: 48,
  uptimeSeconds: 13337,
};

const combos = [
  { name: "Orbit Lane Sweep", points: 75000 },
  { name: "Grav-Well Jackpot", points: 98000 },
  { name: "Fuel Run Rush", points: 120000 },
  { name: "Vector Net Ricochet", points: 185000 },
  { name: "Quantum Field Sync", points: 260000 },
];

const missions = {
  orbital: {
    description: "Maintain a clean orbit, collect nav beacons, and stack jackpots before the reactor cycle ends.",
    baselineProgress: 48,
  },
  rescue: {
    description: "Escort stranded cadets through the wormgate lanes and keep shield energy above 70% at all times.",
    baselineProgress: 35,
  },
  meteor: {
    description: "Salvage meteor cores, bounce through the Grav-Well, and chain ramps to open the cargo vault.",
    baselineProgress: 56,
  },
  anomaly: {
    description: "Trace spectral anomalies, trigger combo reactors in sequence, and stabilize the vector net field.",
    baselineProgress: 62,
  },
};

const logList = document.getElementById("missionLog");
const statusPill = document.getElementById("statusPill");
const scoreValue = document.getElementById("scoreValue");
const multiplierValue = document.getElementById("multiplierValue");
const ballValue = document.getElementById("ballValue");
const stabilityValue = document.getElementById("stabilityValue");
const missionProgress = document.getElementById("missionProgress");
const missionProgressLabel = document.getElementById("missionProgressLabel");
const missionSummary = document.getElementById("missionSummary");
const missionSelect = document.getElementById("missionSelect");
const uptimeDisplay = document.getElementById("uptimeDisplay");
const gravityDial = document.getElementById("gravityDial");
const gravityReading = document.getElementById("gravityReading");
const tiltGuard = document.getElementById("tiltGuard");
const boostSelect = document.getElementById("boostSelect");
const launchButton = document.getElementById("launchButton");
const comboButton = document.getElementById("comboButton");
const saveButton = document.getElementById("saveButton");
const viewToggle = document.getElementById("viewToggle");
const applet = document.querySelector(".applet");
const comboList = document.getElementById("comboList");
const laneElements = Array.from(document.querySelectorAll(".lane"));
const barElements = Array.from(document.querySelectorAll(".bar"));

let activeComboIndex = 0;
let activeLaneIndex = 0;

function formatScore(value) {
  return value.toLocaleString("en-US");
}

function updateStatusPill() {
  statusPill.classList.remove("warning", "critical");
  if (state.stability >= 85) {
    statusPill.textContent = "Stable Orbit";
  } else if (state.stability >= 65) {
    statusPill.textContent = "Caution";
    statusPill.classList.add("warning");
  } else {
    statusPill.textContent = "Critical";
    statusPill.classList.add("critical");
  }
}

function updateScoreboard() {
  scoreValue.textContent = formatScore(state.score);
  multiplierValue.textContent = `x${state.multiplier.toFixed(1)}`;
  ballValue.textContent = state.ball.toString().padStart(2, "0");
  stabilityValue.textContent = `${Math.round(state.stability)}%`;
  missionProgress.value = Math.min(100, Math.max(0, state.missionProgress));
  missionProgressLabel.textContent = `${Math.round(state.missionProgress)}%`;
  updateStatusPill();
}

function renderCombos() {
  comboList.innerHTML = "";
  combos.forEach((combo, index) => {
    const item = document.createElement("li");
    item.className = "combo-item";
    item.dataset.index = index.toString();

    const name = document.createElement("span");
    name.textContent = combo.name;

    const points = document.createElement("span");
    points.className = "combo-points";
    points.textContent = `+${formatScore(combo.points)}`;

    item.append(name, points);
    comboList.appendChild(item);
  });
}

function highlightCombo(index) {
  const items = Array.from(comboList.children);
  items.forEach((item, itemIndex) => {
    if (itemIndex === index) {
      item.classList.add("active");
    } else {
      item.classList.remove("active");
    }
  });
}

function cycleLaneHighlight() {
  laneElements.forEach((lane, index) => {
    lane.classList.toggle("active", index === activeLaneIndex);
  });
  activeLaneIndex = (activeLaneIndex + 1) % laneElements.length;
}

function pushLog(message, tag = "INFO") {
  const entry = document.createElement("li");
  entry.className = "log-entry";

  const label = document.createElement("strong");
  label.textContent = tag;

  const text = document.createElement("span");
  text.textContent = message;

  const time = document.createElement("time");
  time.dateTime = new Date().toISOString();
  time.textContent = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  entry.append(label, text, time);
  logList.prepend(entry);

  const maxEntries = 7;
  while (logList.children.length > maxEntries) {
    logList.removeChild(logList.lastChild);
  }
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function updateBars() {
  barElements.forEach((bar) => {
    const fill = bar.querySelector(".bar-fill");
    if (!fill) return;
    const target = Math.min(100, Math.max(20, Math.round(randomBetween(35, 95))));
    fill.style.width = `${target}%`;
  });
}

function updateUptimeDisplay() {
  state.uptimeSeconds += 1;
  const hours = Math.floor(state.uptimeSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const minutes = Math.floor((state.uptimeSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(state.uptimeSeconds % 60)
    .toString()
    .padStart(2, "0");
  uptimeDisplay.textContent = `Uptime: ${hours}:${minutes}:${seconds}`;
}

function handleMissionChange(value) {
  const mission = missions[value];
  if (!mission) return;
  missionSummary.textContent = mission.description;
  state.missionProgress = mission.baselineProgress;
  state.multiplier = 2 + value.length / 10;
  updateScoreboard();
  pushLog(`Campaign switched to ${missionSelect.options[missionSelect.selectedIndex].text}.`, "MODE");
}

function handleLaunch() {
  const scoreGain = Math.round(randomBetween(52000, 140000));
  state.score += scoreGain;
  state.ball = ((state.ball % 3) + 1);
  state.stability = Math.min(100, state.stability + randomBetween(1, 4));
  state.missionProgress = Math.min(100, state.missionProgress + randomBetween(4, 9));
  updateScoreboard();
  updateBars();
  pushLog(`Ball launched: +${formatScore(scoreGain)} pts and stability recalibrated.`, "LAUNCH");
}

function handleComboTrigger() {
  activeComboIndex = (activeComboIndex + 1) % combos.length;
  highlightCombo(activeComboIndex);
  state.multiplier = Math.min(5.0, state.multiplier + 0.3);
  state.stability = Math.max(40, state.stability - randomBetween(2, 5));
  state.score += combos[activeComboIndex].points;
  state.missionProgress = Math.min(100, state.missionProgress + randomBetween(3, 6));
  updateScoreboard();
  cycleLaneHighlight();
  updateBars();
  pushLog(`${combos[activeComboIndex].name} fired! Multiplier boosted.`, "COMBO");
}

function handleSaveSnapshot() {
  const boost = boostSelect.options[boostSelect.selectedIndex].text;
  pushLog(`Replay snapshot stored with ${boost}.`, "SAVE");
}

function toggleTiltGuard() {
  const active = tiltGuard.getAttribute("data-active") === "true";
  const nextState = !active;
  tiltGuard.setAttribute("data-active", nextState.toString());
  tiltGuard.setAttribute("aria-checked", nextState.toString());
  tiltGuard.querySelector(".toggle-label").textContent = nextState ? "Armed" : "Idle";
  pushLog(`Tilt guard ${nextState ? "engaged" : "disengaged"}.`, "SAFETY");
}

function setupTiltGuardInteractions() {
  tiltGuard.addEventListener("click", toggleTiltGuard);
  tiltGuard.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      toggleTiltGuard();
    }
  });
}

function setupGravityDial() {
  gravityDial.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    gravityReading.textContent = `${value}%`;
    state.stability = Math.min(100, Math.max(40, 120 - value / 1.6));
    updateScoreboard();
  });
}

function setupViewToggle() {
  viewToggle.addEventListener("click", () => {
    const currentMode = applet.getAttribute("data-mode") || "telemetry";
    const nextMode = currentMode === "telemetry" ? "flightpath" : "telemetry";
    applet.setAttribute("data-mode", nextMode);
    viewToggle.textContent =
      nextMode === "telemetry" ? "Switch to Flightpath View" : "Switch to Telemetry View";
    pushLog(`Visualizer toggled to ${nextMode} mode.`, "VIEW");
  });
}

function seedLog() {
  const initialEntries = [
    { message: "Jackpot collected in the Grav-Well lane.", tag: "JACKPOT" },
    { message: "Photon Pulse boost ready for deployment.", tag: "BOOST" },
    { message: "Orbit sweep combo primed for launch.", tag: "COMMS" },
  ];

  initialEntries.forEach((entry) => pushLog(entry.message, entry.tag));
}

function init() {
  renderCombos();
  highlightCombo(activeComboIndex);
  cycleLaneHighlight();
  seedLog();
  setupTiltGuardInteractions();
  setupGravityDial();
  setupViewToggle();
  updateScoreboard();
  updateBars();
  handleMissionChange(missionSelect.value);

  missionSelect.addEventListener("change", (event) => handleMissionChange(event.target.value));
  launchButton.addEventListener("click", handleLaunch);
  comboButton.addEventListener("click", handleComboTrigger);
  saveButton.addEventListener("click", handleSaveSnapshot);

  setInterval(updateUptimeDisplay, 1000);
  setInterval(cycleLaneHighlight, 3200);
}

init();
