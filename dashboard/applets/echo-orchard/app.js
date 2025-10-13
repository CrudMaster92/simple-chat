const trackDefinitions = [
  {
    id: "roots",
    name: "Roots Drum",
    key: "A",
    frequency: 110,
    pan: -0.35,
  },
  {
    id: "branch",
    name: "Branch Clack",
    key: "S",
    frequency: 175,
    pan: -0.1,
  },
  {
    id: "leaf",
    name: "Leaf Flicker",
    key: "D",
    frequency: 240,
    pan: 0.2,
  },
  {
    id: "canopy",
    name: "Canopy Chime",
    key: "F",
    frequency: 320,
    pan: 0.45,
  },
];

const seasonPalettes = {
  spring: {
    label: "Spring Burst",
    uiBackground: "#f5f1e6",
    panel: "rgba(255, 255, 255, 0.78)",
    panelBorder: "rgba(70, 59, 38, 0.18)",
    ink: "#2f2a22",
    accent: "#f17a2b",
    accentStrong: "#f45823",
    ghost: "rgba(47, 42, 34, 0.1)",
    ghostHover: "rgba(47, 42, 34, 0.2)",
    sky: "#cfe7ff",
    background: "#f5f1e6",
    ground: "#d7e4c8",
    bark: "#7b5a3d",
    leaf: "#6cb455",
    bloom: "#f4b18a",
    fruit: "#f97c38",
  },
  summer: {
    label: "Sunwarm Shade",
    uiBackground: "#f4f4eb",
    panel: "rgba(255, 255, 255, 0.8)",
    panelBorder: "rgba(56, 74, 46, 0.18)",
    ink: "#2d3320",
    accent: "#f3a712",
    accentStrong: "#ff7b00",
    ghost: "rgba(45, 51, 32, 0.12)",
    ghostHover: "rgba(45, 51, 32, 0.2)",
    sky: "#d8f2ff",
    background: "#f2f7e6",
    ground: "#d2e49c",
    bark: "#6b5a32",
    leaf: "#7fc15c",
    bloom: "#ffd76b",
    fruit: "#ff9b3b",
  },
  autumn: {
    label: "Amber Drift",
    uiBackground: "#f5ede4",
    panel: "rgba(255, 248, 242, 0.82)",
    panelBorder: "rgba(110, 78, 38, 0.18)",
    ink: "#3a2d20",
    accent: "#f97431",
    accentStrong: "#f55b1c",
    ghost: "rgba(58, 45, 32, 0.12)",
    ghostHover: "rgba(58, 45, 32, 0.22)",
    sky: "#f9dfc5",
    background: "#f4eadf",
    ground: "#e2c198",
    bark: "#7d4d24",
    leaf: "#d37f2f",
    bloom: "#f7aa5c",
    fruit: "#ee5e2a",
  },
  midnight: {
    label: "Midnight Bloom",
    uiBackground: "#0f1e2c",
    panel: "rgba(15, 30, 44, 0.82)",
    panelBorder: "rgba(163, 198, 211, 0.18)",
    ink: "#e8f6ff",
    accent: "#39b4b3",
    accentStrong: "#2a9ca2",
    ghost: "rgba(232, 246, 255, 0.12)",
    ghostHover: "rgba(232, 246, 255, 0.2)",
    sky: "#133349",
    background: "#0f1e2c",
    ground: "#1e403f",
    bark: "#1c2f37",
    leaf: "#3ac2a2",
    bloom: "#9fe3dd",
    fruit: "#4dd3c6",
  },
};

const keyToTrackIndex = {
  a: 0,
  s: 1,
  d: 2,
  f: 3,
};

const state = {
  steps: 8,
  tempo: 100,
  wind: 0.12,
  sceneBars: 4,
  baseStepDuration: 0,
  isPlaying: false,
  currentStep: 0,
  nextStepTime: null,
  stepTimer: null,
  highlightedStep: null,
  tracks: [],
  stepButtons: [],
  sceneStatusEl: null,
  startStopButton: null,
  barsCompleted: 0,
  sceneCycles: 0,
  justStarted: true,
  orchardCanvas: null,
  orchardCtx: null,
  canvasScale: 1,
  theme: "spring",
  themePalette: seasonPalettes.spring,
};

