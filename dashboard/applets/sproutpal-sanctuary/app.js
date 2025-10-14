const state = {
  name: "Sprout",
  hunger: 65,
  joy: 65,
  energy: 65,
  hygiene: 65,
  xp: 0,
  level: 1,
  careStreak: 0,
  environment: "grove",
  exploreReadyAt: 0,
  lastTick: Date.now()
};

const statKeys = ["hunger", "joy", "energy", "hygiene"];
const degradeRates = {
  hunger: 2.2,
  joy: 1.9,
  energy: 2.0,
  hygiene: 1.6
};

const statElements = statKeys.reduce((acc, key) => {
  acc[key] = {
    value: document.getElementById(`stat-${key}-value`),
    fill: document.getElementById(`stat-${key}-fill`)
  };
  return acc;
}, {});

const petNameEl = document.getElementById("pet-name");
const petMoodEl = document.getElementById("pet-mood");
const petLevelEl = document.getElementById("pet-level");
const petXpEl = document.getElementById("pet-xp");
const petAvatarEl = document.querySelector(".pet-avatar");
const careStreakEl = document.getElementById("care-streak");
const logEl = document.getElementById("log");
const exploreCooldownEl = document.getElementById("explore-cooldown");
const sanctuaryApp = document.querySelector(".sanctuary-app");

const nameInput = document.getElementById("name-input");
const renameBtn = document.getElementById("rename-btn");

const envButtons = Array.from(document.querySelectorAll(".env-option"));
const actionButtons = Array.from(document.querySelectorAll(".care-btn"));

const environmentLabels = {
  grove: "Grove Glow",
  coast: "Coast Breeze",
  mesa: "Mesa Bloom"
};

const TICK_INTERVAL = 4000;
const EXPLORE_COOLDOWN = 25000;

const actionEffects = {
  feed: {
    hunger: 22,
    joy: 6,
    energy: 8,
    hygiene: -4,
    xp: 14,
    message: () => `${state.name} devours a citrus feast and glows brighter.`
  },
  play: {
    hunger: -6,
    joy: 20,
    energy: -8,
    hygiene: -2,
    xp: 16,
    message: () => `${state.name} chases ribbon comets with infectious giggles.`
  },
  clean: {
    hunger: -3,
    joy: 6,
    energy: -4,
    hygiene: 24,
    xp: 12,
    message: () => `A sparkling mist leaves ${state.name}'s leaves shimmering.`
  },
  rest: {
    hunger: -5,
    joy: 4,
    energy: 24,
    hygiene: -2,
    xp: 10,
    message: () => `${state.name} snoozes in a hush of lullaby breezes.`
  }
};

const exploreFindings = [
  { message: () => `${state.name} discovers a glowing seed that grants +12 joy.`, joy: 12, xp: 18 },
  { message: () => `${state.name} returns with a pocket of dew pearls. Hygiene +14!`, hygiene: 14, xp: 20 },
  { message: () => `${state.name} tracks a sun mote and feels energized. Energy +16.`, energy: 16, xp: 18 },
  { message: () => `${state.name} shares laughter with a passing breeze spirit. Joy +10.`, joy: 10, xp: 14 },
  { message: () => `${state.name} samples tangy nectar — nutrition +14!`, hunger: 14, xp: 18 },
  { message: () => `${state.name} helps a sprigling neighbor tidy their grove. Hygiene +8, Joy +6.`, hygiene: 8, joy: 6, xp: 22 }
];

function clampStat(value) {
  return Math.max(0, Math.min(100, value));
}

function updateStatsDisplay() {
  statKeys.forEach((key) => {
    const value = Math.round(state[key]);
    statElements[key].value.textContent = value;
    statElements[key].fill.style.width = `${value}%`;

    let colorA = "var(--citrus-burst)";
    let colorB = "var(--citrus-peel)";
    if (value < 35) {
      colorA = "#ff5a5f";
      colorB = "#ff8364";
    } else if (value > 80) {
      colorA = "#3a7d44";
      colorB = "#9ef8e4";
    }
    statElements[key].fill.style.background = `linear-gradient(90deg, ${colorA}, ${colorB})`;
  });
}

function computeMood() {
  const average = statKeys.reduce((sum, key) => sum + state[key], 0) / statKeys.length;
  if (average >= 80) return "Radiant";
  if (average >= 55) return "Bright";
  if (average >= 35) return "Wobbly";
  return "Dreary";
}

function updateMoodDisplay() {
  const mood = computeMood();
  petMoodEl.textContent = mood;
  petAvatarEl.dataset.mood = mood.toLowerCase();
}

function xpNeededForLevel(level) {
  return 60 + (level - 1) * 40;
}

function grantXp(amount) {
  state.xp += amount;
  let leveled = false;
  while (state.xp >= xpNeededForLevel(state.level)) {
    state.xp -= xpNeededForLevel(state.level);
    state.level += 1;
    leveled = true;
  }
  petLevelEl.textContent = state.level;
  petXpEl.textContent = Math.round(state.xp);
  if (leveled) {
    logEvent(`🎉 ${state.name} reached level ${state.level}!`);
  }
}

