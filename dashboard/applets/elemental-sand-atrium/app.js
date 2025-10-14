const canvas = document.getElementById("sandCanvas");
const ctx = canvas.getContext("2d", { willReadFrequently: false });
const paletteEl = document.getElementById("materialPalette");
const brushSizeInput = document.getElementById("brushSize");
const flowRateInput = document.getElementById("flowRate");
const windInput = document.getElementById("wind");
const coolingInput = document.getElementById("cooling");
const brushSizeValue = document.getElementById("brushSizeValue");
const flowRateValue = document.getElementById("flowRateValue");
const windValue = document.getElementById("windValue");
const coolingValue = document.getElementById("coolingValue");
const statusBoard = document.getElementById("statusBoard");
const resetButton = document.getElementById("resetButton");
const autoRainToggle = document.getElementById("autoRain");
const emberPulseToggle = document.getElementById("emberPulse");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const SIZE = WIDTH * HEIGHT;

const MATERIALS = {
  EMPTY: 0,
  SAND: 1,
  WATER: 2,
  STONE: 3,
  PLANT: 4,
  FIRE: 5,
  SMOKE: 6,
  OIL: 7,
  LAVA: 8,
  STEAM: 9,
  SEED: 10,
  ICE: 11,
};

const MATERIAL_INFO = [
  {
    id: MATERIALS.SAND,
    name: "Sand",
    swatch: "#d4b483",
    description: "Heavy grit that tumbles and buries pools.",
  },
  {
    id: MATERIALS.WATER,
    name: "Water",
    swatch: "#3da9fc",
    description: "Flows everywhere, quenches flame, feeds seeds.",
  },
  {
    id: MATERIALS.SEED,
    name: "Seed",
    swatch: "#f4a259",
    description: "Drifting pods that sprout when watered.",
  },
  {
    id: MATERIALS.PLANT,
    name: "Bloom",
    swatch: "#4ade80",
    description: "Verdant growth that spreads with moisture.",
  },
  {
    id: MATERIALS.OIL,
    name: "Oil",
    swatch: "#ff9f1c",
    description: "Slick fuel that floats and ignites easily.",
  },
  {
    id: MATERIALS.FIRE,
    name: "Fire",
    swatch: "#ff6b35",
    description: "Hungry flame that climbs through fuel.",
  },
  {
    id: MATERIALS.LAVA,
    name: "Lava",
    swatch: "#ff5714",
    description: "Molten surge that forges stone with water.",
  },
  {
    id: MATERIALS.STONE,
    name: "Stone",
    swatch: "#94a3b8",
    description: "Solid scaffold that resists most change.",
  },
  {
    id: MATERIALS.STEAM,
    name: "Steam",
    swatch: "#e0ff4f",
    description: "Buoyant vapor that may rain back down.",
  },
  {
    id: MATERIALS.SMOKE,
    name: "Smoke",
    swatch: "#b0bec5",
    description: "Drifts upward and disperses on the wind.",
  },
  {
    id: MATERIALS.ICE,
    name: "Ice",
    swatch: "#8ecae6",
    description: "Brittle chill that melts with heat.",
  },
  {
    id: MATERIALS.EMPTY,
    name: "Vacuum",
    swatch: "#0f1116",
    description: "Erase back to void.",
  },
];

const COLORS = new Map([
  [MATERIALS.EMPTY, [15, 17, 22, 255]],
  [MATERIALS.SAND, [205, 176, 125, 255]],
  [MATERIALS.WATER, [61, 169, 252, 240]],
  [MATERIALS.STONE, [110, 123, 139, 255]],
  [MATERIALS.PLANT, [74, 222, 128, 255]],
  [MATERIALS.FIRE, [255, 107, 53, 255]],
  [MATERIALS.SMOKE, [176, 190, 197, 180]],
  [MATERIALS.OIL, [255, 159, 28, 230]],
  [MATERIALS.LAVA, [255, 87, 20, 255]],
  [MATERIALS.STEAM, [224, 255, 79, 190]],
  [MATERIALS.SEED, [244, 162, 89, 255]],
  [MATERIALS.ICE, [142, 202, 230, 255]],
]);

const DEFAULT_LIFE = new Map([
  [MATERIALS.FIRE, 55],
  [MATERIALS.SMOKE, 42],
  [MATERIALS.STEAM, 52],
  [MATERIALS.SEED, 8],
  [MATERIALS.LAVA, 90],
  [MATERIALS.ICE, 120],
]);

