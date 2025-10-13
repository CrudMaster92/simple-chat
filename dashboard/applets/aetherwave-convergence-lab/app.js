const sequences = [
  {
    id: "tidal-vault",
    name: "Tidal Vault Array",
    description: "A submarine lattice that folds oceanic telemetry into shimmering resonance corridors.",
    colors: {
      inner: "#0E3B43",
      mid: "#1B7F79",
      outer: "#041921",
      trace: "#2EC4B6",
      highlight: "#F2B950"
    },
    pulses: 26,
    layers: 4,
    overlays: ["Brine Sequencer", "Vault Echo", "Kelp Prism"],
    telemetry: [
      "Brine translators spool up, mapping abyssal drifts into navigable pressure chords.",
      "Subsurface gliders spin shimmering corridors between opposing tidal vaults.",
      "Silt harmonics align; expect a brief auric bloom before the field stabilises."
    ],
    metrics: {
      flux: [2.4, 3.8],
      echo: [160, 240],
      drift: [0.18, 0.46]
    }
  },
  {
    id: "zenith-kaleidoscope",
    name: "Zenith Kaleidoscope",
    description: "Stratospheric mirrors braid solar sheets into crystalline navigation glyphs.",
    colors: {
      inner: "#103B2F",
      mid: "#146356",
      outer: "#032029",
      trace: "#5DF2C0",
      highlight: "#F7D08A"
    },
    pulses: 32,
    layers: 5,
    overlays: ["Sky Loom", "Photon Draft", "Altitude Vault"],
    telemetry: [
      "Parhelion beams diffract across the stage, weaving altitude glyphs into orbit.",
      "Thermal drifts settle; kaleidoscopic panels adjust to the new resonance depth.",
      "Expect a mirrored echo seven beats after each catalytic burst."
    ],
    metrics: {
      flux: [3.2, 4.6],
      echo: [90, 150],
      drift: [0.12, 0.34]
    }
  },
  {
    id: "ember-shelves",
    name: "Ember Shelf Relay",
    description: "Volcanic archives vent luminous spores that carry navigational chord progressions.",
    colors: {
      inner: "#2D3A1C",
      mid: "#435B25",
      outer: "#0F180C",
      trace: "#88D66C",
      highlight: "#F7A072"
    },
    pulses: 22,
    layers: 3,
    overlays: ["Spore Drift", "Crust Resonator", "Thermal Choir"],
    telemetry: [
      "Fumarole sigils spark across the diagram while ember shelves hum in sync.",
      "Magma scripts coil upward, trailing spores encoded with expedition timings.",
      "Field notes report a gentle tremor — fold the motifs inward to preserve clarity."
    ],
    metrics: {
      flux: [1.7, 2.9],
      echo: [210, 320],
      drift: [0.26, 0.58]
    }
  },
  {
    id: "glacier-gyre",
    name: "Glacier Gyre Conflux",
    description: "Suspended ice halos shear moonlight into tidal gyres and glassine breathways.",
    colors: {
      inner: "#0C2A32",
      mid: "#16404C",
      outer: "#03141B",
      trace: "#3DD6C6",
      highlight: "#F0C987"
    },
    pulses: 28,
    layers: 5,
    overlays: ["Halo Drift", "Gyre Compass", "Frost Loom"],
    telemetry: [
      "Aeon-cold vapour condenses, revealing the braided gyre channels in turquoise light.",
      "Crystalline breathways align with the lunar clock, shifting the aperture drift inward.",
      "Expect the frost loom to echo each motif in reverse three beats later."
    ],
    metrics: {
      flux: [2.8, 4.1],
      echo: [120, 210],
      drift: [0.14, 0.31]
    }
  }
];

const motifs = [
  "Delta Bloom",
  "Cerulean Wake",
  "Orbital Sail",
  "Signal Coral",
  "Silt Anthem",
  "Mirage Current",
  "Chrono Choir",
  "Flux Lantern"
];

