const stations = [
  { id: "auric", name: "Auric Canopy Outpost", beacon: "Auric Canopy" },
  { id: "cumulus", name: "Cumulus Lantern Pier", beacon: "Lantern Pier" },
  { id: "saffron", name: "Saffron Stratos Loom", beacon: "Stratos Loom" },
  { id: "cirrus", name: "Cirrus Echo Relay", beacon: "Cirrus Echo" },
  { id: "azura", name: "Azura Drift Observatory", beacon: "Drift Observatory" }
];

const scenicNodes = [
  "Nimbus Gate",
  "Aurora Thread",
  "Wavelength Bridge",
  "Sunlace Dock",
  "Glitterwake Spiral",
  "Sylph Chorus Run",
  "Slipstream 7",
  "Thistledown Promenade"
];

const trinkets = [
  {
    id: "feather-seal",
    icon: "🪶",
    name: "Feathered Relay Seal",
    note: "Signed by the skylark couriers who guide first lifts."
  },
  {
    id: "crystal-vane",
    icon: "🧭",
    name: "Crystal Vane Dial",
    note: "Tunes into the faint harmonics of distant slipstreams."
  },
  {
    id: "wind-charm",
    icon: "🎐",
    name: "Wind Chime Capsule",
    note: "Chimes softly whenever a letter finds its roost."
  },
  {
    id: "glow-stamp",
    icon: "💠",
    name: "Lumen Drift Stamp",
    note: "Imprints aurora trails across your next dispatch."
  },
  {
    id: "compass-bloom",
    icon: "🌼",
    name: "Compass Bloom",
    note: "Petals orient toward the busiest relay of the hour."
  },
  {
    id: "glider-knot",
    icon: "🪁",
    name: "Glider Knot Token",
    note: "Knotwork taught by kite pilots to steady playful winds."
  }
];

const form = document.getElementById("letter-form");
const fromSelect = document.getElementById("from-station");
const toSelect = document.getElementById("to-station");
const messageField = document.getElementById("letter-message");
const driftDelayToggle = document.getElementById("drift-delay");
const transitList = document.getElementById("transit-list");
const logEntries = document.getElementById("log-entries");
const trinketShelf = document.getElementById("trinket-shelf");
const windButton = document.querySelector(".wind-refresh");

const stationMap = new Map(stations.map((station) => [station.id, station]));
const activeLetters = new Map();
const collectedTrinkets = new Set();
let letterCount = 0;

function populateSelects() {
  stations.forEach((station, idx) => {
    const optionFrom = document.createElement("option");
    optionFrom.value = station.id;
    optionFrom.textContent = station.name;
    fromSelect.append(optionFrom);

    const optionTo = document.createElement("option");
    optionTo.value = station.id;
    optionTo.textContent = station.name;
    toSelect.append(optionTo);

    if (idx === 0) fromSelect.value = station.id;
    if (idx === 1) toSelect.value = station.id;
  });
}

function ensureDistinctSelection(changedSelect, otherSelect) {
  if (changedSelect.value === otherSelect.value) {
    const currentIndex = stations.findIndex((station) => station.id === changedSelect.value);
    const nextIndex = (currentIndex + 1) % stations.length;
    otherSelect.value = stations[nextIndex].id;
  }
}

function createLetterId() {
  letterCount += 1;
  return `letter-${Date.now()}-${letterCount}`;
}

function pickScenicNodes() {
  const shuffled = [...scenicNodes].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 2);
}

function createLetterCard(letter) {
  const card = document.createElement("article");
  card.className = "letter-card drift";
  card.setAttribute("role", "listitem");
  card.dataset.letterId = letter.id;

  const header = document.createElement("div");
  header.className = "letter-header";
  header.innerHTML = `<span>${letter.fromStation.beacon}</span><span>${letter.toStation.beacon}</span>`;

  const route = document.createElement("div");
  route.className = "route-path";
  letter.routeNodes.forEach((node, index) => {
    if (index > 0) {
      const divider = document.createElement("div");
      divider.className = "route-divider";
      route.append(divider);
    }
    const span = document.createElement("span");
    span.className = "route-node";
    span.textContent = node;
    route.append(span);
  });

  const message = document.createElement("p");
  message.className = "letter-message";
  message.textContent = letter.message;

  const status = document.createElement("div");
  status.className = "letter-status";
  const dot = document.createElement("span");
  dot.className = "status-dot";
  const statusText = document.createElement("span");
  statusText.textContent = letter.stageMessages[0];
  status.append(dot, statusText);

  card.append(header, route, message, status);
  letter.statusNode = statusText;

  setTimeout(() => card.classList.remove("drift"), 4200);

  return card;
}

function addLogEntry(text) {
  const entry = document.createElement("li");
  const timestamp = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  entry.textContent = `[${timestamp}] ${text}`;
  logEntries.prepend(entry);

  while (logEntries.children.length > 20) {
    logEntries.removeChild(logEntries.lastChild);
  }
}

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function scheduleLetter(letter) {
  const durations = [randomDelay(900, 1600), randomDelay(1700, 2600), randomDelay(2100, 3200)];

  let accumulated = 0;
  for (let stageIndex = 1; stageIndex < letter.stageMessages.length; stageIndex += 1) {
    const stageDelay = durations[stageIndex - 1] + (letter.hasExtraDelay ? randomDelay(600, 1600) : 0);
    accumulated += stageDelay;
    const timeout = setTimeout(() => advanceLetter(letter.id, stageIndex), accumulated);
    letter.timeouts.push(timeout);
  }
}

