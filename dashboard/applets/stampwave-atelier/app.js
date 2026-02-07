const inkOptions = [
  {
    name: "Rust Saffron",
    color: "#c4552f",
    soft: "#e7c2b1",
  },
  {
    name: "Verdant Pine",
    color: "#3f5d50",
    soft: "#b9cbbf",
  },
  {
    name: "Harbor Teal",
    color: "#2f6f73",
    soft: "#b7d4d5",
  },
  {
    name: "Amber Press",
    color: "#d99a4c",
    soft: "#f0d4a8",
  },
];

const regions = [
  "Harbor & Haven",
  "Alpine Spur",
  "Cedar Lowlands",
  "Marigold Coast",
  "Slate Mesa",
];

const borders = [
  { value: "border-rope", label: "Roped edge" },
  { value: "border-cut", label: "Notched cut" },
  { value: "border-vintage", label: "Double seal" },
  { value: "border-wave", label: "Wave rim" },
];

const emblems = [
  {
    value: "compass",
    label: "Harbor compass",
    svg: `
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="40" stroke="currentColor" stroke-width="4" />
        <path d="M60 24L72 60L60 96L48 60L60 24Z" fill="currentColor" />
        <path d="M60 40L66 60L60 80L54 60L60 40Z" fill="#f8f1e4" />
      </svg>
    `,
  },
  {
    value: "anchor",
    label: "Anchor crest",
    svg: `
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M60 16V70" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
        <circle cx="60" cy="28" r="10" stroke="currentColor" stroke-width="5" />
        <path d="M30 68C30 88 44 102 60 102C76 102 90 88 90 68" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
        <path d="M22 68H98" stroke="currentColor" stroke-width="6" stroke-linecap="round" />
      </svg>
    `,
  },
  {
    value: "sunburst",
    label: "Sunlit badge",
    svg: `
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="60" cy="60" r="26" stroke="currentColor" stroke-width="5" />
        <path d="M60 12V32" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M60 88V108" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M12 60H32" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M88 60H108" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M24 24L38 38" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M82 82L96 96" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M24 96L38 82" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M82 38L96 24" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
      </svg>
    `,
  },
  {
    value: "leaf",
    label: "Cedar leaf",
    svg: `
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 72C24 40 52 22 90 24C88 60 70 96 38 96C30 96 24 88 24 72Z" stroke="currentColor" stroke-width="5" />
        <path d="M36 72C48 68 60 56 72 40" stroke="currentColor" stroke-width="5" stroke-linecap="round" />
        <path d="M50 86C62 74 76 50 86 30" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
      </svg>
    `,
  },
  {
    value: "ridge",
    label: "Ridge peaks",
    svg: `
      <svg viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 86L46 40L74 78L94 54L108 86H16Z" stroke="currentColor" stroke-width="5" stroke-linejoin="round" />
        <path d="M46 40L54 54" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
        <path d="M94 54L88 66" stroke="currentColor" stroke-width="4" stroke-linecap="round" />
      </svg>
    `,
  },
];

const state = {
  ink: inkOptions[0],
  region: regions[0],
  border: borders[0],
  emblem: emblems[0],
  date: new Date(),
  motto: "Gentle winds, bright harbors",
};

const inkSwatches = document.getElementById("inkSwatches");
const regionSelect = document.getElementById("regionSelect");
const borderSelect = document.getElementById("borderSelect");
const emblemSelect = document.getElementById("emblemSelect");
const dateInput = document.getElementById("dateInput");
const mottoInput = document.getElementById("mottoInput");
const stampPreview = document.getElementById("stampPreview");
const stampRegion = document.getElementById("stampRegion");
const stampEmblem = document.getElementById("stampEmblem");
const stampDate = document.getElementById("stampDate");
const stampMotto = document.getElementById("stampMotto");
const metaInk = document.getElementById("metaInk");
const metaBorder = document.getElementById("metaBorder");
const metaEmblem = document.getElementById("metaEmblem");
const ledgerList = document.getElementById("ledgerList");

function formatDate(date) {
  const parts = [
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
    String(date.getFullYear()),
  ];
  return `${parts[0]} · ${parts[1]} · ${parts[2]}`;
}

