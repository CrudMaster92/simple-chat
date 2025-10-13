const streams = [
  {
    id: "perseid-ribbons",
    name: "Perseid Ribbons",
    tone: "silver filament trails that skip across the atmosphere",
    cadence: "elastic",
    glyph: "✶",
    flourish: "latticed vapor ribbons",
  },
  {
    id: "orionid-trails",
    name: "Orionid Trails",
    tone: "amber shards cascading past Orion's shoulder",
    cadence: "steadfast",
    glyph: "✷",
    flourish: "arched ember curtains",
  },
  {
    id: "tau-herculid-flares",
    name: "Tau Herculid Flares",
    tone: "cerulean plumes blooming from faint comets",
    cadence: "unexpected",
    glyph: "✦",
    flourish: "slow-sparking bloom fronts",
  },
  {
    id: "draconid-whispers",
    name: "Draconid Whispers",
    tone: "cool spirals fanning from the northern dragon",
    cadence: "hushed",
    glyph: "✺",
    flourish: "feathered spiral bands",
  },
];

const moods = [
  { id: "soothed", label: "Soothed", hint: "glassy harmonics and gentle reverbs" },
  { id: "buoyant", label: "Buoyant", hint: "uplift pulses and skipping arpeggios" },
  { id: "mystic", label: "Mystic", hint: "distant choirs and shivering drones" },
  { id: "radiant", label: "Radiant", hint: "bright plucks with comet tail shimmer" },
  { id: "nocturne", label: "Nocturne", hint: "hushed bass beds and midnight bells" },
  { id: "kinetic", label: "Kinetic", hint: "percussive flickers with syncopated sparks" },
];

const instruments = [
  {
    id: "celesta",
    name: "Celesta Drift",
    detail: "tuned glass bars with long tails",
  },
  {
    id: "nebula-harp",
    name: "Nebula Harp",
    detail: "gravity-harp harmonics stretched in slow motion",
  },
  {
    id: "ion-winds",
    name: "Ion Winds",
    detail: "layered wind organs brushing the upper thermosphere",
  },
  {
    id: "pulseframe",
    name: "Pulseframe Pads",
    detail: "polyphonic pads bending through light prisms",
  },
  {
    id: "meteor-drums",
    name: "Meteor Drums",
    detail: "hollow-shell drums that bloom with each impact",
  },
  {
    id: "flux-violin",
    name: "Flux Violin",
    detail: "bowed solar strings gliding through harmonics",
  },
];

const state = {
  tempo: 42,
  moods: new Set(),
  instruments: new Set(["celesta"]),
};

const streamSelect = document.getElementById("stream-select");
const tempoSlider = document.getElementById("tempo-slider");
const tempoValue = document.getElementById("tempo-value");
const moodChips = document.getElementById("mood-chips");
const instrumentGrid = document.getElementById("instrument-grid");
const randomizeButton = document.getElementById("randomize-btn");
const loomButton = document.getElementById("loom-btn");
const weaveTitle = document.getElementById("weave-title");
const weaveSummary = document.getElementById("weave-summary");
const tagStrip = document.getElementById("tag-strip");
const constellationEl = document.getElementById("constellation");
const journalList = document.getElementById("journal-list");
const clearLogButton = document.getElementById("clear-log-btn");
const closeButton = document.querySelector(".close-button");

function init() {
  populateStreams();
  populateMoods();
  populateInstruments();
  updateTempoValue(state.tempo);
  bindEvents();
}

function populateStreams() {
  streams.forEach((stream) => {
    const option = document.createElement("option");
    option.value = stream.id;
    option.textContent = stream.name;
    streamSelect.append(option);
  });
  streamSelect.value = streams[0]?.id ?? "";
}

function populateMoods() {
  moods.forEach((mood) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chip";
    button.textContent = mood.label;
    button.dataset.id = mood.id;
    button.setAttribute("aria-pressed", "false");
    button.title = mood.hint;
    button.addEventListener("click", () => toggleMood(mood.id, button));
    moodChips.append(button);
  });
}

function populateInstruments() {
  instruments.forEach((instrument) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "instrument-card";
    card.dataset.id = instrument.id;
    card.innerHTML = `<strong>${instrument.name}</strong><span>${instrument.detail}</span>`;
    card.setAttribute("aria-pressed", state.instruments.has(instrument.id) ? "true" : "false");
    if (state.instruments.has(instrument.id)) {
      card.classList.add("active");
    }
    card.addEventListener("click", () => toggleInstrument(instrument.id, card));
    instrumentGrid.append(card);
  });
}

