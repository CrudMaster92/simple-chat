const storageKey = "readykit-planner-state-v1";

const safeClone = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
};

const hazardCatalog = [
  {
    id: "earthquake",
    name: "Earthquake",
    blurb: "Brace for shaking, debris, and utility shutdowns.",
  },
  {
    id: "wildfire",
    name: "Wildfire",
    blurb: "Smoke, poor air, and fast evacuations.",
  },
  {
    id: "flood",
    name: "Flood / Storm Surge",
    blurb: "Expect contaminated water and soggy escapes.",
  },
  {
    id: "hurricane",
    name: "Hurricane",
    blurb: "High winds, long outages, and water intrusion.",
  },
  {
    id: "winter",
    name: "Winter storm",
    blurb: "Prolonged cold snaps and road closures.",
  },
  {
    id: "heatwave",
    name: "Extreme heat",
    blurb: "Stay ahead of dehydration and cooling needs.",
  },
  {
    id: "blackout",
    name: "Power outage",
    blurb: "Keep light, comms, and batteries topped up.",
  },
  {
    id: "pandemic",
    name: "Outbreak",
    blurb: "Bolster hygiene and isolation supplies.",
  },
];

const baseItems = [
  {
    id: "water",
    category: "Water & Nutrition",
    label: "Drinking water (sealed)",
    unit: "gallons",
    priority: 5,
    note: "Store in BPA-free containers and rotate every 6 months.",
    compute: (state) => {
      const { adults, children, infants, pets, days, climate } = state.profile;
      const humanGallons = adults * 1 + children * 0.8 + infants * 0.5;
      const petGallons = pets * 0.3;
      const climateBoost = climate === "hot" ? 1.3 : climate === "cold" ? 1.1 : 1;
      return roundToQuarter((humanGallons + petGallons) * days * climateBoost);
    },
  },
  {
    id: "food",
    category: "Water & Nutrition",
    label: "Shelf-stable meals",
    unit: "servings",
    priority: 4,
    note: "Aim for mix of proteins, grains, and ready-to-eat options.",
    compute: (state) => {
      const { adults, children, infants, days } = state.profile;
      const servings = adults * 3 + children * 2 + infants * 1.5;
      return Math.ceil(servings * days);
    },
  },
  {
    id: "snacks",
    category: "Water & Nutrition",
    label: "Electrolyte + calorie boosters",
    unit: "packs",
    priority: 2,
    note: "Gel packs, nut butters, electrolyte mix, or shelf-stable baby food.",
    compute: (state) => {
      const totalPeople = state.profile.adults + state.profile.children + state.profile.infants;
      return Math.max(4, Math.ceil(totalPeople * state.profile.days * 1.5));
    },
  },
  {
    id: "filter",
    category: "Water & Nutrition",
    label: "Water filter or purification tabs",
    unit: "set",
    priority: 4,
    note: "Lightweight squeeze filter plus backup purification tablets.",
    quantity: 1,
  },
  {
    id: "first-aid",
    category: "Health & Comfort",
    label: "Enhanced first-aid kit",
    unit: "kit",
    priority: 5,
    note: "Include antiseptics, trauma pads, tweezers, gloves, and pain relief.",
    quantity: 1,
  },
  {
    id: "medications",
    category: "Health & Comfort",
    label: "Medication + copies of prescriptions",
    unit: "days",
    priority: 5,
    note: "Pack at least seven days if support needs include medication.",
    compute: (state) => (state.profile.support === "medical" || state.profile.support === "both" ? 7 : 3),
  },
  {
    id: "sanitation",
    category: "Health & Comfort",
    label: "Sanitation kit",
    unit: "set",
    priority: 3,
    note: "Waste bags, biodegradable soap, wipes, toothbrushes, and quick-dry towel.",
    quantity: 1,
  },
  {
    id: "sleep",
    category: "Health & Comfort",
    label: "Warmth + rest bundle",
    unit: "sets",
    priority: 3,
    note: "Compact sleeping bag or thermal blanket per person, plus eye mask and earplugs.",
    compute: (state) => state.profile.adults + state.profile.children + state.profile.infants,
  },
  {
    id: "documents",
    category: "Documents & Tech",
    label: "Vital documents cache",
    unit: "packet",
    priority: 5,
    note: "IDs, insurance, medical summaries, contacts. Encrypt digital copies on flash drive.",
    quantity: 1,
  },
  {
    id: "chargers",
    category: "Documents & Tech",
    label: "Battery bank + device cables",
    unit: "banks",
    priority: 4,
    note: "At least 10,000 mAh per two people and solar panel if outages are likely.",
    compute: (state) => Math.max(1, Math.ceil((state.profile.adults + state.profile.children + 1) / 2)),
  },
  {
    id: "light",
    category: "Safety & Tools",
    label: "Light sources",
    unit: "sets",
    priority: 4,
    note: "Headlamps + lantern with spare batteries or crank option.",
    compute: (state) => Math.max(1, Math.ceil((state.profile.adults + state.profile.children) / 2)),
  },
  {
    id: "tools",
    category: "Safety & Tools",
    label: "Multi-tool + utility knife",
    unit: "set",
    priority: 3,
    quantity: 1,
  },
  {
    id: "radio",
    category: "Documents & Tech",
    label: "NOAA weather radio",
    unit: "radio",
    priority: 4,
    note: "Hand-crank or solar models keep updates flowing when networks fail.",
    quantity: 1,
  },
  {
    id: "cash",
    category: "Documents & Tech",
    label: "Small bills cash reserve",
    unit: "pack",
    priority: 3,
    note: "Aim for $100-$200 in small bills sealed in waterproof pouch.",
    quantity: 1,
  },
  {
    id: "maps",
    category: "Safety & Tools",
    label: "Local map + meeting plan",
    unit: "set",
    priority: 3,
    note: "Printed evacuation routes with neighborhood rally points.",
    quantity: 1,
  },
  {
    id: "clothing",
    category: "Health & Comfort",
    label: "Weather-ready clothing",
    unit: "outfits",
    priority: 3,
    note: "Base layers, sturdy shoes, hat, and gloves per person.",
    compute: (state) => state.profile.adults + state.profile.children + state.profile.infants,
  },
  {
    id: "pet-kit",
    category: "Health & Comfort",
    label: "Pet supplies",
    unit: "sets",
    priority: 2,
    note: "Food, leash, carrier, meds, and comfort item per animal.",
    compute: (state) => state.profile.pets > 0 ? state.profile.pets : 0,
  },
  {
    id: "shelter",
    category: "Safety & Tools",
    label: "Compact shelter / tarp",
    unit: "pieces",
    priority: 2,
    note: "Emergency bivy, tarp, and cord in case the primary shelter is compromised.",
    quantity: 1,
  },
];

