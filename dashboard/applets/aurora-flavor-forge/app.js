const baseNebulae = [
  {
    id: "stardust-milk",
    name: "Stardust Almond Nebula",
    profile: "feathery almond milk gelato spun with crystallized starlight",
    texture: "velvet-light",
    color: "opaline"
  },
  {
    id: "galaxy-mocha",
    name: "Galactic Mocha Ripple",
    profile: "dark cocoa folded with microbursts of espresso meteor",
    texture: "silky",
    color: "auric ember"
  },
  {
    id: "comet-citron",
    name: "Comet Citron Sorbet",
    profile: "frost-bright citrus frozen in comet tails",
    texture: "crisp",
    color: "solar mint"
  },
  {
    id: "nebula-ube",
    name: "Nebula Ube Custard",
    profile: "lush purple yam custard kissed by twilight",
    texture: "lush",
    color: "amethyst haze"
  },
  {
    id: "satellite-sesame",
    name: "Satellite Sesame Cloud",
    profile: "toasted sesame mousse with orbiting caramel moons",
    texture: "pillowy",
    color: "lunar gold"
  }
];

const swirlMap = {
  1: { label: "Softstream", descriptor: "whisper-light aurora threads" },
  2: { label: "Glow Drift", descriptor: "glimmering ribbons" },
  3: { label: "Radiant", descriptor: "radiant arcs" },
  4: { label: "Pulsewave", descriptor: "pulsing prisms" },
  5: { label: "Supernova", descriptor: "blazing coronas" }
};

const toppings = [
  { id: "asteroid-sugar", label: "Asteroid Sugar Shards" },
  { id: "luminous-pearls", label: "Luminous Lychee Pearls" },
  { id: "plasma-crackle", label: "Plasma Crackle Crunch" },
  { id: "meteor-meringue", label: "Meteor Meringue Drops" },
  { id: "galactic-fruit", label: "Galactic Dragonfruit Laces" },
  { id: "quasar-sauce", label: "Quasar Caramel Stream" }
];

const moods = [
  { id: "twilight", label: "Twilight Reverie", vibe: "dreamy" },
  { id: "festival", label: "Orbit Festival", vibe: "celebratory" },
  { id: "expedition", label: "Cosmic Expedition", vibe: "adventurous" },
  { id: "sanctuary", label: "Lunar Sanctuary", vibe: "soothing" }
];

const cosmicAsides = [
  "Serve under low gravity for optimal sparkle dispersion.",
  "Pairs perfectly with a comet-tail wafer.",
  "Best enjoyed while gazing at magnetic storms.",
  "Recommended soundtrack: whale song remixed with synth auroras.",
  "Warning: may leave stardust freckles on your smile."
];

const baseSelect = document.querySelector("#base-select");
const swirlSlider = document.querySelector("#swirl-slider");
const swirlLevel = document.querySelector("#swirl-level");
const toppingGrid = document.querySelector("#topping-grid");
const moodGrid = document.querySelector("#mood-grid");
const forgeBtn = document.querySelector("#forge-btn");
const randomizeBtn = document.querySelector("#randomize-btn");
const clearLogBtn = document.querySelector("#clear-log-btn");
const flavorName = document.querySelector("#flavor-name");
const flavorDescription = document.querySelector("#flavor-description");
const flavorTags = document.querySelector("#flavor-tags");
const constellationList = document.querySelector("#constellation-list");

const activeToppings = new Set();
let activeMood = null;
let constellationHistory = [];

function init() {
  renderBaseOptions();
  renderChips();
  updateSwirlLabel();
}

function renderBaseOptions() {
  baseNebulae.forEach((base, index) => {
    const option = document.createElement("option");
    option.value = base.id;
    option.textContent = base.name;
    if (index === 0) option.selected = true;
    baseSelect.append(option);
  });
}

function renderChips() {
  toppings.forEach((topping) => {
    const chip = createChip(topping.label);
    chip.dataset.id = topping.id;
    chip.addEventListener("click", () => toggleTopping(topping.id, chip));
    toppingGrid.append(chip);
  });

  moods.forEach((mood) => {
    const chip = createChip(mood.label);
    chip.dataset.id = mood.id;
    chip.addEventListener("click", () => setMood(mood.id, chip));
    moodGrid.append(chip);
  });
}

function createChip(label) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chip";
  chip.textContent = label;
  return chip;
}

function toggleTopping(id, chip) {
  if (activeToppings.has(id)) {
    activeToppings.delete(id);
    chip.classList.remove("is-active");
  } else {
    activeToppings.add(id);
    chip.classList.add("is-active");
  }
}