function bindEvents() {
  tempoSlider?.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.tempo = value;
    updateTempoValue(value);
  });

  randomizeButton?.addEventListener("click", () => {
    randomizeSelection();
    weaveSequence();
  });

  loomButton?.addEventListener("click", () => weaveSequence());

  clearLogButton?.addEventListener("click", () => {
    journalList.innerHTML = "";
  });

  closeButton?.addEventListener("click", () => {
    window.parent?.postMessage?.({ type: "applet-close" }, "*");
    if (window.history.length > 1) {
      window.history.back();
    }
  });
}

function toggleMood(id, button) {
  if (state.moods.has(id)) {
    state.moods.delete(id);
    button.classList.remove("active");
    button.setAttribute("aria-pressed", "false");
  } else {
    state.moods.add(id);
    button.classList.add("active");
    button.setAttribute("aria-pressed", "true");
  }
}

function toggleInstrument(id, card) {
  if (state.instruments.has(id)) {
    if (state.instruments.size === 1) {
      return; // keep at least one instrument active
    }
    state.instruments.delete(id);
    card.classList.remove("active");
    card.setAttribute("aria-pressed", "false");
    return;
  }

  if (state.instruments.size >= 3) {
    const oldest = state.instruments.values().next().value;
    state.instruments.delete(oldest);
    const previousCard = instrumentGrid.querySelector(`[data-id="${oldest}"]`);
    previousCard?.classList.remove("active");
    previousCard?.setAttribute("aria-pressed", "false");
  }

  state.instruments.add(id);
  card.classList.add("active");
  card.setAttribute("aria-pressed", "true");
}

function updateTempoValue(value) {
  const descriptor = describeTempo(value);
  tempoValue.textContent = `${descriptor} · ${value} bpm`;
}

function describeTempo(value) {
  if (value < 36) return "Still hush";
  if (value < 54) return "Calm drift";
  if (value < 72) return "Skysail sway";
  if (value < 96) return "Arc glide";
  return "Meteor rush";
}

function randomizeSelection() {
  const randomStream = streams[Math.floor(Math.random() * streams.length)];
  streamSelect.value = randomStream.id;

  const tempo = Math.floor(Math.random() * 48) + 32; // 32-80
  state.tempo = tempo;
  tempoSlider.value = String(tempo);
  updateTempoValue(tempo);

  state.moods.clear();
  const chipButtons = Array.from(moodChips.querySelectorAll(".chip"));
  chipButtons.forEach((chip) => {
    chip.classList.remove("active");
    chip.setAttribute("aria-pressed", "false");
  });

  const moodCount = Math.max(1, Math.floor(Math.random() * 3) + 1);
  const shuffledMoods = [...moods].sort(() => Math.random() - 0.5);
  shuffledMoods.slice(0, moodCount).forEach((mood) => {
    state.moods.add(mood.id);
    const button = moodChips.querySelector(`[data-id="${mood.id}"]`);
    button?.classList.add("active");
    button?.setAttribute("aria-pressed", "true");
  });

  const instrumentButtons = Array.from(instrumentGrid.querySelectorAll(".instrument-card"));
  instrumentButtons.forEach((card) => {
    card.classList.remove("active");
    card.setAttribute("aria-pressed", "false");
  });

  state.instruments.clear();
  const shuffledInstruments = [...instruments].sort(() => Math.random() - 0.5);
  shuffledInstruments.slice(0, 2).forEach((instrument) => {
    state.instruments.add(instrument.id);
    const card = instrumentGrid.querySelector(`[data-id="${instrument.id}"]`);
    card?.classList.add("active");
    card?.setAttribute("aria-pressed", "true");
  });
}