const hazardAddOns = {
  earthquake: [
    {
      id: "earthquake-prybar",
      category: "Safety & Tools",
      label: "Pry bar + work gloves",
      unit: "set",
      priority: 4,
      note: "Free stuck doors and protect hands from debris.",
      quantity: 1,
    },
    {
      id: "earthquake-gas",
      category: "Safety & Tools",
      label: "Gas shutoff wrench",
      unit: "wrench",
      priority: 4,
      note: "Know where your shutoff valve is and tag instructions nearby.",
      quantity: 1,
    },
    {
      id: "earthquake-helmet",
      category: "Health & Comfort",
      label: "Impact-rated helmets",
      unit: "helmets",
      priority: 3,
      note: "Bike or climbing helmets to guard against falling debris.",
      compute: (state) => state.profile.adults + state.profile.children,
    },
  ],
  wildfire: [
    {
      id: "wildfire-mask",
      category: "Health & Comfort",
      label: "N95/N99 respirators",
      unit: "masks",
      priority: 5,
      note: "Smoke-ready respirators for every person plus extras.",
      compute: (state) => Math.max(6, (state.profile.adults + state.profile.children + state.profile.infants) * 3),
    },
    {
      id: "wildfire-goggles",
      category: "Safety & Tools",
      label: "Sealed goggles",
      unit: "pairs",
      priority: 3,
      note: "Protect eyes from ash and wind during evacuations.",
      compute: (state) => state.profile.adults + state.profile.children,
    },
    {
      id: "wildfire-cleaner",
      category: "Documents & Tech",
      label: "Air quality tracker app + spare filters",
      unit: "set",
      priority: 2,
      note: "Pack spare HVAC or portable air purifier filters in sealed bag.",
      quantity: 1,
    },
  ],
  flood: [
    {
      id: "flood-bags",
      category: "Safety & Tools",
      label: "Dry bags + zip pouches",
      unit: "bags",
      priority: 4,
      note: "Protect electronics and documents from rising water.",
      compute: (state) => Math.max(4, state.profile.adults + state.profile.children + 2),
    },
    {
      id: "flood-boots",
      category: "Health & Comfort",
      label: "Waterproof boots + gloves",
      unit: "sets",
      priority: 3,
      note: "Chemical-resistant gloves and tall waterproof boots.",
      compute: (state) => state.profile.adults + Math.ceil(state.profile.children / 2),
    },
    {
      id: "flood-bleach",
      category: "Health & Comfort",
      label: "Bleach + cleaning concentrate",
      unit: "bottles",
      priority: 2,
      note: "For disinfecting surfaces post-flood.",
      quantity: 1,
    },
  ],
  hurricane: [
    {
      id: "hurricane-tarp",
      category: "Safety & Tools",
      label: "Roof patch tarp + duct tape",
      unit: "kit",
      priority: 3,
      quantity: 1,
    },
    {
      id: "hurricane-rope",
      category: "Safety & Tools",
      label: "Paracord + bungees",
      unit: "bundle",
      priority: 2,
      note: "Secure tarps and lash gear quickly.",
      quantity: 1,
    },
    {
      id: "hurricane-cooler",
      category: "Health & Comfort",
      label: "Insulated cooler + ice packs",
      unit: "set",
      priority: 3,
      note: "Keep medications and perishables safe during long outages.",
      quantity: 1,
    },
  ],
  winter: [
    {
      id: "winter-handwarmers",
      category: "Health & Comfort",
      label: "Hand and toe warmers",
      unit: "packs",
      priority: 4,
      compute: (state) => Math.max(12, (state.profile.adults + state.profile.children) * 6),
    },
    {
      id: "winter-stove",
      category: "Water & Nutrition",
      label: "Vent-safe stove + fuel",
      unit: "kit",
      priority: 3,
      note: "Compact stove with fuel canisters for hot meals.",
      quantity: 1,
    },
    {
      id: "winter-traction",
      category: "Safety & Tools",
      label: "Traction aids + ice melt",
      unit: "sets",
      priority: 2,
      note: "Microspikes and pet-safe ice melt.",
      quantity: 1,
    },
  ],
  heatwave: [
    {
      id: "heatwave-cooling",
      category: "Health & Comfort",
      label: "Cooling towels + misting bottle",
      unit: "sets",
      priority: 3,
      compute: (state) => state.profile.adults + state.profile.children,
    },
    {
      id: "heatwave-electrolytes",
      category: "Water & Nutrition",
      label: "Electrolyte concentrate",
      unit: "bottles",
      priority: 4,
      note: "High-heat formula to replenish salts.",
      quantity: 2,
    },
    {
      id: "heatwave-shade",
      category: "Safety & Tools",
      label: "Pop-up shade or mylar tarp",
      unit: "kit",
      priority: 2,
      quantity: 1,
    },
  ],
  blackout: [
    {
      id: "blackout-batteries",
      category: "Documents & Tech",
      label: "Battery rotation pack",
      unit: "cells",
      priority: 4,
      note: "Label expiry dates and rotate quarterly.",
      compute: (state) => Math.max(12, (state.profile.adults + state.profile.children) * 6),
    },
    {
      id: "blackout-surge",
      category: "Documents & Tech",
      label: "Surge protector + extension",
      unit: "set",
      priority: 2,
      quantity: 1,
    },
    {
      id: "blackout-lightmap",
      category: "Safety & Tools",
      label: "Glow-in-the-dark home map",
      unit: "set",
      priority: 2,
      note: "Mark breaker, gas, and water shutoff.",
      quantity: 1,
    },
  ],
  pandemic: [
    {
      id: "pandemic-masks",
      category: "Health & Comfort",
      label: "Respirators + surgical masks",
      unit: "masks",
      priority: 4,
      note: "Include child-sized options and labeled storage bag.",
      compute: (state) => Math.max(10, (state.profile.adults + state.profile.children + state.profile.infants) * 4),
    },
    {
      id: "pandemic-thermometer",
      category: "Health & Comfort",
      label: "Contactless thermometer",
      unit: "device",
      priority: 3,
      quantity: 1,
    },
    {
      id: "pandemic-cleaning",
      category: "Health & Comfort",
      label: "Disinfectant + soap reserve",
      unit: "bottles",
      priority: 3,
      note: "At least 30 days of cleaning supplies.",
      quantity: 2,
    },
  ],
};

