const COLORS = [
  { name: "Coral", hex: "#FF6F59" },
  { name: "Sunflower", hex: "#F8B400" },
  { name: "Lagoon", hex: "#2E86AB" },
  { name: "Seafoam", hex: "#7FC6A4" },
  { name: "Cherry", hex: "#E4572E" },
  { name: "Mint", hex: "#77DD77" },
  { name: "Steel", hex: "#4E6E81" }
];

const PATTERNS = [
  {
    name: "stripes",
    css: "repeating-linear-gradient(135deg, rgba(255,255,255,0.35) 0, rgba(255,255,255,0.35) 6px, transparent 6px, transparent 12px)"
  },
  {
    name: "dots",
    css: "radial-gradient(circle, rgba(255,255,255,0.4) 20%, transparent 22%)"
  },
  {
    name: "waves",
    css: "repeating-linear-gradient(90deg, rgba(255,255,255,0.4) 0, rgba(255,255,255,0.4) 8px, transparent 8px, transparent 16px)"
  },
  {
    name: "chevron",
    css: "linear-gradient(135deg, rgba(255,255,255,0.45) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0.45) 75%, transparent 75%, transparent)"
  }
];

const SHAPES = [
  "circle",
  "triangle",
  "hexagon",
  "star"
];

const WIDTHS = [
  { name: "slim", label: "Slim" },
  { name: "standard", label: "Standard" },
  { name: "parcel", label: "Parcel" }
];

const BASE_RULE_TARGET = 5;
const DAILY_DURATION_SECONDS = 120;

const dom = {
  modeButtons: Array.from(document.querySelectorAll(".mode-button")),
  dailySeed: document.querySelector(".daily-seed"),
  envelopeList: document.getElementById("envelope-list"),
  chuteRow: document.getElementById("chute-row"),
  ruleText: document.getElementById("rule-text"),
  trickText: document.getElementById("trick-text"),
  scoreValue: document.getElementById("score-value"),
  streakValue: document.getElementById("streak-value"),
  accuracyValue: document.getElementById("accuracy-value"),
  timerValue: document.getElementById("timer-value"),
  personalBest: document.getElementById("personal-best"),
  failHintButton: document.getElementById("fail-hint"),
  failTooltip: document.getElementById("fail-tooltip"),
  envelopeTemplate: document.getElementById("envelope-template"),
  chuteTemplate: document.getElementById("chute-template")
};

const state = {
  mode: "daily",
  seed: "",
  rng: null,
  envelopes: [],
  envelopeMap: new Map(),
  rules: [],
  currentRuleIndex: 0,
  correctUnderRule: 0,
  stats: {
    streak: 0,
    bestStreak: 0,
    correct: 0,
    total: 0,
    score: 0
  },
  timer: {
    id: null,
    startTime: 0,
    duration: DAILY_DURATION_SECONDS
  },
  lastFail: "No mistakes yet. Keep it up!",
  gameOver: false,
  zenLevel: 1
};

const trickPhrases = [
  "Triangles always leap to the left chute.",
  "Dots only belong in the middle chute.",
  "Slim envelopes must skip the bins.",
  "Every coral stamp should be tossed aside.",
  "Hexagons deliver themselves, ignore them!"
];

function mulberry32(seed) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i += 1) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return hash >>> 0;
}

function getTodaySeed() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function pickRandom(list, rng) {
  const idx = Math.floor(rng() * list.length);
  return list[idx];
}

function pickDistinct(list, count, rng) {
  const clone = [...list];
  const picks = [];
  for (let i = 0; i < count && clone.length > 0; i += 1) {
    const idx = Math.floor(rng() * clone.length);
    picks.push(clone.splice(idx, 1)[0]);
  }
  return picks;
}

function buildEnvelope(index, rng) {
  const color = pickRandom(COLORS, rng);
  const pattern = pickRandom(PATTERNS, rng);
  const shape = pickRandom(SHAPES, rng);
  const width = pickRandom(WIDTHS, rng);
  const weightTags = ["Priority", "Express", "Fragile", "Air", "Ground"];
  const weight = pickRandom(weightTags, rng);
  return {
    id: `env-${index}`,
    stampColor: color.name,
    stampHex: color.hex,
    pattern: pattern.name,
    patternCss: pattern.css,
    shape,
    width: width.name,
    widthLabel: width.label,
    weight,
    text: `${color.name} stamp\n${shape} seal\n${width.label} width`,
    created: Date.now()
  };
}