state.baseStepDuration = computeBaseDuration(state.tempo);
state.tracks = trackDefinitions.map((definition) => ({
  ...definition,
  steps: new Array(state.steps).fill(null),
  metrics: {
    activeCount: 0,
    accuracy: 0,
    offsetAverage: 0,
    velocityAverage: 0,
  },
  growthEnergy: 0,
  leafEnergy: 0,
  mute: false,
  solo: false,
  muteButton: null,
  soloButton: null,
  padButton: null,
}));
state.stepButtons = state.tracks.map(() => new Array(state.steps).fill(null));

let audioContext = null;
let masterGain = null;
const activeKeys = new Set();

function computeBaseDuration(tempo) {
  return (60 / tempo) * 1000 * 0.5;
}

function ensureAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.45;
    masterGain.connect(audioContext.destination);
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
  return audioContext;
}

function init() {
  state.startStopButton = document.getElementById("startStop");
  const clearButton = document.getElementById("clearScene");
  const tempoSlider = document.getElementById("tempo");
  const tempoLabel = document.getElementById("tempoLabel");
  const windSlider = document.getElementById("wind");
  const seasonSelect = document.getElementById("season");
  const sceneLengthSlider = document.getElementById("sceneLength");
  const sceneLabel = document.getElementById("sceneLabel");
  const snapButton = document.getElementById("snapShot");
  state.sceneStatusEl = document.getElementById("sceneStatus");

  const trackControlsEl = document.getElementById("trackControls");
  const gridContainer = document.getElementById("stepGrid");
  gridContainer.innerHTML = "";

  state.tracks.forEach((track, trackIndex) => {
    const card = document.createElement("article");
    card.className = "track-card";

    const name = document.createElement("div");
    name.className = "track-name";
    const strong = document.createElement("strong");
    strong.textContent = track.name;
    const keyHint = document.createElement("span");
    keyHint.className = "key";
    keyHint.textContent = `Tap pad or press ${track.key}`;
    name.appendChild(strong);
    name.appendChild(keyHint);

    const muteButton = document.createElement("button");
    muteButton.type = "button";
    muteButton.className = "mute ghost";
    muteButton.textContent = "Mute";
    muteButton.setAttribute("aria-pressed", "false");
    muteButton.addEventListener("click", () => toggleMute(trackIndex));

    const soloButton = document.createElement("button");
    soloButton.type = "button";
    soloButton.className = "solo secondary";
    soloButton.textContent = "Solo";
    soloButton.setAttribute("aria-pressed", "false");
    soloButton.addEventListener("click", () => toggleSolo(trackIndex));

    const padButton = document.createElement("button");
    padButton.type = "button";
    padButton.className = "pad";
    padButton.textContent = "Tap to Plant";
    padButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      handlePadPress(trackIndex);
    });

    track.muteButton = muteButton;
    track.soloButton = soloButton;
    track.padButton = padButton;

    card.appendChild(name);
    card.appendChild(muteButton);
    card.appendChild(soloButton);
    card.appendChild(padButton);
    trackControlsEl.appendChild(card);

    const row = document.createElement("div");
    row.className = "step-row";
    for (let stepIndex = 0; stepIndex < state.steps; stepIndex += 1) {
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "step";
      cell.dataset.track = String(trackIndex);
      cell.dataset.step = String(stepIndex);
      cell.setAttribute(
        "aria-label",
        `${track.name} step ${stepIndex + 1}`
      );
      cell.addEventListener("click", () => toggleStep(trackIndex, stepIndex));
      row.appendChild(cell);
      state.stepButtons[trackIndex][stepIndex] = cell;
    }
    gridContainer.appendChild(row);
  });

  state.startStopButton.addEventListener("click", togglePlayback);
  clearButton.addEventListener("click", clearScene);

  tempoSlider.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    tempoLabel.textContent = value.toString();
    state.tempo = value;
    state.baseStepDuration = computeBaseDuration(state.tempo);
    if (state.isPlaying) {
      restartPlayback();
    }
  });

  windSlider.addEventListener("input", (event) => {
    state.wind = Number(event.target.value);
  });

  seasonSelect.addEventListener("change", (event) => {
    applySeason(event.target.value);
  });

  sceneLengthSlider.addEventListener("input", (event) => {
    const value = Number(event.target.value);
    state.sceneBars = value;
    sceneLabel.textContent = value.toString();
    state.barsCompleted = 0;
    state.sceneCycles = 0;
    state.sceneStatusEl.textContent = `Scene length set to ${value} bars.`;
  });

  snapButton.addEventListener("click", captureSnapshot);

  document.addEventListener("keydown", onKeyDown);
  document.addEventListener("keyup", onKeyUp);

  state.orchardCanvas = document.getElementById("orchardCanvas");
  state.orchardCtx = state.orchardCanvas.getContext("2d");
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  applySeason("spring");
  refreshAllTrackMetrics();
  updateAllStepButtons();
  updateStartStopButton();
  requestAnimationFrame(animateOrchard);
}

