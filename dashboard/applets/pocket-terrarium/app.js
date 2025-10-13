const GRID_SIZE = 32;
const CANVAS_SIZE = 512;
const CELL_SIZE = CANVAS_SIZE / GRID_SIZE;
const MAX_FRAMES = 80;

const SPECIES = {
  moss: {
    name: "Moss",
    color: "#7fb069",
    surviveMin: 2,
    surviveMax: 4,
    birthMin: 3,
    birthMax: 4,
  },
  bloom: {
    name: "Bloom",
    color: "#ffb79d",
    surviveMin: 3,
    surviveMax: 5,
    birthMin: 4,
    birthMax: 6,
  },
  fungus: {
    name: "Fungus",
    color: "#d7c97a",
    surviveMin: 1,
    surviveMax: 3,
    birthMin: 2,
    birthMax: 3,
  },
};

const WEATHER_STATES = {
  normal: {
    label: "Calm Skies",
    surviveMinOffset: 0,
    surviveMaxOffset: 0,
    birthMinOffset: 0,
    birthMaxOffset: 0,
  },
  rain: {
    label: "Rainshower",
    surviveMinOffset: -1,
    surviveMaxOffset: 1,
    birthMinOffset: -1,
    birthMaxOffset: 1,
  },
  drought: {
    label: "Drought",
    surviveMinOffset: 1,
    surviveMaxOffset: -1,
    birthMinOffset: 1,
    birthMaxOffset: -1,
  },
};

const canvas = document.getElementById("terrarium");
const ctx = canvas.getContext("2d", { willReadFrequently: true });
const runButton = document.querySelector('[data-action="run"]');
const stepButton = document.querySelector('[data-action="step"]');
const clearButton = document.querySelector('[data-action="clear"]');
const saveButton = document.querySelector('[data-action="save-preset"]');
const loadButton = document.querySelector('[data-action="load-preset"]');
const sampleButton = document.querySelector('[data-action="load-sample"]');
const gifButton = document.querySelector('[data-action="export-gif"]');
const frameCountInput = document.getElementById("frameCount");
const presetArea = document.getElementById("presetArea");
const speedSlider = document.getElementById("speedSlider");
const speedLabel = document.getElementById("speedLabel");
const toolButtons = document.querySelectorAll("[data-tool]");
const statusMessage = document.getElementById("statusMessage");
const generationLabel = document.getElementById("generationLabel");
const closeButton = document.getElementById("closeButton");

let grid = createEmptyGrid();
let running = false;
let pointerActive = false;
let pointerTool = "paint";
let selectedSpecies = "moss";
let currentWeather = "normal";
let generation = 0;
let currentSpeed = Number(speedSlider?.value ?? 320);
let stepTimeout = null;
let statusTimeout = null;
const frameHistory = [];

const meadowSeeds = [
  { x: 14, y: 15, species: "moss" },
  { x: 15, y: 15, species: "moss" },
  { x: 16, y: 15, species: "moss" },
  { x: 15, y: 16, species: "moss" },
  { x: 20, y: 14, species: "bloom" },
  { x: 21, y: 14, species: "bloom" },
  { x: 20, y: 15, species: "bloom" },
  { x: 21, y: 15, species: "bloom" },
  { x: 11, y: 18, species: "fungus" },
  { x: 12, y: 19, species: "fungus" },
  { x: 12, y: 20, species: "fungus" },
  { x: 11, y: 20, species: "fungus" },
  { x: 19, y: 19, species: "bloom" },
  { x: 13, y: 13, species: "moss" },
  { x: 18, y: 18, species: "fungus" },
];

function createEmptyGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => null)
  );
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mixColor(hex, ratio) {
  const { r, g, b } = hexToRgb(hex);
  const mixRatio = clamp(ratio, 0, 1);
  const mixed = {
    r: Math.round(r + (255 - r) * mixRatio),
    g: Math.round(g + (255 - g) * mixRatio),
    b: Math.round(b + (255 - b) * mixRatio),
  };
  return `rgb(${mixed.r}, ${mixed.g}, ${mixed.b})`;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const bigint = parseInt(normalized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function renderGrid(capture = true, delay = currentSpeed) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const cell = grid[y][x];
      const drawX = x * CELL_SIZE;
      const drawY = y * CELL_SIZE;
      if (cell) {
        const baseColor = SPECIES[cell.species].color;
        const color = mixColor(baseColor, Math.min(cell.age, 6) * 0.08);
        ctx.fillStyle = color;
      } else {
        ctx.fillStyle = y % 2 === x % 2 ? "#f6f3e8" : "#f4efe2";
      }
      ctx.fillRect(drawX, drawY, CELL_SIZE, CELL_SIZE);
      ctx.strokeStyle = "rgba(43, 58, 46, 0.08)";
      ctx.strokeRect(drawX + 0.5, drawY + 0.5, CELL_SIZE - 1, CELL_SIZE - 1);
    }
  }

  if (capture) {
    captureFrame(delay);
  }
}

function captureFrame(delay) {
  try {
    const imageData = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    frameHistory.push({ imageData, delay: Math.max(delay, 80) });
    if (frameHistory.length > MAX_FRAMES) {
      frameHistory.shift();
    }
  } catch (error) {
    console.error("Unable to capture frame", error);
  }
}

function countNeighbors(x, y) {
  const counts = { moss: 0, bloom: 0, fungus: 0 };
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= GRID_SIZE || ny < 0 || ny >= GRID_SIZE) continue;
      const neighbor = grid[ny][nx];
      if (neighbor) {
        counts[neighbor.species] += 1;
      }
    }
  }
  return counts;
}

function applyWeatherAdjustments(speciesKey, counts) {
  const species = SPECIES[speciesKey];
  const weather = WEATHER_STATES[currentWeather];
  const sameCount = counts[speciesKey];
  const surviveMin = clamp(
    species.surviveMin + (weather?.surviveMinOffset ?? 0),
    0,
    8
  );
  const surviveMax = clamp(
    species.surviveMax + (weather?.surviveMaxOffset ?? 0),
    0,
    8
  );
  const birthMin = clamp(
    species.birthMin + (weather?.birthMinOffset ?? 0),
    0,
    8
  );
  const birthMax = clamp(
    species.birthMax + (weather?.birthMaxOffset ?? 0),
    0,
    8
  );

  return {
    survive: sameCount >= surviveMin && sameCount <= surviveMax,
    born: sameCount >= birthMin && sameCount <= birthMax,
    neighborCount: sameCount,
  };
}

function stepSimulation() {
  const nextGrid = createEmptyGrid();
  let changed = false;

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const currentCell = grid[y][x];
      const counts = countNeighbors(x, y);
      let nextCell = null;

      if (currentCell) {
        const weatherResult = applyWeatherAdjustments(currentCell.species, counts);
        if (weatherResult.survive) {
          nextCell = {
            species: currentCell.species,
            age: currentCell.age + 1,
          };
        }
      }

      if (!nextCell) {
        let candidate = null;
        for (const key of Object.keys(SPECIES)) {
          const weatherResult = applyWeatherAdjustments(key, counts);
          if (weatherResult.born) {
            if (!candidate || weatherResult.neighborCount > candidate.neighborCount) {
              candidate = { species: key, age: 0, neighborCount: weatherResult.neighborCount };
            }
          }
        }
        if (candidate) {
          nextCell = { species: candidate.species, age: currentCell ? 0 : candidate.age };
        }
      }

      nextGrid[y][x] = nextCell;
      if (!cellsEqual(currentCell, nextCell)) {
        changed = true;
      }
    }
  }

  grid = nextGrid;
  generation += 1;
  updateGenerationLabel();
  renderGrid(true, currentSpeed);
  if (!changed && running) {
    flashStatus("The garden settled.");
    stopRun();
  }
  return changed;
}

function cellsEqual(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return a.species === b.species;
}

function toggleRun() {
  if (running) {
    stopRun();
  } else {
    startRun();
  }
}

function startRun() {
  running = true;
  runButton.textContent = "Pause";
  runButton.classList.add("is-running");
  scheduleNextStep();
  refreshStatus();
}