const sequenceSelect = document.getElementById("sequence-select");
const sequenceHint = document.getElementById("sequence-hint");
const resonanceRange = document.getElementById("resonance-range");
const resonanceValue = document.getElementById("resonance-value");
const motifGrid = document.getElementById("motif-grid");
const overlayPills = document.getElementById("overlay-pills");
const telemetryReadout = document.getElementById("telemetry-readout");
const fluxValue = document.getElementById("flux-value");
const echoValue = document.getElementById("echo-value");
const driftValue = document.getElementById("drift-value");
const sculptBtn = document.getElementById("sculpt-btn");
const imprintBtn = document.getElementById("imprint-btn");
const randomizeBtn = document.getElementById("randomize-btn");
const cycleBtn = document.getElementById("cycle-btn");
const clearChronicleBtn = document.getElementById("clear-chronicle-btn");
const exportBtn = document.getElementById("export-btn");
const manifestCard = document.getElementById("manifest-card");
const manifestCloseBtn = document.getElementById("manifest-close");
const manifestOutput = document.getElementById("manifest-output");
const chronicleList = document.getElementById("chronicle-list");

const canvas = document.getElementById("constellation-canvas");
const ctx = canvas.getContext("2d");

let selectedMotifs = new Set();
let currentSequence = sequences[0];
let currentResonance = Number(resonanceRange.value);
let currentTelemetryIndex = 0;
let animationFrameId;
let animationParticles = [];
let animationSettings = {
  spin: 0.002,
  drift: 0.0006,
  hueShift: 0
};
let chronicle = [];
let autoCycleInterval = null;

function createId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `blueprint-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function populateSequences() {
  sequences.forEach((sequence) => {
    const option = document.createElement("option");
    option.value = sequence.id;
    option.textContent = sequence.name;
    sequenceSelect.append(option);
  });
  setSequence(sequences[0].id);
}

function renderMotifs() {
  motifs.forEach((motif) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = motif;
    button.className = "chip";
    button.addEventListener("click", () => toggleMotif(motif, button));
    motifGrid.append(button);
  });
}

function toggleMotif(motif, element) {
  if (selectedMotifs.has(motif)) {
    selectedMotifs.delete(motif);
    element.classList.remove("active");
    return;
  }

  if (selectedMotifs.size >= 4) {
    const [first] = selectedMotifs;
    selectedMotifs.delete(first);
    const chip = [...motifGrid.children].find((child) => child.textContent === first);
    chip?.classList.remove("active");
  }

  selectedMotifs.add(motif);
  element.classList.add("active");
}

function setSequence(id) {
  const sequence = sequences.find((seq) => seq.id === id);
  if (!sequence) return;
  currentSequence = sequence;
  sequenceSelect.value = sequence.id;
  sequenceHint.textContent = sequence.description;
  updateOverlay(sequence.overlays);
  telemetryReadout.textContent = sequence.telemetry[0];
  currentTelemetryIndex = 0;
  updateMetrics(sequence.metrics);
  updateAnimationSettings();
}

function updateOverlay(overlays) {
  overlayPills.innerHTML = "";
  overlays.forEach((label) => {
    const pill = document.createElement("span");
    pill.className = "overlay-pill";
    pill.textContent = label;
    overlayPills.append(pill);
  });
}

function updateMetrics(metrics) {
  fluxValue.textContent = `${randomMetric(metrics.flux, 2)}π`;
  echoValue.textContent = `${randomMetric(metrics.echo, 0)} ms`;
  driftValue.textContent = `${randomMetric(metrics.drift, 2)}°`;
}

function randomMetric([min, max], decimals) {
  const value = min + Math.random() * (max - min);
  return value.toFixed(decimals);
}

function randomArrayEntry(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function updateTelemetry() {
  currentTelemetryIndex = (currentTelemetryIndex + 1) % currentSequence.telemetry.length;
  telemetryReadout.textContent = currentSequence.telemetry[currentTelemetryIndex];
}

function updateAnimationSettings() {
  const { colors, pulses, layers } = currentSequence;
  const resonanceFactor = currentResonance / 10;
  const totalParticles = Math.floor(pulses * (0.6 + resonanceFactor));
  const radiusBase = 90 + resonanceFactor * 120;
  const layerDepth = layers + resonanceFactor * 3;

  animationSettings = {
    spin: 0.0015 + resonanceFactor * 0.003,
    drift: 0.0005 + resonanceFactor * 0.0008,
    hueShift: resonanceFactor * 50,
    radiusBase,
    totalParticles,
    layerDepth,
    colors
  };

  generateParticles();
  cancelAnimationFrame(animationFrameId);
  animate();
}

function generateParticles() {
  const { totalParticles, layerDepth } = animationSettings;
  animationParticles = Array.from({ length: totalParticles }, (_, index) => {
    const layer = (index % layerDepth) + 1;
    const radius = animationSettings.radiusBase + layer * 24 + Math.random() * 18;
    const speed = animationSettings.spin * (0.5 + layer / layerDepth);
    const direction = index % 2 === 0 ? 1 : -1;
    return {
      angle: Math.random() * Math.PI * 2,
      radius,
      layer,
      direction,
      speed,
      flicker: Math.random() * 1.5 + 0.2
    };
  });
}

function animate(timestamp = 0) {
  const { colors, hueShift } = animationSettings;
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(width / 2, height / 2, 60, width / 2, height / 2, width / 2);
  gradient.addColorStop(0, colors.inner);
  gradient.addColorStop(0.4, colors.mid);
  gradient.addColorStop(1, colors.outer);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  animationParticles.forEach((particle, index) => {
    particle.angle += particle.speed * particle.direction;
    const wobble = Math.sin(timestamp * animationSettings.drift + index) * 6 * (particle.layer / animationSettings.layerDepth);
    const x = width / 2 + Math.cos(particle.angle) * (particle.radius + wobble);
    const y = height / 2 + Math.sin(particle.angle) * (particle.radius + wobble * 0.6);

    const size = 3 + (particle.layer / animationSettings.layerDepth) * 4;
    const alpha = 0.3 + (particle.layer / animationSettings.layerDepth) * 0.4;
    ctx.beginPath();
    ctx.fillStyle = `hsla(${hueShift + particle.layer * 12}, 60%, 65%, ${alpha})`;
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    if (index % 3 === 0) {
      ctx.beginPath();
      ctx.strokeStyle = `hsla(${hueShift + particle.layer * 15}, 70%, 70%, 0.15)`;
      ctx.lineWidth = 1.5;
      ctx.moveTo(width / 2, height / 2);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  });

  animationFrameId = requestAnimationFrame(animate);
}

function sculptConvergence() {
  const motifsArray = [...selectedMotifs];
  const motifPhrase = motifsArray.length
    ? motifsArray.join(" · ")
    : "Baseline pulses";

  const telemetryText = `${randomArrayEntry(currentSequence.telemetry)}