const grid = new Uint8Array(SIZE);
const life = new Uint16Array(SIZE);
const moved = new Uint8Array(SIZE);

let selectedMaterial = MATERIALS.SAND;
let brushSize = Number(brushSizeInput.value);
let flowRate = Number(flowRateInput.value);
brushSizeValue.textContent = brushSize;
flowRateValue.textContent = `${flowRate}x`;
windValue.textContent = describeWind(Number(windInput.value));
coolingValue.textContent = describeCooling(Number(coolingInput.value));

const environment = {
  wind: 0,
  cooling: 0.5,
  autoRain: false,
  emberPulse: false,
};

const index = (x, y) => y * WIDTH + x;
const inBounds = (x, y) => x >= 0 && x < WIDTH && y >= 0 && y < HEIGHT;

const updatePaletteSelection = () => {
  [...paletteEl.children].forEach((button) => {
    const isSelected = Number(button.dataset.material) === selectedMaterial;
    button.setAttribute("data-selected", String(isSelected));
    button.setAttribute("aria-checked", String(isSelected));
  });
};

const describeWind = (value) => (value === 0 ? "Calm" : value > 0 ? `East ${value}` : `West ${Math.abs(value)}`);
const describeCooling = (value) => {
  if (value === 5) return "Balanced";
  if (value < 5) return `Warm +${5 - value}`;
  return `Chill ${value - 5}`;
};

const buildPalette = () => {
  const fragment = document.createDocumentFragment();
  MATERIAL_INFO.forEach((material) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "material-button";
    button.dataset.material = material.id;
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    button.innerHTML = `
      <div class="material-button__swatch" style="--swatch: ${material.swatch}"></div>
      <strong>${material.name}</strong>
      <span>${material.description}</span>
    `;
    button.addEventListener("click", () => {
      selectedMaterial = material.id;
      updatePaletteSelection();
    });
    fragment.appendChild(button);
  });
  paletteEl.appendChild(fragment);
  updatePaletteSelection();
};

buildPalette();

const setStatus = (entries) => {
  statusBoard.innerHTML = "";
  entries.forEach(([label, value]) => {
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    statusBoard.append(dt, dd);
  });
};

const updateStatus = () => {
  const counts = new Array(Object.keys(MATERIALS).length).fill(0);
  for (let i = 0; i < SIZE; i++) {
    counts[grid[i]] += 1;
  }
  const total = SIZE;
  const percent = (count) => ((count / total) * 100).toFixed(1) + "%";
  setStatus([
    ["Sand", percent(counts[MATERIALS.SAND])],
    ["Water", percent(counts[MATERIALS.WATER])],
    ["Plant", percent(counts[MATERIALS.PLANT])],
    ["Lava", percent(counts[MATERIALS.LAVA])],
  ]);
};

let statusTimer = 0;

const moveCell = (fromIdx, toIdx) => {
  const material = grid[fromIdx];
  const age = life[fromIdx];
  grid[toIdx] = material;
  life[toIdx] = age;
  grid[fromIdx] = MATERIALS.EMPTY;
  life[fromIdx] = 0;
  moved[fromIdx] = 1;
  moved[toIdx] = 1;
};

const swapCells = (aIdx, bIdx) => {
  const material = grid[aIdx];
  const other = grid[bIdx];
  const ageA = life[aIdx];
  const ageB = life[bIdx];
  grid[aIdx] = other;
  grid[bIdx] = material;
  life[aIdx] = ageB;
  life[bIdx] = ageA;
  moved[aIdx] = 1;
  moved[bIdx] = 1;
};

const defaultLifeFor = (material) => DEFAULT_LIFE.get(material) ?? 0;

const setCell = (idx, material, age = null) => {
  grid[idx] = material;
  life[idx] = age ?? defaultLifeFor(material);
  moved[idx] = 1;
};

const addCell = (x, y, material, age = null) => {
  if (!inBounds(x, y)) return;
  const idx = index(x, y);
  grid[idx] = material;
  life[idx] = age ?? defaultLifeFor(material);
};

const getNeighbors = (x, y) => {
  const neighbors = [];
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (inBounds(nx, ny)) {
        neighbors.push([nx, ny, index(nx, ny)]);
      }
    }
  }
  return neighbors;
};

