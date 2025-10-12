const fileInput = document.getElementById("photo-input");
const statusMessage = document.getElementById("status-message");
const previewSection = document.getElementById("preview");
const previewImage = document.getElementById("preview-image");
const retakeButton = document.getElementById("retake-button");
const resultsSection = document.getElementById("results");
const ingredientsContainer = document.getElementById("ingredients");
const brewPanel = document.getElementById("brew");
const brewTitle = document.getElementById("brew-title");
const brewDescription = document.getElementById("brew-description");
const incantationText = document.getElementById("incantation-text");

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

if (!ctx) {
  setStatus("Your device does not support the alchemy canvas.", true);
}

fileInput?.addEventListener("change", handleFileSelection);
retakeButton?.addEventListener("click", resetExperience);

function handleFileSelection(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  if (!file.type.startsWith("image/")) {
    setStatus("Please select an image so the oracle can begin brewing.", true);
    return;
  }

  resetResults();
  setStatus("Distilling colors from your scene...");

  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      previewImage.src = image.src;
      previewSection.hidden = false;
      requestAnimationFrame(() => {
        const pigments = extractDominantColors(image);
        if (!pigments.length) {
          setStatus("The oracle couldn't find vivid hues. Try a brighter scene!", true);
          return;
        }
        displayResults(pigments);
        setStatus("Potion profile prepared! Scroll to explore your brew.");
      });
    };
    image.onerror = () => setStatus("The image fizzled before it reached the cauldron. Try again?", true);
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function resetExperience() {
  fileInput.value = "";
  previewSection.hidden = true;
  resetResults();
  setStatus("Choose a fresh scene to brew another concoction.");
}

function resetResults() {
  ingredientsContainer.innerHTML = "";
  resultsSection.hidden = true;
  brewPanel.hidden = true;
  brewTitle.textContent = "";
  brewDescription.textContent = "";
  incantationText.textContent = "";
}

function displayResults(pigments) {
  resultsSection.hidden = false;
  brewPanel.hidden = false;

  pigments.forEach((pigment) => {
    const card = document.createElement("article");
    card.className = "ingredient";

    const swatch = document.createElement("div");
    swatch.className = "ingredient__swatch";
    swatch.style.setProperty("background", pigment.hex);
    swatch.setAttribute("aria-hidden", "true");

    const name = document.createElement("h3");
    name.className = "ingredient__name";
    name.textContent = pigment.story.name;

    const trait = document.createElement("p");
    trait.className = "ingredient__trait";
    trait.textContent = pigment.story.trait;

    const effect = document.createElement("p");
    effect.className = "ingredient__effect";
    effect.textContent = pigment.story.effect;

    card.append(swatch, name, trait, effect);
    ingredientsContainer.append(card);
  });

  const categories = pigments.map((p) => p.category);
  brewTitle.textContent = createBrewTitle(categories);
  brewDescription.textContent = createBrewDescription(pigments);
  incantationText.textContent = forgeIncantation(categories);
}

function extractDominantColors(image) {
  if (!ctx) return [];

  const maxDimension = 480;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const width = Math.max(1, Math.floor(image.width * scale));
  const height = Math.max(1, Math.floor(image.height * scale));

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);

  const { data } = ctx.getImageData(0, 0, width, height);
  const stride = Math.max(1, Math.floor(Math.sqrt((width * height) / 2500)));

  const buckets = new Map();

  for (let y = 0; y < height; y += stride) {
    for (let x = 0; x < width; x += stride) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const a = data[index + 3];
      if (a < 32) continue;

      const key = `${quantize(r)}|${quantize(g)}|${quantize(b)}`;
      const bucket = buckets.get(key) || { count: 0, r: 0, g: 0, b: 0 };
      bucket.count += 1;
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      buckets.set(key, bucket);
    }
  }

  const swatches = [...buckets.entries()]
    .map(([key, bucket]) => {
      const samples = Math.max(1, bucket.count);
      const r = Math.round(bucket.r / samples);
      const g = Math.round(bucket.g / samples);
      const b = Math.round(bucket.b / samples);
      const category = categorizeColor(r, g, b);
      return {
        key,
        r,
        g,
        b,
        category,
        brightness: (r + g + b) / 3,
        count: bucket.count,
      };
    })
    .filter((entry) => entry.count > 1)
    .sort((a, b) => b.count - a.count);

  const chosen = [];
  const seenCategories = new Set();

  for (const swatch of swatches) {
    if (chosen.length >= 4) break;
    if (swatch.brightness < 28 || swatch.brightness > 240) continue;
    const story = storyForSwatch(swatch, chosen.length);
    const signature = `${swatch.category}-${Math.round(swatch.brightness / 10)}`;
    if (seenCategories.has(signature)) continue;
    seenCategories.add(signature);
    chosen.push({
      ...swatch,
      hex: rgbToHex(swatch.r, swatch.g, swatch.b),
      story,
    });
  }

  if (!chosen.length && swatches.length) {
    const fallback = swatches[0];
    chosen.push({
      ...fallback,
      hex: rgbToHex(fallback.r, fallback.g, fallback.b),
      story: storyForSwatch(fallback, 0),
    });
  }

  return chosen.slice(0, 3);
}