function logEvent(message) {
  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  li.innerHTML = `<span>${message}</span><span class="timestamp">${time}</span>`;
  logEl.prepend(li);
  while (logEl.children.length > 8) {
    logEl.removeChild(logEl.lastChild);
  }
}

function applyAction(actionKey) {
  const action = actionEffects[actionKey];
  if (!action) return;

  statKeys.forEach((key) => {
    if (action[key]) {
      state[key] = clampStat(state[key] + action[key]);
    }
  });

  grantXp(action.xp);
  updateCareStreak();
  updateStatsDisplay();
  updateMoodDisplay();
  logEvent(action.message());
}

function handleExplore() {
  const now = Date.now();
  if (now < state.exploreReadyAt) {
    return;
  }
  state.exploreReadyAt = now + EXPLORE_COOLDOWN;
  exploreCooldownEl.textContent = "Exploring...";
  disableExplore(true);

  setTimeout(() => {
    const find = exploreFindings[Math.floor(Math.random() * exploreFindings.length)];
    statKeys.forEach((key) => {
      if (find[key]) {
        state[key] = clampStat(state[key] + find[key]);
      }
    });
    grantXp(find.xp);
    updateCareStreak();
    updateStatsDisplay();
    updateMoodDisplay();
    logEvent(`🧭 ${find.message()}`);
    countdownExplore();
  }, 2800);
}

function disableExplore(disabled) {
  const exploreBtn = actionButtons.find((btn) => btn.dataset.action === "explore");
  if (exploreBtn) {
    exploreBtn.disabled = disabled;
  }
}

function countdownExplore() {
  const timer = setInterval(() => {
    const remaining = state.exploreReadyAt - Date.now();
    if (remaining <= 0) {
      exploreCooldownEl.textContent = "Ready";
      disableExplore(false);
      clearInterval(timer);
    } else {
      exploreCooldownEl.textContent = `${Math.ceil(remaining / 1000)}s until return`;
    }
  }, 500);
}

function tick() {
  const now = Date.now();
  if (now - state.lastTick < TICK_INTERVAL) return;
  state.lastTick = now;

  statKeys.forEach((key) => {
    state[key] = clampStat(state[key] - degradeRates[key]);
  });

  updateStatsDisplay();
  updateMoodDisplay();
  updateCareStreak();
  checkCriticalStates();
}

function updateCareStreak() {
  const average = statKeys.reduce((sum, key) => sum + state[key], 0) / statKeys.length;
  if (average >= 70) {
    state.careStreak += 1;
    if (state.careStreak % 3 === 0) {
      logEvent(`🌱 Care streak bonus! ${state.name} blossoms with gratitude.`);
      grantXp(12);
    }
  } else {
    state.careStreak = 0;
  }
  careStreakEl.textContent = state.careStreak;
}

function checkCriticalStates() {
  const lowStats = statKeys.filter((key) => state[key] <= 20);
  if (lowStats.length === 0) return;
  const warnings = lowStats
    .map((key) => ({
      hunger: "nutrition",
      joy: "joy",
      energy: "energy",
      hygiene: "freshness"
    }[key]))
    .join(", ");
  logEvent(`⚠️ ${state.name} needs ${warnings}!`);
}

function renamePet() {
  const trimmed = nameInput.value.trim();
  if (!trimmed) return;
  state.name = trimmed;
  petNameEl.textContent = state.name;
  logEvent(`✏️ Your companion now answers to ${state.name}.`);
  nameInput.value = "";
}

function setEnvironment(newEnv) {
  if (state.environment === newEnv) return;
  state.environment = newEnv;
  sanctuaryApp.dataset.environment = newEnv;
  envButtons.forEach((btn) => {
    const isActive = btn.dataset.environment === newEnv;
    btn.classList.toggle("active", isActive);
    btn.setAttribute("aria-pressed", isActive ? "true" : "false");
  });
  const label = environmentLabels[newEnv] || newEnv;
  logEvent(`🌤️ Habitat tuned to ${label} vibes.`);
}

function init() {
  sanctuaryApp.dataset.environment = state.environment;
  updateStatsDisplay();
  updateMoodDisplay();
  petLevelEl.textContent = state.level;
  petXpEl.textContent = state.xp;
  careStreakEl.textContent = state.careStreak;
  logEvent("🌱 SproutPal awakens and looks to you for guidance.");

  actionButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "explore") {
        handleExplore();
      } else {
        applyAction(action);
      }
    });
  });

  envButtons.forEach((btn) => {
    btn.addEventListener("click", () => setEnvironment(btn.dataset.environment));
  });

  renameBtn.addEventListener("click", renamePet);
  nameInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      renamePet();
    }
  });

  setInterval(tick, 1000);
}

init();