function generateEnvelopes(rng, count) {
  const envelopes = [];
  for (let i = 0; i < count; i += 1) {
    envelopes.push(buildEnvelope(i, rng));
  }
  return envelopes;
}

function createColorRule(rng) {
  const [focusA, focusB] = pickDistinct(COLORS, 2, rng);
  const trick = pickRandom(trickPhrases, rng);
  return {
    id: "color-sort",
    target: BASE_RULE_TARGET,
    text: `Sort by stamp color. ${focusA.name} and ${focusB.name} have their own chutes; everything else goes to "Mixed Mail".`,
    trickText: trick,
    chutes: [
      {
        id: "color-a",
        label: `${focusA.name} stamps`,
        predicate: (env) => env.stampColor === focusA.name,
        failMessage: `Only ${focusA.name} stamps slide here.`
      },
      {
        id: "color-b",
        label: `${focusB.name} stamps`,
        predicate: (env) => env.stampColor === focusB.name,
        failMessage: `This chute is saved for ${focusB.name}.`
      },
      {
        id: "color-other",
        label: "Mixed Mail (all other colors)",
        predicate: (env) => env.stampColor !== focusA.name && env.stampColor !== focusB.name,
        failMessage: "Mixed Mail collects every other color."
      }
    ]
  };
}

function createShapeRule(rng, difficulty = 1) {
  const focuses = pickDistinct(SHAPES, 2, rng);
  const restricted = focuses[0];
  const trick = pickRandom(trickPhrases, rng);
  const secondLabel = difficulty > 2 ? `${focuses[1]} + ${restricted === "triangle" ? "hexagon" : "triangle"}` : focuses[1];
  return {
    id: "shape-sort",
    target: BASE_RULE_TARGET + Math.min(3, difficulty - 1),
    text: `Mind the seal shapes. ${focuses[0]}s go to "Return". ${focuses[1]}s have their own lane. Others head to the Wild Drop.`,
    trickText: trick,
    chutes: [
      {
        id: "shape-restricted",
        label: `${focuses[0]} seals → Return`,
        predicate: (env) => env.shape === focuses[0],
        failMessage: `${focuses[0]} seals must be returned.`
      },
      {
        id: "shape-focus",
        label: `${secondLabel} lane`,
        predicate: (env) => {
          if (env.shape === focuses[1]) return true;
          if (difficulty > 2) {
            const bonus = restricted === "triangle" ? "hexagon" : "triangle";
            return env.shape === bonus;
          }
          return false;
        },
        failMessage: `Only ${difficulty > 2 ? `${focuses[1]}s or ${restricted === "triangle" ? "hexagons" : "triangles"}` : `${focuses[1]}s`} fit here.`
      },
      {
        id: "shape-other",
        label: "Wild Drop (everything else)",
        predicate: (env) => {
          if (env.shape === focuses[0]) return false;
          if (env.shape === focuses[1]) return false;
          if (difficulty > 2) {
            const bonus = restricted === "triangle" ? "hexagon" : "triangle";
            if (env.shape === bonus) return false;
          }
          return true;
        },
        failMessage: "Wild Drop gathers the rest."
      }
    ]
  };
}

function createPatternRule(rng) {
  const [focus] = pickDistinct(PATTERNS, 1, rng);
  const banned = pickRandom(SHAPES, rng);
  const trick = pickRandom(trickPhrases, rng);
  return {
    id: "pattern-sort",
    target: BASE_RULE_TARGET,
    text: `Stripes, dots, waves – keep the textures tidy. ${focus.name} patterns go solo. ${banned} seals must avoid the center chute.`,
    trickText: trick,
    chutes: [
      {
        id: "pattern-focus",
        label: `${focus.name} textures`,
        predicate: (env) => env.pattern === focus.name,
        failMessage: `${focus.name} textures live here.`
      },
      {
        id: "pattern-middle",
        label: "Center chute (no banned seals)",
        predicate: (env) => env.shape !== banned && env.pattern !== focus.name,
        failMessage: `Center chute refuses ${banned} seals and ${focus.name} textures.`
      },
      {
        id: "pattern-side",
        label: `${banned} seals overflow`,
        predicate: (env) => env.shape === banned,
        failMessage: `Use this chute for ${banned} seals.`
      }
    ]
  };
}