const presetProfiles = {
  duo: {
    profile: { adults: 2, children: 0, infants: 0, pets: 0, support: "none", days: 3, climate: "temperate", location: "urban" },
    hazards: ["earthquake", "blackout"],
  },
  family: {
    profile: { adults: 2, children: 2, infants: 1, pets: 1, support: "medical", days: 4, climate: "hot", location: "suburban" },
    hazards: ["wildfire", "heatwave", "blackout"],
  },
  solo: {
    profile: { adults: 1, children: 0, infants: 0, pets: 0, support: "none", days: 3, climate: "temperate", location: "travel" },
    hazards: ["flood", "hurricane"],
  },
};

const timelineBuckets = [
  { id: "immediate", label: "This week", hint: "Lock in fundamentals while calm." },
  { id: "monthly", label: "Monthly pulse", hint: "Short rituals keep readiness fresh." },
  { id: "seasonal", label: "Season shift", hint: "Rotate gear when conditions change." },
];

const baseTasks = [
  {
    id: "task-water-label",
    bucket: "immediate",
    text: "Label stored water with fill date and set a 6-month reminder to refresh.",
  },
  {
    id: "task-contacts",
    bucket: "immediate",
    text: "Print emergency contact sheet with rally point instructions.",
  },
  {
    id: "task-checkup",
    bucket: "monthly",
    text: "Review expiry dates on medications, food, and batteries.",
  },
  {
    id: "task-drill",
    bucket: "seasonal",
    text: "Run an evacuation drill using your current hazard list.",
  },
  {
    id: "task-data",
    bucket: "monthly",
    text: "Sync encrypted copies of documents to cloud + flash drive.",
  },
];