function setMood(id, chip) {
  if (activeMood === id) {
    activeMood = null;
    chip.classList.remove("is-active");
    return;
  }

  activeMood = id;
  document.querySelectorAll("#mood-grid .chip").forEach((el) => el.classList.remove("is-active"));
  chip.classList.add("is-active");
}

function updateSwirlLabel() {
  const level = Number(swirlSlider.value);
  const { label } = swirlMap[level];
  swirlLevel.textContent = `${label} (${level})`;
}

function forgeFlavor() {
  const base = baseNebulae.find((item) => item.id === baseSelect.value);
  const swirlLevelValue = Number(swirlSlider.value);
  const swirl = swirlMap[swirlLevelValue];
  const chosenToppings = Array.from(activeToppings).map((id) => toppings.find((item) => item.id === id));
  const mood = moods.find((item) => item.id === activeMood) || moods[0];

  const toppingPhrase = chosenToppings.length
    ? `${joinWithAnd(chosenToppings.map((t) => t.label))}`
    : "bare constellations of pure starlight";

  const moodDescriptor = mood.vibe;
  const cosmicAside = cosmicAsides[Math.floor(Math.random() * cosmicAsides.length)];

  const flavorTitle = `${swirl.label} ${mood.label.split(" ")[0]} ${base.name}`;
  const description = `A ${swirl.descriptor} weaving through ${base.profile}, finished with ${toppingPhrase}. Expect a ${moodDescriptor} glow and hints of ${base.color}. ${cosmicAside}`;

  flavorName.textContent = flavorTitle;
  flavorDescription.textContent = description;
  renderTags({ base, swirl: swirl.label, mood: mood.vibe, toppings: chosenToppings });
  addToConstellation({ title: flavorTitle, description, mood: mood.label, toppings: chosenToppings });
}

function renderTags({ base, swirl, mood, toppings }) {
  flavorTags.innerHTML = "";
  const tags = [base.texture, swirl, mood, `${toppings.length} toppings`];
  tags.forEach((tag) => {
    const li = document.createElement("li");
    li.textContent = tag;
    flavorTags.append(li);
  });
}

function addToConstellation(entry) {
  constellationHistory = [{
    ...entry,
    timestamp: new Date()
  }, ...constellationHistory].slice(0, 6);

  renderConstellation();
}

function renderConstellation() {
  constellationList.innerHTML = "";
  if (!constellationHistory.length) {
    const empty = document.createElement("li");
    empty.className = "constellation__item";
    empty.textContent = "No flavors forged yet. Spin up the auroras!";
    constellationList.append(empty);
    return;
  }

  constellationHistory.forEach((entry) => {
    const li = document.createElement("li");
    li.className = "constellation__item";

    const title = document.createElement("div");
    title.className = "constellation__item-title";
    title.textContent = entry.title;

    const meta = document.createElement("div");
    meta.className = "constellation__item-meta";
    const toppingMeta = entry.toppings.length
      ? `${entry.toppings.length} topping${entry.toppings.length > 1 ? "s" : ""}`
      : "no toppings";
    meta.textContent = `${entry.mood} • ${toppingMeta}`;

    li.append(title, meta);
    constellationList.append(li);
  });
}

function joinWithAnd(items) {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`;
}

function cosmicShuffle() {
  const randomBase = baseNebulae[Math.floor(Math.random() * baseNebulae.length)];
  baseSelect.value = randomBase.id;

  const randomSwirlLevel = Math.floor(Math.random() * 5) + 1;
  swirlSlider.value = randomSwirlLevel;
  updateSwirlLabel();

  activeToppings.clear();
  document.querySelectorAll("#topping-grid .chip").forEach((chip) => chip.classList.remove("is-active"));
  const randomToppingCount = Math.floor(Math.random() * toppings.length);
  const shuffled = [...toppings].sort(() => Math.random() - 0.5).slice(0, randomToppingCount);
  shuffled.forEach(({ id }) => {
    activeToppings.add(id);
    const chip = document.querySelector(`#topping-grid .chip[data-id="${id}"]`);
    if (chip) chip.classList.add("is-active");
  });

  if (activeMood) {
    document.querySelector(`#mood-grid .chip[data-id="${activeMood}"]`)?.classList.remove("is-active");
  }
  const randomMood = moods[Math.floor(Math.random() * moods.length)];
  activeMood = randomMood.id;
  document.querySelector(`#mood-grid .chip[data-id="${activeMood}"]`)?.classList.add("is-active");
}

function clearConstellation() {
  constellationHistory = [];
  renderConstellation();
}

swirlSlider.addEventListener("input", updateSwirlLabel);
forgeBtn.addEventListener("click", forgeFlavor);
randomizeBtn.addEventListener("click", () => {
  cosmicShuffle();
  forgeFlavor();
});
clearLogBtn.addEventListener("click", clearConstellation);

init();
renderConstellation();
