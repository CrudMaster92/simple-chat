const slider = document.getElementById("paceSlider");
const paceLabel = document.getElementById("paceLabel");
const spinButton = document.getElementById("spinButton");
const destinationName = document.getElementById("destinationName");
const destinationTagline = document.getElementById("destinationTagline");
const destinationTempo = document.getElementById("destinationTempo");
const destinationMoment = document.getElementById("destinationMoment");
const destinationHighlights = document.getElementById("destinationHighlights");
const openLinkButton = document.getElementById("openLink");
const copyLinkButton = document.getElementById("copyLink");
const voyageLog = document.getElementById("voyageLog");
const tipText = document.getElementById("tipText");
const compassHalo = document.querySelector(".compass__halo");

const paceStages = [
  {
    id: "drift",
    min: 0,
    max: 33,
    label: "Gentle drift",
    accent: "#ffc857",
    accentStrong: "#f77f00",
    gradient: "radial-gradient(circle at 20% 20%, #0d3a5c, #041326 60%)",
  },
  {
    id: "roam",
    min: 34,
    max: 66,
    label: "Curious roaming",
    accent: "#ff9f1c",
    accentStrong: "#ff6b35",
    gradient: "radial-gradient(circle at 30% 10%, #104f5b, #041326 65%)",
  },
  {
    id: "dash",
    min: 67,
    max: 100,
    label: "High-energy dash",
    accent: "#ffd166",
    accentStrong: "#ef476f",
    gradient: "radial-gradient(circle at 70% 15%, #0f2950, #031021 66%)",
  },
];

