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
  ritualCooldowns: {
    sunsoak: 0,
    storytime: 0,
    breezestretch: 0
  },
  quests: [],
  lastTick: Date.now()
};

const statKeys = ["hunger", "joy", "energy", "hygiene"];
const baseDegradeRates = {
  hunger: 2.2,
  joy: 1.9,
  energy: 2.0,
  hygiene: 1.6
};

const environments = {
  grove: {
    label: "Grove Glow",
    description: "Grove Glow keeps nutrition and freshness steady beneath a gentle canopy.",
    modifiers: { hunger: 0.8, joy: 1, energy: 1, hygiene: 0.85 },
    actionBoosts: {
      feed: { joy: 2 },
      clean: { hygiene: 3 }
    }
  },
  coast: {
    label: "Coast Breeze",
    description: "Coast Breeze ushers in playful gusts — energy restores faster while joy needs tending.",
    modifiers: { hunger: 1, joy: 1.1, energy: 0.85, hygiene: 1 },
    actionBoosts: {
      play: { joy: 3 },
      rest: { energy: 4 }
    }
  },
  mesa: {
    label: "Mesa Bloom",
    description: "Mesa Bloom basks in sunbursts — joy soars, but nutrition wanes a touch quicker.",
    modifiers: { hunger: 1.15, joy: 0.9, energy: 1, hygiene: 1 },
    actionBoosts: {
      feed: { hunger: 4 },
      explore: { hygiene: 4 }
    }
  }
};

const rituals = {
  sunsoak: {
    cooldown: 45000,
    delay: 1100,
    effects: { energy: 14, joy: 8, hunger: -4 },
    xp: 22,
    inProgress: "Channeling sunlight...",
    message: () => `${state.name} bathes in gentle light and hums with warmth.`
  },
  storytime: {
    cooldown: 52000,
    delay: 1200,
    effects: { joy: 16, energy: 6 },
    xp: 24,
    inProgress: "Gathering echoes...",
    message: () => `${state.name} leans close for a story and settles into calm focus.`
  },
  breezestretch: {
    cooldown: 48000,
    delay: 1000,
    effects: { hygiene: 18, energy: 8 },
    xp: 20,
    inProgress: "Tuning the breeze...",
    message: () => `${state.name} sways with the breeze, leaves polished and lively.`
  }
};

const questBlueprints = [
  {
    id: "feast",
    title: "Citrus Steward",
    description: "Serve citrus feasts 3 times to fill nutrition stores.",
    target: { type: "action", key: "feed" },
    required: 3,
    xp: 18
  },
  {
    id: "playmaker",
    title: "Ribbon Reveler",
    description: "Spark ribbon chases twice to keep joy swirling.",
    target: { type: "action", key: "play" },
    required: 2,
    xp: 20
  },
  {
    id: "cleanse",
    title: "Grove Polisher",
    description: "Freshen Sprout two times so every leaf gleams.",
    target: { type: "action", key: "clean" },
    required: 2,
    xp: 18
  },
  {
    id: "dreamer",
    title: "Lullaby Keeper",
    description: "Guide Sprout into two restful naps for deep renewal.",
    target: { type: "action", key: "rest" },
    required: 2,
    xp: 16
  },
  {
    id: "voyager",
    title: "Trailblazer",
    description: "Send Sprout on forage voyages twice this cycle.",
    target: { type: "action", key: "explore" },
    required: 2,
    xp: 24
  },
  {
    id: "ritualist",
    title: "Ritual Maestro",
    description: "Complete any two rituals to keep sanctuary rhythms strong.",
    target: { type: "ritual", key: "any" },
    required: 2,
    xp: 22
  }
];

const milestones = [2, 4, 6, 8];

const milestoneDescriptions = {
  2: "Sprout begins documenting feelings in the journal.",
  4: "Daily rituals recharge 5s faster.",
  6: "Forage voyages return with +5 bonus xp.",
  8: "Care streak celebrations grant extra xp."
};

const journalEntries = [
  {
    level: 2,
    title: "Awakening",
    text: "I blinked into the canopy today and felt your steady presence nearby."
  },
  {
    level: 3,
    title: "Ribbon Laughter",
    text: "The ribbon chase painted giggles in the air — thank you for spinning alongside me."
  },
  {
    level: 5,
    title: "Coastline Echo",
    text: "Sea breezes taught me to sway with change; I hope you felt the calm too."
  },
  {
    level: 7,
    title: "Mesa Promise",
    text: "Sunset embers warmed my leaves — together we'll glow through every season."
  }
];