function quantize(value) {
  return Math.round(value / 24) * 24;
}

function categorizeColor(r, g, b) {
  const { h, s, l } = rgbToHsl(r, g, b);
  if (l > 0.85) return "lumen";
  if (l < 0.18) return "umbra";
  if (s < 0.15) return "aether";

  if (h < 20 || h >= 340) return "ember";
  if (h < 50) return "amber";
  if (h < 90) return "verdant";
  if (h < 150) return "lagoon";
  if (h < 210) return "storm";
  if (h < 270) return "bloom";
  if (h < 320) return "violet";
  return "aurora";
}

const storyLibrary = {
  ember: [
    {
      name: "Emberglass Radiance",
      trait: "Forged from molten sunset shards that shimmer with bold optimism.",
      effect: "Ignites courage and kindles quick-witted banter among allies.",
    },
    {
      name: "Dragonfruit Sparks",
      trait: "Seared fruit sugars captured mid-flare by festival fire-dancers.",
      effect: "Adds a crackling burst of enthusiasm to every scheme.",
    },
  ],
  amber: [
    {
      name: "Solstice Honey Drizzle",
      trait: "Collected from auric bees that hum in perpetual dawnlight.",
      effect: "Brightens focus and attracts serendipitous breakthroughs.",
    },
    {
      name: "Sunwisp Citrus",
      trait: "Thin zest ribbons shaved from a comet-cooled pomelo.",
      effect: "Invites warm camaraderie and easy laughter.",
    },
  ],
  verdant: [
    {
      name: "Verdigris Fern Fronds",
      trait: "Harvested from whispering groves that harmonize with moon tides.",
      effect: "Centers intentions and anchors sprouting ideas.",
    },
    {
      name: "Glimmer Grove Moss",
      trait: "A moss that hums soft lullabies to restless spirits.",
      effect: "Steadies nerves and nurtures steady resilience.",
    },
  ],
  lagoon: [
    {
      name: "Tideglass Dew",
      trait: "Condensed from azure waves that crash in slow motion.",
      effect: "Calls forth flexible thinking and effortless improvisation.",
    },
    {
      name: "Bluecurrent Foam",
      trait: "Skimmed from the crest of bioluminescent lagoons.",
      effect: "Bathes plans in calm clarity and cool curiosity.",
    },
  ],
  storm: [
    {
      name: "Thunderhead Sparks",
      trait: "Captured from static ribbons woven by skywhales.",
      effect: "Charges the brew with quick reflexes and sharp instincts.",
    },
    {
      name: "Tempest Quartz",
      trait: "Shards grown where lightning strikes frozen rain.",
      effect: "Amplifies daring decisions and storm-born intuition.",
    },
  ],
  bloom: [
    {
      name: "Petalburst Nectar",
      trait: "Pollinated by aurora moths that paint the midnight canopy.",
      effect: "Sprinkles charming charisma over every conversation.",
    },
    {
      name: "Roseveil Mist",
      trait: "Collected at dawn as moonblush roses dissolve into vapor.",
      effect: "Coaxes heartfelt storytelling from even the shyest adventurer.",
    },
  ],
  violet: [
    {
      name: "Nebula Plum Slices",
      trait: "Frozen mid-orbit around a storytelling meteor.",
      effect: "Draws out dreamy ideas and time-bending imaginations.",
    },
    {
      name: "Starshade Petiole",
      trait: "A spectral stem from flowers that bloom only during eclipses.",
      effect: "Wraps thoughts in reflective insight and gentle wonder.",
    },
  ],
  aurora: [
    {
      name: "Prismtrail Dust",
      trait: "Swept from the tails of migrating auroral drakes.",
      effect: "Bends chance toward delightful coincidences.",
    },
    {
      name: "Iridescent Lyric",
      trait: "Crystalized echoes from a midnight choir of sprites.",
      effect: "Tunes the potion to harmonize with bold new ideas.",
    },
  ],
  aether: [
    {
      name: "Moonlit Chalk",
      trait: "Ground from silent constellations sketched in the sky.",
      effect: "Stabilizes the brew and clarifies tangled thoughts.",
    },
    {
      name: "Frostglass Threads",
      trait: "Spun from the quiet between snowflake heartbeats.",
      effect: "Slows time just enough to savor each spark of inspiration.",
    },
  ],
  lumen: [
    {
      name: "Starglint Sugar",
      trait: "Sparkles caught on the tips of daylight comets.",
      effect: "Sweetens moods and brightens the room with radiance.",
    },
    {
      name: "Auric Halo Shards",
      trait: "Crystalline flecks from crowns of midday auroras.",
      effect: "Wraps companions in an aura of openhearted welcome.",
    },
  ],
  umbra: [
    {
      name: "Obsidian Velvet",
      trait: "Carved from the softest shadow beneath lunar eclipses.",
      effect: "Grounds the potion with restful depth and introspection.",
    },
    {
      name: "Nightfall Inkwell",
      trait: "Drawn from the moment stars inhale before they shine.",
      effect: "Sharpens quiet focus for plotting intricate plans.",
    },
  ],
};