const tryFall = (x, y, dx, dy, swapTargets = []) => {
  const nx = x + dx;
  const ny = y + dy;
  if (!inBounds(nx, ny)) return false;
  const idx = index(x, y);
  const targetIdx = index(nx, ny);
  const target = grid[targetIdx];
  if (target === MATERIALS.EMPTY) {
    moveCell(idx, targetIdx);
    return true;
  }
  if (swapTargets.includes(target)) {
    swapCells(idx, targetIdx);
    return true;
  }
  return false;
};

const igniteNeighbors = (x, y, fuels) => {
  const neighbors = getNeighbors(x, y);
  neighbors.forEach(([, , nIdx]) => {
    if (fuels.includes(grid[nIdx])) {
      setCell(nIdx, MATERIALS.FIRE, 30);
    }
  });
};

const extinguishAround = (x, y) => {
  const neighbors = getNeighbors(x, y);
  neighbors.forEach(([nx, ny, nIdx]) => {
    if (grid[nIdx] === MATERIALS.FIRE) {
      setCell(nIdx, MATERIALS.STEAM, 35);
    }
    if (grid[nIdx] === MATERIALS.LAVA) {
      setCell(nIdx, MATERIALS.STONE, 0);
    }
  });
};

const plantSpread = (x, y) => {
  const neighbors = getNeighbors(x, y);
  const moist = neighbors.some(([, , idx]) => grid[idx] === MATERIALS.WATER || grid[idx] === MATERIALS.STEAM);
  if (!moist) return;
  neighbors.forEach(([nx, ny, idx]) => {
    if (grid[idx] === MATERIALS.EMPTY && Math.random() < 0.06) {
      setCell(idx, MATERIALS.SEED, 0);
    }
  });
};

const condense = (x, y, into) => {
  const idx = index(x, y);
  setCell(idx, into, 0);
};