function togglePlayback() {
  if (state.isPlaying) {
    stopPlayback();
  } else {
    startPlayback();
  }
}

function startPlayback() {
  ensureAudioContext();
  if (state.isPlaying) return;
  state.isPlaying = true;
  state.currentStep = 0;
  state.nextStepTime = performance.now();
  state.barsCompleted = 0;
  state.sceneCycles = 0;
  state.justStarted = true;
  state.sceneStatusEl.textContent = `Bar 1 of ${state.sceneBars}`;
  updateStartStopButton();
  playStep();
}

function stopPlayback() {
  state.isPlaying = false;
  if (state.stepTimer) {
    clearTimeout(state.stepTimer);
    state.stepTimer = null;
  }
  state.nextStepTime = null;
  updateStartStopButton();
  updateStepHighlight(null);
  state.sceneStatusEl.textContent = "Loop paused. Tap Start to wake the orchard.";
}

function restartPlayback() {
  const wasPlaying = state.isPlaying;
  stopPlayback();
  updateStepHighlight(null);
  if (wasPlaying) {
    startPlayback();
  }
}

function playStep() {
  if (!state.isPlaying) return;
  const stepIndex = state.currentStep;
  const now = performance.now();

  triggerStep(stepIndex);
  updateStepHighlight(stepIndex);

  if (stepIndex === 0) {
    if (state.justStarted) {
      state.justStarted = false;
    } else {
      onBarTransition();
    }
  }

  const base = state.baseStepDuration;
  const swing = state.wind;
  const duration =
    stepIndex % 2 === 0 ? base * (1 - swing) : base * (1 + swing);

  state.currentStep = (stepIndex + 1) % state.steps;
  state.nextStepTime = now + duration;
  state.stepTimer = window.setTimeout(playStep, duration);
}

function triggerStep(stepIndex) {
  const soloed = state.tracks.some((track) => track.solo);
  state.tracks.forEach((track, trackIndex) => {
    const event = track.steps[stepIndex];
    if (event && (!soloed || track.solo) && !track.mute) {
      triggerSound(trackIndex, event.velocity);
      pulseTrack(trackIndex, event.velocity, event.accuracy);
    }
  });
}

function onBarTransition() {
  state.barsCompleted += 1;
  refreshAllTrackMetrics();
  const within = state.barsCompleted % state.sceneBars;
  if (within === 0) {
    state.sceneCycles += 1;
    state.sceneStatusEl.textContent = `Scene loop ${state.sceneCycles} complete! Snap the grove when it feels right.`;
  } else {
    state.sceneStatusEl.textContent = `Bar ${within + 1} of ${state.sceneBars}`;
  }
}

function toggleMute(trackIndex) {
  const track = state.tracks[trackIndex];
  track.mute = !track.mute;
  if (track.muteButton) {
    track.muteButton.classList.toggle("active", track.mute);
    track.muteButton.setAttribute("aria-pressed", track.mute ? "true" : "false");
    track.muteButton.textContent = track.mute ? "Muted" : "Mute";
  }
}

function toggleSolo(trackIndex) {
  const track = state.tracks[trackIndex];
  track.solo = !track.solo;
  if (track.soloButton) {
    track.soloButton.classList.toggle("active", track.solo);
    track.soloButton.setAttribute("aria-pressed", track.solo ? "true" : "false");
    track.soloButton.textContent = track.solo ? "Soloing" : "Solo";
  }
}

