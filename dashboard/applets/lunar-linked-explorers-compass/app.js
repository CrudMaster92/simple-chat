const phaseSlider = document.getElementById("phaseSlider");
const driftSlider = document.getElementById("driftSlider");
const phaseValue = document.getElementById("phaseValue");
const driftValue = document.getElementById("driftValue");
const phaseLabel = document.getElementById("phaseLabel");
const driftLabel = document.getElementById("driftLabel");
const motifLabel = document.getElementById("motifLabel");
const motifDescription = document.getElementById("motifDescription");
const notesList = document.getElementById("notesList");
const wanderButton = document.getElementById("wanderButton");
const captureButton = document.getElementById("captureButton");
const motifChips = Array.from(document.querySelectorAll(".motif-chip"));
const needle = document.getElementById("compassNeedle");
const phaseGlow = document.getElementById("phaseGlow");

const motifs = {
  "Lullaby Tide Map": {
    description:
      "Soft arcs trace hidden coastlines while quiet bells mark the tide's return. Every note lingers like moonlight resting on calm water.",
    whisper: "Tides hum in gentle thirds, coaxing the shoreline to unfurl its glow.",
  },
  "Crater Lantern Weave": {
    description:
      "Braided filaments cradle crater rims, draping lanterns that glow in patient pulses.",
    whisper: "Lantern threads tighten around the crater edge, waiting for the next breath to sway.",
  },
  "Orbital Echo Garden": {
    description:
      "Floating gardens bloom with mirrored bells that answer each other across the orbital hush.",
    whisper: "Echoing blossoms exchange stories about wanderers who listened long enough to hear them.",
  },
  "Noctiluna Wayfinding": {
    description:
      "Translucent waypoints shimmer in elongated paths, inviting detours and soft recalculations.",
    whisper: "A silvered glyph unfurls, suggesting a detour through familiar starlight.",
  },
  "Satellite Drift Chorus": {
    description:
      "Slow-moving satellites hum in layered chords, tracing safe passage for curious travelers.",
    whisper: "A trio of satellites lean toward one another, sharing a chorus only midnight hears.",
  },
};

const phaseRanges = [
  { max: 16, label: "New hush" },
  { max: 32, label: "First shimmer" },
  { max: 48, label: "Waxing Ways" },
  { max: 64, label: "Luminous swell" },
  { max: 80, label: "Full hush" },
  { max: 100, label: "Waning trails" },
];

const driftHeadings = [
  { max: 22.5, label: "Northern hush" },
  { max: 67.5, label: "Northeast hush" },
  { max: 112.5, label: "Eastern hush" },
  { max: 157.5, label: "Southeast hush" },
  { max: 202.5, label: "Southern hush" },
  { max: 247.5, label: "Southwest hush" },
  { max: 292.5, label: "Western hush" },
  { max: 337.5, label: "Northwest hush" },
  { max: 360, label: "Northern hush" },
];

function updatePhase(value) {
  const numeric = Number(value);
  phaseValue.textContent = `${numeric}%`;
  const phase = phaseRanges.find((range) => numeric <= range.max) ?? phaseRanges[phaseRanges.length - 1];
  phaseLabel.textContent = phase.label;
  const rotation = (numeric / 100) * 180 - 90;
  phaseGlow.style.transform = `rotate(${rotation}deg) scale(${0.8 + numeric / 200})`;
  phaseGlow.style.opacity = 0.6 + numeric / 250;
}

function updateDrift(value) {
  const numeric = Number(value);
  driftValue.textContent = `${numeric.toFixed(0)}°`;
  const heading = driftHeadings.find((range) => numeric <= range.max) ?? driftHeadings[0];
  driftLabel.textContent = heading.label;
  needle.style.transform = `rotate(${numeric - 90}deg)`;
}

function setMotif(name) {
  motifChips.forEach((chip) => {
    chip.classList.toggle("active", chip.dataset.motif === name);
  });
  motifLabel.textContent = name;
  motifDescription.textContent = motifs[name].description;
}

function captureWhisper() {
  const activeMotif = motifLabel.textContent;
  const entry = document.createElement("li");
  const timestamp = new Date().toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
  entry.innerHTML = `<strong>${timestamp}</strong> — ${motifs[activeMotif].whisper}`;
  notesList.prepend(entry);
  if (notesList.children.length > 8) {
    notesList.removeChild(notesList.lastElementChild);
  }
}

function wander() {
  const randomPhase = Math.floor(Math.random() * 101);
  const randomDrift = Math.floor(Math.random() * 361);
  updatePhase(randomPhase);
  phaseSlider.value = randomPhase;
  updateDrift(randomDrift);
  driftSlider.value = randomDrift;

  const motifNames = Object.keys(motifs);
  const current = motifLabel.textContent;
  const filtered = motifNames.filter((name) => name !== current);
  const newMotif = filtered[Math.floor(Math.random() * filtered.length)];
  setMotif(newMotif);
  captureWhisper();
}

phaseSlider.addEventListener("input", (event) => updatePhase(event.target.value));
driftSlider.addEventListener("input", (event) => updateDrift(event.target.value));
motifChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    setMotif(chip.dataset.motif);
  });
});
wanderButton.addEventListener("click", wander);
captureButton.addEventListener("click", captureWhisper);

// Initialize the compass with default state
updatePhase(phaseSlider.value);
updateDrift(driftSlider.value);
setMotif(motifLabel.textContent);

captureWhisper();