function stopRun() {
  running = false;
  runButton.textContent = "Run";
  runButton.classList.remove("is-running");
  if (stepTimeout) {
    clearTimeout(stepTimeout);
    stepTimeout = null;
  }
  refreshStatus();
}

function scheduleNextStep() {
  if (!running) return;
  stepTimeout = setTimeout(() => {
    stepSimulation();
    scheduleNextStep();
  }, currentSpeed);
}

function updateGenerationLabel() {
  generationLabel.textContent = `Generation ${generation}`;
}

function refreshStatus() {
  if (statusTimeout) return;
  const weatherLabel = WEATHER_STATES[currentWeather]?.label ?? "Calm Skies";
  statusMessage.textContent = `${running ? "Running" : "Paused"} — ${weatherLabel}`;
}

function flashStatus(message, duration = 2400) {
  clearTimeout(statusTimeout);
  statusMessage.textContent = message;
  statusTimeout = setTimeout(() => {
    statusTimeout = null;
    refreshStatus();
  }, duration);
}

function applyToolToCell(x, y) {
  if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return;
  if (pointerTool === "paint") {
    grid[y][x] = { species: selectedSpecies, age: 0 };
  } else if (pointerTool === "erase") {
    grid[y][x] = null;
  }
  renderGrid(false);
}

function handlePointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = Math.floor(((event.clientX - rect.left) * scaleX) / CELL_SIZE);
  const y = Math.floor(((event.clientY - rect.top) * scaleY) / CELL_SIZE);
  applyToolToCell(x, y);
}

function clearGrid(showMessage = true) {
  stopRun();
  grid = createEmptyGrid();
  generation = 0;
  frameHistory.length = 0;
  updateGenerationLabel();
  renderGrid(true);
  if (showMessage) {
    flashStatus("Cleared the terrarium.");
  }
}

function gatherPreset() {
  return {
    size: GRID_SIZE,
    weather: currentWeather,
    generation,
    grid: grid.map((row) => row.map((cell) => (cell ? cell.species : null))),
  };
}

function applyPreset(preset) {
  if (!preset || !Array.isArray(preset.grid)) {
    throw new Error("Invalid preset format.");
  }
  if (preset.grid.length !== GRID_SIZE) {
    throw new Error("Preset grid size mismatch.");
  }
  stopRun();
  grid = createEmptyGrid();
  for (let y = 0; y < GRID_SIZE; y += 1) {
    if (!Array.isArray(preset.grid[y]) || preset.grid[y].length !== GRID_SIZE) {
      throw new Error("Preset row size mismatch.");
    }
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const value = preset.grid[y][x];
      if (value && SPECIES[value]) {
        grid[y][x] = { species: value, age: 0 };
      }
    }
  }
  currentWeather = preset.weather && WEATHER_STATES[preset.weather] ? preset.weather : currentWeather;
  generation = Number.isFinite(preset.generation) ? preset.generation : 0;
  updateWeatherControls();
  updateGenerationLabel();
  frameHistory.length = 0;
  renderGrid(true);
  flashStatus("Loaded preset.");
}

function updateWeatherControls() {
  const weatherRadios = document.querySelectorAll('input[name="weather"]');
  weatherRadios.forEach((radio) => {
    radio.checked = radio.value === currentWeather;
  });
  refreshStatus();
}

function loadMeadowSample() {
  clearGrid(false);
  meadowSeeds.forEach(({ x, y, species }) => {
    if (SPECIES[species]) {
      grid[y][x] = { species, age: 0 };
    }
  });
  generation = 0;
  updateGenerationLabel();
  renderGrid(true);
  presetArea.value = JSON.stringify(gatherPreset(), null, 2);
  flashStatus("Meadow sample planted.");
}