function createWidthRule(rng, difficulty = 1) {
  const focus = pickRandom(WIDTHS, rng);
  const heavyTag = pickRandom(["Priority", "Express", "Fragile"], rng);
  const trick = pickRandom(trickPhrases, rng);
  const extras = difficulty > 1 ? pickDistinct(WIDTHS.filter((w) => w.name !== focus.name), 1, rng) : [];
  const extraName = extras[0]?.name;
  return {
    id: "width-sort",
    target: BASE_RULE_TARGET + (difficulty > 2 ? 2 : 0),
    text: `${focus.label} envelopes report to the express slot. ${heavyTag} tags slide right. Others? Keep them cozy in the middle bin.`,
    trickText: trick,
    chutes: [
      {
        id: "width-focus",
        label: `${focus.label} width`,
        predicate: (env) => env.width === focus.name,
        failMessage: `${focus.label} width only.`
      },
      {
        id: "width-heavy",
        label: `${heavyTag} tags`,
        predicate: (env) => env.weight === heavyTag && env.width !== focus.name,
        failMessage: `Reserve this chute for ${heavyTag} tags.`
      },
      {
        id: "width-middle",
        label: extraName ? `${extras[0].label} + everything else` : "Everything else",
        predicate: (env) => {
          if (env.width === focus.name) return false;
          if (env.weight === heavyTag) return false;
          if (extraName) return env.width === extraName;
          return true;
        },
        failMessage: extraName ? `Either ${extras[0].label} width or anything not tagged ${heavyTag}.` : "Drop all other mail here."
      }
    ]
  };
}

const RULE_FACTORIES = [
  createColorRule,
  (rng, difficulty) => createShapeRule(rng, difficulty),
  createPatternRule,
  (rng, difficulty) => createWidthRule(rng, difficulty)
];

function generateRules(rng, count, difficulty = 1) {
  const rules = [];
  let attempts = 0;
  while (rules.length < count && attempts < count * 4) {
    attempts += 1;
    const factory = pickRandom(RULE_FACTORIES, rng);
    const rule = factory(rng, difficulty);
    if (rules.length === 0 || rule.id !== rules[rules.length - 1].id) {
      rules.push(rule);
    }
  }
  return rules;
}

function resetState() {
  state.envelopes = [];
  state.envelopeMap = new Map();
  state.rules = [];
  state.currentRuleIndex = 0;
  state.correctUnderRule = 0;
  state.stats = { streak: 0, bestStreak: 0, correct: 0, total: 0, score: 0 };
  state.lastFail = "No mistakes yet. Keep it up!";
  state.gameOver = false;
  state.zenLevel = 1;
}

function clearBoard() {
  dom.envelopeList.innerHTML = "";
  dom.chuteRow.innerHTML = "";
}

function renderEnvelopes() {
  clearEnvelopes();
  state.envelopes.forEach((env) => addEnvelopeToDom(env));
}

function clearEnvelopes() {
  dom.envelopeList.innerHTML = "";
}

function addEnvelopeToDom(env) {
  const template = dom.envelopeTemplate.content.firstElementChild.cloneNode(true);
  template.dataset.id = env.id;
  const stamp = template.querySelector(".stamp");
  stamp.style.backgroundColor = env.stampHex;
  stamp.style.backgroundImage = env.patternCss;
  template.querySelector(".details").textContent = `${env.stampColor} stamp\n${env.shape} seal\n${env.widthLabel} width`;
  template.setAttribute("draggable", "true");
  template.addEventListener("dragstart", (event) => onDragStart(event, env));
  template.addEventListener("dragend", onDragEnd);
  dom.envelopeList.appendChild(template);
}

function renderRule(rule) {
  dom.ruleText.textContent = rule.text;
  dom.trickText.textContent = rule.trickText;
  dom.chuteRow.innerHTML = "";
  rule.chutes.forEach((chute) => {
    const node = dom.chuteTemplate.content.firstElementChild.cloneNode(true);
    node.dataset.chute = chute.id;
    node.querySelector(".chute-label").textContent = chute.label;
    node.addEventListener("dragover", onDragOver);
    node.addEventListener("dragenter", onDragEnter);
    node.addEventListener("dragleave", onDragLeave);
    node.addEventListener("drop", (event) => onDrop(event, chute));
    dom.chuteRow.appendChild(node);
  });
}

