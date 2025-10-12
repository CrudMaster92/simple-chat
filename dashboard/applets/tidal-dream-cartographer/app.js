const canvas = document.getElementById("tidal-map");
const ctx = canvas.getContext("2d");
const titleInput = document.getElementById("title-input");
const moodSelect = document.getElementById("mood-select");
const layoutSelect = document.getElementById("layout-select");
const lumenSlider = document.getElementById("lumen-slider");
const lumenOutput = document.getElementById("lumen-output");
const instrumentSelect = document.getElementById("instrument-select");
const whisperInput = document.getElementById("whisper-input");
const modelInput = document.getElementById("model-input");
const apiKeyInput = document.getElementById("api-key");
const generateBtn = document.getElementById("generate-btn");
const mapTitleEl = document.getElementById("map-title");
const mapTagsEl = document.getElementById("map-tags");
const storyOutput = document.getElementById("tide-story");
const storyStatus = document.getElementById("story-status");

const titleSeeds = [
  "Lumen Shoal Almanac",
  "Estuary of Dawns",
  "Radiant Tidal Braille",
  "Archipelago of Sleepwalkers",
  "Sunwake Sounding",
  "Opaline Drift Charts",
  "Sunglint Atoll Scroll"
];

let lastSettings = null;
let lastMapData = null;

function randomOf(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function initializeTitle() {
  if (!titleInput.value.trim()) {
    titleInput.value = randomOf(titleSeeds);
  }
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return;
  }
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = rect.width * pixelRatio;
  canvas.height = rect.height * pixelRatio;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.scale(pixelRatio, pixelRatio);
  if (lastSettings) {
    drawDreamMap(lastSettings, { preserveMeta: true });
  }
}

window.addEventListener("resize", () => {
  resizeCanvas();
});

function collectSettings() {
  const title = titleInput.value.trim();
  const moodLabel = moodSelect.options[moodSelect.selectedIndex]?.textContent ?? moodSelect.value;
  const layoutLabel = layoutSelect.options[layoutSelect.selectedIndex]?.textContent ?? layoutSelect.value;
  const instrumentLabel = instrumentSelect.options[instrumentSelect.selectedIndex]?.textContent ?? instrumentSelect.value;
  const lumen = parseInt(lumenSlider.value, 10);
  const model = modelInput.value.trim() || "gpt-4o-mini";

  return {
    title,
    mood: moodSelect.value,
    moodLabel,
    layout: layoutSelect.value,
    layoutLabel,
    instrument: instrumentSelect.value,
    instrumentLabel,
    lumen,
    whisper: whisperInput.value.trim(),
    model
  };
}

function setStatus(message, state) {
  storyStatus.textContent = message;
  if (state) {
    storyStatus.setAttribute("data-state", state);
  } else {
    storyStatus.removeAttribute("data-state");
  }
}

function hexToRgb(hex) {
  const sanitized = hex.replace("#", "");
  const bigint = parseInt(sanitized, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255
  };
}