function exportGif() {
  if (typeof GIF === "undefined") {
    flashStatus("GIF library unavailable.");
    return;
  }
  const framesRequested = clamp(Number(frameCountInput.value) || 0, 5, 120);
  const frames = frameHistory.slice(-framesRequested);
  if (frames.length === 0) {
    flashStatus("No frames captured yet.");
    return;
  }

  gifButton.disabled = true;
  flashStatus("Rendering GIF...", 4000);

  const workerScript = "https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js";
  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript,
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
  });

  const offscreen = document.createElement("canvas");
  offscreen.width = CANVAS_SIZE;
  offscreen.height = CANVAS_SIZE;
  const offCtx = offscreen.getContext("2d");

  frames.forEach((frame) => {
    offCtx.putImageData(frame.imageData, 0, 0);
    gif.addFrame(offscreen, { copy: true, delay: frame.delay });
  });

  gif.on("finished", (blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pocket-terrarium.gif";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    gifButton.disabled = false;
    flashStatus("GIF saved to downloads.");
  });

  gif.on("abort", () => {
    gifButton.disabled = false;
    flashStatus("GIF export aborted.");
  });

  gif.on("error", () => {
    gifButton.disabled = false;
    flashStatus("GIF export failed.");
  });

  gif.render();
}

function bindEvents() {
  toolButtons.forEach((button) => {
    button.addEventListener("click", () => {
      pointerTool = button.dataset.tool;
      toolButtons.forEach((btn) => btn.classList.toggle("active", btn === button));
    });
  });

  document.querySelectorAll('input[name="seed"]').forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (event.target.checked) {
        selectedSpecies = event.target.value;
      }
    });
  });

  document.querySelectorAll('input[name="weather"]').forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (event.target.checked) {
        currentWeather = event.target.value;
        refreshStatus();
      }
    });
  });

  runButton?.addEventListener("click", toggleRun);
  stepButton?.addEventListener("click", () => {
    stopRun();
    stepSimulation();
  });

  clearButton?.addEventListener("click", () => clearGrid(true));

  saveButton?.addEventListener("click", () => {
    const preset = gatherPreset();
    presetArea.value = JSON.stringify(preset, null, 2);
    presetArea.focus();
    presetArea.select();
    flashStatus("Preset copied to JSON area.");
  });

  loadButton?.addEventListener("click", () => {
    try {
      const preset = JSON.parse(presetArea.value);
      applyPreset(preset);
    } catch (error) {
      console.error(error);
      flashStatus("Could not parse preset.");
    }
  });

  sampleButton?.addEventListener("click", loadMeadowSample);
  gifButton?.addEventListener("click", exportGif);

  speedSlider?.addEventListener("input", (event) => {
    currentSpeed = Number(event.target.value);
    speedLabel.textContent = `${currentSpeed} ms`;
    if (running) {
      stopRun();
      startRun();
    }
  });

  canvas.addEventListener("pointerdown", (event) => {
    pointerActive = true;
    canvas.setPointerCapture(event.pointerId);
    handlePointer(event);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!pointerActive) return;
    handlePointer(event);
  });

  canvas.addEventListener("pointerup", (event) => {
    pointerActive = false;
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    captureFrame(currentSpeed);
  });

  canvas.addEventListener("pointercancel", (event) => {
    pointerActive = false;
    if (canvas.hasPointerCapture?.(event.pointerId)) {
      canvas.releasePointerCapture(event.pointerId);
    }
    captureFrame(currentSpeed);
  });

  canvas.addEventListener("contextmenu", (event) => event.preventDefault());

  window.addEventListener("pointerup", () => {
    pointerActive = false;
  });

  closeButton?.addEventListener("click", () => {
    window.parent?.postMessage?.({ type: "applet-close" }, "*");
    if (window.history.length > 1) {
      window.history.back();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.code === "Space") {
      event.preventDefault();
      toggleRun();
    }
    if (event.code === "KeyE") {
      pointerTool = "erase";
      toolButtons.forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.tool === pointerTool)
      );
    }
    if (event.code === "KeyP") {
      pointerTool = "paint";
      toolButtons.forEach((btn) =>
        btn.classList.toggle("active", btn.dataset.tool === pointerTool)
      );
    }
  });
}

function init() {
  speedLabel.textContent = `${currentSpeed} ms`;
  updateGenerationLabel();
  renderGrid(true);
  refreshStatus();
  bindEvents();
}

init();