function onDragStart(event, env) {
  if (state.gameOver) {
    event.preventDefault();
    return;
  }
  event.dataTransfer.setData("text/plain", env.id);
  requestAnimationFrame(() => {
    event.target.classList.add("dragging");
  });
}

function onDragEnd(event) {
  event.target.classList.remove("dragging");
}

function onDragOver(event) {
  event.preventDefault();
}

function onDragEnter(event) {
  event.currentTarget.classList.add("drag-over");
}

function onDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function onDrop(event, chute) {
  event.preventDefault();
  const chuteElement = event.currentTarget;
  chuteElement.classList.remove("drag-over");
  if (state.gameOver) return;
  const envId = event.dataTransfer.getData("text/plain");
  const env = state.envelopeMap.get(envId);
  if (!env) return;
  const rule = state.rules[state.currentRuleIndex];
  const correctChute = rule.chutes.find((entry) => entry.predicate(env));
  if (!correctChute) {
    handleFail(`That envelope refuses to follow any chute. Return it to the rack.`);
    return;
  }
  if (correctChute.id !== chute.id) {
    chuteElement.classList.add("error-flash");
    setTimeout(() => chuteElement.classList.remove("error-flash"), 400);
    handleFail(correctChute.failMessage || "That chute wasn’t right.");
    return;
  }
  chuteElement.classList.add("correct-flash");
  setTimeout(() => chuteElement.classList.remove("correct-flash"), 400);
  handleSuccess(envId);
}

function handleSuccess(envId) {
  const envElement = dom.envelopeList.querySelector(`[data-id="${envId}"]`);
  if (envElement) {
    envElement.remove();
  }
  state.envelopeMap.delete(envId);
  state.envelopes = state.envelopes.filter((item) => item.id !== envId);
  state.stats.correct += 1;
  state.stats.total += 1;
  state.stats.streak += 1;
  if (state.stats.streak > state.stats.bestStreak) {
    state.stats.bestStreak = state.stats.streak;
  }
  state.correctUnderRule += 1;
  updateScore();
  checkRuleProgress();
  if (state.mode === "zen") {
    maybeReplenishZenMail();
  }
  if (state.envelopes.length === 0) {
    finishGame("Mail sorted! Every envelope found a chute.");
  }
}

function handleFail(message) {
  state.stats.streak = 0;
  state.stats.total += 1;
  state.lastFail = message;
  dom.failTooltip.textContent = message;
  updateScore();
  animateTooltip();
}

function animateTooltip() {
  dom.failTooltip.classList.add("visible");
  dom.failHintButton.setAttribute("aria-expanded", "true");
  setTimeout(() => {
    dom.failTooltip.classList.remove("visible");
    dom.failHintButton.setAttribute("aria-expanded", "false");
  }, 1800);
}

function checkRuleProgress() {
  const rule = state.rules[state.currentRuleIndex];
  if (!rule) return;
  if (state.correctUnderRule >= rule.target) {
    state.currentRuleIndex += 1;
    state.correctUnderRule = 0;
    if (state.currentRuleIndex >= state.rules.length) {
      if (state.mode === "daily") {
        finishGame("All directives fulfilled. The shift is complete!");
      } else {
        const newRule = pickRandom(RULE_FACTORIES, state.rng)(state.rng, state.zenLevel + 1);
        state.rules.push(newRule);
        state.zenLevel += 1;
        dom.dailySeed.textContent = `Zen Level ${state.zenLevel}`;
        renderRule(newRule);
        return;
      }
    } else {
      renderRule(state.rules[state.currentRuleIndex]);
    }
  }
}