function toggleStep(trackIndex, stepIndex) {
  const track = state.tracks[trackIndex];
  const current = track.steps[stepIndex];
  if (current) {
    track.steps[stepIndex] = null;
  } else {
    track.steps[stepIndex] = {
      accuracy: 0.68,
      velocity: 0.6,
      offset: 0,
      normalizedOffset: 0,
      plantedAt: performance.now(),
    };
    triggerSound(trackIndex, 0.45);
    pulseTrack(trackIndex, 0.6, 0.68);
  }
  updateStepButton(trackIndex, stepIndex);
  refreshTrackMetrics(trackIndex);
}

function updateStepButton(trackIndex, stepIndex) {
  const button = state.stepButtons[trackIndex][stepIndex];
  if (!button) return;
  const event = state.tracks[trackIndex].steps[stepIndex];
  const isActive = Boolean(event);
  button.classList.toggle("active", isActive);
  if (event) {
    const glow = 0.18 + event.accuracy * 0.25;
    button.style.background = `rgba(241, 122, 43, ${glow.toFixed(2)})`;
  } else {
    button.style.background = "";
  }
}

function updateAllStepButtons() {
  state.tracks.forEach((_, trackIndex) => {
    for (let stepIndex = 0; stepIndex < state.steps; stepIndex += 1) {
      updateStepButton(trackIndex, stepIndex);
    }
  });
}

function updateStepHighlight(stepIndex) {
  if (state.highlightedStep !== null && state.highlightedStep !== undefined) {
    state.stepButtons.forEach((row) => {
      const btn = row[state.highlightedStep];
      if (btn) {
        btn.classList.remove("is-current");
      }
    });
  }
  if (stepIndex === null || stepIndex === undefined) {
    state.highlightedStep = null;
    return;
  }
  state.highlightedStep = stepIndex;
  state.stepButtons.forEach((row) => {
    const btn = row[stepIndex];
    if (btn) {
      btn.classList.add("is-current");
    }
  });
}

function handlePadPress(trackIndex) {
  ensureAudioContext();
  const track = state.tracks[trackIndex];
  const velocityFromTap = 0.5;
  if (state.isPlaying && state.nextStepTime !== null) {
    const now = performance.now();
    const timeUntilStep = state.nextStepTime - now;
    const offset = -timeUntilStep;
    const normalized = clamp(offset / state.baseStepDuration, -1, 1);
    const accuracy = clamp(1 - Math.abs(normalized), 0, 1);
    const velocity = 0.35 + 0.65 * accuracy;
    const stepIndex = state.currentStep;
    track.steps[stepIndex] = {
      accuracy,
      velocity,
      offset,
      normalizedOffset: normalized,
      plantedAt: now,
    };
    updateStepButton(trackIndex, stepIndex);
    refreshTrackMetrics(trackIndex);
    triggerSound(trackIndex, velocity);
    pulseTrack(trackIndex, velocity, accuracy);
  } else {
    triggerSound(trackIndex, velocityFromTap);
    pulseTrack(trackIndex, velocityFromTap, 0.6);
  }
}

function pulseTrack(trackIndex, velocity, accuracy) {
  const track = state.tracks[trackIndex];
  const energyBoost = velocity * 0.6;
  const leafBoost = (accuracy ?? velocity) * 0.6;
  track.growthEnergy = Math.min(1.6, track.growthEnergy + energyBoost);
  track.leafEnergy = Math.min(1.6, track.leafEnergy + leafBoost);
}

function triggerSound(trackIndex, velocity = 0.5) {
  const ctx = ensureAudioContext();
  if (!ctx || !masterGain) return;
  const track = state.tracks[trackIndex];
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = trackIndex === 0 ? "sine" : trackIndex === 3 ? "triangle" : "square";
  osc.frequency.setValueAtTime(track.frequency, now);

  const gainNode = ctx.createGain();
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.22 * velocity, now + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);

  const panner = ctx.createStereoPanner();
  panner.pan.value = track.pan;

  osc.connect(gainNode);
  gainNode.connect(panner);
  panner.connect(masterGain);

  osc.start(now);
  osc.stop(now + 0.35);
}