const defaultModifiers = { hunger: 1, joy: 1, energy: 1, hygiene: 1 };
const ritualTimers = {};

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
const environmentInsightEl = document.getElementById("environment-insight");
const harmonyMeterEl = document.getElementById("harmony-meter");
const harmonyFillEl = document.getElementById("harmony-fill");
const harmonyPointerEl = document.getElementById("harmony-pointer");
const harmonyTipEl = document.getElementById("harmony-tip");

const ritualStatusEls = {
  sunsoak: document.getElementById("ritual-sunsoak-status"),
  storytime: document.getElementById("ritual-storytime-status"),
  breezestretch: document.getElementById("ritual-breezestretch-status")
};

const nameInput = document.getElementById("name-input");
const renameBtn = document.getElementById("rename-btn");

const envButtons = Array.from(document.querySelectorAll(".env-option"));
const actionButtons = Array.from(document.querySelectorAll(".care-btn"));
const ritualButtons = Array.from(document.querySelectorAll(".ritual-btn"));
const questListEl = document.getElementById("quest-list");
const questSummaryEl = document.getElementById("quest-summary");

const milestoneProgressFill = document.getElementById("milestone-progress-fill");
const milestoneProgressValue = document.getElementById("milestone-progress-value");
const nextMilestoneEl = document.getElementById("next-milestone");
const milestoneListEl = document.getElementById("milestone-list");
const journalEntriesEl = document.getElementById("journal-entries");

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

