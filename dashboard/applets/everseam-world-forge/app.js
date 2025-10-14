const canvas = document.getElementById("map");
const ctx = canvas.getContext("2d");
const seedInput = document.getElementById("seed");
const scaleInput = document.getElementById("scale");
const detailInput = document.getElementById("detail");
const moistureInput = document.getElementById("moisture");
const temperatureInput = document.getElementById("temperature");
const showContoursInput = document.getElementById("showContours");
const showRiversInput = document.getElementById("showRivers");
const animateClimateInput = document.getElementById("animateClimate");
const regenButton = document.getElementById("regen");
const randomizeButton = document.getElementById("randomize");
const legendList = document.getElementById("legendList");
const readout = document.getElementById("readout");

const width = canvas.width;
const height = canvas.height;

const biomePalette = [
  { name: "Deep Ocean", color: "#04364a" },
  { name: "Shallow Sea", color: "#0b5a6f" },
  { name: "Coastal Shoals", color: "#2e8a8c" },
  { name: "Delta Marsh", color: "#3d9b7c" },
  { name: "Rainforest", color: "#2f8f52" },
  { name: "Temperate Forest", color: "#4fa45f" },
  { name: "Prairie", color: "#7dbb5e" },
  { name: "Savanna", color: "#c9c65b" },
  { name: "Steppe", color: "#e2c572" },
  { name: "Desert", color: "#edb872" },
  { name: "Highland", color: "#c39f6b" },
  { name: "Alpine", color: "#dcd7c4" },
  { name: "Snowcap", color: "#f4f5f6" }
];

let worldState = {
  heightMap: new Float32Array(width * height),
  moistureMap: new Float32Array(width * height),
  temperatureMap: new Float32Array(width * height),
  biomeMap: new Array(width * height),
  rivers: new Uint8Array(width * height),
  baseImage: null,
  animationHandle: null,
  bounds: {
    heightMin: 0,
    heightMax: 1,
    moistureMin: 0,
    moistureMax: 1,
    tempMin: 0,
    tempMax: 1
  }
};

class Perlin2D {
  constructor(seed) {
    this.permutation = new Uint8Array(512);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    const rng = mulberry32(seed);
    for (let i = 255; i >= 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255];
    }
  }

  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(a, b, t) {
    return a + t * (b - a);
  }

  grad(hash, x, y) {
    const h = hash & 7;
    const u = h < 4 ? x : y;
    const v = h < 4 ? y : x;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  noise(x, y) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const topRight = this.permutation[this.permutation[X + 1] + Y + 1];
    const topLeft = this.permutation[this.permutation[X] + Y + 1];
    const bottomRight = this.permutation[this.permutation[X + 1] + Y];
    const bottomLeft = this.permutation[this.permutation[X] + Y];

    const u = this.fade(xf);
    const v = this.fade(yf);

    const gradTL = this.grad(topLeft, xf, yf - 1);
    const gradTR = this.grad(topRight, xf - 1, yf - 1);
    const gradBL = this.grad(bottomLeft, xf, yf);
    const gradBR = this.grad(bottomRight, xf - 1, yf);

    const lerpTop = this.lerp(gradTL, gradTR, u);
    const lerpBottom = this.lerp(gradBL, gradBR, u);
    const value = this.lerp(lerpBottom, lerpTop, v);

    return (value + 1) / 2;
  }
}