const hazardTasks = {
  earthquake: [
    {
      id: "task-quake-secure",
      bucket: "immediate",
      text: "Bolt tall furniture and water heaters to studs.",
    },
    {
      id: "task-quake-drill",
      bucket: "seasonal",
      text: "Practice drop, cover, and hold with all household members.",
    },
  ],
  wildfire: [
    {
      id: "task-wildfire-zone",
      bucket: "seasonal",
      text: "Clear defensible space and clean gutters of dry debris.",
    },
    {
      id: "task-wildfire-notice",
      bucket: "immediate",
      text: "Enable local alerting apps and review go-bag staging spot.",
    },
  ],
  flood: [
    {
      id: "task-flood-photos",
      bucket: "immediate",
      text: "Photograph key rooms and valuables for potential insurance claims.",
    },
    {
      id: "task-flood-route",
      bucket: "seasonal",
      text: "Scout alternate evacuation routes to higher ground.",
    },
  ],
  hurricane: [
    {
      id: "task-hurricane-shutters",
      bucket: "seasonal",
      text: "Inspect shutters or pre-cut window panels.",
    },
    {
      id: "task-hurricane-fuel",
      bucket: "monthly",
      text: "Rotate fuel for generators or vehicles.",
    },
  ],
  winter: [
    {
      id: "task-winter-boiler",
      bucket: "seasonal",
      text: "Schedule furnace and chimney inspection.",
    },
    {
      id: "task-winter-car",
      bucket: "monthly",
      text: "Keep vehicle tank at least half full and stash extra antifreeze.",
    },
  ],
  heatwave: [
    {
      id: "task-heatwave-shade",
      bucket: "immediate",
      text: "Install reflective window film or blackout curtains in main rooms.",
    },
    {
      id: "task-heatwave-cooling",
      bucket: "monthly",
      text: "Test portable fans or cooling units and recharge backup batteries.",
    },
  ],
  blackout: [
    {
      id: "task-blackout-map",
      bucket: "immediate",
      text: "Tag breaker panel, water, and gas shutoff with glow tape.",
    },
    {
      id: "task-blackout-backup",
      bucket: "monthly",
      text: "Cycle battery banks to 50% and recharge to prolong lifespan.",
    },
  ],
  pandemic: [
    {
      id: "task-pandemic-plan",
      bucket: "immediate",
      text: "List isolation room plan and care rotation schedule.",
    },
    {
      id: "task-pandemic-stock",
      bucket: "monthly",
      text: "Audit PPE levels and replace any opened packs.",
    },
  ],
};