function adjustStats(deltas, boosts = {}) {
  statKeys.forEach((key) => {
    const baseChange = typeof deltas[key] === "number" ? deltas[key] : 0;
    const boostChange = typeof boosts[key] === "number" ? boosts[key] : 0;
    const total = baseChange + boostChange;
    if (total !== 0) {
      state[key] = clampStat(state[key] + total);
    }
  });
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
  updateHarmonyMeter();
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
  updateMilestones();
  updateJournal();
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

function updateMilestones() {
  if (!milestoneProgressFill || !milestoneProgressValue || !nextMilestoneEl || !milestoneListEl) {
    return;
  }
  const xpGoal = xpNeededForLevel(state.level);
  const progressPercent = xpGoal > 0 ? Math.min(100, Math.round((state.xp / xpGoal) * 100)) : 0;
  milestoneProgressFill.style.width = `${progressPercent}%`;
  milestoneProgressValue.textContent = `${Math.round(state.xp)} / ${xpGoal} xp`;

  const upcoming = milestones.find((level) => level > state.level);
  if (upcoming) {
    nextMilestoneEl.textContent = `Next milestone: Level ${upcoming}`;
  } else {
    nextMilestoneEl.textContent = `Next milestone: Level ${state.level + 1}`;
  }

  milestoneListEl.innerHTML = "";
  milestones.forEach((level) => {
    const li = document.createElement("li");
    const achieved = state.level >= level;
    const description = milestoneDescriptions[level];
    li.className = achieved ? "milestone achieved" : "milestone";
    const badgeClass = achieved ? "milestone-badge achieved" : "milestone-badge";
    li.innerHTML = `<span class="${badgeClass}">${achieved ? "✔" : level}</span><div><h5>Level ${level}</h5><p>${description}</p></div>`;
    milestoneListEl.appendChild(li);
  });
}

function updateJournal() {
  if (!journalEntriesEl) return;
  journalEntriesEl.innerHTML = "";
  const unlocked = journalEntries.filter((entry) => state.level >= entry.level);
  if (unlocked.length === 0) {
    const li = document.createElement("li");
    li.textContent = "Keep caring to record Sprout's reflections.";
    journalEntriesEl.appendChild(li);
    return;
  }
  unlocked.forEach((entry) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${entry.title}</strong><span>${entry.text}</span>`;
    journalEntriesEl.appendChild(li);
  });
}

function updateEnvironmentInsight() {
  if (!environmentInsightEl) return;
  const env = environments[state.environment];
  if (env) {
    environmentInsightEl.textContent = env.description;
  }
}

function pickInitialQuests(count = 3) {
  const pool = [...questBlueprints];
  const quests = [];
  for (let i = 0; i < count && pool.length > 0; i += 1) {
    const index = Math.floor(Math.random() * pool.length);
    const blueprint = pool.splice(index, 1)[0];
    quests.push(createQuestInstance(blueprint));
  }
  if (quests.length < count) {
    while (quests.length < count) {
      quests.push(createQuestInstance(questBlueprints[quests.length % questBlueprints.length]));
    }
  }
  return quests;
}

function createQuestInstance(blueprint) {
  return {
    blueprintId: blueprint.id,
    title: blueprint.title,
    description: blueprint.description,
    target: blueprint.target,
    required: blueprint.required,
    xp: blueprint.xp,
    progress: 0,
    completed: false
  };
}

function chooseQuestBlueprint(excludeId) {
  const options = questBlueprints.filter((blueprint) => blueprint.id !== excludeId);
  if (options.length === 0) {
    return questBlueprints.find((blueprint) => blueprint.id === excludeId) || questBlueprints[0];
  }
  const index = Math.floor(Math.random() * options.length);
  return options[index];
}

function renderQuests() {
  if (!questListEl) return;
  questListEl.innerHTML = "";
  let readyCount = 0;
  state.quests.forEach((quest, index) => {
    if (quest.completed) {
      readyCount += 1;
    }
    const li = document.createElement("li");
    li.className = quest.completed ? "quest-item completed" : "quest-item";
    const percent = Math.min(100, Math.round((quest.progress / quest.required) * 100));
    const status = quest.completed ? "Reward ready" : `${quest.progress} / ${quest.required} steps`;
    li.innerHTML = `
      <div class="quest-header">
        <h4>${quest.title}</h4>
        <span class="quest-xp">+${quest.xp} xp</span>
      </div>
      <p class="quest-description">${quest.description}</p>
      <div class="quest-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}">
        <div class="quest-progress-fill" style="width: ${percent}%;"></div>
      </div>
      <div class="quest-status">${status}</div>
      <button class="quest-claim-btn" ${quest.completed ? "" : "disabled"} data-quest-index="${index}">
        ${quest.completed ? "Claim Reward" : "In progress"}
      </button>
    `;
    questListEl.appendChild(li);
  });
  if (questSummaryEl) {
    questSummaryEl.textContent =
      readyCount > 0 ? `${readyCount} quest${readyCount > 1 ? "s" : ""} ready` : "No quests ready yet";
  }
}

function claimQuestReward(index) {
  const quest = state.quests[index];
  if (!quest || !quest.completed) return;
  grantXp(quest.xp);
  logEvent(`🏅 Quest complete: ${quest.title}!`);
  const newBlueprint = chooseQuestBlueprint(quest.blueprintId);
  Object.assign(quest, createQuestInstance(newBlueprint));
  logEvent(`🧭 New quest unlocked: ${quest.title}.`);
  renderQuests();
}

function recordQuestProgress(type, key) {
  let updated = false;
  state.quests.forEach((quest) => {
    if (quest.completed) return;
    const matchesType = quest.target.type === type;
    const matchesKey = quest.target.key === "any" || quest.target.key === key;
    if (matchesType && matchesKey) {
      quest.progress = Math.min(quest.required, quest.progress + 1);
      updated = true;
      if (quest.progress >= quest.required && !quest.completed) {
        quest.completed = true;
        logEvent(`🏆 Quest ready: ${quest.title}!`);
      }
    }
  });
  if (updated) {
    renderQuests();
  }
}

function describeHarmonyTip(average) {
  if (average >= 80) {
    return "Harmony is soaring — chain rituals to cash in on streak bonuses.";
  }
  if (average >= 60) {
    return "Balanced and bright. A quick ritual could push Sprout to radiant.";
  }
  if (average >= 40) {
    return "Mood is wobbling — rotate care actions to stabilize the vibe.";
  }
  return "Critical low! Stack nourishing actions to rescue Sprout.";
}

function updateHarmonyMeter() {
  if (!harmonyMeterEl || !harmonyFillEl || !harmonyPointerEl || !harmonyTipEl) return;
  const average = statKeys.reduce((sum, key) => sum + state[key], 0) / statKeys.length;
  const percent = Math.max(0, Math.min(100, Math.round(average)));
  const pointerPercent = Math.max(2, Math.min(98, percent));
  harmonyFillEl.style.width = `${percent}%`;
  harmonyPointerEl.style.left = `calc(${pointerPercent}% - 10px)`;
  harmonyMeterEl.setAttribute("aria-valuenow", percent.toString());
  harmonyTipEl.textContent = describeHarmonyTip(average);
}

function getRitualCooldown(key) {
  const ritual = rituals[key];
  if (!ritual) return 0;
  let cooldown = ritual.cooldown;
  if (state.level >= 4) {
    cooldown = Math.max(20000, cooldown - 5000);
  }
  return cooldown;
}

function disableRitualButton(key, disabled) {
  const btn = ritualButtons.find((button) => button.dataset.ritual === key);
  if (btn) {
    btn.disabled = disabled;
  }
}

function startRitualCountdown(key) {
  const statusEl = ritualStatusEls[key];
  if (!statusEl) return;
  if (ritualTimers[key]) {
    clearInterval(ritualTimers[key]);
  }
  ritualTimers[key] = setInterval(() => {
    const remaining = state.ritualCooldowns[key] - Date.now();
    if (remaining <= 0) {
      clearInterval(ritualTimers[key]);
      ritualTimers[key] = null;
      statusEl.textContent = "Ready";
      disableRitualButton(key, false);
    } else {
      statusEl.textContent = `${Math.ceil(remaining / 1000)}s to reset`;
    }
  }, 500);
}

function applyAction(actionKey) {
  const action = actionEffects[actionKey];
  if (!action) return;

  const envBoost = environments[state.environment]?.actionBoosts?.[actionKey] || {};
  adjustStats(action, envBoost);

  grantXp(action.xp);
  updateCareStreak();
  updateStatsDisplay();
  updateMoodDisplay();
  logEvent(action.message());
  recordQuestProgress("action", actionKey);
  checkCriticalStates();
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
    const envBoost = environments[state.environment]?.actionBoosts?.explore || {};
    adjustStats(find, envBoost);
    const bonusXp = state.level >= 6 ? 5 : 0;
    const totalXp = find.xp + bonusXp;
    grantXp(totalXp);
    updateCareStreak();
    updateStatsDisplay();
    updateMoodDisplay();
    let message = find.message();
    if (bonusXp > 0) {
      message += " Seasoned explorer bonus!";
    }
    logEvent(`🧭 ${message}`);
    recordQuestProgress("action", "explore");
    checkCriticalStates();
    countdownExplore();
  }, 2800);
}

function handleRitual(key) {
  const ritual = rituals[key];
  if (!ritual) return;
  const now = Date.now();
  if (now < state.ritualCooldowns[key]) {
    return;
  }

  const statusEl = ritualStatusEls[key];
  if (statusEl) {
    statusEl.textContent = ritual.inProgress;
  }
  disableRitualButton(key, true);

  const cooldown = getRitualCooldown(key);
  state.ritualCooldowns[key] = now + cooldown;

  setTimeout(() => {
    adjustStats(ritual.effects);
    grantXp(ritual.xp);
    updateCareStreak();
    updateStatsDisplay();
    updateMoodDisplay();
    logEvent(`🌀 ${ritual.message()}`);
    recordQuestProgress("ritual", key);
    checkCriticalStates();
    startRitualCountdown(key);
  }, ritual.delay);
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

  const modifiers = environments[state.environment]?.modifiers || defaultModifiers;
  statKeys.forEach((key) => {
    const modifier = typeof modifiers[key] === "number" ? modifiers[key] : 1;
    state[key] = clampStat(state[key] - baseDegradeRates[key] * modifier);
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
      const bonusXp = state.level >= 8 ? 18 : 12;
      logEvent(`🌱 Care streak bonus! ${state.name} blossoms with gratitude.`);
      grantXp(bonusXp);
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
  const label = environments[newEnv]?.label || newEnv;
  logEvent(`🌤️ Habitat tuned to ${label} vibes.`);
  updateEnvironmentInsight();
}

function init() {
  sanctuaryApp.dataset.environment = state.environment;
  updateEnvironmentInsight();
  updateStatsDisplay();
  updateMoodDisplay();
  if (state.quests.length === 0) {
    state.quests = pickInitialQuests();
  }
  renderQuests();
  petLevelEl.textContent = state.level;
  petXpEl.textContent = Math.round(state.xp);
  careStreakEl.textContent = state.careStreak;
  updateMilestones();
  updateJournal();
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

  ritualButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const ritualKey = btn.dataset.ritual;
      handleRitual(ritualKey);
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

  if (questListEl) {
    questListEl.addEventListener("click", (event) => {
      const button = event.target.closest(".quest-claim-btn");
      if (!button || button.disabled) return;
      const index = Number.parseInt(button.dataset.questIndex, 10);
      if (!Number.isNaN(index)) {
        claimQuestReward(index);
      }
    });
  }

  Object.keys(state.ritualCooldowns).forEach((key) => {
    if (state.ritualCooldowns[key] > Date.now()) {
      disableRitualButton(key, true);
      startRitualCountdown(key);
    } else {
      disableRitualButton(key, false);
      if (ritualStatusEls[key]) {
        ritualStatusEls[key].textContent = "Ready";
      }
    }
  });

  setInterval(() => {
    tick();
  }, 1000);
}

init();
