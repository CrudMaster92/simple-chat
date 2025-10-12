const pantry = [
  {
    id: "saffron-sun",
    name: "Saffron Sun",
    tagline: "nectar warmth",
    color: "#ff9c41",
    glow: "#ffe1ad",
    frequency: 432,
    note: "Honeyed threads mingle with orange zest and velvety smoke.",
  },
  {
    id: "cardamom-mist",
    name: "Cardamom Mist",
    tagline: "cool bloom",
    color: "#f4c068",
    glow: "#fff1cf",
    frequency: 512,
    note: "Silvered spice trails drift into eucalyptus shimmer.",
  },
  {
    id: "sumac-dawn",
    name: "Sumac Dawn",
    tagline: "tart ember",
    color: "#ff6f5e",
    glow: "#ffd3c7",
    frequency: 476,
    note: "Crimson citrus sparks brighten toasted embers.",
  },
  {
    id: "cocoa-cinder",
    name: "Cocoa Cinder",
    tagline: "smoked velvet",
    color: "#a35337",
    glow: "#f4c4a6",
    frequency: 392,
    note: "Charred cacao hush steadies caramel twilight.",
  },
  {
    id: "spirulina-sky",
    name: "Spirulina Sky",
    tagline: "mineral tide",
    color: "#3fa6a0",
    glow: "#c8f5de",
    frequency: 528,
    note: "Salty zephyrs stir sea-glass clarity.",
  },
  {
    id: "hibiscus-glow",
    name: "Hibiscus Glow",
    tagline: "ruby bloom",
    color: "#ff5f87",
    glow: "#ffc6d7",
    frequency: 498,
    note: "Petaled tartness blooms into rosy dew.",
  },
  {
    id: "turmeric-halo",
    name: "Turmeric Halo",
    tagline: "amber earth",
    color: "#f7b43c",
    glow: "#ffe9b3",
    frequency: 444,
    note: "Earthy sunbeams swirl with gingered spark.",
  },
  {
    id: "indigo-nightfall",
    name: "Indigo Nightfall",
    tagline: "moon pigment",
    color: "#2f6a8b",
    glow: "#bde3ff",
    frequency: 368,
    note: "Midnight breeze hums beside candied sage.",
  },
];

const whispers = [
  "collides with",
  "embraces",
  "drizzles across",
  "spirals toward",
  "dances beside",
  "glazes over",
  "folds into",
];

const afterglows = [
  "amber reverie",
  "glassy citrus dew",
  "molten herbal hush",
  "cool mineral bloom",
  "luminous ember hush",
  "sun-soft praline",
  "creamy dusk breeze",
];

const paletteList = document.getElementById("palette-items");
const bloomField = document.getElementById("bloom-field");
const canvasHint = document.getElementById("canvas-hint");
const clearButton = document.getElementById("clear-bloom");

let audioContext;

function ensureAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioContext.state === "suspended") {
    audioContext.resume();
  }
}

function playTone(frequency) {
  ensureAudio();
  const osc = audioContext.createOscillator();
  const gain = audioContext.createGain();

  osc.type = "sine";
  osc.frequency.value = frequency;

  const now = audioContext.currentTime;
  gain.gain.setValueAtTime(0, now);
  gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

  osc.connect(gain);
  gain.connect(audioContext.destination);

  osc.start(now);
  osc.stop(now + 1.6);
}

function createPantryItem(item) {
  const element = document.createElement("div");
  element.className = "pantry-item";
  element.draggable = true;
  element.dataset.itemId = item.id;
  element.setAttribute("role", "listitem");
  element.setAttribute("tabindex", "0");
  element.setAttribute("aria-label", `${item.name}, ${item.tagline}`);

  const swatch = document.createElement("div");
  swatch.className = "pantry-item__swatch";
  swatch.style.background = item.color;

  const label = document.createElement("div");
  label.className = "pantry-item__label";
  label.innerHTML = `<span>${item.name}</span><span>${item.tagline}</span>`;

  element.appendChild(swatch);
  element.appendChild(label);

  element.addEventListener("dragstart", (event) => {
    element.classList.add("is-dragging");
    event.dataTransfer.setData("text/plain", item.id);
    event.dataTransfer.effectAllowed = "copy";
  });

  element.addEventListener("dragend", () => {
    element.classList.remove("is-dragging");
  });

  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      addFragment(item);
    }
  });

  element.addEventListener("click", () => {
    addFragment(item);
  });

  return element;
}

function randomFrom(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function craftNote(baseNote) {
  return `${baseNote.split(".")[0]} ${randomFrom(whispers)} ${randomFrom(afterglows)}.`;
}

function addFragment(item) {
  if (!item) return;

  const fragment = document.createElement("article");
  fragment.className = "bloom-fragment";

  const swirl = document.createElement("div");
  swirl.className = "bloom-fragment__swirl";
  swirl.style.background = `conic-gradient(from 0deg, ${item.color} 0deg, ${item.glow} 160deg, ${item.color} 360deg)`;
  swirl.style.boxShadow = `0 0 0 6px rgba(255, 255, 255, 0.65), 0 0 40px ${item.glow}`;

  const title = document.createElement("div");
  title.className = "bloom-fragment__title";
  title.textContent = item.name;

  const note = document.createElement("p");
  note.className = "bloom-fragment__note";
  note.textContent = craftNote(item.note);

  fragment.style.borderColor = `${item.color}40`;
  fragment.style.boxShadow = `0 18px 30px ${item.color}33`;

  fragment.appendChild(swirl);
  fragment.appendChild(title);
  fragment.appendChild(note);

  bloomField.appendChild(fragment);
  bloomField.classList.remove("is-hovered");
  updateCanvasState();
  playTone(item.frequency);
}

function updateCanvasState() {
  const hasFragments = bloomField.querySelectorAll(".bloom-fragment").length > 0;
  canvasHint.hidden = hasFragments;
  if (!hasFragments) {
    canvasHint.removeAttribute("hidden");
  }
}

function clearBloom() {
  bloomField.querySelectorAll(".bloom-fragment").forEach((element) => element.remove());
  updateCanvasState();
}

function handleDrop(event) {
  event.preventDefault();
  bloomField.classList.remove("is-hovered");
  const id = event.dataTransfer.getData("text/plain");
  const item = pantry.find((entry) => entry.id === id);
  addFragment(item);
}

function handleDragOver(event) {
  event.preventDefault();
  event.dataTransfer.dropEffect = "copy";
}

bloomField.addEventListener("dragover", handleDragOver);

bloomField.addEventListener("dragenter", (event) => {
  event.preventDefault();
  bloomField.classList.add("is-hovered");
});

bloomField.addEventListener("dragleave", () => {
  bloomField.classList.remove("is-hovered");
});

bloomField.addEventListener("drop", handleDrop);

clearButton.addEventListener("click", () => {
  clearBloom();
  playTone(320);
});

pantry.forEach((item) => {
  const element = createPantryItem(item);
  paletteList.appendChild(element);
});

updateCanvasState();