const destinations = [
  {
    name: "WindowSwap",
    url: "https://window-swap.com",
    tagline: "Drop into a stranger's living-room view and let their skyline replace yours for a moment.",
    tempo: "drift",
    moment: "Sip something warm while the scene slowly changes.",
    highlights: [
      "Queue up a world tour by bookmarking the windows that make you smile.",
      "Toggle between cinematic and ambient audio to match the room's vibe.",
      "Screen share with a friend and compare the skies you land on.",
    ],
    accent: "#f6ae2d",
    accentStrong: "#f26419",
    gradient: "radial-gradient(circle at 15% 20%, #12496d, #041326 65%)",
  },
  {
    name: "Radio Garden",
    url: "https://radio.garden",
    tagline: "Spin a glowing globe of radio stations broadcasting live from every timezone.",
    tempo: "roam",
    moment: "Zoom into a random island and catch the midnight jazz drift.",
    highlights: [
      "Mark the green orbs you love so you can hop back instantly.",
      "Switch to stories mode for mini sonic postcards from each region.",
      "Try muting and unmuting as you spin to create your own audio collage.",
    ],
    accent: "#4cc9f0",
    accentStrong: "#4895ef",
    gradient: "radial-gradient(circle at 70% 25%, #0f335e, #031021 70%)",
  },
  {
    name: "Are.na Channels",
    url: "https://www.are.na/explore",
    tagline: "Glide through hand-built collections of links, visuals, and research breadcrumbs.",
    tempo: "roam",
    moment: "Follow a rabbit hole from architecture zines to type specimens.",
    highlights: [
      "Skim the explore feed for new channels shaped by niche experts.",
      "Drag clips into your own channel to map out a future moodboard.",
      "Switch to block view to drift through textures and typography.",
    ],
    accent: "#ffd670",
    accentStrong: "#e09f3e",
    gradient: "radial-gradient(circle at 30% 80%, #153355, #021124 68%)",
  },
  {
    name: "Neave TV",
    url: "https://neave.tv",
    tagline: "Channel surf a hypnotic feed of creative video experiments curated by Paul Neave.",
    tempo: "dash",
    moment: "Let the auto-switching feed surprise you every few seconds.",
    highlights: [
      "Tap to skip instantly when a channel sparks a new direction.",
      "Full-screen the feed for an impromptu ambient backdrop.",
      "Pair it with your favorite audio stream for a homemade visual radio.",
    ],
    accent: "#ef476f",
    accentStrong: "#f78c6b",
    gradient: "radial-gradient(circle at 82% 10%, #2f1b41, #070c1a 65%)",
  },
  {
    name: "Poolside FM",
    url: "https://poolside.fm",
    tagline: "Queue sun-faded playlists while browsing VHS-era visuals and ambient chat.",
    tempo: "drift",
    moment: "Switch to VHS mode and let the neon UI idle as a party screen.",
    highlights: [
      "Hop between daytime, bonfire, or after hours moods with a tap.",
      "Open the mini video player and play synth commercials while you work.",
      "Drop into the chat to collect the best song recs from other listeners.",
    ],
    accent: "#ffd166",
    accentStrong: "#ef476f",
    gradient: "radial-gradient(circle at 80% 70%, #1a3a60, #040f24 70%)",
  },
  {
    name: "Neal.fun – Internet Artifacts",
    url: "https://neal.fun/internet-artifacts",
    tagline: "Flip through lovingly restored relics from early web culture.",
    tempo: "roam",
    moment: "Scroll slowly and savor the mix of UI screenshots and lore.",
    highlights: [
      "Follow the hyperlinks inside each artifact to fall into a history tour.",
      "Toggle to full-screen on the retro desktop moments for extra nostalgia.",
      "Share your favorite find straight from the page's quick link tools.",
    ],
    accent: "#ffb703",
    accentStrong: "#fb8500",
    gradient: "radial-gradient(circle at 50% 10%, #123861, #020d1d 65%)",
  },
  {
    name: "Pointer Pointer",
    url: "https://pointerpointer.com",
    tagline: "Every time you move your cursor, a photo appears pointing exactly at it.",
    tempo: "dash",
    moment: "Race across the screen and make the site sprint to keep up.",
    highlights: [
      "Challenge friends to land the most unexpected pointer pose.",
      "Go full-screen and choreograph a pointer dance routine.",
      "Set a timer and see how many unique pointers you can trigger.",
    ],
    accent: "#ff9770",
    accentStrong: "#ff6f59",
    gradient: "radial-gradient(circle at 25% 85%, #143452, #020b1a 65%)",
  },
  {
    name: "A Soft Murmur",
    url: "https://asoftmurmur.com",
    tagline: "Blend rain, thunder, coffee shop clatter, and more into a custom ambient soundtrack.",
    tempo: "drift",
    moment: "Craft a soundscape that matches the view from your window.",
    highlights: [
      "Layer in the singing bowl with a gentle fire crackle for a cozy night in.",
      "Use the timers to fade in sounds as you start or end your day.",
      "Share your mix with a friend to sync the vibe across distance.",
    ],
    accent: "#90be6d",
    accentStrong: "#43aa8b",
    gradient: "radial-gradient(circle at 70% 20%, #0f3a44, #02121f 70%)",
  },
  {
    name: "Patatap",
    url: "https://patatap.com",
    tagline: "Tap any key to trigger melodic bursts and animated shapes in sync.",
    tempo: "dash",
    moment: "Switch to mobile and drum with your thumbs for impromptu beat battles.",
    highlights: [
      "Challenge yourself to keep a rhythm going for a full minute.",
      "Try different keyboards to see how the visuals morph with each pack.",
      "Mirror the animations on a TV for an instant living-room light show.",
    ],
    accent: "#f94144",
    accentStrong: "#f3722c",
    gradient: "radial-gradient(circle at 15% 75%, #2d0c3a, #090714 70%)",
  },
];

const tips = [
  "Spin twice in a row and open both tabs for a spontaneous split-screen voyage.",
  "Blend a drift destination with your own playlist for a personalized radio cruise.",
  "Invite friends to pick numbers on the slider, then spin and compare where you land.",
  "Try copying a link and dropping it into your notes as a future rainy-day escape.",
  "Stack today's spins in the voyage log and re-run them as a themed crawl tomorrow.",
  "Let the site idle in the background; most of them reward a patient gaze.",
];

let lastDestination = null;

function getStage(value) {
  const numeric = Number(value);
  return paceStages.find((stage) => numeric >= stage.min && numeric <= stage.max) ?? paceStages[1];
}