function refreshTrackMetrics(trackIndex) {
  const track = state.tracks[trackIndex];
  const events = track.steps.filter(Boolean);
  const count = events.length;
  const accuracy = count
    ? events.reduce((sum, event) => sum + (event.accuracy ?? 0), 0) / count
    : 0;
  const offsetAverage = count
    ? events.reduce((sum, event) => sum + (event.normalizedOffset ?? 0), 0) /
      count
    : 0;
  const velocityAverage = count
    ? events.reduce((sum, event) => sum + (event.velocity ?? 0), 0) / count
    : 0;
  track.metrics = {
    activeCount: count,
    accuracy,
    offsetAverage,
    velocityAverage,
  };
}

function refreshAllTrackMetrics() {
  state.tracks.forEach((_, index) => refreshTrackMetrics(index));
}

function clearScene() {
  state.tracks.forEach((track, trackIndex) => {
    track.steps = new Array(state.steps).fill(null);
    track.growthEnergy = 0;
    track.leafEnergy = 0;
    refreshTrackMetrics(trackIndex);
  });
  updateAllStepButtons();
  updateStepHighlight(null);
  state.barsCompleted = 0;
  state.sceneCycles = 0;
  state.sceneStatusEl.textContent = "Scene cleared. Plant fresh beats to regrow the grove.";
}

function onKeyDown(event) {
  const key = event.key.toLowerCase();
  if (!keyToTrackIndex.hasOwnProperty(key)) return;
  if (activeKeys.has(key)) return;
  activeKeys.add(key);
  event.preventDefault();
  handlePadPress(keyToTrackIndex[key]);
}

function onKeyUp(event) {
  const key = event.key.toLowerCase();
  if (activeKeys.has(key)) {
    activeKeys.delete(key);
  }
}

function applySeason(seasonKey) {
  const palette = seasonPalettes[seasonKey];
  if (!palette) return;
  state.theme = seasonKey;
  state.themePalette = palette;
  const root = document.documentElement;
  root.style.setProperty("--bg", palette.uiBackground);
  root.style.setProperty("--panel", palette.panel);
  root.style.setProperty("--panel-border", palette.panelBorder);
  root.style.setProperty("--ink", palette.ink);
  root.style.setProperty("--accent", palette.accent);
  root.style.setProperty("--accent-strong", palette.accentStrong);
  root.style.setProperty("--ghost", palette.ghost);
  root.style.setProperty("--ghost-hover", palette.ghostHover);
}

function resizeCanvas() {
  const canvas = state.orchardCanvas;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;
  state.canvasScale = scale;
  canvas.width = Math.max(600, Math.floor(rect.width * scale));
  canvas.height = Math.max(360, Math.floor(rect.height * scale));
}

function animateOrchard(timestamp) {
  renderOrchard(timestamp || 0);
  requestAnimationFrame(animateOrchard);
}

