const state = {
  environment: {
    area: 60,
    sunlight: 6.5,
    wind: "south",
    waterAccess: true,
    windScreen: false,
    herbBorder: true,
    height: 12,
  },
  hives: [],
  blooms: {
    spring: ["wild thyme"],
    summer: ["lavandin"],
    "late-summer": ["sunflower"],
    autumn: ["aster"],
  },
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const hivePresets = [
  { focus: "Forager Relay", zone: "South rail", cue: "Dawn release" },
  { focus: "Explorer Scout", zone: "Greenhouse edge", cue: "Midday drift" },
  { focus: "Gentle Brood", zone: "Planter wall", cue: "Late afternoon hush" },
  { focus: "Forager Relay", zone: "Skylight corner", cue: "Golden hour glide" },
  { focus: "Explorer Scout", zone: "Windbreak lane", cue: "Twilight sweep" },
  { focus: "Gentle Brood", zone: "Central deck", cue: "Sunset settle" },
];

const zoneOptions = [
  "South rail",
  "Central deck",
  "Greenhouse edge",
  "Skylight corner",
  "Planter wall",
  "Windbreak lane",
];

const focusTemperamentMap = {
  "Forager Relay": 68,
  "Gentle Brood": 42,
  "Explorer Scout": 58,
};

const cueOptions = [
  "Dawn release",
  "Midday drift",
  "Late afternoon hush",
  "Golden hour glide",
  "Twilight sweep",
  "Sunset settle",
];

const areaInput = document.getElementById("area");
const areaValue = document.getElementById("areaValue");
const sunlightInput = document.getElementById("sunlight");
const sunlightValue = document.getElementById("sunlightValue");
const windSelect = document.getElementById("wind");
const waterToggle = document.getElementById("waterAccess");
const windScreenToggle = document.getElementById("windScreen");
const herbBorderToggle = document.getElementById("herbBorder");
const heightInput = document.getElementById("height");
const heightValue = document.getElementById("heightValue");
const hiveGrid = document.getElementById("hiveGrid");
const addHiveButton = document.getElementById("addHive");
const riskNeedle = document.getElementById("riskNeedle");
const riskLabel = document.getElementById("riskLabel");
const trafficList = document.getElementById("trafficList");
const narrativeText = document.getElementById("narrativeText");
const generatePlanButton = document.getElementById("generatePlan");
const resetPlannerButton = document.getElementById("resetPlanner");

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function createHive(index) {
  const preset = hivePresets[index % hivePresets.length];
  return {
    id: createId(),
    name: `Hive ${index + 1}`,
    focus: preset.focus,
    zone: preset.zone,
    cue: preset.cue,
    temperament: focusTemperamentMap[preset.focus] ?? 55,
  };
}

function renderHives() {
  hiveGrid.innerHTML = "";
  if (!state.hives.length) {
    const empty = document.createElement("p");
    empty.className = "hint";
    empty.textContent = "Add hive slots to begin crafting staggered pollinator routes.";
    hiveGrid.appendChild(empty);
    updateAddHiveButton();
    return;
  }

  state.hives.forEach((hive) => {
    const card = document.createElement("article");
    card.className = "hive-card";

    const header = document.createElement("header");
    const title = document.createElement("h3");
    title.textContent = hive.name;
    title.contentEditable = true;
    title.spellcheck = false;
    title.addEventListener("input", () => {
      const value = title.textContent?.trim() ?? "";
      hive.name = value || "Unnamed hive";
      title.classList.toggle("empty", !value);
      renderInsights();
    });

    const remove = document.createElement("button");
    remove.className = "remove";
    remove.type = "button";
    remove.setAttribute("aria-label", `Remove ${hive.name}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      state.hives = state.hives.filter((item) => item.id !== hive.id);
      renderHives();
      renderInsights();
    });

    header.append(title, remove);

    const focusRow = document.createElement("div");
    focusRow.className = "row";
    const focusLabel = document.createElement("label");
    focusLabel.textContent = "Colony focus";
    focusRow.appendChild(focusLabel);
    const focusSelect = document.createElement("select");
    ["Forager Relay", "Gentle Brood", "Explorer Scout"].forEach((focus) => {
      const option = document.createElement("option");
      option.value = focus;
      option.textContent = focus;
      if (focus === hive.focus) option.selected = true;
      focusSelect.appendChild(option);
    });
    focusSelect.addEventListener("change", () => {
      hive.focus = focusSelect.value;
      if (!hive.manualTemperament) {
        hive.temperament = focusTemperamentMap[hive.focus] ?? hive.temperament;
        temperamentInput.value = hive.temperament;
        temperamentDisplay.textContent = describeTemperament(hive.temperament);
      }
      renderInsights();
      updateBadgeRow();
    });
    focusRow.appendChild(focusSelect);

    const zoneRow = document.createElement("div");
    zoneRow.className = "row";
    const zoneLabel = document.createElement("label");
    zoneLabel.textContent = "Terrace zone";
    zoneRow.appendChild(zoneLabel);
    const zoneSelect = document.createElement("select");
    zoneOptions.forEach((zone) => {
      const option = document.createElement("option");
      option.value = zone;
      option.textContent = zone;
      if (zone === hive.zone) option.selected = true;
      zoneSelect.appendChild(option);
    });
    zoneSelect.addEventListener("change", () => {
      hive.zone = zoneSelect.value;
      renderInsights();
      updateBadgeRow();
    });
    zoneRow.appendChild(zoneSelect);

    const cueRow = document.createElement("div");
    cueRow.className = "row";
    const cueLabel = document.createElement("label");
    cueLabel.textContent = "Release cue";
    cueRow.appendChild(cueLabel);
    const cueSelect = document.createElement("select");
    cueOptions.forEach((cue) => {
      const option = document.createElement("option");
      option.value = cue;
      option.textContent = cue;
      if (cue === hive.cue) option.selected = true;
      cueSelect.appendChild(option);
    });
    cueSelect.addEventListener("change", () => {
      hive.cue = cueSelect.value;
      renderInsights();
      updateBadgeRow();
    });
    cueRow.appendChild(cueSelect);

    const temperamentRow = document.createElement("div");
    temperamentRow.className = "row";
    const temperamentLabel = document.createElement("label");
    temperamentLabel.textContent = "Temperament dial";
    temperamentRow.appendChild(temperamentLabel);

    const temperamentInput = document.createElement("input");
    temperamentInput.type = "range";
    temperamentInput.min = "20";
    temperamentInput.max = "90";
    temperamentInput.value = String(hive.temperament);
    temperamentInput.addEventListener("input", () => {
      const value = Number(temperamentInput.value);
      hive.manualTemperament = true;
      hive.temperament = clamp(value, 20, 90);
      temperamentDisplay.textContent = describeTemperament(hive.temperament);
      renderInsights();
      updateBadgeRow();
    });

    const temperamentDisplay = document.createElement("span");
    temperamentDisplay.className = "badge";
    temperamentDisplay.textContent = describeTemperament(hive.temperament);

    const badgeRow = document.createElement("div");
    badgeRow.className = "traits";

    function updateBadgeRow() {
      badgeRow.innerHTML = "";
      const spacingBadge = document.createElement("span");
      spacingBadge.className = "badge";
      spacingBadge.textContent = computeSpacingLabel(hive);
      badgeRow.appendChild(spacingBadge);

      const flowBadge = document.createElement("span");
      flowBadge.className = "badge";
      flowBadge.textContent = `${hive.focus} flow`;
      badgeRow.appendChild(flowBadge);

      const cueBadge = document.createElement("span");
      cueBadge.className = "badge";
      cueBadge.textContent = hive.cue;
      badgeRow.appendChild(cueBadge);
    }

    updateBadgeRow();

    temperamentRow.append(temperamentInput, temperamentDisplay);

    card.append(header, focusRow, zoneRow, cueRow, temperamentRow, badgeRow);
    hiveGrid.appendChild(card);
  });

  updateAddHiveButton();
}

function computeSpacingLabel(hive) {
  const areaPerHive = state.environment.area / Math.max(state.hives.length, 1);
  const heightFactor = state.environment.height > 20 ? 1.2 : 1;
  const base = areaPerHive / heightFactor;
  if (base > 25) return "Wide glide lanes";
  if (base > 18) return "Comfortable spacing";
  if (base > 12) return "Tightened chorus";
  return "Crowded perch";
}

function describeTemperament(value) {
  if (value <= 35) return "Soft hum";
  if (value <= 55) return "Balanced";
  if (value <= 70) return "Lively scouts";
  return "High alert";
}

function registerSeasonControls() {
  document.querySelectorAll(".season").forEach((seasonEl) => {
    const seasonKey = seasonEl.dataset.season;
    const checkboxes = seasonEl.querySelectorAll("input[type='checkbox']");
    state.blooms[seasonKey] = Array.from(checkboxes)
      .filter((box) => box.checked)
      .map((box) => box.value);

    checkboxes.forEach((box) => {
      box.addEventListener("change", () => {
        state.blooms[seasonKey] = Array.from(checkboxes)
          .filter((item) => item.checked)
          .map((item) => item.value);
        renderInsights();
      });
    });
  });
}

function updateAreaDisplay() {
  areaValue.textContent = `${state.environment.area} m²`;
}

function updateSunlightDisplay() {
  sunlightValue.textContent = `${state.environment.sunlight} hrs`;
}

function updateHeightDisplay() {
  heightValue.textContent = `${state.environment.height} stories`;
}

function renderInsights() {
  updateRiskMeter();
  updateTrafficBands();
}

function updateRiskMeter() {
  const { area, sunlight, wind, waterAccess, windScreen, herbBorder, height } = state.environment;
  let riskScore = 40;

  if (area < 45) riskScore += 12;
  if (area > 100) riskScore -= 6;
  if (sunlight < 5.5) riskScore += 15;
  if (sunlight > 8.5) riskScore -= 4;
  if (!waterAccess) riskScore += 12;
  if (windScreen) riskScore -= 8;
  if (!herbBorder) riskScore += 6;
  if (height > 24) riskScore += 10;
  if (height < 8) riskScore -= 4;

  const windPenalty = ["north", "east"].includes(wind) ? 6 : 0;
  riskScore += windPenalty;

  const hivePressure = state.hives.length * 5;
  riskScore += hivePressure;

  const temperamentLoad = state.hives.length
    ? state.hives.reduce((acc, hive) => acc + (hive.temperament - 50), 0) / state.hives.length
    : 0;
  riskScore += temperamentLoad * 0.3;

  const bloomCoverage = Object.values(state.blooms).reduce((acc, blooms) => acc + blooms.length, 0);
  riskScore -= Math.min(bloomCoverage * 1.5, 10);

  riskScore = clamp(Math.round(riskScore), 5, 95);
  riskNeedle.style.left = `${riskScore}%`;

  if (riskScore < 30) {
    riskLabel.textContent = "Serene drift";
  } else if (riskScore < 55) {
    riskLabel.textContent = "Balanced & breezy";
  } else if (riskScore < 75) {
    riskLabel.textContent = "Watch for crowding";
  } else {
    riskLabel.textContent = "Signal redress";
  }
}

function updateTrafficBands() {
  trafficList.innerHTML = "";
  if (!state.hives.length) {
    const item = document.createElement("li");
    item.className = "hint";
    item.textContent = "Traffic bands appear once hive slots are assigned.";
    trafficList.appendChild(item);
    return;
  }

  state.hives.forEach((hive) => {
    const traffic = computeTrafficLoad(hive);
    const li = document.createElement("li");
    li.className = "traffic-item";
    const name = document.createElement("span");
    name.textContent = hive.name;
    const load = document.createElement("small");
    load.textContent = `${traffic.label} · ${traffic.range}`;
    li.append(name, load);
    trafficList.appendChild(li);
  });
}

function computeTrafficLoad(hive) {
  const base = hive.focus === "Forager Relay" ? 65 : hive.focus === "Explorer Scout" ? 55 : 45;
  const temperament = hive.temperament - 40;
  const areaBonus = Math.min(state.environment.area / (state.hives.length || 1), 45);
  const score = clamp(Math.round(base + temperament - areaBonus * 0.6), 10, 95);

  if (score < 30) {
    return { label: "Featherlight", range: "12–20 flights/hr" };
  }
  if (score < 55) {
    return { label: "Steady lanes", range: "22–35 flights/hr" };
  }
  if (score < 75) {
    return { label: "Busy ribbon", range: "36–48 flights/hr" };
  }
  return { label: "Swarm alert", range: "49+ flights/hr" };
}

function composeNarrative() {
  const { area, sunlight, wind, waterAccess, windScreen, herbBorder, height } = state.environment;
  if (!state.hives.length) {
    narrativeText.textContent =
      "Layer in at least one hive slot to draft a full apiary narrative with tone and timing recommendations.";
    return;
  }

  const windLabel = {
    south: "a sheltered southern slipstream",
    southwest: "a southwest updraft",
    west: "steady western crosswinds",
    north: "a brisk northern push",
    east: "an easterly climb",
  }[wind];

  const supportNotes = [
    waterAccess ? "quick refill trays" : "manual water hauls",
    windScreen ? "reed screens soften gusts" : "exposed gust lanes",
    herbBorder ? "herb borders keep scents humming" : "bare edges need infill",
  ].join(", ");

  const hiveLines = state.hives.map((hive) => {
    const traffic = computeTrafficLoad(hive);
    const blooms = recommendBloomsForHive(hive).join(", ");
    return `${hive.name} anchors the ${hive.zone.toLowerCase()} with ${hive.focus.toLowerCase()} duties, cueing a ${
      hive.cue
    } cadence, ${traffic.label.toLowerCase()} traffic, and leaning on ${blooms || "adaptive forage"}.`;
  });

  const bloomSummary = Object.entries(state.blooms)
    .filter(([, list]) => list.length)
    .map(([season, list]) => `${formatSeasonLabel(season)}: ${list.join(", ")}`)
    .join("; ");

  narrativeText.textContent = `The ${area} m² terrace rides ${windLabel} with ${sunlight} hours of light and sits ${height} stories up, relying on ${supportNotes}. ${
    hiveLines.join(" ")
  } Seasonal forage rotation — ${bloomSummary || "add more bloom anchors"} — keeps nectar corridors in tune.`;
}

function recommendBloomsForHive(hive) {
  const keys = Object.keys(state.blooms);
  const picks = [];
  keys.forEach((season) => {
    const list = state.blooms[season];
    if (!list.length) return;
    const index = Math.min(Math.floor(hive.temperament / 20), list.length - 1);
    if (list[index]) picks.push(list[index]);
  });
  return picks.slice(0, 3);
}

function formatSeasonLabel(key) {
  switch (key) {
    case "spring":
      return "Spring";
    case "summer":
      return "Summer";
    case "late-summer":
      return "Late Summer";
    case "autumn":
      return "Autumn";
    default:
      return key;
  }
}

function addHive() {
  if (state.hives.length >= 6) {
    updateAddHiveButton();
    return;
  }

  const hive = createHive(state.hives.length);
  state.hives.push(hive);
  renderHives();
  renderInsights();
}

function resetPlanner() {
  state.environment = {
    area: 60,
    sunlight: 6.5,
    wind: "south",
    waterAccess: true,
    windScreen: false,
    herbBorder: true,
    height: 12,
  };
  state.blooms = {
    spring: ["wild thyme"],
    summer: ["lavandin"],
    "late-summer": ["sunflower"],
    autumn: ["aster"],
  };
  state.hives = [];
  areaInput.value = state.environment.area;
  sunlightInput.value = state.environment.sunlight;
  windSelect.value = state.environment.wind;
  waterToggle.checked = state.environment.waterAccess;
  windScreenToggle.checked = state.environment.windScreen;
  herbBorderToggle.checked = state.environment.herbBorder;
  heightInput.value = state.environment.height;
  document.querySelectorAll(".season").forEach((seasonEl) => {
    const seasonKey = seasonEl.dataset.season;
    const boxes = seasonEl.querySelectorAll("input[type='checkbox']");
    boxes.forEach((box) => {
      box.checked = state.blooms[seasonKey].includes(box.value);
    });
  });
  updateAddHiveButton();
  updateAreaDisplay();
  updateSunlightDisplay();
  updateHeightDisplay();
  renderHives();
  renderInsights();
  narrativeText.textContent =
    "Dial in terrace conditions and add hive slots to compose a narrative that keeps your rooftop colony flourishing.";
}

function updateAddHiveButton() {
  if (state.hives.length >= 6) {
    addHiveButton.disabled = true;
    addHiveButton.textContent = "Hive capacity reached";
  } else {
    addHiveButton.disabled = false;
    addHiveButton.textContent = "Add Hive Slot";
  }
}

areaInput.addEventListener("input", () => {
  state.environment.area = Number(areaInput.value);
  updateAreaDisplay();
  renderInsights();
});

sunlightInput.addEventListener("input", () => {
  state.environment.sunlight = Number(sunlightInput.value);
  updateSunlightDisplay();
  renderInsights();
});

windSelect.addEventListener("change", () => {
  state.environment.wind = windSelect.value;
  renderInsights();
});

waterToggle.addEventListener("change", () => {
  state.environment.waterAccess = waterToggle.checked;
  renderInsights();
});

windScreenToggle.addEventListener("change", () => {
  state.environment.windScreen = windScreenToggle.checked;
  renderInsights();
});

herbBorderToggle.addEventListener("change", () => {
  state.environment.herbBorder = herbBorderToggle.checked;
  renderInsights();
});

heightInput.addEventListener("input", () => {
  state.environment.height = Number(heightInput.value);
  updateHeightDisplay();
  renderInsights();
});

addHiveButton.addEventListener("click", addHive);

generatePlanButton.addEventListener("click", composeNarrative);

resetPlannerButton.addEventListener("click", () => {
  resetPlanner();
  addHive();
  addHive();
});

registerSeasonControls();
updateAreaDisplay();
updateSunlightDisplay();
updateHeightDisplay();
resetPlanner();
addHive();
addHive();