const defaultState = {
  profile: {
    adults: 2,
    children: 0,
    infants: 0,
    pets: 0,
    support: "none",
    days: 3,
    climate: "temperate",
    location: "urban",
  },
  hazards: ["earthquake", "blackout"],
  packed: {},
  customQuantities: {},
  customItems: [],
  taskStatus: {},
  categoryFilter: "all",
};

function loadState() {
  try {
    const saved = localStorage.getItem(storageKey);
    if (!saved) return safeClone(defaultState);
    const parsed = JSON.parse(saved);
    return {
      ...safeClone(defaultState),
      ...parsed,
      profile: { ...safeClone(defaultState.profile), ...(parsed.profile || {}) },
      hazards: Array.isArray(parsed.hazards) ? parsed.hazards : safeClone(defaultState.hazards),
      packed: parsed.packed || {},
      customQuantities: parsed.customQuantities || {},
      customItems: parsed.customItems || [],
      taskStatus: parsed.taskStatus || {},
    };
  } catch (error) {
    console.warn("ReadyKit Planner: failed to load state", error);
    return safeClone(defaultState);
  }
}

let state = loadState();

const ui = {
  adults: document.querySelector("#adultsInput"),
  children: document.querySelector("#childrenInput"),
  infants: document.querySelector("#infantsInput"),
  pets: document.querySelector("#petsInput"),
  support: document.querySelector("#supportInput"),
  days: document.querySelector("#daysInput"),
  climate: document.querySelector("#climateInput"),
  location: document.querySelector("#locationInput"),
  hazards: document.querySelector("#hazardChips"),
  presetButtons: document.querySelectorAll(".preset"),
  kitList: document.querySelector("#kitList"),
  coverageRatio: document.querySelector("#coverageRatio"),
  waterNeed: document.querySelector("#waterNeed"),
  mealNeed: document.querySelector("#mealNeed"),
  powerHours: document.querySelector("#powerHours"),
  timeline: document.querySelector("#timeline"),
  resetPacked: document.querySelector("#resetPacked"),
  customForm: document.querySelector("#customItemForm"),
  customName: document.querySelector("#customName"),
  customCategory: document.querySelector("#customCategory"),
  customQuantity: document.querySelector("#customQuantity"),
  customUnit: document.querySelector("#customUnit"),
  customNote: document.querySelector("#customNote"),
  gapList: document.querySelector("#gapList"),
  gapSummary: document.querySelector("#gapSummary"),
  categoryFilter: document.querySelector("#categoryFilter"),
};

function persistState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function roundToQuarter(value) {
  return Math.round(value * 4) / 4;
}

function sanitizeNumber(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function computeItems() {
  const items = [];

  const addItem = (item, source = "base") => {
    if (item.compute) {
      const computed = item.compute(state);
      if (computed <= 0) return;
      items.push({ ...item, quantity: applyCustomQuantity(item.id, computed), source });
    } else {
      const qty = item.quantity ?? 1;
      if (qty <= 0) return;
      items.push({ ...item, quantity: applyCustomQuantity(item.id, qty), source });
    }
  };

  baseItems.forEach((item) => addItem(item, "base"));

  state.hazards.forEach((hazard) => {
    const extras = hazardAddOns[hazard] || [];
    extras.forEach((item) => addItem(item, hazard));
  });

  state.customItems.forEach((item) => {
    const customQty = state.customQuantities[item.id] ?? item.quantity;
    items.push({ ...item, quantity: customQty, source: "custom" });
  });

  return items;
}

function applyCustomQuantity(id, computedQty) {
  if (state.customQuantities[id] !== undefined) {
    return state.customQuantities[id];
  }
  if (computedQty < 0) return 0;
  return Number(computedQty.toFixed(2));
}

function renderProfileInputs() {
  ui.adults.value = state.profile.adults;
  ui.children.value = state.profile.children;
  ui.infants.value = state.profile.infants;
  ui.pets.value = state.profile.pets;
  ui.support.value = state.profile.support;
  ui.days.value = state.profile.days;
  ui.climate.value = state.profile.climate;
  ui.location.value = state.profile.location;
}

function renderHazardChips() {
  ui.hazards.innerHTML = "";
  hazardCatalog.forEach((hazard) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `hazard-chip${state.hazards.includes(hazard.id) ? " active" : ""}`;
    button.dataset.hazardId = hazard.id;
    button.setAttribute("aria-pressed", state.hazards.includes(hazard.id));
    button.title = hazard.blurb;
    button.textContent = hazard.name;
    ui.hazards.appendChild(button);
  });
}