const simulate = () => {
  moved.fill(0);

  for (let y = HEIGHT - 1; y >= 0; y--) {
    const windPush = environment.wind;
    for (let x = 0; x < WIDTH; x++) {
      const idx = index(x, y);
      if (moved[idx]) continue;
      const material = grid[idx];
      if (material === MATERIALS.EMPTY) continue;

      switch (material) {
        case MATERIALS.SAND: {
          const choices = Math.random() < 0.5 ? [-1, 1] : [1, -1];
          if (tryFall(x, y, 0, 1, [MATERIALS.WATER, MATERIALS.OIL, MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          if (tryFall(x, y, choices[0], 1, [MATERIALS.WATER, MATERIALS.OIL, MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          tryFall(x, y, choices[1], 1, [MATERIALS.WATER, MATERIALS.OIL, MATERIALS.SMOKE, MATERIALS.STEAM]);
          break;
        }
        case MATERIALS.SEED: {
          life[idx]++;
          const settled = tryFall(x, y, 0, 1, [MATERIALS.WATER, MATERIALS.SMOKE, MATERIALS.STEAM]);
          if (!settled) {
            const neighbors = getNeighbors(x, y);
            const hydrated = neighbors.some(([, , nIdx]) => grid[nIdx] === MATERIALS.WATER || grid[nIdx] === MATERIALS.STEAM);
            if (hydrated || life[idx] > 150) {
              setCell(idx, MATERIALS.PLANT, 0);
            }
          }
          break;
        }
        case MATERIALS.WATER: {
          life[idx]++;
          extinguishAround(x, y);
          if (tryFall(x, y, 0, 1, [MATERIALS.OIL, MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          const first = windPush === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(windPush);
          const second = -first;
          if (tryFall(x, y, first, 1, [MATERIALS.OIL, MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          if (tryFall(x, y, second, 1, [MATERIALS.OIL, MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          if (tryFall(x, y, first, 0, [MATERIALS.OIL, MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          tryFall(x, y, second, 0, [MATERIALS.OIL, MATERIALS.SMOKE, MATERIALS.STEAM]);
          break;
        }
        case MATERIALS.OIL: {
          life[idx]++;
          if (tryFall(x, y, 0, 1, [MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          const belowIdx = inBounds(x, y + 1) ? index(x, y + 1) : -1;
          if (belowIdx >= 0 && grid[belowIdx] === MATERIALS.WATER) {
            swapCells(idx, belowIdx);
            break;
          }
          const dir = windPush === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(windPush);
          if (tryFall(x, y, dir, 1, [MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          if (tryFall(x, y, -dir, 1, [MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          if (tryFall(x, y, dir, 0, [MATERIALS.SMOKE, MATERIALS.STEAM])) break;
          tryFall(x, y, -dir, 0, [MATERIALS.SMOKE, MATERIALS.STEAM]);
          break;
        }
        case MATERIALS.LAVA: {
          life[idx]++;
          const coolingFactor = environment.cooling;
          const neighbors = getNeighbors(x, y);
          let quenched = false;
          for (const [, , nIdx] of neighbors) {
            if (grid[nIdx] === MATERIALS.WATER) {
              setCell(nIdx, MATERIALS.STEAM, 40);
              setCell(idx, MATERIALS.STONE, 0);
              quenched = true;
              break;
            }
            if (grid[nIdx] === MATERIALS.PLANT || grid[nIdx] === MATERIALS.OIL || grid[nIdx] === MATERIALS.SEED) {
              setCell(nIdx, MATERIALS.FIRE, 20);
            }
            if (grid[nIdx] === MATERIALS.ICE) {
              setCell(nIdx, MATERIALS.WATER, 0);
            }
          }
          if (quenched) break;
          if (Math.random() < coolingFactor * 0.004) {
            setCell(idx, MATERIALS.STONE, 0);
            break;
          }
          if (tryFall(x, y, 0, 1, [MATERIALS.WATER, MATERIALS.SMOKE, MATERIALS.STEAM, MATERIALS.OIL, MATERIALS.SEED, MATERIALS.PLANT])) break;
          const lateral = Math.random() < 0.5 ? -1 : 1;
          if (tryFall(x, y, lateral, 1, [MATERIALS.WATER, MATERIALS.SMOKE, MATERIALS.STEAM, MATERIALS.OIL, MATERIALS.SEED, MATERIALS.PLANT])) break;
          tryFall(x, y, -lateral, 1, [MATERIALS.WATER, MATERIALS.SMOKE, MATERIALS.STEAM, MATERIALS.OIL, MATERIALS.SEED, MATERIALS.PLANT]);
          break;
        }
        case MATERIALS.FIRE: {
          const decay = 1 + environment.cooling * 0.4;
          life[idx] = life[idx] > decay ? life[idx] - decay : 0;
          igniteNeighbors(x, y, [MATERIALS.PLANT, MATERIALS.OIL, MATERIALS.SEED]);
          if (life[idx] <= 0) {
            setCell(idx, MATERIALS.SMOKE, 40);
            break;
          }
          const upDir = windPush === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(windPush);
          if (tryFall(x, y, upDir, -1, [])) break;
          tryFall(x, y, -upDir, -1, []);
          break;
        }
        case MATERIALS.SMOKE: {
          life[idx] = (life[idx] || 40) - 1 - Math.abs(environment.wind) * 0.2;
          const dir = environment.wind === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(environment.wind);
          if (!tryFall(x, y, dir, -1) && !tryFall(x, y, 0, -1)) {
            tryFall(x, y, dir, 0) || tryFall(x, y, -dir, 0);
          }
          if (life[idx] <= 0) {
            setCell(idx, MATERIALS.EMPTY, 0);
          }
          break;
        }
        case MATERIALS.STEAM: {
          life[idx] = (life[idx] || 50) - 1;
          if (environment.cooling > 0.7 && Math.random() < environment.cooling * 0.02) {
            condense(x, y, MATERIALS.WATER);
            break;
          }
          const dir = environment.wind === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(environment.wind);
          if (!tryFall(x, y, dir, -1, []) && !tryFall(x, y, 0, -1, [])) {
            tryFall(x, y, dir, 0, []) || tryFall(x, y, -dir, 0, []);
          }
          if (life[idx] <= 0) {
            setCell(idx, MATERIALS.WATER, 0);
          }
          break;
        }
        case MATERIALS.ICE: {
          if (Math.random() < 0.002 * (1 - environment.cooling)) {
            setCell(idx, MATERIALS.WATER, 0);
          }
          break;
        }
        case MATERIALS.PLANT: {
          life[idx]++;
          plantSpread(x, y);
          if (environment.cooling < 0.2 && Math.random() < 0.002) {
            setCell(idx, MATERIALS.SEED, 0);
            break;
          }
          break;
        }
        case MATERIALS.STONE: {
          if (environment.cooling > 0.85 && Math.random() < environment.cooling * 0.001 && y < HEIGHT - 1) {
            if (y > 0) {
              const aboveIdx = index(x, y - 1);
              if (grid[aboveIdx] === MATERIALS.WATER) {
                setCell(idx, MATERIALS.ICE, 0);
              }
            }
          }
          break;
        }
        default:
          break;
      }
    }
  }

  if (environment.autoRain && Math.random() < 0.6) {
    const drops = Math.ceil(flowRate * 1.5);
    for (let i = 0; i < drops; i++) {
      const x = Math.floor(Math.random() * WIDTH);
      addCell(x, 0, MATERIALS.WATER);
    }
  }

  if (environment.emberPulse && Math.random() < 0.3) {
    const x = Math.floor(Math.random() * WIDTH);
    const y = Math.floor(Math.random() * (HEIGHT / 3) + HEIGHT / 2);
    addCell(x, y, MATERIALS.LAVA);
  }

  statusTimer++;
  if (statusTimer > 30) {
    statusTimer = 0;
    updateStatus();
  }
};

const imageData = ctx.createImageData(WIDTH, HEIGHT);
const pixels = imageData.data;

const render = () => {
  for (let i = 0; i < SIZE; i++) {
    const color = COLORS.get(grid[i]) || COLORS.get(MATERIALS.EMPTY);
    const offset = i * 4;
    pixels[offset] = color[0];
    pixels[offset + 1] = color[1];
    pixels[offset + 2] = color[2];
    pixels[offset + 3] = color[3];
  }
  ctx.putImageData(imageData, 0, 0);
};

let drawing = false;

const paintAt = (clientX, clientY, event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = WIDTH / rect.width;
  const scaleY = HEIGHT / rect.height;
  const x = Math.floor((clientX - rect.left) * scaleX);
  const y = Math.floor((clientY - rect.top) * scaleY);
  if (!inBounds(x, y)) return;

  const targetIdx = index(x, y);
  if (event.shiftKey) {
    selectedMaterial = grid[targetIdx];
    updatePaletteSelection();
    return;
  }

  const mode = event.altKey ? MATERIALS.EMPTY : selectedMaterial;
  const radius = brushSize;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy > radius * radius) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (!inBounds(nx, ny)) continue;
      const idx = index(nx, ny);
      if (mode === MATERIALS.EMPTY) {
        grid[idx] = MATERIALS.EMPTY;
        life[idx] = 0;
      } else {
        grid[idx] = mode;
        life[idx] = defaultLifeFor(mode);
      }
    }
  }
};

const pointerDown = (event) => {
  event.preventDefault();
  drawing = true;
  for (let i = 0; i < flowRate; i++) {
    paintAt(event.clientX, event.clientY, event);
  }
};

const pointerMove = (event) => {
  if (!drawing) return;
  for (let i = 0; i < flowRate; i++) {
    paintAt(event.clientX, event.clientY, event);
  }
};

const pointerUp = () => {
  drawing = false;
};

canvas.addEventListener("pointerdown", pointerDown);
canvas.addEventListener("pointermove", pointerMove);
canvas.addEventListener("pointerup", pointerUp);
canvas.addEventListener("pointerleave", pointerUp);
window.addEventListener("pointerup", pointerUp);
canvas.addEventListener("contextmenu", (event) => event.preventDefault());

resetButton.addEventListener("click", () => {
  grid.fill(MATERIALS.EMPTY);
  life.fill(0);
  updateStatus();
});

brushSizeInput.addEventListener("input", () => {
  brushSize = Number(brushSizeInput.value);
  brushSizeValue.textContent = brushSize;
});

flowRateInput.addEventListener("input", () => {
  flowRate = Number(flowRateInput.value);
  flowRateValue.textContent = `${flowRate}x`;
});

windInput.addEventListener("input", () => {
  const raw = Number(windInput.value);
  environment.wind = raw;
  windValue.textContent = describeWind(raw);
});

coolingInput.addEventListener("input", () => {
  const raw = Number(coolingInput.value);
  environment.cooling = raw / 10;
  coolingValue.textContent = describeCooling(raw);
});

autoRainToggle.addEventListener("change", () => {
  environment.autoRain = autoRainToggle.checked;
});

emberPulseToggle.addEventListener("change", () => {
  environment.emberPulse = emberPulseToggle.checked;
});

const tick = () => {
  simulate();
  render();
  requestAnimationFrame(tick);
};

updateStatus();
tick();