function renderOrchard(timestamp) {
  const canvas = state.orchardCanvas;
  const ctx = state.orchardCtx;
  if (!canvas || !ctx) return;
  const palette = state.themePalette;
  const scale = state.canvasScale || 1;
  const viewWidth = canvas.width / scale;
  const viewHeight = canvas.height / scale;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(scale, scale);

  const gradient = ctx.createLinearGradient(0, 0, 0, viewHeight);
  gradient.addColorStop(0, palette.sky);
  gradient.addColorStop(1, palette.background);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, viewWidth, viewHeight);

  const groundHeight = Math.min(110, viewHeight * 0.22);
  ctx.fillStyle = palette.ground;
  ctx.fillRect(0, viewHeight - groundHeight, viewWidth, groundHeight);

  const breeze = Math.sin(timestamp * 0.0015) * state.wind * 20;

  const columns = 2;
  const rows = Math.ceil(state.tracks.length / columns);
  const cellWidth = viewWidth / columns;
  const cellHeight = (viewHeight - groundHeight) / rows;

  state.tracks.forEach((track, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const centerX = column * cellWidth + cellWidth / 2;
    const baseY = viewHeight - groundHeight + 8;
    const metrics = track.metrics;
    const activeRatio = metrics.activeCount / state.steps;
    const accuracy = metrics.accuracy;
    const offsetAverage = metrics.offsetAverage;
    const heightBase = cellHeight * (0.45 + activeRatio * 0.4) + track.growthEnergy * 40;
    const sway = offsetAverage * 50 + breeze + Math.sin(timestamp * 0.001 + index) * state.wind * 25;
    const branchThickness = 6 + activeRatio * 8;

    // Ground patch
    ctx.fillStyle = `rgba(0, 0, 0, ${0.06 + activeRatio * 0.12})`;
    ctx.beginPath();
    ctx.ellipse(centerX, viewHeight - groundHeight + 6, cellWidth * 0.25 + track.growthEnergy * 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = palette.bark;
    ctx.lineWidth = branchThickness;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(centerX, baseY);
    ctx.quadraticCurveTo(
      centerX + sway * 0.3,
      baseY - heightBase * 0.45,
      centerX + sway,
      baseY - heightBase
    );
    ctx.stroke();

    const branchCount = 3 + Math.round(activeRatio * 3);
    for (let branchIndex = 0; branchIndex < branchCount; branchIndex += 1) {
      const progress = (branchIndex + 1) / (branchCount + 1);
      const startY = baseY - heightBase * progress;
      const direction = branchIndex % 2 === 0 ? -1 : 1;
      const length = heightBase * (0.25 + accuracy * 0.35) + track.growthEnergy * 12;
      const curvature = sway * 0.2 + direction * (1 - accuracy) * 26;
      ctx.lineWidth = Math.max(2, branchThickness * (1 - progress * 0.7));
      ctx.beginPath();
      ctx.moveTo(centerX + sway * progress * 0.3, startY);
      ctx.quadraticCurveTo(
        centerX + direction * (length * (0.8 + accuracy * 0.2)) + curvature * 0.3,
        startY - length * 0.35,
        centerX + direction * (length * (1.2 + track.leafEnergy * 0.2)) + curvature,
        startY - length
      );
      ctx.stroke();
    }

    const leafDensity = Math.round(6 + activeRatio * 12 + track.leafEnergy * 8);
    ctx.fillStyle = palette.leaf;
    for (let leafIndex = 0; leafIndex < leafDensity; leafIndex += 1) {
      const noise = pseudoRandom(index * 31 + leafIndex * 17);
      const angle = noise * Math.PI * 2;
      const radius = 6 + track.leafEnergy * 2 + accuracy * 3;
      const radialDistance = heightBase * 0.3 + noise * heightBase * 0.5;
      const leafX = centerX + Math.cos(angle) * radialDistance + sway * 0.4;
      const leafY = baseY - heightBase * 0.3 - noise * heightBase * 0.7 + Math.sin(timestamp * 0.002 + leafIndex) * state.wind * 6;
      ctx.beginPath();
      ctx.ellipse(
        leafX,
        leafY,
        radius * 0.6,
        radius,
        angle,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    const bloomCount = Math.max(2, Math.round(accuracy * 6));
    ctx.fillStyle = palette.bloom;
    for (let bloomIndex = 0; bloomIndex < bloomCount; bloomIndex += 1) {
      const noise = pseudoRandom(bloomIndex * 43 + index * 19 + 0.3);
      const angle = noise * Math.PI * 2;
      const distance = heightBase * 0.4 + noise * heightBase * 0.35;
      const bloomX = centerX + Math.cos(angle) * distance + sway * 0.2;
      const bloomY = baseY - heightBase * 0.5 - Math.sin(angle) * distance * 0.6;
      ctx.beginPath();
      ctx.arc(bloomX, bloomY, 4 + accuracy * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    if (track.metrics.activeCount > 0) {
      ctx.fillStyle = palette.fruit;
      ctx.beginPath();
      ctx.arc(centerX + sway * 0.15, baseY - heightBase - 18, 6 + track.growthEnergy * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    track.growthEnergy = Math.max(0, track.growthEnergy - 0.01);
    track.leafEnergy = Math.max(0, track.leafEnergy - 0.015);
  });

  ctx.restore();
}

function pseudoRandom(seed) {
  const x = Math.sin(seed) * 43758.5453;
  return x - Math.floor(x);
}

function captureSnapshot() {
  const canvas = state.orchardCanvas;
  if (!canvas) return;
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  link.download = `echo-orchard-${timestamp}.png`;
  link.click();
  state.sceneStatusEl.textContent = "Snapshot saved! The orchard keeps listening.";
}

function updateStartStopButton() {
  if (!state.startStopButton) return;
  state.startStopButton.textContent = state.isPlaying ? "Pause Loop" : "Start Loop";
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

init();
