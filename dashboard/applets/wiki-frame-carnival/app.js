const frame = document.getElementById("wikiFrame");
const searchForm = document.getElementById("searchForm");
const searchInput = document.getElementById("searchInput");
const historyList = document.getElementById("historyList");
const statusTicker = document.getElementById("statusTicker");
const viewerBanner = document.getElementById("viewerBanner");
const quickLinkShelf = document.getElementById("quickLinkShelf");
const accentButtons = document.querySelectorAll(".swatch");

const MAX_HISTORY = 8;
const visited = [];

const statusPhrases = [
  "Confetti cannons primed.",
  "Rainbow routing engaged.",
  "Knowledge parade rolling by.",
  "Sprinkling serif sparkles.",
  "Color guard ready for launch."
];
let phraseIndex = 0;

function rotateStatus() {
  phraseIndex = (phraseIndex + 1) % statusPhrases.length;
  statusTicker.dataset.pulse = "true";
  statusTicker.textContent = statusPhrases[phraseIndex];
  setTimeout(() => statusTicker.removeAttribute("data-pulse"), 400);
}

setInterval(rotateStatus, 7000);

function setStatus(message) {
  statusTicker.textContent = message;
  statusTicker.dataset.pulse = "true";
  setTimeout(() => statusTicker.removeAttribute("data-pulse"), 400);
}

function buildWikipediaUrl(query) {
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}&go=Go`;
}

function pushHistory(label, url) {
  visited.unshift({ label, url, timestamp: new Date() });
  if (visited.length > MAX_HISTORY) {
    visited.length = MAX_HISTORY;
  }
  renderHistory();
}

function renderHistory() {
  historyList.innerHTML = "";
  visited.forEach((entry, index) => {
    const li = document.createElement("li");
    const info = document.createElement("span");
    info.textContent = entry.label;

    const revisit = document.createElement("button");
    revisit.type = "button";
    revisit.textContent = "Replay";
    revisit.addEventListener("click", () => {
      navigateTo(entry.url, entry.label, false);
    });

    li.style.background = historyCardGradient(index);
    li.append(info, revisit);
    historyList.append(li);
  });
}

function historyCardGradient(index) {
  const palette = [
    ["#ffe5b4", "#fff2d3"],
    ["#bdeff9", "#d6fbff"],
    ["#ffd5c8", "#ffe7dd"],
    ["#f9ffc5", "#ffeabf"]
  ];
  const [start, end] = palette[index % palette.length];
  return `linear-gradient(135deg, ${start}, ${end})`;
}

function updateBanner(label) {
  viewerBanner.textContent = `Viewing: ${label}`;
}

function navigateTo(url, label, addToHistory = true) {
  frame.src = url;
  updateBanner(label);
  setStatus(`Beaming you to ${label} ✨`);
  if (addToHistory) {
    pushHistory(label, url);
  }
}

searchForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const raw = searchInput.value.trim();
  if (!raw) {
    setStatus("Need a topic before we launch.");
    return;
  }
  const url = buildWikipediaUrl(raw);
  navigateTo(url, raw);
  searchInput.value = "";
});

quickLinkShelf.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (!target.classList.contains("quick-link")) return;

  if (target.dataset.random) {
    setStatus("Rolling the surprise wheel…");
    navigateTo("https://en.wikipedia.org/wiki/Special:Random", "Random adventure");
    return;
  }

  const query = target.dataset.search;
  if (query) {
    const url = buildWikipediaUrl(query);
    navigateTo(url, query);
  }
});

accentButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyAccent(button.dataset.accent);
  });
});

function applyAccent(name = "sunrise") {
  document.body.dataset.accent = name;
  switch (name) {
    case "lagoon":
      setStatus("Lagoon mode: turquoise tides unlocked.");
      break;
    case "sherbet":
      setStatus("Sherbet swirl activated. Stay sweet!");
      break;
    default:
      setStatus("Sunrise glow engaged. Golden hour forever.");
  }
}

applyAccent("sunrise");
pushHistory("Wikipedia Main Page", "https://en.wikipedia.org/wiki/Main_Page");