function withAlpha(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const palettes = [
  {
    name: "Sunshower Wake",
    colors: ["#0fa3b1", "#90f0ff", "#ffd166"],
    shimmer: "gilded"
  },
  {
    name: "Coral Aurora",
    colors: ["#ff6f59", "#fce694", "#2ec4b6"],
    shimmer: "coral-sung"
  },
  {
    name: "Tonic Lagoon",
    colors: ["#4cc9f0", "#bde6ff", "#ffbe0b"],
    shimmer: "tonic"
  },
  {
    name: "Zephyr Shoals",
    colors: ["#00bbf9", "#48f2c9", "#ffd6a5"],
    shimmer: "zephyr"
  }
];

function layoutCoordinates(layout, count) {
  const coords = [];
  if (layout === "crescent chain") {
    const baseAngle = Math.PI * 0.9;
    for (let i = 0; i < count; i += 1) {
      const t = count === 1 ? 0.5 : i / (count - 1);
      const angle = -baseAngle / 2 + t * baseAngle;
      const radius = 0.28 + Math.random() * 0.08;
      coords.push({
        x: 0.55 + Math.cos(angle) * radius,
        y: 0.55 + Math.sin(angle) * radius
      });
    }
  } else if (layout === "spiral bloom") {
    const turns = 1.9;
    for (let i = 0; i < count; i += 1) {
      const angle = i * (Math.PI * turns) / count;
      const radius = 0.12 + i * 0.08;
      coords.push({
        x: 0.5 + Math.cos(angle) * radius,
        y: 0.5 + Math.sin(angle) * radius
      });
    }
  } else if (layout === "drifting fan") {
    for (let i = 0; i < count; i += 1) {
      const spread = 0.1 + i * 0.12;
      coords.push({
        x: 0.4 + spread,
        y: 0.35 + i * 0.12 + Math.random() * 0.04
      });
    }
  } else {
    for (let i = 0; i < count; i += 1) {
      coords.push({
        x: 0.35 + Math.random() * 0.4,
        y: 0.25 + Math.random() * 0.5
      });
    }
  }
  return coords;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function generateSeeds(settings, palette, width, height) {
  let count = 4;
  if (settings.layout === "spiral bloom") {
    count = 5;
  } else if (settings.layout === "scattered polyps") {
    count = 6 + Math.floor(Math.random() * 2);
  } else if (settings.layout === "drifting fan") {
    count = 4 + (Math.random() < 0.5 ? 1 : 0);
  }
  const coordinates = layoutCoordinates(settings.layout, count);
  const seeds = [];

  for (let i = 0; i < count; i += 1) {
    const base = coordinates[i] ?? {
      x: 0.35 + Math.random() * 0.4,
      y: 0.35 + Math.random() * 0.4
    };
    const jitterX = (Math.random() - 0.5) * 0.12;
    const jitterY = (Math.random() - 0.5) * 0.12;
    const x = clamp(base.x + jitterX, 0.15, 0.85) * width;
    const y = clamp(base.y + jitterY, 0.18, 0.82) * height;
    const radiusBase = settings.layout === "scattered polyps" ? width * 0.05 : width * 0.08;
    const radius = radiusBase + Math.random() * width * 0.05;
    seeds.push({
      x,
      y,
      radius,
      rotation: Math.random() * Math.PI,
      squish: 0.6 + Math.random() * 0.5,
      color: palette.colors[i % palette.colors.length],
      accent: palette.colors[(i + 1) % palette.colors.length]
    });
  }

  return seeds;
}

function drawBackground(width, height) {
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#001b2e");
  gradient.addColorStop(0.5, "#01456a");
  gradient.addColorStop(1, "#012035");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const haze = ctx.createRadialGradient(width * 0.2, height * 0.1, 0, width * 0.2, height * 0.1, width * 0.85);
  haze.addColorStop(0, "rgba(255, 209, 102, 0.2)");
  haze.addColorStop(1, "rgba(255, 209, 102, 0)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  const aurora = ctx.createLinearGradient(0, height, width, 0);
  aurora.addColorStop(0, "rgba(79, 209, 197, 0.12)");
  aurora.addColorStop(1, "rgba(255, 209, 102, 0.25)");
  ctx.save();
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = aurora;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

function drawIslands(seeds, lumenLevel) {
  seeds.forEach((seed) => {
    ctx.save();
    ctx.translate(seed.x, seed.y);
    ctx.rotate(seed.rotation);
    ctx.scale(1, seed.squish);

    const glowRange = Math.min(1, 0.4 + lumenLevel * 0.12);
    const gradient = ctx.createRadialGradient(0, 0, seed.radius * 0.2, 0, 0, seed.radius * 1.15);
    gradient.addColorStop(0, withAlpha(seed.accent, 0.95));
    gradient.addColorStop(0.55, withAlpha(seed.color, glowRange));
    gradient.addColorStop(1, "rgba(1, 26, 40, 0.9)");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, seed.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalCompositeOperation = "lighter";
    ctx.fillStyle = withAlpha(seed.color, 0.25 + lumenLevel * 0.08);
    ctx.beginPath();
    ctx.arc(-seed.radius * 0.2, -seed.radius * 0.18, seed.radius * 0.75, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
  ctx.globalCompositeOperation = "source-over";
}

function drawCurrents(lumenLevel, width, height) {
  const lineCount = 3 + Math.floor(lumenLevel);
  const flowDirections = [
    "sunward",
    "moonward",
    "north-easterly",
    "south-westerly",
    "toward the dawn shoal",
    "toward the midnight trench"
  ];
  const direction = randomOf(flowDirections);

  ctx.save();
  ctx.lineWidth = 1.5;
  ctx.setLineDash([10, 26]);
  ctx.strokeStyle = "rgba(144, 240, 255, 0.45)";
  for (let i = 0; i < lineCount; i += 1) {
    const baseY = height * (0.2 + Math.random() * 0.6);
    ctx.beginPath();
    ctx.moveTo(-width * 0.05, baseY);
    ctx.bezierCurveTo(
      width * (0.2 + Math.random() * 0.25),
      baseY + (Math.random() - 0.5) * 160,
      width * (0.55 + Math.random() * 0.25),
      baseY + (Math.random() - 0.5) * 160,
      width * 1.05,
      baseY + (Math.random() - 0.5) * 90
    );
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.lineWidth = 0.8;
  ctx.strokeStyle = "rgba(255, 209, 102, 0.22)";
  ctx.setLineDash([]);
  for (let i = 0; i < Math.max(2, Math.floor(lineCount / 2)); i += 1) {
    const startY = height * (0.25 + Math.random() * 0.5);
    ctx.beginPath();
    ctx.moveTo(-width * 0.1, startY);
    ctx.bezierCurveTo(
      width * (0.3 + Math.random() * 0.2),
      startY + (Math.random() - 0.5) * 120,
      width * (0.6 + Math.random() * 0.2),
      startY + (Math.random() - 0.5) * 120,
      width * 1.1,
      startY + (Math.random() - 0.5) * 80
    );
    ctx.stroke();
  }
  ctx.restore();

  const energy = lumenLevel >= 4 ? "Radiant surges" : lumenLevel <= 2 ? "Feathered ripples" : "Lucent undertows";
  return `${energy} flowing ${direction}`;
}

function scatterGlow(width, height, lumenLevel) {
  const shimmerCount = 60 + lumenLevel * 25;
  for (let i = 0; i < shimmerCount; i += 1) {
    const radius = Math.random() * 1.9 + 0.6;
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.beginPath();
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.45})`;
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const beam = ctx.createRadialGradient(width * 0.75, height * 0.3, 0, width * 0.75, height * 0.3, width * 0.6);
  beam.addColorStop(0, `rgba(255, 209, 102, ${0.08 + lumenLevel * 0.03})`);
  beam.addColorStop(1, "rgba(255, 209, 102, 0)");
  ctx.fillStyle = beam;
  ctx.fillRect(0, 0, width, height);
}

function describeQuadrant(x, y, width, height) {
  const vertical = y < height / 2 ? "northern" : "southern";
  const horizontal = x < width / 2 ? "western" : "eastern";
  return `${vertical}-${horizontal}`;
}

function drawDreamMap(settings, options = {}) {
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) {
    return lastMapData ?? {
      summary: "",
      paletteName: "",
      paletteColors: [],
      observations: [],
      currents: { description: "" }
    };
  }
  const width = rect.width;
  const height = rect.height;

  const palette = randomOf(palettes);
  const seeds = generateSeeds(settings, palette, width, height);

  drawBackground(width, height);
  drawIslands(seeds, settings.lumen);
  const currentDescriptor = drawCurrents(settings.lumen, width, height);
  scatterGlow(width, height, settings.lumen);

  const dominant = seeds.reduce((acc, seed) => (seed.radius > acc.radius ? seed : acc), seeds[0]);
  const quadrant = describeQuadrant(dominant.x, dominant.y, width, height);
  const luminescenceNote = settings.lumen >= 4
    ? "Isles blaze with phosphor wake and mirrored surf."
    : settings.lumen <= 2
      ? "Tides murmur in dimmed hush, arcs softly haloed."
      : "Currents gleam with tempered shimmer between shoals.";

  const observations = [
    `${seeds.length} islands sketch a ${settings.layoutLabel.toLowerCase()} formation.`,
    `Dominant isle anchors the ${quadrant} quadrant.`,
    `${luminescenceNote}`
  ];

  const summary = [
    `Title: ${settings.title || "Untitled Chart"}`,
    `Tide Emotion: ${settings.moodLabel} (${settings.mood})`,
    `Layout: ${settings.layoutLabel}`,
    `Luminescence: ${settings.lumen} / 5`,
    `Instrument: ${settings.instrumentLabel} (${settings.instrument})`,
    `Palette: ${palette.name} (${palette.colors.join(", ")})`,
    `Currents: ${currentDescriptor}`,
    `Notes: ${observations.join(" | ")}`
  ].join("\n");

  const mapData = {
    summary,
    paletteName: palette.name,
    paletteColors: palette.colors,
    observations,
    currents: { description: currentDescriptor },
    paletteShimmer: palette.shimmer,
    seeds
  };

  if (!options.preserveMeta) {
    lastSettings = { ...settings };
    lastMapData = mapData;
  }

  return mapData;
}

function updateMapMeta(settings, mapData) {
  mapTitleEl.textContent = settings.title || "Untitled Chart";
  mapTagsEl.innerHTML = "";
  const tags = [
    settings.moodLabel,
    `${mapData.paletteName} palette`,
    `${settings.lumen}/5 lumens`,
    mapData.currents.description
  ];
  tags.forEach((tag) => {
    const span = document.createElement("span");
    span.className = "map-tag";
    span.textContent = tag;
    mapTagsEl.appendChild(span);
  });
}

async function fetchTideLore(apiKey, settings, mapData) {
  const payload = {
    model: settings.model,
    temperature: 0.9,
    max_tokens: 320,
    messages: [
      {
        role: "system",
        content:
          "You are a visionary tidal chronicler. Write dreamy, luminous prose about fantastical archipelagos. Keep responses under 170 words, in 2-3 short paragraphs, and conclude with a single sentence omen in italics."
      },
      {
        role: "user",
        content: `${mapData.summary}\nAnchor Whisper: ${settings.whisper || "None"}`
      }
    ]
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    let errorMessage = `OpenAI request failed (${response.status})`;
    try {
      const problem = await response.json();
      if (problem?.error?.message) {
        errorMessage = problem.error.message;
      }
    } catch (error) {
      // ignore parsing failure
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("No lore returned. Try again.");
  }
  return content;
}

async function handleGenerate() {
  const apiKey = apiKeyInput.value.trim();
  const settings = collectSettings();
  if (!settings.title) {
    settings.title = randomOf(titleSeeds);
    titleInput.value = settings.title;
  }

  const mapData = drawDreamMap(settings);
  updateMapMeta(settings, mapData);

  if (!apiKey) {
    setStatus("Map woven. Add your OpenAI key for lore.", "error");
    storyOutput.textContent = "A chart shimmers on the page, but the currents stay silent until you offer an API key.";
    return;
  }

  try {
    generateBtn.disabled = true;
    generateBtn.textContent = "Weaving...";
    setStatus("Summoning tide-scribed whispers...", "loading");
    storyOutput.textContent = "The ocean inhales, preparing its story...";
    const lore = await fetchTideLore(apiKey, settings, mapData);
    storyOutput.textContent = lore;
    setStatus("Lore received", "success");
  } catch (error) {
    setStatus("Lore failed", "error");
    storyOutput.textContent = error.message || "Unable to gather lore.";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Weave Tidal Dream";
  }
}

function setup() {
  initializeTitle();
  lumenOutput.textContent = `${lumenSlider.value} / 5`;
  resizeCanvas();
  const initialSettings = collectSettings();
  const mapData = drawDreamMap(initialSettings);
  updateMapMeta(initialSettings, mapData);
  setStatus("Map seeded. Add your key to weave lore.", "loading");
}

lumenSlider.addEventListener("input", () => {
  lumenOutput.textContent = `${lumenSlider.value} / 5`;
});

generateBtn.addEventListener("click", () => {
  handleGenerate();
});

setup();