function advanceLetter(letterId, stageIndex) {
  const letter = activeLetters.get(letterId);
  if (!letter) return;

  letter.stage = stageIndex;
  const message = letter.stageMessages[stageIndex];
  if (letter.statusNode) {
    letter.statusNode.textContent = message;
  }

  if (stageIndex === letter.stageMessages.length - 1) {
    letter.card.classList.add("delivered");
    addLogEntry(`Delivery to ${letter.toStation.name} complete. Trinket incoming.`);
    awardTrinket();
    letter.timeouts.forEach((timeout) => clearTimeout(timeout));
    setTimeout(() => {
      if (letter.card.isConnected) {
        letter.card.classList.remove("delivered");
        letter.card.classList.add("drift");
        setTimeout(() => letter.card.remove(), 900);
      }
      activeLetters.delete(letterId);
    }, 1800);
  }
}

function awardTrinket() {
  const available = trinkets.filter((trinket) => !collectedTrinkets.has(trinket.id));
  const pool = available.length > 0 ? available : trinkets;
  const choice = pool[Math.floor(Math.random() * pool.length)];

  if (!collectedTrinkets.has(choice.id)) {
    collectedTrinkets.add(choice.id);
    renderTrinket(choice, true);
    addLogEntry(`Collected new trinket: ${choice.name}.`);
  } else {
    renderTrinket(choice, false);
    addLogEntry(`Duplicate breeze trinket revisited: ${choice.name}.`);
  }
}

function renderTrinket(trinket, isNew) {
  if (isNew) {
    const card = document.createElement("article");
    card.className = "trinket-card";

    const icon = document.createElement("div");
    icon.className = "trinket-icon";
    icon.textContent = trinket.icon;

    const name = document.createElement("div");
    name.className = "trinket-name";
    name.textContent = trinket.name;

    const note = document.createElement("p");
    note.className = "trinket-note";
    note.textContent = trinket.note;

    card.append(icon, name, note);
    trinketShelf.append(card);
  } else {
    const existing = Array.from(trinketShelf.children).find((child) => child.querySelector(".trinket-name")?.textContent === trinket.name);
    if (existing) {
      existing.classList.add("gust");
      setTimeout(() => existing.classList.remove("gust"), 1000);
    }
  }
}

function handleSubmit(event) {
  event.preventDefault();
  const fromId = fromSelect.value;
  const toId = toSelect.value;
  const message = messageField.value.trim();

  if (!message) {
    messageField.focus();
    return;
  }

  if (fromId === toId) {
    addLogEntry("The winds prefer destinations apart. Choose a different arrival station.");
    ensureDistinctSelection(fromSelect, toSelect);
    return;
  }

  const fromStation = stationMap.get(fromId);
  const toStation = stationMap.get(toId);
  const scenic = pickScenicNodes();
  const letter = {
    id: createLetterId(),
    fromStation,
    toStation,
    message,
    scenic,
    routeNodes: [fromStation.beacon, scenic[0], scenic[1], toStation.beacon],
    stageMessages: [
      `Lift-off from ${fromStation.name}.`,
      `Drafting near ${scenic[0]} under attentive kites.`,
      `Looping past ${scenic[1]} with playful currents.`,
      `Arriving at ${toStation.name} with a keepsake.`
    ],
    statusNode: null,
    card: null,
    timeouts: [],
    hasExtraDelay: driftDelayToggle.checked,
    stage: 0
  };

  letter.card = createLetterCard(letter);
  transitList.prepend(letter.card);
  activeLetters.set(letter.id, letter);
  addLogEntry(`Letter launched from ${fromStation.name} toward ${toStation.name}.`);

  scheduleLetter(letter);
  form.reset();
  ensureDistinctSelection(fromSelect, toSelect);
}

function handleWindRefresh() {
  if (!activeLetters.size) {
    addLogEntry("Winds swirl idly — no letters in flight just yet.");
    return;
  }

  document.querySelectorAll(".letter-card").forEach((card) => {
    card.classList.add("gust");
    setTimeout(() => card.classList.remove("gust"), 900);
  });

  activeLetters.forEach((letter) => {
    if (letter.statusNode && letter.stage < letter.stageMessages.length - 1) {
      letter.statusNode.textContent = `${letter.stageMessages[letter.stage]} (winds teasing)`;
    }
  });

  addLogEntry("Stirred the winds — routes shimmer with renewed currents.");
}

populateSelects();
form.addEventListener("submit", handleSubmit);
fromSelect.addEventListener("change", () => ensureDistinctSelection(fromSelect, toSelect));
toSelect.addEventListener("change", () => ensureDistinctSelection(toSelect, fromSelect));
windButton.addEventListener("click", handleWindRefresh);

addLogEntry("Awaiting your first sky-letter dispatch.");