function renderCategoryFilter(items) {
  ui.categoryFilter.innerHTML = "";
  const categories = new Map();
  items.forEach((item) => {
    const stats = categories.get(item.category) || { total: 0, packed: 0 };
    stats.total += 1;
    if (state.packed[item.id]) stats.packed += 1;
    categories.set(item.category, stats);
  });

  const createButton = (label, value, subtitle) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.category = value;
    btn.className = state.categoryFilter === value ? "active" : "";

    const strong = document.createElement("strong");
    strong.textContent = label;
    btn.appendChild(strong);
    if (subtitle) {
      const span = document.createElement("span");
      span.textContent = ` · ${subtitle}`;
      btn.appendChild(span);
    }

    ui.categoryFilter.appendChild(btn);
  };

  const packedTotal = items.reduce((acc, item) => acc + (state.packed[item.id] ? 1 : 0), 0);
  createButton("All", "all", `${packedTotal}/${items.length}`);

  categories.forEach((stats, label) => {
    createButton(label, label, `${stats.packed}/${stats.total}`);
  });
}

function renderKit(items) {
  ui.kitList.innerHTML = "";
  const groups = new Map();
  items.forEach((item) => {
    if (state.categoryFilter !== "all" && item.category !== state.categoryFilter) return;
    if (!groups.has(item.category)) groups.set(item.category, []);
    groups.get(item.category).push(item);
  });

  groups.forEach((groupItems, category) => {
    const group = document.createElement("section");
    group.className = "category-group";

    const title = document.createElement("h3");
    title.className = "category-title";
    const packedCount = groupItems.reduce((acc, item) => acc + (state.packed[item.id] ? 1 : 0), 0);
    title.textContent = `${category} · ${packedCount}/${groupItems.length} packed`;
    group.appendChild(title);

    const listFragment = document.createDocumentFragment();

    groupItems
      .slice()
      .sort((a, b) => (b.priority || 1) - (a.priority || 1))
      .forEach((item) => {
        const itemEl = document.createElement("article");
        itemEl.className = `kit-item${state.packed[item.id] ? " packed" : ""}`;
        itemEl.dataset.itemId = item.id;

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "packed-toggle";
        toggle.setAttribute("aria-pressed", state.packed[item.id] ? "true" : "false");
        toggle.title = state.packed[item.id] ? "Mark as not packed" : "Mark as packed";
        itemEl.appendChild(toggle);

        const details = document.createElement("div");
        const titleEl = document.createElement("h3");
        titleEl.textContent = item.label;
        details.appendChild(titleEl);
        if (item.note) {
          const note = document.createElement("p");
          note.textContent = item.note;
          details.appendChild(note);
        }
        if (item.source && item.source !== "base" && item.source !== "custom") {
          const badge = document.createElement("span");
          badge.className = "unit-label";
          badge.textContent = `Hazard add-on · ${hazardCatalog.find((h) => h.id === item.source)?.name ?? item.source}`;
          details.appendChild(badge);
        } else if (item.source === "custom") {
          const badge = document.createElement("span");
          badge.className = "unit-label";
          badge.textContent = "Added by you";
          details.appendChild(badge);
        }
        itemEl.appendChild(details);

        const controls = document.createElement("div");
        controls.className = "quantity-stepper";

        const minus = document.createElement("button");
        minus.type = "button";
        minus.dataset.action = "decrement";
        minus.dataset.itemId = item.id;
        minus.textContent = "−";

        const value = document.createElement("span");
        value.className = "quantity-value";
        value.textContent = formatQuantity(item.quantity);

        const plus = document.createElement("button");
        plus.type = "button";
        plus.dataset.action = "increment";
        plus.dataset.itemId = item.id;
        plus.textContent = "+";

        controls.append(minus, value, plus);

        const unit = document.createElement("div");
        unit.className = "unit-label";
        unit.textContent = item.unit ? item.unit : "";
        controls.appendChild(unit);

        itemEl.appendChild(controls);
        listFragment.appendChild(itemEl);
      });

    group.appendChild(listFragment);
    ui.kitList.appendChild(group);
  });

  if (!ui.kitList.children.length) {
    const empty = document.createElement("p");
    empty.className = "unit-label";
    empty.textContent = "No items match this category yet.";
    ui.kitList.appendChild(empty);
  }
}

