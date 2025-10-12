const plantGrid = document.getElementById("plantGrid");
const enterButton = document.getElementById("enterButton");
const introSection = document.getElementById("intro");
const gardenSection = document.getElementById("garden");
const shimmerDepthInput = document.getElementById("shimmerDepth");
const breezeLevelInput = document.getElementById("breezeLevel");
const canopyShadeInput = document.getElementById("canopyShade");

const plants = [
  {
    id: "lumen-lily",
    name: "Lumen Lily",
    description: "Glassine petals release slow sine lullabies that gently bend toward light.",
    wave: "sine",
    frequency: 220,
    baseVolume: 0.28,
    driftRange: 36,
    driftInterval: 5200,
    filterMultiplier: 0.95,
    pulseLabel: "Tidal swell"
  },
  {
    id: "chromawisp-fern",
    name: "Chromawisp Fern",
    description: "Triangular fronds shimmer in airy chords that flutter with iridescent color shifts.",
    wave: "triangle",
    frequency: 330,
    baseVolume: 0.25,
    driftRange: 48,
    driftInterval: 4200,
    filterMultiplier: 1.2,
    pulseLabel: "Iridescent flutter"
  },
  {
    id: "celestine-orchid",
    name: "Celestine Orchid",
    description: "Saw-edged petals hum in crystalline harmonics and scatter frost-bright echoes.",
    wave: "sawtooth",
    frequency: 174,
    baseVolume: 0.22,
    driftRange: 28,
    driftInterval: 6000,
    filterMultiplier: 0.8,
    pulseLabel: "Crystalline drift"
  },
  {
    id: "nebula-thistle",
    name: "Nebula Thistle",
    description: "A glowing core pulses with cosmic square waves and softens into aurora haze.",
    wave: "square",
    frequency: 262,
    baseVolume: 0.2,
    driftRange: 54,
    driftInterval: 4700,
    filterMultiplier: 1.35,
    pulseLabel: "Aurora heartbeat"
  },
  {
    id: "star-moss",
    name: "Star Moss",
    description: "Distant pinpricks sparkle in gentle bells that twinkle above the canopy.",
    wave: "sine",
    frequency: 523,
    baseVolume: 0.17,
    driftRange: 22,
    driftInterval: 3600,
    filterMultiplier: 1.6,
    pulseLabel: "Twilight shimmer"
  }
];

const plantLookup = new Map(plants.map((plant) => [plant.id, plant]));

let audioCtx;
let masterGain;
let canopyFilter;
let shimmerInput;
let shimmerMix;
let shimmerDelay;
let breeze;
const activeVoices = new Map();
const uiState = new Map();

function setupAudio() {
  if (audioCtx) {
    return;
  }

  audioCtx = new AudioContext();

  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.62;

  canopyFilter = audioCtx.createBiquadFilter();
  canopyFilter.type = "lowpass";
  canopyFilter.Q.value = 0.7;
  canopyFilter.frequency.value = parseFloat(canopyShadeInput.value);

  shimmerInput = audioCtx.createGain();
  shimmerInput.gain.value = 0.8;

  shimmerDelay = audioCtx.createDelay(1.6);
  shimmerDelay.delayTime.value = 0.46;

  const shimmerFeedback = audioCtx.createGain();
  shimmerFeedback.gain.value = 0.28;

  shimmerMix = audioCtx.createGain();
  shimmerMix.gain.value = parseFloat(shimmerDepthInput.value);

  masterGain.connect(canopyFilter);
  canopyFilter.connect(audioCtx.destination);

  shimmerInput.connect(shimmerDelay);
  shimmerDelay.connect(shimmerFeedback);
  shimmerFeedback.connect(shimmerDelay);
  shimmerDelay.connect(shimmerMix);
  shimmerMix.connect(canopyFilter);
}

function ensureAudioStarted() {
  setupAudio();
  if (audioCtx.state === "suspended") {
    return audioCtx.resume();
  }
  return Promise.resolve();
}

function ensureBreeze() {
  if (breeze) {
    return breeze;
  }

  const bufferSize = audioCtx.sampleRate * 4;
  const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }

  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = noiseBuffer;
  noiseSource.loop = true;

  const noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = "bandpass";
  noiseFilter.frequency.value = 900;
  noiseFilter.Q.value = 0.9;

  const noiseGain = audioCtx.createGain();
  noiseGain.gain.value = parseFloat(breezeLevelInput.value);

  noiseSource.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(masterGain);
  noiseGain.connect(shimmerInput);
  noiseSource.start();

  breeze = { noiseSource, noiseGain };
  return breeze;
}

