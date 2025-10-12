const timeInput = document.getElementById("timeOfDay");
const timeLabel = document.getElementById("timeLabel");
const seasonSelect = document.getElementById("seasonSelect");
const weatherSelect = document.getElementById("weatherSelect");
const quickButtons = document.querySelectorAll(".chip[data-time]");

const lanternScene = document.getElementById("lanternScene");
const lantern = document.getElementById("lantern");
const lanternFibers = document.getElementById("lanternFibers");
const chimeCluster = document.getElementById("chimeCluster");

const coreDescription = document.getElementById("coreDescription");
const chimeDescription = document.getElementById("chimeDescription");
const fiberDescription = document.getElementById("fiberDescription");

const timePhases = [
  {
    label: "Midnight",
    ranges: [
      [21, 24],
      [0, 3]
    ],
    lightStory: "Moonlight slides through the frame, coaxing patient embers to watch over the quiet hours.",
    fiberStory: "Fibers tighten softly, conserving warmth while the village sleeps.",
    windStory: "Every gust becomes a low drone that circles close to the glass."
  },
  {
    label: "Dawn",
    ranges: [[3, 7]],
    lightStory: "First light brushes the core, sketching pale arcs that swell with optimism.",
    fiberStory: "Threads loosen and sip dew, readying for the first market bells.",
    windStory: "Chimes answer with delicate arpeggios that drift downriver."
  },
  {
    label: "Morning",
    ranges: [[7, 11]],
    lightStory: "Sunbeams strike true, setting the inner glass to a lively whirl.",
    fiberStory: "Lattices stretch tall, inviting pigments to climb the vertical ribs.",
    windStory: "Breezes paint the chimes with quick, playful motifs."
  },
  {
    label: "Zenith",
    ranges: [[11, 15]],
    lightStory: "The core burns confidently, scattering prisms across the workshop walls.",
    fiberStory: "Strands glow translucent, revealing every woven memory.",
    windStory: "Chimes ring in steady cycles that guide apprentices."
  },
  {
    label: "Gloaming",
    ranges: [[15, 19]],
    lightStory: "Light leans amber, steeping the core in a tea of late-day warmth.",
    fiberStory: "Fibers drink dyes deeply, sealing in smoky gold highlights.",
    windStory: "The breeze grows resonant, humming with layered chords."
  },
  {
    label: "Nightfall",
    ranges: [[19, 21]],
    lightStory: "Shadows return and the core banks its brilliance into a slow pulse.",
    fiberStory: "Threads relax again, ready for new constellations of glow.",
    windStory: "Chimes echo with lantern-keeper calls across the square."
  }
];

const seasons = {
  spring: {
    label: "Vernal Bloom",
    core: { hue: 112, saturation: 62, lightRange: [58, 80] },
    halo: {
      day: [146, 236, 205, 0.55],
      night: [82, 204, 189, 0.28]
    },
    skyTop: { day: "#13535f", night: "#05232f" },
    skyBottom: { day: "#063845", night: "#02121d" },
    fiber: {
      opacityRange: [0.52, 0.8],
      strandColor: "rgba(150, 240, 210, 0.4)",
      weftColor: "rgba(96, 210, 188, 0.28)",
      story: "Willow floss threads wick dew and breathe spearmint light."
    },
    motif: "Herbal sparks chase one another through riverstone glass."
  },
  summer: {
    label: "Solstice Ember",
    core: { hue: 38, saturation: 72, lightRange: [60, 86] },
    halo: {
      day: [247, 214, 134, 0.58],
      night: [211, 143, 70, 0.32]
    },
    skyTop: { day: "#274b63", night: "#041e2b" },
    skyBottom: { day: "#123449", night: "#020f1a" },
    fiber: {
      opacityRange: [0.48, 0.72],
      strandColor: "rgba(255, 200, 128, 0.45)",
      weftColor: "rgba(239, 145, 71, 0.24)",
      story: "Sun-soaked reed bands radiate heat shimmer through the weave."
    },
    motif: "Amber seeds tumble through the core like captured fireflies."
  },
  autumn: {
    label: "Harvest Ember",
    core: { hue: 22, saturation: 68, lightRange: [52, 78] },
    halo: {
      day: [255, 190, 133, 0.52],
      night: [200, 114, 62, 0.3]
    },
    skyTop: { day: "#2d3f59", night: "#081928" },
    skyBottom: { day: "#132938", night: "#020b15" },
    fiber: {
      opacityRange: [0.5, 0.78],
      strandColor: "rgba(255, 176, 124, 0.42)",
      weftColor: "rgba(204, 112, 54, 0.24)",
      story: "Copper twine carries cider warmth and woodsmoke memories."
    },
    motif: "Cider-glow embers drift in looping ellipses inside the shell."
  },
  winter: {
    label: "Aurora Frost",
    core: { hue: 186, saturation: 58, lightRange: [54, 78] },
    halo: {
      day: [173, 232, 255, 0.55],
      night: [104, 203, 241, 0.32]
    },
    skyTop: { day: "#14415d", night: "#031927" },
    skyBottom: { day: "#0a2c3f", night: "#010b16" },
    fiber: {
      opacityRange: [0.46, 0.7],
      strandColor: "rgba(164, 233, 255, 0.38)",
      weftColor: "rgba(102, 188, 230, 0.25)",
      story: "Icy silk cords capture auroral whispers and hold them steady."
    },
    motif: "Glacial ribbons swirl, refracting stars into crystalline facets."
  }
};