function formatQuantity(value) {
  if (Number.isInteger(value)) return value.toString();
  if (Math.abs(value - Math.round(value)) < 0.01) return Math.round(value).toString();
  return value.toFixed(2).replace(/\.00$/, "");
}

function renderSummary(items) {
  const totalItems = items.length;
  const packedItems = items.reduce((acc, item) => acc + (state.packed[item.id] ? 1 : 0), 0);
  const coverage = totalItems === 0 ? 0 : Math.round((packedItems / totalItems) * 100);
  ui.coverageRatio.textContent = `${coverage}%`;

  const waterItem = items.find((item) => item.id === "water");
  const { waterGallons, mealServings, powerHours } = deriveNeeds(waterItem ? waterItem.quantity : undefined);
  ui.waterNeed.textContent = formatQuantity(waterGallons);
  ui.mealNeed.textContent = formatQuantity(mealServings);
  ui.powerHours.textContent = formatQuantity(powerHours);
}

function deriveNeeds(waterQuantity) {
  const { adults, children, infants, days, support } = state.profile;
  const totalHumans = adults + children + infants;
  const waterGallons = waterQuantity ?? roundToQuarter((totalHumans + state.profile.pets * 0.3) * days);
  const mealServings = Math.ceil((adults * 3 + children * 2 + infants * 1.5) * days);
  const baseHours = totalHumans * 6 * days;
  const hazardBoost = state.hazards.includes("blackout") ? 24 : 12;
  const supportBoost = support === "medical" || support === "both" ? 18 : 0;
  const powerHours = baseHours / 3 + hazardBoost + supportBoost;
  return { waterGallons, mealServings, powerHours: Math.ceil(powerHours) };
}

function renderGaps(items) {
  const outstanding = items.filter((item) => !state.packed[item.id]);
  const totalOutstanding = outstanding.length;
  if (totalOutstanding === 0) {
    ui.gapSummary.textContent = "Powerful! Every item in this blueprint is marked as staged.";
    ui.gapList.innerHTML = "";
    return;
  }

  ui.gapSummary.textContent = `${totalOutstanding} item${totalOutstanding === 1 ? "" : "s"} left to pack across ${new Set(
    outstanding.map((item) => item.category)
  ).size} categories.`;

  const topGaps = outstanding
    .slice()
    .sort((a, b) => (b.priority || 1) - (a.priority || 1))
    .slice(0, 4);

  ui.gapList.innerHTML = "";
  topGaps.forEach((item) => {
    const li = document.createElement("li");
    li.className = "gap-item";

    const strong = document.createElement("strong");
    strong.textContent = item.label;
    li.appendChild(strong);

    const detail = document.createElement("span");
    const quantity = `${formatQuantity(item.quantity)} ${item.unit || ""}`.trim();
    detail.textContent = `${quantity} · ${item.category}`;
    li.appendChild(detail);

    ui.gapList.appendChild(li);
  });
}

function renderTimeline() {
  const tasks = [...baseTasks];
  state.hazards.forEach((hazard) => {
    (hazardTasks[hazard] || []).forEach((task) => {
      if (!tasks.find((t) => t.id === task.id)) tasks.push(task);
    });
  });

  ui.timeline.innerHTML = "";
  timelineBuckets.forEach((bucket) => {
    const stageTasks = tasks.filter((task) => task.bucket === bucket.id);
    if (!stageTasks.length) return;

    const stage = document.createElement("section");
    stage.className = "timeline-stage";
    const heading = document.createElement("h3");
    heading.textContent = bucket.label;
    stage.appendChild(heading);

    const hint = document.createElement("span");
    hint.className = "unit-label";
    hint.textContent = bucket.hint;
    stage.appendChild(hint);

    stageTasks.forEach((task) => {
      const taskRow = document.createElement("label");
      taskRow.className = "timeline-task";

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.taskId = task.id;
      checkbox.checked = Boolean(state.taskStatus[task.id]);

      const textWrap = document.createElement("div");
      const text = document.createElement("p");
      text.textContent = task.text;
      textWrap.appendChild(text);
      const cadence = document.createElement("span");
      cadence.textContent = bucket.label;
      textWrap.appendChild(cadence);

      taskRow.append(checkbox, textWrap);
      stage.appendChild(taskRow);
    });

    ui.timeline.appendChild(stage);
  });
}