function applyStage(stage) {
  paceLabel.textContent = stage.label;
  document.documentElement.style.setProperty("--accent", stage.accent);
  document.documentElement.style.setProperty("--accent-strong", stage.accentStrong);
  document.documentElement.style.setProperty("--bg-gradient", stage.gradient);
  compassHalo.style.background = `radial-gradient(circle at 50% 30%, ${stage.accent}33, transparent 68%)`;
}

function updateTip() {
  const selection = tips[Math.floor(Math.random() * tips.length)];
  tipText.textContent = selection;
}

function selectDestination(stageId) {
  const pool = destinations.filter((item) => item.tempo === stageId || stageId === "roam");
  const options = pool.length > 0 ? pool : destinations;
  let pick = options[Math.floor(Math.random() * options.length)];
  if (lastDestination && options.length > 1) {
    while (pick === lastDestination) {
      pick = options[Math.floor(Math.random() * options.length)];
    }
  }
  lastDestination = pick;
  return pick;
}

function clearHighlights() {
  destinationHighlights.innerHTML = "";
}

function renderDestination(destination) {
  destinationName.textContent = destination.name;
  destinationTagline.textContent = destination.tagline;
  destinationTempo.textContent = destination.tempo === "drift" ? "Slow drift" : destination.tempo === "dash" ? "Flash dash" : "Curious roam";
  destinationMoment.textContent = destination.moment;
  clearHighlights();
  destination.highlights.forEach((highlight) => {
    const li = document.createElement("li");
    li.textContent = highlight;
    destinationHighlights.appendChild(li);
  });

  document.documentElement.style.setProperty("--accent", destination.accent);
  document.documentElement.style.setProperty("--accent-strong", destination.accentStrong);
  document.documentElement.style.setProperty("--bg-gradient", destination.gradient);
  compassHalo.style.background = `radial-gradient(circle at 50% 30%, ${destination.accent}33, transparent 68%)`;

  openLinkButton.disabled = false;
  copyLinkButton.disabled = false;
  openLinkButton.dataset.url = destination.url;
  copyLinkButton.dataset.url = destination.url;

  appendToLog(destination);
  updateTip();
}

function appendToLog(destination) {
  const item = document.createElement("li");
  const title = document.createElement("span");
  title.className = "log__title";
  title.textContent = destination.name;

  const meta = document.createElement("span");
  meta.className = "log__meta";
  const timestamp = new Intl.DateTimeFormat([], {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date());
  meta.textContent = `${timestamp} • ${destination.tempo === "drift" ? "Drift" : destination.tempo === "dash" ? "Dash" : "Roam"} mode`;

  item.append(title, meta);
  voyageLog.prepend(item);

  const maxEntries = 12;
  while (voyageLog.children.length > maxEntries) {
    voyageLog.removeChild(voyageLog.lastElementChild);
  }
}

slider.addEventListener("input", () => {
  const stage = getStage(slider.value);
  applyStage(stage);
});

spinButton.addEventListener("click", () => {
  const stage = getStage(slider.value);
  const destination = selectDestination(stage.id);
  renderDestination(destination);
});

openLinkButton.addEventListener("click", () => {
  const url = openLinkButton.dataset.url;
  if (!url) return;
  window.open(url, "_blank", "noopener");
});

copyLinkButton.addEventListener("click", async () => {
  const url = copyLinkButton.dataset.url;
  if (!url) return;
  if (!navigator.clipboard) {
    copyLinkButton.textContent = "Copy not supported";
    copyLinkButton.disabled = true;
    return;
  }

  try {
    await navigator.clipboard.writeText(url);
    const originalLabel = copyLinkButton.textContent;
    copyLinkButton.textContent = "Copied!";
    setTimeout(() => {
      copyLinkButton.textContent = originalLabel;
    }, 1800);
  } catch (error) {
    copyLinkButton.textContent = "Copy failed";
    setTimeout(() => {
      copyLinkButton.textContent = "Copy link";
    }, 2000);
  }
});

// Initialize the UI with the default stage styling
applyStage(getStage(slider.value));
updateTip();