Motif Weave: ${motifPhrase}.
Resonance Depth: ${currentResonance.toString().padStart(2, "0")} strata.`;
  telemetryReadout.textContent = telemetryText;
  updateMetrics(currentSequence.metrics);
  updateAnimationSettings();
}

function imprintBlueprint() {
  const blueprint = {
    id: createId(),
    sequence: currentSequence,
    resonance: currentResonance,
    motifs: [...selectedMotifs],
    timestamp: new Date()
  };
  chronicle.unshift(blueprint);
  chronicle = chronicle.slice(0, 8);
  renderChronicle();
}

function renderChronicle() {
  chronicleList.innerHTML = "";
  if (!chronicle.length) {
    const empty = document.createElement("li");
    empty.className = "chronicle-entry";
    empty.innerHTML = "<p>No blueprints archived yet. Imprint a convergence to begin the chronicle.</p>";
    chronicleList.append(empty);
    return;
  }

  chronicle.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "chronicle-entry";

    const title = document.createElement("h3");
    title.textContent = `${entry.sequence.name}`;
    li.append(title);

    const summary = document.createElement("p");
    summary.textContent = `Resonance depth ${entry.resonance} with ${entry.motifs.length || "no"} motif threads.`;
    li.append(summary);

    if (entry.motifs.length) {
      const tags = document.createElement("div");
      tags.className = "entry-tags";
      entry.motifs.forEach((motif) => {
        const span = document.createElement("span");
        span.className = "entry-tag";
        span.textContent = motif;
        tags.append(span);
      });
      li.append(tags);
    }

    const timestamp = document.createElement("p");
    timestamp.className = "control-hint";
    timestamp.textContent = entry.timestamp.toLocaleString();
    li.append(timestamp);

    const actions = document.createElement("div");
    actions.className = "entry-actions";

    const replayButton = document.createElement("button");
    replayButton.type = "button";
    replayButton.textContent = "Replay";
    replayButton.addEventListener("click", () => replayBlueprint(entry));

    const manifestButton = document.createElement("button");
    manifestButton.type = "button";
    manifestButton.textContent = "Focus";
    manifestButton.addEventListener("click", () => focusBlueprint(entry));

    actions.append(replayButton, manifestButton);
    li.append(actions);

    chronicleList.append(li);
  });
}

function replayBlueprint(entry) {
  selectedMotifs = new Set(entry.motifs);
  [...motifGrid.children].forEach((chip) => {
    if (selectedMotifs.has(chip.textContent)) {
      chip.classList.add("active");
    } else {
      chip.classList.remove("active");
    }
  });
  currentResonance = entry.resonance;
  resonanceRange.value = entry.resonance;
  resonanceValue.textContent = entry.resonance;
  setSequence(entry.sequence.id);
  sculptConvergence();
}

function focusBlueprint(entry) {
  const manifest = {
    sequence: entry.sequence.name,
    resonance: entry.resonance,
    motifs: entry.motifs.join(", ") || "Baseline",
    imprintedAt: entry.timestamp.toISOString()
  };
  manifestOutput.textContent = JSON.stringify(manifest, null, 2);
  manifestCard.hidden = false;
}

function clearChronicle() {
  chronicle = [];
  renderChronicle();
}

function exportManifest() {
  if (!chronicle.length) {
    manifestOutput.textContent = "No blueprints to export yet.";
  } else {
    const manifest = chronicle.map((entry) => ({
      sequence: entry.sequence.name,
      resonance: entry.resonance,
      motifs: entry.motifs,
      imprintedAt: entry.timestamp.toISOString()
    }));
    manifestOutput.textContent = JSON.stringify(manifest, null, 2);
  }
  manifestCard.hidden = false;
}

function randomizeControls() {
  const randomSequence = randomArrayEntry(sequences);
  setSequence(randomSequence.id);
  const randomResonance = Math.floor(Math.random() * 10) + 1;
  resonanceRange.value = randomResonance;
  resonanceValue.textContent = randomResonance;
  currentResonance = randomResonance;
  selectedMotifs.clear();
  [...motifGrid.children].forEach((chip) => chip.classList.remove("active"));
  const shuffled = motifs.slice().sort(() => Math.random() - 0.5);
  shuffled.slice(0, Math.floor(Math.random() * 4)).forEach((motif) => {
    const chip = [...motifGrid.children].find((child) => child.textContent === motif);
    chip?.classList.add("active");
    selectedMotifs.add(motif);
  });
  sculptConvergence();
}

function toggleAutoCycle() {
  if (autoCycleInterval) {
    clearInterval(autoCycleInterval);
    autoCycleInterval = null;
    cycleBtn.classList.remove("active");
    cycleBtn.textContent = "Auto Cycle";
    return;
  }

  cycleBtn.classList.add("active");
  cycleBtn.textContent = "Stop Cycle";
  autoCycleInterval = setInterval(() => {
    updateTelemetry();
    const nextSequenceIndex = (sequences.indexOf(currentSequence) + 1) % sequences.length;
    setSequence(sequences[nextSequenceIndex].id);
    const resonanceShift = ((currentResonance + 3) % 10) + 1;
    resonanceRange.value = resonanceShift;
    resonanceValue.textContent = resonanceShift;
    currentResonance = resonanceShift;
    sculptConvergence();
  }, 6000);
}

function onResonanceChange(event) {
  currentResonance = Number(event.target.value);
  resonanceValue.textContent = currentResonance;
  updateAnimationSettings();
}

populateSequences();
renderMotifs();
renderChronicle();
updateAnimationSettings();
sculptConvergence();

resonanceRange.addEventListener("input", onResonanceChange);
sequenceSelect.addEventListener("change", (event) => setSequence(event.target.value));
sculptBtn.addEventListener("click", () => {
  sculptConvergence();
});
imprintBtn.addEventListener("click", () => {
  imprintBlueprint();
});
randomizeBtn.addEventListener("click", () => {
  randomizeControls();
});
cycleBtn.addEventListener("click", () => {
  toggleAutoCycle();
});
clearChronicleBtn.addEventListener("click", () => {
  clearChronicle();
});
exportBtn.addEventListener("click", () => {
  exportManifest();
});
manifestCloseBtn.addEventListener("click", () => {
  manifestCard.hidden = true;
});

window.addEventListener("beforeunload", () => {
  if (autoCycleInterval) {
    clearInterval(autoCycleInterval);
  }
  cancelAnimationFrame(animationFrameId);
});