function attachEventListeners() {
  [
    [ui.adults, "adults"],
    [ui.children, "children"],
    [ui.infants, "infants"],
    [ui.pets, "pets"],
  ].forEach(([input, key]) => {
    input.addEventListener("input", () => {
      state.profile[key] = sanitizeNumber(input.value, state.profile[key]);
      sync();
    });
  });

  ui.days.addEventListener("change", () => {
    state.profile.days = sanitizeNumber(ui.days.value, state.profile.days);
    sync();
  });

  ui.support.addEventListener("change", () => {
    state.profile.support = ui.support.value;
    sync();
  });

  ui.climate.addEventListener("change", () => {
    state.profile.climate = ui.climate.value;
    sync();
  });

  ui.location.addEventListener("change", () => {
    state.profile.location = ui.location.value;
    sync();
  });

  ui.hazards.addEventListener("click", (event) => {
    const button = event.target.closest(".hazard-chip");
    if (!button) return;
    const hazardId = button.dataset.hazardId;
    if (state.hazards.includes(hazardId)) {
      state.hazards = state.hazards.filter((id) => id !== hazardId);
    } else {
      state.hazards = [...state.hazards, hazardId];
    }
    sync();
  });

  ui.presetButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const preset = presetProfiles[button.dataset.preset];
      if (!preset) return;
      state = {
        ...state,
        profile: { ...state.profile, ...preset.profile },
        hazards: [...preset.hazards],
      };
      renderProfileInputs();
      sync();
    });
  });

  ui.resetPacked.addEventListener("click", () => {
    state.packed = {};
    sync();
  });

  ui.kitList.addEventListener("click", (event) => {
    const stepButton = event.target.closest("button[data-action]");
    if (stepButton) {
      const id = stepButton.dataset.itemId;
      const delta = stepButton.dataset.action === "increment" ? 1 : -1;
      adjustQuantity(id, delta);
      return;
    }

    const toggle = event.target.closest(".packed-toggle");
    if (toggle) {
      const id = toggle.closest(".kit-item").dataset.itemId;
      state.packed[id] = !state.packed[id];
      sync();
    }
  });

  ui.categoryFilter.addEventListener("click", (event) => {
    const btn = event.target.closest("button[data-category]");
    if (!btn) return;
    state.categoryFilter = btn.dataset.category;
    sync();
  });

  ui.customForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = ui.customName.value.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    const item = {
      id,
      category: ui.customCategory.value,
      label: name,
      unit: ui.customUnit.value.trim(),
      note: ui.customNote.value.trim() || undefined,
      quantity: Math.max(1, sanitizeNumber(ui.customQuantity.value, 1)),
      priority: 3,
    };
    state.customItems = [...state.customItems, item];
    state.customQuantities[id] = item.quantity;
    ui.customForm.reset();
    sync();
  });

  ui.timeline.addEventListener("change", (event) => {
    const checkbox = event.target.closest("input[type=checkbox][data-task-id]");
    if (!checkbox) return;
    state.taskStatus[checkbox.dataset.taskId] = checkbox.checked;
    persistState();
  });
}

function adjustQuantity(id, delta) {
  const items = computeItems();
  const item = items.find((i) => i.id === id);
  if (!item) return;
  const current = state.customQuantities[id] ?? item.quantity;
  const next = Math.max(0, Number((current + delta).toFixed(2)));
  state.customQuantities[id] = next;
  sync();
}

function sync(shouldPersist = true) {
  if (shouldPersist) persistState();
  const items = computeItems();
  renderProfileInputs();
  renderHazardChips();
  renderCategoryFilter(items);
  renderKit(items);
  renderSummary(items);
  renderGaps(items);
  renderTimeline();
}

renderProfileInputs();
renderHazardChips();
attachEventListeners();
sync(false);