function mulberry32(a) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function octaveNoise(perlin, x, y, octaves, persistence = 0.5, lacunarity = 2) {
  let total = 0;
  let amplitude = 1;
  let frequency = 1;
  let maxValue = 0;
  for (let i = 0; i < octaves; i++) {
    total += perlin.noise(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= lacunarity;
  }
  return total / maxValue;
}

function normalize(value, min, max) {
  if (max - min === 0) return 0;
  const normalized = (value - min) / (max - min);
  return Math.min(1, Math.max(0, normalized));
}

function getBiome(elevation, moisture, temperature) {
  if (elevation < 0.22) return 0;
  if (elevation < 0.28) return 1;
  if (elevation < 0.32) return 2;

  if (elevation > 0.82) {
    return temperature < 0.35 ? 12 : 11;
  }
  if (elevation > 0.7) {
    return temperature < 0.4 ? 12 : 10;
  }

  if (moisture > 0.7) {
    if (temperature > 0.65) return 4; // rainforest
    return 5; // temperate forest
  }
  if (moisture > 0.5) {
    if (temperature < 0.35) return 5;
    return temperature > 0.6 ? 4 : 6;
  }
  if (moisture > 0.35) {
    if (temperature > 0.7) return 7; // savanna
    return 6; // prairie
  }
  if (moisture > 0.2) {
    return temperature > 0.6 ? 7 : 8; // steppe
  }

  return temperature > 0.55 ? 9 : 10; // desert or highland scrub
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

const biomeRGB = biomePalette.map((b) => ({ ...b, rgb: hexToRgb(b.color) }));

function generateWorld() {
  const seed = Number(seedInput.value) || 0;
  const elevationScale = Number(scaleInput.value);
  const octaves = Number(detailInput.value);
  const moistureDrift = Number(moistureInput.value);
  const thermalSway = Number(temperatureInput.value);
  const showContours = showContoursInput.checked;
  const showRivers = showRiversInput.checked;

  const elevationNoise = new Perlin2D(seed + 13);
  const moistureNoise = new Perlin2D(seed * 1.3 + 97);
  const temperatureNoise = new Perlin2D(seed * 2.1 + 211);

  let heightMin = Infinity;
  let heightMax = -Infinity;
  let moistureMin = Infinity;
  let moistureMax = -Infinity;
  let tempMin = Infinity;
  let tempMax = -Infinity;

  const { heightMap, moistureMap, temperatureMap, biomeMap } = worldState;

  const moistureOctaves = Math.max(1, octaves - 1);
  const temperatureOctaves = Math.max(1, octaves - 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const nx = (x - width / 2) / elevationScale;
      const ny = (y - height / 2) / elevationScale;

      const base = octaveNoise(elevationNoise, nx, ny, octaves, 0.52, 2.2);
      const continent = octaveNoise(elevationNoise, nx * 0.4, ny * 0.4, 2, 0.65, 1.8);
      const elevation = base * 0.7 + continent * 0.3;

      const radial = Math.sqrt((x - width / 2) ** 2 + (y - height / 2) ** 2) / (Math.min(width, height) / 2);
      const coastBias = Math.max(0, 1 - radial * 0.85);
      const heightValue = elevation * 0.85 + coastBias * 0.25 - radial * 0.12;

      const moist = octaveNoise(
        moistureNoise,
        nx * (0.6 + moistureDrift * 0.08),
        ny * (0.6 + moistureDrift * 0.08),
        moistureOctaves,
        0.58,
        2.1
      );
      const moistureValue = moist;

      const lat = Math.abs(y / height - 0.5) * 2;
      const tempNoise = octaveNoise(
        temperatureNoise,
        nx * 0.7,
        ny * (0.8 + thermalSway * 0.08),
        temperatureOctaves,
        0.6,
        2.05
      );
      const temperatureValue = 1 - lat * 0.75 + tempNoise * 0.45;

      heightMap[idx] = heightValue;
      moistureMap[idx] = moistureValue;
      temperatureMap[idx] = temperatureValue;

      if (heightValue < heightMin) heightMin = heightValue;
      if (heightValue > heightMax) heightMax = heightValue;
      if (moistureValue < moistureMin) moistureMin = moistureValue;
      if (moistureValue > moistureMax) moistureMax = moistureValue;
      if (temperatureValue < tempMin) tempMin = temperatureValue;
      if (temperatureValue > tempMax) tempMax = temperatureValue;
    }
  }

  worldState.bounds = {
    heightMin,
    heightMax,
    moistureMin,
    moistureMax,
    tempMin,
    tempMax
  };

  const seaLevel = heightMin + (heightMax - heightMin) * 0.27;

  const activeBiomes = new Set();
  for (let i = 0; i < width * height; i++) {
    const h = normalize(heightMap[i], heightMin, heightMax);
    const m = normalize(moistureMap[i], moistureMin, moistureMax);
    const t = normalize(temperatureMap[i], tempMin, tempMax);
    const biomeIndex = getBiome(h, m, t);
    biomeMap[i] = biomeIndex;
    activeBiomes.add(biomeIndex);
  }

  const rivers = computeRivers(heightMap, moistureMap, width, height, seaLevel, showRivers);
  worldState.rivers = rivers;

  const contourInterval = 0.05;
  const baseImage = ctx.createImageData(width, height);
  const data = baseImage.data;

  for (let i = 0; i < width * height; i++) {
    const biome = biomeRGB[biomeMap[i]];
    let [r, g, b] = biome.rgb;

    if (showContours) {
      const h = normalize(heightMap[i], heightMin, heightMax);
      const contour = Math.abs(((h / contourInterval) % 1) - 0.5);
      if (contour < 0.03 && h > seaLevel) {
        r = Math.min(255, r + 24);
        g = Math.min(255, g + 24);
        b = Math.min(255, b + 24);
      }
    }

    if (rivers[i] && biomeMap[i] > 0) {
      r = 32;
      g = 120;
      b = 160;
    }

    const a = 255;
    const di = i * 4;
    data[di] = r;
    data[di + 1] = g;
    data[di + 2] = b;
    data[di + 3] = a;
  }

  ctx.putImageData(baseImage, 0, 0);
  worldState.baseImage = baseImage;
  refreshLegend(activeBiomes);
  updateReadout(null);
  manageAnimation();
}

function computeRivers(heightMap, moistureMap, width, height, seaLevel, enabled) {
  const rivers = new Uint8Array(width * height);
  if (!enabled) return rivers;

  const size = width * height;
  const order = new Array(size);
  for (let i = 0; i < size; i++) order[i] = i;
  order.sort((a, b) => heightMap[b] - heightMap[a]);

  const flow = new Float32Array(size).fill(0.6);
  const target = new Int32Array(size).fill(-1);

  const offsets = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1]
  ];

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (heightMap[idx] < seaLevel) continue;
      let lowest = heightMap[idx];
      let best = -1;
      for (const [dx, dy] of offsets) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (heightMap[nIdx] < lowest) {
          lowest = heightMap[nIdx];
          best = nIdx;
        }
      }
      target[idx] = best;
    }
  }

  for (const idx of order) {
    const next = target[idx];
    if (next === -1) continue;
    flow[next] += flow[idx] + moistureMap[idx] * 1.5;
  }

  const threshold = 8;
  for (let i = 0; i < size; i++) {
    if (heightMap[i] < seaLevel) continue;
    if (flow[i] > threshold) {
      rivers[i] = 1;
    }
  }
  return rivers;
}

