const vibePalette = {
  1: {
    label: "Mellow Drift",
    stamp: "✶",
    stampColor: "#ff7ab5",
    frameColor: "rgba(255, 122, 181, 0.35)",
    opening: (era, locale) => `In the hush of ${era}, ${locale} glimmers with soft echoes,`,
    mood: "a mellow tide of memories",
    closing: "Stay anchored in the gentlest timelines",
    signature: "Your reflective correspondent"
  },
  2: {
    label: "Chromatic Bounce",
    stamp: "✺",
    stampColor: "#ffb347",
    frameColor: "rgba(255, 179, 71, 0.35)",
    opening: (era, locale) => `Under neon gusts of ${era}, ${locale} pulses like a synthwave heartbeat,`,
    mood: "a chromatic burst of joy",
    closing: "Catch the rhythm before it loops",
    signature: "Your kaleidoscope pal"
  },
  3: {
    label: "Quantum Whirl",
    stamp: "✸",
    stampColor: "#5ad1ff",
    frameColor: "rgba(90, 209, 255, 0.35)",
    opening: (era, locale) => `Somewhere between timelines at ${locale}, the ${era} breeze spirals around us,`,
    mood: "a swirl of curious possibility",
    closing: "Meet me where the hourglass pirouettes",
    signature: "Your quantum co-pilot"
  },
  4: {
    label: "Mythic Ember",
    stamp: "✷",
    stampColor: "#ff6f91",
    frameColor: "rgba(255, 111, 145, 0.35)",
    opening: (era, locale) => `Lanterns bloom over ${locale} in the roaring ${era},`,
    mood: "a myth-spun spark",
    closing: "Guard the ember until we reunite",
    signature: "Your fireside fabulist"
  },
  5: {
    label: "Solar Fanfare",
    stamp: "✹",
    stampColor: "#ffd166",
    frameColor: "rgba(255, 209, 102, 0.35)",
    opening: (era, locale) => `Trumpets of dawn blare across ${locale} as ${era} unfurls,`,
    mood: "a fanfare of brazen wonder",
    closing: "Stride boldly between the sunbeams",
    signature: "Your celebratory herald"
  }
};

const eras = [
  { name: "Aurora Junction 2145", locale: "on a skyrail above the floating markets" },
  { name: "Coral Metropolis 3090", locale: "inside a glass bubble beneath the singing reef" },
  { name: "Clockwork Soirée 1887", locale: "inside a ballroom powered by brass gears" },
  { name: "Nebula Carnival 2372", locale: "along a parade of gravity-defying lanterns" },
  { name: "Verdant Utopia 3021", locale: "inside the canopy of a talking forest" },
  { name: "Starlit Caravan 1205", locale: "amid a caravan shimmering across desert constellations" }
];

const happenings = [
  "time-surfers are trading constellations like baseball cards",
  "the air smells like rain-soaked vinyl and stardust",
  "every street performer juggles different versions of tomorrow",
  "a choir of pocket-sized oracles keeps humming your name",
  "the local clocktender is rewinding sunsets for extra sparkle",
  "someone just sketched your initials on a comet trail"
];

const souvenirs = [
  "a pocketful of glowstick fossils",
  "a foldable skyline postcard",
  "a bundle of self-folding origami cranes",
  "a spoonful of midnight marmalade",
  "a map that redraws itself when you laugh",
  "a ticket stub from a concert that hasn’t debuted yet"
];

const dispatches = [
  "The timeline concierge insisted I deliver this moment to you.",
  "Every compass here keeps tilting toward your orbit.",
  "An archivist just pressed your favorite song into moonlight.",
  "A ripple of déjà vu keeps asking about you by name.",
  "The locals swear your laughter can unstick frozen hours.",
  "I promised a star-gazer you'd read this before the next eclipse."
];

const STORAGE_KEY = "time-capsule-postcards";
const MAX_CARDS = 8;

const recipientInput = document.querySelector("#recipient");
const vibeInput = document.querySelector("#vibe");
const vibeLabel = document.querySelector("#vibe-label");
const noteInput = document.querySelector("#note");
const generateButton = document.querySelector("#generate");
const saveButton = document.querySelector("#save");
const clearButton = document.querySelector("#clear");
const statusEl = document.querySelector("#status");
const postcardEl = document.querySelector("#postcard");
const originEl = postcardEl.querySelector(".postcard__origin");
const stampEl = postcardEl.querySelector(".postcard__stamp");
const messageEl = postcardEl.querySelector(".postcard__message");
const signatureEl = postcardEl.querySelector(".postcard__signature");
const capsuleList = document.querySelector("#capsule-list");

let currentCard = null;

const readCapsule = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Time Capsule storage unavailable", error);
    return [];
  }
};

const writeCapsule = (cards) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  } catch (error) {
    console.warn("Unable to persist Time Capsule", error);
  }
};

const pick = (items) => items[Math.floor(Math.random() * items.length)];