function createPlantCard(plant) {
  const card = document.createElement("article");
  card.className = "plant-card";
  card.dataset.plantId = plant.id;

  const name = document.createElement("h3");
  name.className = "plant-name";
  name.textContent = plant.name;

  const description = document.createElement("p");
  description.className = "plant-description";
  description.textContent = plant.description;

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "toggle";
  toggle.setAttribute("aria-pressed", "false");
  toggle.textContent = "Wake bloom";

  const pulse = document.createElement("span");
  pulse.className = "pulse-indicator";
  pulse.textContent = plant.pulseLabel;

  const sliderGroup = document.createElement("div");
  sliderGroup.className = "slider-group";
  const sliderLabel = document.createElement("label");
  sliderLabel.setAttribute("for", `${plant.id}-volume`);
  sliderLabel.textContent = "Glow intensity";

  const volumeSlider = document.createElement("input");
  volumeSlider.type = "range";
  volumeSlider.min = "0";
  volumeSlider.max = "0.7";
  volumeSlider.step = "0.01";
  volumeSlider.value = plant.baseVolume.toString();
  volumeSlider.id = `${plant.id}-volume`;

  sliderGroup.append(sliderLabel, volumeSlider);
  card.append(name, description, toggle, pulse, sliderGroup);

  toggle.addEventListener("click", () => {
    togglePlant(plant.id);
  });

  volumeSlider.addEventListener("input", () => {
    const voice = activeVoices.get(plant.id);
    if (voice) {
      voice.targetVolume = parseFloat(volumeSlider.value);
      voice.gainNode.gain.setTargetAtTime(
        voice.targetVolume,
        audioCtx.currentTime,
        0.25
      );
    }
  });

  uiState.set(plant.id, {
    card,
    toggle,
    volumeSlider
  });

  plantGrid.append(card);
}

function togglePlant(plantId) {
  const voice = activeVoices.get(plantId);
  if (voice) {
    silencePlant(plantId);
  } else {
    bloomPlant(plantId);
  }
}

function bloomPlant(plantId) {
  const plant = plantLookup.get(plantId);
  if (!plant) return;
  const ui = uiState.get(plantId);
  if (!ui) return;

  const now = audioCtx.currentTime;
  const oscillator = audioCtx.createOscillator();
  oscillator.type = plant.wave;
  oscillator.frequency.setValueAtTime(plant.frequency, now);

  const filter = audioCtx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(
    Math.max(120, parseFloat(canopyShadeInput.value) * plant.filterMultiplier),
    now
  );
  filter.Q.value = 6;

  const gainNode = audioCtx.createGain();
  gainNode.gain.setValueAtTime(0.0001, now);

  oscillator.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(masterGain);
  gainNode.connect(shimmerInput);

  oscillator.start();

  const targetVolume = parseFloat(ui.volumeSlider.value);
  gainNode.gain.setTargetAtTime(targetVolume, now + 0.05, 0.4);

  const driftTimer = startDrift(plant, oscillator, filter);

  activeVoices.set(plantId, {
    oscillator,
    filter,
    gainNode,
    driftTimer,
    targetVolume
  });

  ui.card.classList.add("active");
  ui.toggle.setAttribute("aria-pressed", "true");
  ui.toggle.textContent = "Blooming";
}

function silencePlant(plantId) {
  const voice = activeVoices.get(plantId);
  const ui = uiState.get(plantId);
  if (!voice || !ui) return;

  const now = audioCtx.currentTime;
  voice.gainNode.gain.setTargetAtTime(0.0001, now, 0.35);
  voice.oscillator.stop(now + 1.2);

  clearInterval(voice.driftTimer);

  setTimeout(() => {
    voice.oscillator.disconnect();
    voice.filter.disconnect();
    voice.gainNode.disconnect();
  }, 1500);

  activeVoices.delete(plantId);
  ui.card.classList.remove("active");
  ui.toggle.setAttribute("aria-pressed", "false");
  ui.toggle.textContent = "Wake bloom";
}

function startDrift(plant, oscillator, filter) {
  return setInterval(() => {
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const sway = (Math.random() - 0.5) * plant.driftRange;
    oscillator.frequency.setTargetAtTime(
      Math.max(60, plant.frequency + sway),
      now,
      1.2
    );
    const shadeBase = parseFloat(canopyShadeInput.value) * plant.filterMultiplier;
    filter.frequency.setTargetAtTime(Math.max(150, shadeBase + sway * 6), now, 1.4);
  }, plant.driftInterval);
}

function renderPlants() {
  plants.forEach((plant) => createPlantCard(plant));
}

enterButton.addEventListener("click", () => {
  enterButton.disabled = true;
  ensureAudioStarted().then(() => {
    introSection.hidden = true;
    gardenSection.hidden = false;
    gardenSection.focus?.();
  });
});

shimmerDepthInput.addEventListener("input", () => {
  if (!audioCtx) return;
  shimmerMix.gain.setTargetAtTime(
    parseFloat(shimmerDepthInput.value),
    audioCtx.currentTime,
    0.3
  );
});

breezeLevelInput.addEventListener("input", () => {
  if (!audioCtx) return;
  const breezeNodes = ensureBreeze();
  breezeNodes.noiseGain.gain.setTargetAtTime(
    parseFloat(breezeLevelInput.value),
    audioCtx.currentTime,
    0.4
  );
});

canopyShadeInput.addEventListener("input", () => {
  if (!audioCtx) return;
  const value = parseFloat(canopyShadeInput.value);
  canopyFilter.frequency.setTargetAtTime(value, audioCtx.currentTime, 0.4);
  activeVoices.forEach((voice, id) => {
    const plant = plantLookup.get(id);
    if (!plant) return;
    const target = Math.max(180, value * plant.filterMultiplier);
    voice.filter.frequency.setTargetAtTime(target, audioCtx.currentTime, 0.6);
  });
});

renderPlants();