function refreshLegend(activeBiomes) {
  legendList.innerHTML = "";
  const sorted = [...activeBiomes].sort((a, b) => a - b);
  for (const index of sorted) {
    const biome = biomeRGB[index];
    const li = document.createElement("li");
    const swatch = document.createElement("span");
    swatch.style.background = biome.color;
    li.appendChild(swatch);
    li.appendChild(document.createTextNode(biome.name));
    legendList.appendChild(li);
  }
}

function updateReadout(info) {
  if (!info) {
    readout.textContent = "Hover the map to inspect elevation, moisture, and biome.";
    return;
  }
  readout.textContent = `Elevation ${(info.elevation * 100).toFixed(1)}% · Moisture ${(info.moisture * 100).toFixed(1)}% · Temp ${(info.temperature * 100).toFixed(1)}% · ${info.biome}`;
}

function manageAnimation() {
  if (worldState.animationHandle) {
    cancelAnimationFrame(worldState.animationHandle);
    worldState.animationHandle = null;
  }
  if (!animateClimateInput.checked || !worldState.baseImage) {
    ctx.putImageData(worldState.baseImage, 0, 0);
    return;
  }

  const base = worldState.baseImage;
  const overlay = ctx.createLinearGradient(0, 0, 0, height);
  overlay.addColorStop(0, "rgba(244, 185, 66, 0.2)");
  overlay.addColorStop(0.5, "rgba(15, 76, 92, 0.12)");
  overlay.addColorStop(1, "rgba(4, 54, 74, 0.22)");

  let frame = 0;
  const animate = () => {
    frame += 0.01;
    ctx.putImageData(base, 0, 0);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = 0.4 + Math.sin(frame) * 0.12;
    ctx.fillStyle = overlay;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
    worldState.animationHandle = requestAnimationFrame(animate);
  };
  worldState.animationHandle = requestAnimationFrame(animate);
}

function setSeed(value) {
  seedInput.value = value;
}

function randomSeed() {
  return Math.floor(Math.random() * 999999);
}

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = width / rect.width;
  const scaleY = height / rect.height;
  const x = Math.floor((event.clientX - rect.left) * scaleX);
  const y = Math.floor((event.clientY - rect.top) * scaleY);
  if (x < 0 || y < 0 || x >= width || y >= height) {
    updateReadout(null);
    return;
  }
  const idx = y * width + x;
  const h = worldState.heightMap[idx];
  const m = worldState.moistureMap[idx];
  const t = worldState.temperatureMap[idx];
  const bounds = worldState.bounds;
  const normalized = {
    elevation: normalize(h, bounds.heightMin, bounds.heightMax),
    moisture: normalize(m, bounds.moistureMin, bounds.moistureMax),
    temperature: normalize(t, bounds.tempMin, bounds.tempMax)
  };
  const biome = biomePalette[worldState.biomeMap[idx]].name;
  updateReadout({ ...normalized, biome });
});

canvas.addEventListener("mouseleave", () => updateReadout(null));

const controls = [scaleInput, detailInput, moistureInput, temperatureInput, showContoursInput, showRiversInput];
controls.forEach((control) => control.addEventListener("input", generateWorld));
regenButton.addEventListener("click", generateWorld);
randomizeButton.addEventListener("click", () => {
  const newSeed = randomSeed();
  setSeed(newSeed);
  generateWorld();
});
seedInput.addEventListener("change", generateWorld);
animateClimateInput.addEventListener("input", manageAnimation);

function bootstrap() {
  const initialSeed = randomSeed();
  setSeed(initialSeed);
  generateWorld();
}

bootstrap();