const updateVibeLabel = () => {
  const vibe = vibePalette[Number(vibeInput.value)];
  if (!vibe) return;
  vibeLabel.textContent = vibe.label;
};

const formatDate = (isoString) => {
  const date = new Date(isoString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const renderPostcard = (card) => {
  if (!card) {
    originEl.textContent = "Awaiting coordinates…";
    stampEl.textContent = "✶";
    messageEl.textContent = "Tap \"Generate\" to receive a freshly inked time capsule postcard.";
    signatureEl.textContent = "— Chrononaut Courier";
    postcardEl.style.setProperty("--stamp-color", "#ff7ab5");
    postcardEl.style.setProperty("--frame-color", "rgba(123, 92, 255, 0.35)");
    return;
  }

  originEl.textContent = card.origin;
  stampEl.textContent = card.stamp;
  messageEl.textContent = card.body;
  signatureEl.textContent = `— ${card.signature}`;
  postcardEl.style.setProperty("--stamp-color", card.stampColor);
  postcardEl.style.setProperty("--frame-color", card.frameColor);
};

const renderCapsule = () => {
  const cards = readCapsule();
  capsuleList.innerHTML = "";

  if (!cards.length) {
    const placeholder = document.createElement("div");
    placeholder.className = "capsule__empty";
    placeholder.textContent = "No postcards bottled yet. Generate one and save it to start your shelf.";
    capsuleList.append(placeholder);
    return;
  }

  cards.forEach((card) => {
    const article = document.createElement("article");
    article.className = "capsule-card";

    const meta = document.createElement("div");
    meta.className = "capsule-card__meta";

    const originTag = document.createElement("span");
    originTag.textContent = card.origin;

    const vibeTag = document.createElement("span");
    vibeTag.textContent = card.vibe;

    const savedTag = document.createElement("span");
    savedTag.textContent = formatDate(card.savedAt);

    meta.append(originTag, vibeTag, savedTag);

    const body = document.createElement("pre");
    body.className = "capsule-card__body";
    body.textContent = card.body;

    article.append(meta, body);
    capsuleList.append(article);
  });
};

const buildMessage = ({ recipient, vibe, era, note }) => {
  const firstLine = vibe.opening(era.name, era.locale);
  const secondLine = `Right now ${pick(happenings)}.`;
  const souvenirLine = `I tucked away ${pick(souvenirs)} just for you.`;
  const dispatchLine = pick(dispatches);

  const lines = [
    `Dear ${recipient},`,
    "",
    `${firstLine} carrying ${vibe.mood}.`,
    secondLine,
    souvenirLine,
    dispatchLine
  ];

  if (note) {
    lines.push("", `P.S. ${note}`);
  }

  lines.push("", `${vibe.closing},`, vibe.signature);

  return lines.join("\n");
};

const generateCard = () => {
  const vibe = vibePalette[Number(vibeInput.value)] ?? vibePalette[1];
  const era = pick(eras);
  const recipient = recipientInput.value.trim() || "Time Traveler";
  const note = noteInput.value.trim();

  const body = buildMessage({ recipient, vibe, era, note });

  currentCard = {
    origin: `${era.name} • ${era.locale}`,
    stamp: vibe.stamp,
    stampColor: vibe.stampColor,
    frameColor: vibe.frameColor,
    body,
    signature: vibe.signature,
    vibe: vibe.label,
    savedAt: new Date().toISOString()
  };

  renderPostcard(currentCard);
  saveButton.disabled = false;
  statusEl.textContent = `Postcard tuned to ${vibe.label}.`;
};

const saveCurrentCard = () => {
  if (!currentCard) {
    statusEl.textContent = "Generate a postcard before saving.";
    return;
  }

  const cards = readCapsule();
  cards.unshift({ ...currentCard });

  if (cards.length > MAX_CARDS) {
    cards.length = MAX_CARDS;
  }

  writeCapsule(cards);
  renderCapsule();
  statusEl.textContent = "Postcard tucked safely into the capsule shelf.";
  saveButton.disabled = true;
};

const clearCapsule = () => {
  writeCapsule([]);
  renderCapsule();
  statusEl.textContent = "Capsule shelf cleared.";
};

vibeInput.addEventListener("input", () => {
  updateVibeLabel();
  const vibe = vibePalette[Number(vibeInput.value)];
  if (vibe) {
    postcardEl.style.setProperty("--stamp-color", vibe.stampColor);
    postcardEl.style.setProperty("--frame-color", vibe.frameColor);
    stampEl.textContent = vibe.stamp;
  }
});

generateButton.addEventListener("click", (event) => {
  event.preventDefault();
  generateCard();
});

saveButton.addEventListener("click", (event) => {
  event.preventDefault();
  saveCurrentCard();
});

clearButton.addEventListener("click", (event) => {
  event.preventDefault();
  clearCapsule();
  saveButton.disabled = true;
  currentCard = null;
  renderPostcard(null);
});

window.addEventListener("load", () => {
  updateVibeLabel();
  renderCapsule();
  renderPostcard(null);
});