const weatherSettings = {
  clear: {
    label: "Clear",
    description: "Clear skies coax glass harmonics that shimmer in wide intervals.",
    haloLift: 0.08,
    glowShift: 0.12,
    strandGradient: "linear-gradient(180deg, rgba(129, 214, 231, 0.35), rgba(21, 83, 110, 0.65))",
    beadGradient: "linear-gradient(180deg, rgba(244, 208, 126, 0.85), rgba(147, 88, 28, 0.4))",
    echoGradient: "linear-gradient(180deg, rgba(180, 246, 255, 0.65), rgba(53, 137, 165, 0.2))",
    strandShadow: "0 12px 18px rgba(10, 37, 48, 0.45)",
    beadShadow: "0 12px 20px rgba(10, 37, 48, 0.45)",
    echoShadow: "0 10px 16px rgba(10, 37, 48, 0.4)"
  },
  mist: {
    label: "Mist",
    description: "Mist wraps the chimes in hollow bells and gentle, breathy beats.",
    haloLift: 0.16,
    glowShift: -0.06,
    strandGradient: "linear-gradient(180deg, rgba(152, 212, 217, 0.45), rgba(39, 103, 124, 0.6))",
    beadGradient: "linear-gradient(180deg, rgba(198, 232, 242, 0.75), rgba(91, 142, 157, 0.38))",
    echoGradient: "linear-gradient(180deg, rgba(170, 227, 235, 0.7), rgba(57, 119, 141, 0.3))",
    strandShadow: "0 14px 22px rgba(14, 40, 53, 0.55)",
    beadShadow: "0 14px 22px rgba(14, 40, 53, 0.55)",
    echoShadow: "0 12px 18px rgba(14, 40, 53, 0.55)"
  },
  storm: {
    label: "Storm",
    description: "Storm fronts strike bronze gongs that rumble with traveling thunder.",
    haloLift: -0.02,
    glowShift: -0.12,
    strandGradient: "linear-gradient(180deg, rgba(186, 146, 102, 0.6), rgba(66, 45, 26, 0.75))",
    beadGradient: "linear-gradient(180deg, rgba(234, 197, 119, 0.82), rgba(120, 76, 28, 0.55))",
    echoGradient: "linear-gradient(180deg, rgba(208, 156, 94, 0.75), rgba(80, 54, 32, 0.45))",
    strandShadow: "0 16px 24px rgba(10, 15, 24, 0.65)",
    beadShadow: "0 18px 26px rgba(10, 15, 24, 0.68)",
    echoShadow: "0 16px 22px rgba(10, 15, 24, 0.65)"
  }
};

function blendHex(hexA, hexB, amount) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const mix = {
    r: Math.round(a.r + (b.r - a.r) * amount),
    g: Math.round(a.g + (b.g - a.g) * amount),
    b: Math.round(a.b + (b.b - a.b) * amount)
  };
  return `rgb(${mix.r}, ${mix.g}, ${mix.b})`;
}

function hexToRgb(hex) {
  const normalized = hex.replace("#", "");
  const value = normalized.length === 3
    ? normalized.split("").map((char) => parseInt(char + char, 16))
    : [
        parseInt(normalized.slice(0, 2), 16),
        parseInt(normalized.slice(2, 4), 16),
        parseInt(normalized.slice(4, 6), 16)
      ];
  return { r: value[0], g: value[1], b: value[2] };
}

function blendRgbaArrays(a, b, amount) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * amount),
    Math.round(a[1] + (b[1] - a[1]) * amount),
    Math.round(a[2] + (b[2] - a[2]) * amount),
    clamp(a[3] + (b[3] - a[3]) * amount, 0, 1)
  ];
}