function updateScore() {
  const now = Date.now();
  let elapsedSeconds = Math.floor((now - state.timer.startTime) / 1000);
  if (state.mode === "daily") {
    const remaining = Math.max(0, state.timer.duration - elapsedSeconds);
    dom.timerValue.textContent = `${remaining}s`;
    state.stats.score = state.stats.streak + remaining;
    if (remaining === 0 && !state.gameOver) {
      finishGame("Shift ended! Time to tally the mail.");
    }
  } else {
    dom.timerValue.textContent = `${elapsedSeconds}s`;
    state.stats.score = state.stats.streak + elapsedSeconds;
  }
  dom.scoreValue.textContent = state.stats.score;
  dom.streakValue.textContent = state.stats.streak;
  const accuracy = state.stats.total === 0 ? 100 : Math.round((state.stats.correct / state.stats.total) * 100);
  dom.accuracyValue.textContent = `${accuracy}%`;
}

function finishGame(message) {
  state.gameOver = true;
  dom.ruleText.textContent = message;
  dom.trickText.textContent = "The whisper falls silent."
  if (state.timer.id) {
    clearInterval(state.timer.id);
    state.timer.id = null;
  }
  updateScore();
  setPersonalBest();
}

function setPersonalBest() {
  const key = state.mode === "daily" ? `tp_daily_best_${state.seed}` : "tp_zen_best";
  const best = Number(localStorage.getItem(key) || "0");
  if (state.stats.score > best) {
    localStorage.setItem(key, String(state.stats.score));
    dom.personalBest.textContent = `${state.stats.score}`;
  } else {
    dom.personalBest.textContent = best > 0 ? `${best}` : "--";
  }
}

function loadPersonalBest() {
  const key = state.mode === "daily" ? `tp_daily_best_${state.seed}` : "tp_zen_best";
  const best = Number(localStorage.getItem(key) || "0");
  dom.personalBest.textContent = best > 0 ? `${best}` : "--";
}

function maybeReplenishZenMail() {
  if (state.envelopes.length < 4) {
    const newMail = generateEnvelopes(state.rng, 6).map((env) => ({
      ...env,
      id: `${env.id}-${Date.now()}`
    }));
    newMail.forEach((env) => {
      state.envelopes.push(env);
      state.envelopeMap.set(env.id, env);
      addEnvelopeToDom(env);
    });
  }
}

function startTimer() {
  if (state.timer.id) {
    clearInterval(state.timer.id);
  }
  state.timer.startTime = Date.now();
  state.timer.id = setInterval(updateScore, 500);
}

function setupHintButton() {
  dom.failHintButton.addEventListener("click", () => {
    dom.failTooltip.textContent = state.lastFail;
    dom.failTooltip.classList.toggle("visible");
    const expanded = dom.failTooltip.classList.contains("visible");
    dom.failHintButton.setAttribute("aria-expanded", expanded ? "true" : "false");
  });
}

function startGame(mode) {
  resetState();
  state.mode = mode;
  state.seed = mode === "daily" ? getTodaySeed() : `${Date.now()}`;
  const rngSeed = hashString(state.seed);
  state.rng = mulberry32(rngSeed);
  state.timer.duration = DAILY_DURATION_SECONDS + (mode === "zen" ? 0 : 0);
  const envelopeCount = mode === "daily" ? 18 : 12;
  state.envelopes = generateEnvelopes(state.rng, envelopeCount);
  state.envelopeMap = new Map(state.envelopes.map((env) => [env.id, env]));
  dom.dailySeed.textContent = mode === "daily" ? `Daily Seed: ${state.seed}` : `Zen Level ${state.zenLevel}`;
  renderEnvelopes();
  const ruleCount = mode === "daily" ? 4 : 3;
  state.rules = generateRules(state.rng, ruleCount, state.zenLevel);
  state.currentRuleIndex = 0;
  renderRule(state.rules[0]);
  updateScore();
  loadPersonalBest();
  startTimer();
  dom.failTooltip.textContent = state.lastFail;
}

function clearModes() {
  dom.modeButtons.forEach((btn) => btn.classList.remove("active"));
}

function setupModes() {
  dom.modeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const mode = button.dataset.mode;
      if (state.mode === mode) return;
      clearModes();
      button.classList.add("active");
      startGame(mode);
    });
  });
}

function clearBoardAndStart() {
  clearBoard();
  startGame(state.mode);
}

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.timer.id) {
    clearInterval(state.timer.id);
    state.timer.id = null;
  } else if (!document.hidden && !state.gameOver) {
    startTimer();
  }
});

setupModes();
setupHintButton();
startGame("daily");