function weaveSequence() {
  const stream = streams.find((item) => item.id === streamSelect.value) ?? streams[0];
  const selectedMoods = [...state.moods].map((id) => moods.find((mood) => mood.id === id)).filter(Boolean);
  const selectedInstruments = [...state.instruments]
    .map((id) => instruments.find((instrument) => instrument.id === id))
    .filter(Boolean);

  if (!stream) return;

  const descriptor = describeTempo(state.tempo);
  const moodLine = selectedMoods.length
    ? selectedMoods.map((mood) => mood.hint).join(", ")
    : "open-air resonance with plenty of headroom";
  const instrumentNames = selectedInstruments.length
    ? selectedInstruments.map((instrument) => instrument.name).join(" · ")
    : "bare-sky resonance";

  weaveTitle.textContent = `${stream.name} · ${descriptor}`;
  weaveSummary.textContent = `A ${descriptor.toLowerCase()} arrangement of ${stream.tone} guided by ${instrumentNames}, with ${moodLine}.`;

  renderTags({ descriptor, moods: selectedMoods, instruments: selectedInstruments, stream });
  constellationEl.textContent = buildConstellation({ stream, tempo: state.tempo, moods: selectedMoods, instruments: selectedInstruments });
  addJournalEntry({ stream, descriptor, moods: selectedMoods, instruments: selectedInstruments });
}

function renderTags({ descriptor, moods: selectedMoods, instruments: selectedInstruments, stream }) {
  tagStrip.innerHTML = "";
  const tags = [descriptor, stream.cadence, stream.flourish];
  selectedMoods.forEach((mood) => tags.push(mood.label));
  selectedInstruments.forEach((instrument) => tags.push(instrument.name));

  tags.slice(0, 8).forEach((tag) => {
    const span = document.createElement("span");
    span.className = "tag";
    span.textContent = tag;
    tagStrip.append(span);
  });
}

function addJournalEntry({ stream, descriptor, moods: selectedMoods, instruments: selectedInstruments }) {
  const entry = document.createElement("li");
  const timestamp = document.createElement("time");
  const now = new Date();
  timestamp.dateTime = now.toISOString();
  timestamp.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const heading = document.createElement("strong");
  heading.textContent = `${stream.name} ${descriptor.toLowerCase()}`;

  const body = document.createElement("p");
  body.textContent = describeJournalBody({ stream, descriptor, moods: selectedMoods, instruments: selectedInstruments });

  entry.append(timestamp, heading, body);
  journalList.prepend(entry);

  const entries = journalList.querySelectorAll("li");
  if (entries.length > 6) {
    journalList.removeChild(entries[entries.length - 1]);
  }
}

function describeJournalBody({ stream, descriptor, moods: selectedMoods, instruments: selectedInstruments }) {
  const moodLabels = selectedMoods.length ? selectedMoods.map((mood) => mood.label.toLowerCase()) : ["open"];
  const instrumentPhrases = selectedInstruments.length
    ? selectedInstruments.map((instrument) => instrument.detail)
    : ["ambient air currents"];

  return `Tempo set to ${descriptor.toLowerCase()} while ${stream.flourish} respond to ${moodLabels.join(", ")}; instrumentation rides ${instrumentPhrases.join(", ")}.`;
}

function buildConstellation({ stream, tempo, moods: selectedMoods, instruments: selectedInstruments }) {
  const seedParts = [stream.id, tempo, ...selectedMoods.map((mood) => mood.id), ...selectedInstruments.map((instrument) => instrument.id)];
  const random = createRandom(seedParts.join("|"));
  const rows = 6;
  const cols = 13;
  const highlightGlyph = stream.glyph;
  const accentGlyphs = ["✶", "✷", "✦", "✹", "⟡", "⋆"]; // fallback glyphs
  const baseGlyphs = ["·", "∙", "•", "·"];
  const moodWeight = 0.12 * selectedMoods.length;
  const instrumentWeight = 0.08 * selectedInstruments.length;
  const tempoWeight = Math.min(0.25, (tempo - 24) / 160);
  const highlightChance = 0.18 + moodWeight + instrumentWeight + tempoWeight;

  const rowsContent = [];
  for (let row = 0; row < rows; row += 1) {
    let line = "";
    for (let col = 0; col < cols; col += 1) {
      const roll = random();
      if (roll < highlightChance) {
        line += highlightGlyph;
      } else if (roll < highlightChance + 0.22) {
        const accent = accentGlyphs[Math.floor(random() * accentGlyphs.length)];
        line += accent;
      } else {
        const base = baseGlyphs[Math.floor(random() * baseGlyphs.length)];
        line += base;
      }
      if (col < cols - 1) {
        line += col % 2 === 0 ? " " : "";
      }
    }
    rowsContent.push(line.trimEnd());
  }
  return rowsContent.join("\n");
}

function createRandom(seed) {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return () => {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}

init();