function buildSwatches() {
  inkOptions.forEach((option) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "swatch";
    button.style.setProperty("--swatch-color", option.color);
    button.innerHTML = `<span>${option.name}</span>`;
    button.addEventListener("click", () => {
      state.ink = option;
      updateStamp();
      setActiveSwatch(option.name);
    });
    inkSwatches.appendChild(button);
  });
  setActiveSwatch(state.ink.name);
}

function setActiveSwatch(name) {
  inkSwatches.querySelectorAll(".swatch").forEach((swatch) => {
    swatch.classList.toggle("active", swatch.textContent.trim() === name);
  });
}

function fillSelect(select, items, getValue, getLabel) {
  items.forEach((item) => {
    const option = document.createElement("option");
    option.value = getValue(item);
    option.textContent = getLabel(item);
    select.appendChild(option);
  });
}

function updateStamp() {
  document.documentElement.style.setProperty("--ink", state.ink.color);
  document.documentElement.style.setProperty("--ink-soft", state.ink.soft);

  stampRegion.textContent = state.region;
  stampEmblem.innerHTML = state.emblem.svg;
  stampDate.textContent = formatDate(state.date);
  stampMotto.textContent = state.motto || "Signed in quiet ink";

  stampPreview.classList.remove(...borders.map((border) => border.value));
  stampPreview.classList.add(state.border.value);

  metaInk.textContent = state.ink.name;
  metaBorder.textContent = state.border.label;
  metaEmblem.textContent = state.emblem.label;
}

function randomize() {
  state.ink = inkOptions[Math.floor(Math.random() * inkOptions.length)];
  state.region = regions[Math.floor(Math.random() * regions.length)];
  state.border = borders[Math.floor(Math.random() * borders.length)];
  state.emblem = emblems[Math.floor(Math.random() * emblems.length)];
  state.motto = [
    "Harbor lights guide the way",
    "Summit air, steady heart",
    "Cedar trails in morning glow",
    "Warm tides, open skies",
    "Stone paths, golden hours",
  ][Math.floor(Math.random() * 5)];
  state.date = new Date();

  regionSelect.value = state.region;
  borderSelect.value = state.border.value;
  emblemSelect.value = state.emblem.value;
  dateInput.valueAsDate = state.date;
  mottoInput.value = state.motto;
  setActiveSwatch(state.ink.name);
  updateStamp();
}

function addLedgerEntry() {
  const entry = document.createElement("div");
  entry.className = "ledger-item";
  entry.innerHTML = `
    <strong>${state.region}</strong>
    <span>${state.emblem.label} • ${state.border.label}</span>
    <span>${formatDate(state.date)} • ${state.motto || "Signed in quiet ink"}</span>
  `;
  ledgerList.prepend(entry);
  if (ledgerList.children.length > 4) {
    ledgerList.lastElementChild.remove();
  }
}

fillSelect(regionSelect, regions, (item) => item, (item) => item);
fillSelect(borderSelect, borders, (item) => item.value, (item) => item.label);
fillSelect(emblemSelect, emblems, (item) => item.value, (item) => item.label);

regionSelect.addEventListener("change", (event) => {
  state.region = event.target.value;
  updateStamp();
});

borderSelect.addEventListener("change", (event) => {
  state.border = borders.find((border) => border.value === event.target.value);
  updateStamp();
});

emblemSelect.addEventListener("change", (event) => {
  state.emblem = emblems.find((emblem) => emblem.value === event.target.value);
  updateStamp();
});

dateInput.addEventListener("change", (event) => {
  state.date = event.target.valueAsDate || new Date();
  updateStamp();
});

mottoInput.addEventListener("input", (event) => {
  state.motto = event.target.value.trim();
  updateStamp();
});

document.getElementById("shuffle").addEventListener("click", randomize);

document.getElementById("addLedger").addEventListener("click", () => {
  addLedgerEntry();
});

buildSwatches();

dateInput.valueAsDate = state.date;
regionSelect.value = state.region;
borderSelect.value = state.border.value;
emblemSelect.value = state.emblem.value;
mottoInput.value = state.motto;

updateStamp();
addLedgerEntry();