function storyForSwatch(swatch, index) {
  const pool = storyLibrary[swatch.category] || storyLibrary.aether;
  if (!pool.length) return { name: "Mystery Essence", trait: "An unidentified shimmer.", effect: "Adds intrigue." };
  const seed = (swatch.r * 3 + swatch.g * 5 + swatch.b * 7 + index * 13) % pool.length;
  return pool[seed];
}

function createBrewTitle(categories) {
  const lead = titleFragments[categories[0]] || "Arcane";
  const second = titleSuffix[categories[1]] || "Harmony";
  return `${lead} ${second} Draught`;
}

const titleFragments = {
  ember: "Ember",
  amber: "Solar",
  verdant: "Grove",
  lagoon: "Tidal",
  storm: "Tempest",
  bloom: "Petal",
  violet: "Nebula",
  aurora: "Prism",
  aether: "Aether",
  lumen: "Lumen",
  umbra: "Shadow",
};

const titleSuffix = {
  ember: "Flare",
  amber: "Glow",
  verdant: "Bloom",
  lagoon: "Current",
  storm: "Surge",
  bloom: "Blossom",
  violet: "Veil",
  aurora: "Cascade",
  aether: "Chorus",
  lumen: "Radiance",
  umbra: "Echo",
};

function createBrewDescription(pigments) {
  const ingredientNames = pigments.map((p) => p.story.name).join(", ");
  const effects = pigments.map((p) => p.story.effect.replace(/\.$/, "")).join(". ");
  return `Stir together ${ingredientNames}. ${effects}.`;
}

const incantationLexicon = {
  ember: "Ignis",
  amber: "Solara",
  verdant: "Sylvae",
  lagoon: "Maris",
  storm: "Tempestus",
  bloom: "Florielle",
  violet: "Nebulon",
  aurora: "Prisma",
  aether: "Aeris",
  lumen: "Lumin", // stylized
  umbra: "Umbrae",
};

const incantationClosers = [
  "twine and rise, let the draught crystallize",
  "spiral bright, awaken the auric night",
  "shimmer true, guide this brew anew",
  "braid and sing, crown the potion king",
  "ebb and flow, let the elixir glow",
  "spark and soar, open the astral door",
];

function forgeIncantation(categories) {
  const words = categories.map((cat) => incantationLexicon[cat] || "Arcana");
  const uniqueWords = [...new Set(words)];
  const colorSum = categories.reduce((sum, cat) => sum + (cat.charCodeAt(0) || 0), 0);
  const closer = incantationClosers[colorSum % incantationClosers.length];
  return `${uniqueWords.join(" · ")} — ${closer}!`;
}

function rgbToHex(r, g, b) {
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function toHex(value) {
  return value.toString(16).padStart(2, "0");
}

function rgbToHsl(r, g, b) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;

  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
    }
    h *= 60;
  }

  return { h, s, l };
}

function setStatus(message, isError = false) {
  if (!statusMessage) return;
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? "#fca5a5" : "rgba(129, 200, 255, 0.9)";
}