function toRgbaString(arr) {
  return `rgba(${arr[0]}, ${arr[1]}, ${arr[2]}, ${arr[3].toFixed(2)})`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function formatTime(decimalHour) {
  const hours = Math.floor(decimalHour) % 24;
  const minutes = Math.round((decimalHour - Math.floor(decimalHour)) * 60);
  const paddedHours = hours.toString().padStart(2, "0");
  const paddedMinutes = minutes.toString().padStart(2, "0");
  return `${paddedHours}:${paddedMinutes}`;
}

function resolvePhase(value) {
  for (const phase of timePhases) {
    if (
      phase.ranges.some(([start, end]) => {
        if (start < end) {
          return value >= start && value < end;
        }
        return value >= start || value < end;
      })
    ) {
      return phase;
    }
  }
  return timePhases[0];
}

function calculateBrightness(hour) {
  const rad = ((hour - 12) / 12) * Math.PI;
  return (Math.cos(rad) + 1) / 2; // 0 at midnight, 1 at noon
}

function updateLantern() {
  const rawHour = parseFloat(timeInput.value);
  const hour = rawHour % 24;
  const seasonKey = seasonSelect.value;
  const weatherKey = weatherSelect.value;

  const season = seasons[seasonKey];
  const weather = weatherSettings[weatherKey];
  const phase = resolvePhase(hour);
  const brightness = calculateBrightness(hour);

  const ambientTop = blendHex(season.skyTop.night, season.skyTop.day, brightness);
  const ambientBottom = blendHex(season.skyBottom.night, season.skyBottom.day, brightness);
  lanternScene.style.setProperty("--scene-backdrop-top", ambientTop);
  lanternScene.style.setProperty("--scene-backdrop-bottom", ambientBottom);

  const haloBlend = blendRgbaArrays(season.halo.night, season.halo.day, brightness);
  haloBlend[3] = clamp(haloBlend[3] + weather.haloLift, 0.08, 0.88);
  lanternScene.style.setProperty("--halo-color", toRgbaString(haloBlend));

  const coreLight = season.core.lightRange[0] + (season.core.lightRange[1] - season.core.lightRange[0]) * brightness;
  const glowAdjustment = clamp(coreLight / 100 + weather.glowShift, 0.2, 0.95);
  const coreColor = `hsl(${season.core.hue} ${season.core.saturation}% ${coreLight}%)`;
  const coreGlow = `hsla(${season.core.hue} ${season.core.saturation}% ${coreLight + 8}%, ${glowAdjustment})`;
  lantern.style.setProperty("--core-bright", coreColor);
  lantern.style.setProperty("--core-glow", coreGlow);

  const opacity = season.fiber.opacityRange[0] + (season.fiber.opacityRange[1] - season.fiber.opacityRange[0]) * (0.35 + brightness * 0.65);
  lanternFibers.style.setProperty("--fiber-opacity", clamp(opacity, 0.35, 0.92));
  lanternFibers.style.setProperty("--fiber-strand-color", season.fiber.strandColor);
  lanternFibers.style.setProperty("--fiber-weft-color", season.fiber.weftColor);

  chimeCluster.style.setProperty("--strand-gradient", weather.strandGradient);
  chimeCluster.style.setProperty("--bead-gradient", weather.beadGradient);
  chimeCluster.style.setProperty("--echo-gradient", weather.echoGradient);
  chimeCluster.style.setProperty("--strand-shadow", weather.strandShadow);
  chimeCluster.style.setProperty("--bead-shadow", weather.beadShadow);
  chimeCluster.style.setProperty("--echo-shadow", weather.echoShadow);

  const formatted = `${phase.label} • ${formatTime(hour)}`;
  timeLabel.textContent = formatted;

  const intensityMood = brightness > 0.75
    ? "radiates a sun-warmed corona"
    : brightness > 0.45
    ? "breathes in a steady heartbeat"
    : brightness > 0.2
    ? "banks into a mindful ember"
    : "holds a pocket of secret glow";

  coreDescription.textContent = `${phase.lightStory} Its core ${intensityMood} as ${season.motif}`;
  chimeDescription.textContent = `${weather.description} ${phase.windStory}`;
  fiberDescription.textContent = `${season.fiber.story} ${phase.fiberStory}`;
}

function handleQuickButton(event) {
  const value = event.currentTarget.dataset.time;
  if (typeof value === "undefined") return;
  timeInput.value = value;
  updateLantern();
}

timeInput.addEventListener("input", updateLantern);
seasonSelect.addEventListener("change", updateLantern);
weatherSelect.addEventListener("change", updateLantern);
quickButtons.forEach((button) => button.addEventListener("click", handleQuickButton));

updateLantern();
