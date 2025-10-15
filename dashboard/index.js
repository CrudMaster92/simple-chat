const grid = document.querySelector('[data-role="applet-grid"]');
const status = document.querySelector('[data-role="status"]');
const startMenu = document.querySelector('[data-role="start-menu"]');
const startButton = document.querySelector('[data-role="start-button"]');
const startClose = document.querySelector('[data-role="close-start"]');
const startSearch = document.querySelector('[data-role="start-search"]');
const taskbarSearch = document.querySelector('[data-role="taskbar-search"]');
const categoryList = document.querySelector('[data-role="category-list"]');
const menuList = document.querySelector('[data-role="menu-list"]');
const pinnedList = document.querySelector('[data-role="pinned-list"]');
const pinnedSection = document.querySelector('[data-role="pinned-section"]');
const emptyState = document.querySelector('[data-role="start-empty"]');
const shortcutContainer = document.querySelector('[data-role="shortcut-container"]');
const allAppsPanel = document.querySelector('[data-role="all-apps"]');
const openAllAppsButton = document.querySelector('[data-role="open-all-apps"]');
const closeAllAppsButton = document.querySelector('[data-role="close-all-apps"]');
const clockDisplay = document.querySelector('[data-role="taskbar-clock"]');
const taskbarSearchWrapper = document.querySelector('[data-role="taskbar-search-wrapper"]');
const settingsToggle = document.querySelector('[data-role="settings-toggle"]');
const settingsPanel = document.querySelector('[data-role="settings-panel"]');
const settingsClose = document.querySelector('[data-role="close-settings"]');
const wallpaperList = document.querySelector('[data-role="wallpaper-list"]');
const wallpaperStatus = document.querySelector('[data-role="wallpaper-status"]');
const wallpaperUpload = document.querySelector('[data-role="wallpaper-upload"]');
const wallpaperClear = document.querySelector('[data-role="wallpaper-clear"]');
const buddyContainer = document.querySelector('[data-role="desktop-buddy"]');
const buddyAvatar = document.querySelector('[data-role="buddy-avatar"]');
const buddyMessageBubble = document.querySelector('[data-role="buddy-message"]');
const buddyPanel = document.querySelector('[data-role="buddy-panel"]');
const buddyLog = document.querySelector('[data-role="buddy-log"]');
const buddyStatus = document.querySelector('[data-role="buddy-status"]');
const buddyModelSelect = document.querySelector('[data-role="buddy-model-select"]');
const buddyModelStatusElements = document.querySelectorAll('[data-role="buddy-model-status"]');
const buddyRefreshButton = document.querySelector('[data-role="buddy-refresh-models"]');
const buddyKeyInput = document.querySelector('[data-role="buddy-key"]');
const buddyRememberKey = document.querySelector('[data-role="buddy-remember-key"]');
const buddyForm = document.querySelector('[data-role="buddy-form"]');
const buddyInput = document.querySelector('[data-role="buddy-input"]');
const buddySendButton = document.querySelector('[data-role="buddy-send"]');
const buddyCloseButton = document.querySelector('[data-role="buddy-close"]');
const buddyOpenSettingsButton = document.querySelector('[data-role="buddy-open-settings"]');
const buddyEnabledToggle = document.querySelector('[data-role="buddy-enabled"]');
const buddyIdleToggle = document.querySelector('[data-role="buddy-idle-toggle"]');
const buddySoundToggle = document.querySelector('[data-role="buddy-sound-toggle"]');
const buddyResetPositionButton = document.querySelector('[data-role="buddy-reset-position"]');
const buddySkinList = document.querySelector('[data-role="buddy-skins"]');
const osShell = document.querySelector('[data-role="os-shell"]');
const osWindow = document.querySelector('[data-role="os-window"]');
const osTitle = document.querySelector('[data-role="os-title"]');
const osIconSlot = document.querySelector('[data-role="os-icon"]');
const osFrame = document.querySelector('[data-role="os-frame"]');
const osMinimizeButton = document.querySelector('[data-action="minimize"]');
const osCloseButton = document.querySelector('[data-action="close"]');
const taskbarSessions = document.querySelector('[data-role="taskbar-sessions"]');
const taskbar = document.querySelector('[data-role="taskbar"]');
const osResizeButton = document.querySelector('[data-action="resize"]');
const bootScreen = document.querySelector('[data-role="boot-screen"]');
const bootRing = bootScreen?.querySelector('[data-role="boot-ring"]');
const bootTitle = bootScreen?.querySelector('[data-role="boot-title"]');
const bootHint = bootScreen?.querySelector('[data-role="boot-hint"]');
const bootBloom = bootScreen?.querySelector('[data-role="boot-bloom"]');
const bootPop = bootScreen?.querySelector('[data-role="boot-pop"]');
const restartButton = document.querySelector('[data-role="restart-desktop"]');

const shortcutButtonMap = new Map();
const deleteRevealTimers = new WeakMap();
let draggedShortcutSlug = null;
const DELETE_REVEAL_DELAY = 1200;

const CLOCK_APPLET_SLUG = 'maestro-clock-pavilion';
const CLOCK_APPLET_FALLBACK_NAME = 'Maestro Clock Pavilion';
let pendingClockLaunch = false;

let audioContext = null;
let audioMasterGain = null;
const audioThrottleMarks = new Map();

const SOUND_THEMES = {
  menuOpen: [
    { frequency: 520, duration: 0.12, volume: 0.35 },
    { frequency: 740, duration: 0.1, volume: 0.25, gap: 0.04 },
  ],
  menuClose: [
    { frequency: 420, duration: 0.08, volume: 0.3 },
    { frequency: 280, duration: 0.14, volume: 0.22 },
  ],
  appLaunch: [
    { frequency: 660, duration: 0.1, volume: 0.35 },
    { frequency: 880, duration: 0.12, volume: 0.28, gap: 0.05 },
  ],
  appClose: [
    { frequency: 360, duration: 0.14, volume: 0.32 },
    { frequency: 240, duration: 0.12, volume: 0.24 },
  ],
  appMinimize: [
    { frequency: 520, duration: 0.08, volume: 0.26 },
  ],
  appRestore: [
    { frequency: 640, duration: 0.08, volume: 0.26 },
    { frequency: 780, duration: 0.09, volume: 0.22, gap: 0.03 },
  ],
  search: [
    { frequency: 720, duration: 0.06, volume: 0.18 },
  ],
  settingsToggleOn: [
    { frequency: 540, duration: 0.1, volume: 0.24 },
  ],
  settingsToggleOff: [
    { frequency: 340, duration: 0.1, volume: 0.22 },
  ],
  buddyWake: [
    { frequency: 620, duration: 0.12, volume: 0.32 },
    { frequency: 820, duration: 0.1, volume: 0.25, gap: 0.05 },
    { frequency: 540, duration: 0.14, volume: 0.18 },
  ],
  buddySend: [
    { frequency: 560, duration: 0.08, volume: 0.26 },
    { frequency: 720, duration: 0.08, volume: 0.22, gap: 0.03 },
  ],
  buddyReply: [
    { frequency: 420, duration: 0.1, volume: 0.28 },
    { frequency: 640, duration: 0.12, volume: 0.24, gap: 0.04 },
  ],
  buddyChirp: [
    { frequency: 900, duration: 0.06, volume: 0.22 },
    { frequency: 690, duration: 0.08, volume: 0.2, gap: 0.04 },
  ],
  buddyMove: [
    { frequency: 360, duration: 0.12, volume: 0.26 },
  ],
};

const BUDDY_NAME = 'Cirrus';
const BUDDY_SETTINGS_KEY = 'desktop-buddy-settings';
const BUDDY_MODEL_CACHE_KEY = 'desktop-buddy-model-cache';
const BUDDY_KEY_STORAGE_KEY = 'desktop-buddy-openai-key';
const BUDDY_IDLE_INTERVAL = 120_000;
const BUDDY_SYSTEM_PROMPT =
  "You are Cirrus, a buoyant desktop companion for the Slop OS dashboard. Keep replies friendly, concise, and action-oriented. Mention applet names exactly as provided and suggest which applet can help when giving advice. Encourage curiosity, offer gentle productivity nudges, and never invent unavailable applets.";

const BUDDY_IDLE_MESSAGES = [
  'Need a tour? Ask me about any applet.',
  'Drop in an OpenAI key and I can chat through anything.',
  'Wondering what to try? Say “list applets” and I will guide you.',
  'You can drag me anywhere if I am in the way.',
  'Ask for a creative spark and I will point to the right applet.',
  'Curious about the dashboard? I have tips ready whenever you are.',
];

const BUDDY_SKINS = [
  {
    id: 'lagoon-drift',
    name: 'Lagoon Drift',
    tagline: 'Seafoam teal with tidal shimmer.',
    swatch: 'linear-gradient(135deg, #53ddcf, #1a9ba0)',
  },
  {
    id: 'sunrise-sorbet',
    name: 'Sunrise Sorbet',
    tagline: 'Peach sherbet glow with citrus shine.',
    swatch: 'linear-gradient(135deg, #ffb677, #ff6f4f)',
  },
  {
    id: 'cloudline-mist',
    name: 'Cloudline Mist',
    tagline: 'Airy blues lifted by bright sky light.',
    swatch: 'linear-gradient(135deg, #9cccf7, #2f7dde)',
  },
  {
    id: 'citrus-grove',
    name: 'Citrus Grove',
    tagline: 'Zesty greens with sunlit highlights.',
    swatch: 'linear-gradient(135deg, #b7f267, #4aa72f)',
  },
  {
    id: 'ember-dawn',
    name: 'Ember Dawn',
    tagline: 'Warm ember oranges with a cozy glow.',
    swatch: 'linear-gradient(135deg, #ff8660, #c9452e)',
  },
];

const BUDDY_SKIN_IDS = new Set(BUDDY_SKINS.map((skin) => skin.id));

const buddyState = {
  enabled: true,
  idleMessages: true,
  playSounds: true,
  skin: BUDDY_SKINS[0]?.id || 'lagoon-drift',
  rememberKey: false,
  statusMessage: 'Say hello!',
  modelStatus: 'Add an API key to fetch models.',
  conversation: [],
  models: null,
  selectedModel: null,
  isPanelOpen: false,
  awaitingResponse: false,
  idleTimer: null,
  messageTimer: null,
  lastIdleMessage: null,
  position: { left: null, top: null },
  appletDigest: '',
  appletPreviewList: [],
  openAiKey: '',
  hasInitialized: false,
};

const buddyDragState = {
  pointerId: null,
  startX: 0,
  startY: 0,
  originLeft: 0,
  originTop: 0,
  moved: false,
  justDragged: false,
};

const BOOT_CONFIG = { radius: 84, cubeSize: 28, gap: 6 };
const BOOT_ANGLES = Array.from({ length: 8 }, (_, index) => index * 45);
const BOOT_GRID = (() => {
  const offset = (BOOT_CONFIG.cubeSize + BOOT_CONFIG.gap) / 2;
  return [
    { x: -offset, y: -offset },
    { x: offset, y: -offset },
    { x: -offset, y: offset },
    { x: offset, y: offset },
  ];
})();

const reduceMotionQuery =
  typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

const bootState = {
  stage: 0,
  timers: [],
  isPlaying: false,
  hasPlayed: false,
  reduceMotion: reduceMotionQuery?.matches ?? false,
};

let bootCubes = [];

if (bootRing) {
  const fragment = document.createDocumentFragment();
  BOOT_ANGLES.forEach((_, index) => {
    const cube = document.createElement('div');
    cube.className = 'boot-cube';
    cube.setAttribute('data-role', 'boot-cube');
    cube.dataset.index = String(index);
    cube.style.width = `${BOOT_CONFIG.cubeSize}px`;
    cube.style.height = `${BOOT_CONFIG.cubeSize}px`;

    const inner = document.createElement('div');
    inner.className = `boot-cube__inner ${index < 4 ? 'boot-cube__inner--primary' : 'boot-cube__inner--secondary'}`;
    const bevel = document.createElement('div');
    bevel.className = 'boot-cube__bevel';
    inner.appendChild(bevel);
    cube.appendChild(inner);
    fragment.appendChild(cube);
  });
  bootRing.appendChild(fragment);
  bootCubes = Array.from(bootRing.querySelectorAll('[data-role="boot-cube"]'));
}

if (bootScreen) {
  bootScreen.setAttribute('data-stage', '0');
}

if (bootHint) {
  bootHint.textContent = bootState.reduceMotion ? 'Reduced motion mode' : 'Click to replay';
}

if (reduceMotionQuery) {
  const handleReduceMotionChange = (event) => {
    bootState.reduceMotion = event.matches;
    if (bootHint) {
      bootHint.textContent = event.matches ? 'Reduced motion mode' : 'Click to replay';
    }
  };
  if (typeof reduceMotionQuery.addEventListener === 'function') {
    reduceMotionQuery.addEventListener('change', handleReduceMotionChange);
  } else if (typeof reduceMotionQuery.addListener === 'function') {
    reduceMotionQuery.addListener(handleReduceMotionChange);
  }
}

function ensureAudioContext() {
  if (audioContext) {
    return audioContext;
  }
  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (typeof AudioContextConstructor !== 'function') {
    return null;
  }
  audioContext = new AudioContextConstructor();
  audioMasterGain = audioContext.createGain();
  audioMasterGain.gain.value = 0.4;
  audioMasterGain.connect(audioContext.destination);
  return audioContext;
}

function scheduleToneStep(context, masterGain, startTime, step) {
  const duration = typeof step.duration === 'number' ? Math.max(step.duration, 0.01) : 0.12;
  const oscillator = context.createOscillator();
  oscillator.type = step.type || 'triangle';
  oscillator.frequency.value = Math.max(step.frequency || 440, 40);
  const gainNode = context.createGain();
  const volume = typeof step.volume === 'number' ? Math.max(Math.min(step.volume, 0.8), 0) : 0.2;
  const attack = 0.01;
  const release = 0.08;
  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.linearRampToValueAtTime(volume, startTime + attack);
  gainNode.gain.linearRampToValueAtTime(0.0001, startTime + duration + release);
  oscillator.connect(gainNode).connect(masterGain);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + release + 0.02);
  return duration + (step.gap ?? 0);
}

function playSound(name, options = {}) {
  const pattern = SOUND_THEMES[name];
  if (!pattern?.length) return;
  const context = ensureAudioContext();
  if (!context || !audioMasterGain) return;

  const throttleKey = options.throttleKey ?? name;
  const throttleInterval = typeof options.throttleMs === 'number' ? options.throttleMs : 0;
  if (throttleInterval > 0) {
    const lastTime = audioThrottleMarks.get(throttleKey) ?? 0;
    if (performance.now() - lastTime < throttleInterval) {
      return;
    }
    audioThrottleMarks.set(throttleKey, performance.now());
  }

  if (context.state === 'suspended') {
    context.resume().catch(() => {});
  }

  let cursor = context.currentTime;
  pattern.forEach((step) => {
    cursor += scheduleToneStep(context, audioMasterGain, cursor, step);
  });
}

function playBuddySound(name, options = {}) {
  if (!buddyState.playSounds) return;
  playSound(name, options);
}

function setBuddyStatus(message) {
  if (typeof message !== 'string') return;
  buddyState.statusMessage = message;
  if (buddyStatus) {
    buddyStatus.textContent = message;
  }
}

function setBuddyModelStatus(message) {
  if (typeof message !== 'string') return;
  buddyState.modelStatus = message;
  buddyModelStatusElements.forEach((node) => {
    node.textContent = message;
  });
}

function persistBuddySettings() {
  try {
    const payload = {
      enabled: buddyState.enabled,
      idleMessages: buddyState.idleMessages,
      playSounds: buddyState.playSounds,
      skin: buddyState.skin,
      rememberKey: buddyState.rememberKey,
      position: buddyState.position,
    };
    window.localStorage?.setItem(BUDDY_SETTINGS_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to persist Cirrus settings', error);
  }
}

function persistBuddyKey() {
  try {
    if (buddyState.rememberKey && buddyState.openAiKey) {
      window.localStorage?.setItem(BUDDY_KEY_STORAGE_KEY, buddyState.openAiKey);
    } else {
      window.localStorage?.removeItem(BUDDY_KEY_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Unable to persist Cirrus API key', error);
  }
}

function loadBuddyStoredKey() {
  if (!buddyState.rememberKey) return;
  try {
    const stored = window.localStorage?.getItem(BUDDY_KEY_STORAGE_KEY);
    if (stored) {
      buddyState.openAiKey = stored;
      if (buddyKeyInput) {
        buddyKeyInput.value = stored;
      }
    }
  } catch (error) {
    console.warn('Unable to restore Cirrus API key', error);
  }
}

function restoreBuddySettings() {
  let stored;
  try {
    const raw = window.localStorage?.getItem(BUDDY_SETTINGS_KEY);
    if (raw) {
      stored = JSON.parse(raw);
    }
  } catch (error) {
    console.warn('Unable to restore Cirrus settings', error);
  }
  if (stored) {
    if (typeof stored.enabled === 'boolean') buddyState.enabled = stored.enabled;
    if (typeof stored.idleMessages === 'boolean') buddyState.idleMessages = stored.idleMessages;
    if (typeof stored.playSounds === 'boolean') buddyState.playSounds = stored.playSounds;
    if (typeof stored.skin === 'string' && BUDDY_SKIN_IDS.has(stored.skin)) buddyState.skin = stored.skin;
    if (typeof stored.rememberKey === 'boolean') buddyState.rememberKey = stored.rememberKey;
    if (
      stored.position &&
      typeof stored.position.left === 'number' &&
      typeof stored.position.top === 'number'
    ) {
      buddyState.position = { left: stored.position.left, top: stored.position.top };
    }
  }
  if (buddyEnabledToggle) buddyEnabledToggle.checked = buddyState.enabled;
  if (buddyIdleToggle) buddyIdleToggle.checked = buddyState.idleMessages;
  if (buddySoundToggle) buddySoundToggle.checked = buddyState.playSounds;
  if (buddyRememberKey) buddyRememberKey.checked = buddyState.rememberKey;
  if (buddyState.rememberKey) {
    loadBuddyStoredKey();
  } else if (buddyKeyInput) {
    buddyKeyInput.value = '';
  }
}

function getTaskbarHeight() {
  return taskbar ? Math.round(taskbar.getBoundingClientRect().height) : 72;
}

function getDefaultBuddyPosition() {
  const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 1280;
  const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 720;
  const rect = buddyContainer?.getBoundingClientRect();
  const width = rect?.width || 150;
  const height = rect?.height || 200;
  const left = Math.max(Math.round(viewportWidth * 0.68) - width / 2, 24);
  const safeBottom = getTaskbarHeight() + 180;
  const top = Math.min(Math.round(viewportHeight * 0.55), viewportHeight - height - safeBottom);
  return { left, top: Math.max(top, 24) };
}

function getBuddyBounds() {
  const viewportWidth = window.innerWidth || document.documentElement?.clientWidth || 1280;
  const viewportHeight = window.innerHeight || document.documentElement?.clientHeight || 720;
  const rect = buddyContainer?.getBoundingClientRect();
  const width = rect?.width || 150;
  const height = rect?.height || 200;
  const minLeft = 12;
  const minTop = 12;
  const maxLeft = Math.max(viewportWidth - width - 12, minLeft);
  const safeBottom = getTaskbarHeight() + 180;
  const maxTop = Math.max(viewportHeight - height - safeBottom, minTop);
  return { minLeft, minTop, maxLeft, maxTop };
}

function applyBuddyPosition(options = {}) {
  if (!buddyContainer) return;
  let { left, top } = buddyState.position;
  if (typeof left !== 'number' || typeof top !== 'number') {
    const defaults = getDefaultBuddyPosition();
    left = defaults.left;
    top = defaults.top;
  }
  const bounds = getBuddyBounds();
  const clampedLeft = Math.min(Math.max(left, bounds.minLeft), bounds.maxLeft);
  const clampedTop = Math.min(Math.max(top, bounds.minTop), bounds.maxTop);
  buddyContainer.style.left = `${clampedLeft}px`;
  buddyContainer.style.top = `${clampedTop}px`;
  buddyState.position = { left: clampedLeft, top: clampedTop };
  if (!options.skipPersist) {
    persistBuddySettings();
  }
}

function updateBuddySkinSelection(skinId) {
  if (!buddySkinList) return;
  const options = buddySkinList.querySelectorAll('.settings__buddy-skin');
  options.forEach((option) => {
    const input = option.querySelector('input[type="radio"]');
    const isActive = input?.value === skinId;
    if (input) {
      input.checked = Boolean(isActive);
    }
    option.classList.toggle('is-selected', Boolean(isActive));
  });
}

function renderBuddySkinOptions() {
  if (!buddySkinList) return;
  buddySkinList.innerHTML = '';
  BUDDY_SKINS.forEach((skin) => {
    const label = document.createElement('label');
    label.className = 'settings__buddy-skin';
    label.dataset.skin = skin.id;

    const input = document.createElement('input');
    input.type = 'radio';
    input.name = 'buddy-skin';
    input.value = skin.id;
    input.checked = skin.id === buddyState.skin;

    const swatch = document.createElement('span');
    swatch.className = 'settings__buddy-swatch';
    swatch.style.setProperty('--swatch', skin.swatch);

    const info = document.createElement('span');
    info.className = 'settings__buddy-info';

    const name = document.createElement('span');
    name.className = 'settings__buddy-name';
    name.textContent = skin.name;

    const description = document.createElement('span');
    description.className = 'settings__buddy-description';
    description.textContent = skin.tagline;

    info.append(name, description);
    if (input.checked) {
      label.classList.add('is-selected');
    }
    label.append(input, swatch, info);
    buddySkinList.append(label);
  });
  updateBuddySkinSelection(buddyState.skin);
}

function applyBuddySkin(skinId, options = {}) {
  if (!BUDDY_SKIN_IDS.size) return;
  const targetSkin = BUDDY_SKIN_IDS.has(skinId) ? skinId : BUDDY_SKINS[0]?.id;
  if (!targetSkin) return;
  buddyState.skin = targetSkin;
  if (buddyContainer) {
    buddyContainer.dataset.skin = targetSkin;
  }
  if (!options.skipSelectionSync) {
    updateBuddySkinSelection(targetSkin);
  }
  if (!options.skipPersist) {
    persistBuddySettings();
  }
}

function resetBuddyPosition() {
  buddyState.position = getDefaultBuddyPosition();
  applyBuddyPosition();
  playBuddySound('buddyMove');
}

function updateBuddyVisibility() {
  if (!buddyContainer) return;
  const shouldShow = buddyState.enabled && !osState.current;
  buddyContainer.classList.toggle('is-hidden', !shouldShow);
  buddyContainer.setAttribute('aria-hidden', shouldShow ? 'false' : 'true');
  if (!shouldShow) {
    closeBuddyPanel({ silent: true });
    cancelBuddyIdle();
    clearBuddyBubble();
  } else {
    scheduleBuddyIdle();
  }
}

function cancelBuddyIdle() {
  if (buddyState.idleTimer) {
    window.clearTimeout(buddyState.idleTimer);
    buddyState.idleTimer = null;
  }
}

function clearBuddyBubble() {
  if (!buddyMessageBubble) return;
  window.clearTimeout(buddyState.messageTimer);
  buddyState.messageTimer = null;
  buddyMessageBubble.classList.remove('is-visible');
  if (!buddyMessageBubble.hasAttribute('hidden')) {
    buddyMessageBubble.setAttribute('hidden', '');
  }
}

function showBuddyBubble(message) {
  if (!buddyMessageBubble || typeof message !== 'string' || !message.trim()) return;
  buddyMessageBubble.textContent = message;
  buddyMessageBubble.removeAttribute('hidden');
  buddyMessageBubble.classList.add('is-visible');
  window.clearTimeout(buddyState.messageTimer);
  buddyState.messageTimer = window.setTimeout(() => {
    clearBuddyBubble();
  }, 6000);
}

function triggerBuddyIdleMessage() {
  if (!buddyState.enabled || !buddyState.idleMessages || buddyState.isPanelOpen || osState.current) {
    return;
  }
  const pool = Array.isArray(BUDDY_IDLE_MESSAGES) && BUDDY_IDLE_MESSAGES.length ? BUDDY_IDLE_MESSAGES : [];
  if (!pool.length) return;
  let message = pool[Math.floor(Math.random() * pool.length)];
  if (pool.length > 1 && message === buddyState.lastIdleMessage) {
    const alternatives = pool.filter((item) => item !== message);
    if (alternatives.length) {
      message = alternatives[Math.floor(Math.random() * alternatives.length)];
    }
  }
  buddyState.lastIdleMessage = message;
  showBuddyBubble(message);
  playBuddySound('buddyChirp', { throttleMs: 1500, throttleKey: 'buddy-chirp' });
}

function scheduleBuddyIdle() {
  cancelBuddyIdle();
  if (!buddyState.enabled || !buddyState.idleMessages || buddyState.isPanelOpen || osState.current) {
    return;
  }
  buddyState.idleTimer = window.setTimeout(() => {
    triggerBuddyIdleMessage();
    scheduleBuddyIdle();
  }, BUDDY_IDLE_INTERVAL);
}

function updateBuddyAppletDigest() {
  if (!state.records?.length) {
    buddyState.appletDigest = '';
    buddyState.appletPreviewList = [];
    return;
  }
  const summary = state.records
    .map((record) => `${record.name} — ${record.description}`)
    .slice(0, 36);
  buddyState.appletDigest = summary.join('\n');
  buddyState.appletPreviewList = state.records
    .slice(0, 12)
    .map((record) => `• ${record.name} — ${record.description}`);
}

function trimBuddyConversation(limit = 14) {
  if (buddyState.conversation.length > limit) {
    buddyState.conversation.splice(0, buddyState.conversation.length - limit);
  }
}

function appendBuddyLogEntry({ role, content, tone }) {
  if (!buddyLog || typeof content !== 'string') return;
  const entry = document.createElement('div');
  entry.className = 'desktop-buddy__entry';
  entry.dataset.speaker = role;
  const label = document.createElement('span');
  label.className = 'desktop-buddy__entry-label';
  label.textContent = role === 'user' ? 'You' : role === 'assistant' ? BUDDY_NAME : 'Note';
  const bubble = document.createElement('div');
  bubble.className = 'desktop-buddy__message-block';
  if (tone === 'local') {
    bubble.classList.add('desktop-buddy__message-block--local');
  }
  bubble.textContent = content;
  entry.append(label, bubble);
  buddyLog.appendChild(entry);
  buddyLog.scrollTop = buddyLog.scrollHeight;
}

function renderBuddyModelOptions() {
  if (!buddyModelSelect) return;
  buddyModelSelect.replaceChildren();
  const models = buddyState.models;
  if (!models) {
    buddyModelSelect.disabled = true;
    return;
  }
  const groups = [
    ['chat', 'Chat'],
    ['vision', 'Vision'],
    ['images', 'Images'],
    ['audio', 'Audio'],
    ['embeddings', 'Embeddings'],
  ];
  let hasOptions = false;
  groups.forEach(([key, label]) => {
    const list = Array.isArray(models[key]) ? models[key] : [];
    if (!list.length) return;
    hasOptions = true;
    const optgroup = document.createElement('optgroup');
    optgroup.label = label;
    list.forEach((id) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = id;
      optgroup.appendChild(option);
    });
    buddyModelSelect.appendChild(optgroup);
  });
  buddyModelSelect.disabled = !hasOptions;
  if (!hasOptions) {
    buddyState.selectedModel = null;
    return;
  }
  const available = new Set(Object.values(models).flat().filter(Boolean));
  if (!available.has(buddyState.selectedModel)) {
    buddyState.selectedModel =
      models.chat?.[0] ?? models.vision?.[0] ?? models.images?.[0] ?? models.audio?.[0] ?? models.embeddings?.[0] ?? null;
  }
  if (buddyState.selectedModel) {
    buddyModelSelect.value = buddyState.selectedModel;
  }
}

function fingerprintBuddyKey(key) {
  if (!key) return 'anon';
  return `openai-${String(key).slice(0, 8)}`;
}

function persistBuddyModelCache() {
  if (!buddyState.models) return;
  try {
    const raw = window.localStorage?.getItem(BUDDY_MODEL_CACHE_KEY);
    const cache = raw ? JSON.parse(raw) : {};
    cache[fingerprintBuddyKey(buddyState.openAiKey)] = {
      models: buddyState.models,
      selectedModel: buddyState.selectedModel,
      timestamp: Date.now(),
    };
    window.localStorage?.setItem(BUDDY_MODEL_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Unable to store Cirrus model cache', error);
  }
}

function loadBuddyCachedModels() {
  if (!buddyState.openAiKey) return;
  try {
    const raw = window.localStorage?.getItem(BUDDY_MODEL_CACHE_KEY);
    if (!raw) return;
    const cache = JSON.parse(raw);
    const entry = cache[fingerprintBuddyKey(buddyState.openAiKey)];
    if (entry?.models) {
      applyBuddyModels(entry.models, { selectedModel: entry.selectedModel });
      setBuddyModelStatus(`Loaded ${countBuddyModels(entry.models)} cached models.`);
    }
  } catch (error) {
    console.warn('Unable to load Cirrus model cache', error);
  }
}

function resolveBuddyModelBucket(id) {
  const key = String(id).toLowerCase();
  if (key.includes('embedding')) return 'embeddings';
  if (key.includes('audio') || key.includes('voice')) return 'audio';
  if (key.includes('image') || key.includes('dall')) return 'images';
  if (key.includes('vision')) return 'vision';
  return 'chat';
}

function bucketizeBuddyModels(models) {
  const buckets = {
    chat: [],
    vision: [],
    images: [],
    audio: [],
    embeddings: [],
  };
  const seen = {
    chat: new Set(),
    vision: new Set(),
    images: new Set(),
    audio: new Set(),
    embeddings: new Set(),
  };
  models.forEach((model) => {
    const id = typeof model === 'string' ? model : model?.id;
    if (!id) return;
    const bucket = resolveBuddyModelBucket(id);
    if (!seen[bucket].has(id)) {
      seen[bucket].add(id);
      buckets[bucket].push(id);
    }
  });
  Object.keys(buckets).forEach((key) => buckets[key].sort());
  return buckets;
}

function countBuddyModels(models) {
  return Object.values(models || {}).reduce(
    (total, list) => total + (Array.isArray(list) ? list.length : 0),
    0
  );
}

function applyBuddyModels(models, options = {}) {
  buddyState.models = models;
  if (options.selectedModel) {
    buddyState.selectedModel = options.selectedModel;
  }
  renderBuddyModelOptions();
  persistBuddyModelCache();
}

function buildBuddyMessages() {
  const messages = [{ role: 'system', content: BUDDY_SYSTEM_PROMPT }];
  if (buddyState.appletDigest) {
    messages.push({ role: 'system', content: `Applet directory:\n${buddyState.appletDigest}` });
  }
  const history = buddyState.conversation.slice(-14);
  messages.push(...history);
  return messages;
}

async function refreshBuddyModels() {
  if (!buddyState.openAiKey) {
    setBuddyModelStatus('Add an API key to fetch models.');
    return;
  }
  setBuddyModelStatus('Fetching models from OpenAI…');
  setBuddyStatus('Syncing with OpenAI…');
  buddyRefreshButton?.setAttribute('disabled', 'true');
  buddyModelSelect?.setAttribute('disabled', 'true');
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${buddyState.openAiKey}`,
      },
    });
    if (response.status === 401) {
      setBuddyModelStatus('OpenAI rejected the API key. Keeping the last known list.');
      setBuddyStatus('OpenAI rejected the key. Update it to continue.');
      return;
    }
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `OpenAI model refresh failed (${response.status})`);
    }
    const payload = await response.json();
    const bucketed = bucketizeBuddyModels(payload?.data ?? []);
    if (countBuddyModels(bucketed) === 0) {
      setBuddyModelStatus('No models returned. Try again soon.');
      setBuddyStatus('No models available right now.');
      return;
    }
    applyBuddyModels(bucketed);
    const count = countBuddyModels(bucketed);
    setBuddyModelStatus(`Loaded ${count} models from OpenAI.`);
    setBuddyStatus('Model catalog refreshed.');
  } catch (error) {
    console.error('Unable to refresh Cirrus models', error);
    setBuddyModelStatus('Network error while fetching models. Using any cached list.');
    setBuddyStatus('I could not reach OpenAI. Try again soon.');
  } finally {
    buddyRefreshButton?.removeAttribute('disabled');
    if (buddyState.models && buddyModelSelect) {
      buddyModelSelect.removeAttribute('disabled');
    }
  }
}

const OPENAI_RESPONSES_MODEL_PATTERNS = [/^gpt-4\.1/i, /^gpt-5/i, /^o[0-9]/i, /^o-mini/i];

function shouldUseOpenAIResponses(modelId) {
  if (!modelId) return false;
  return OPENAI_RESPONSES_MODEL_PATTERNS.some((pattern) => pattern.test(String(modelId).trim()));
}

function parseOpenAIError(raw, fallback) {
  if (raw) {
    try {
      const data = JSON.parse(raw);
      const message = data?.error?.message || data?.message || data?.error;
      if (typeof message === 'string' && message.trim()) {
        return message.trim();
      }
    } catch (error) {
      const trimmed = raw.trim();
      if (trimmed) return trimmed;
    }
  }
  return fallback || 'OpenAI request failed';
}

function extractOpenAITextParts(parts) {
  if (!parts) return '';
  const list = Array.isArray(parts) ? parts : [parts];
  let buffer = '';
  list.forEach((part) => {
    if (!part) return;
    if (typeof part === 'string') {
      buffer += part;
      return;
    }
    if (typeof part.text === 'string') {
      buffer += part.text;
      return;
    }
    if (typeof part.value === 'string') {
      buffer += part.value;
      return;
    }
    if (typeof part.content === 'string') {
      buffer += part.content;
      return;
    }
    if (Array.isArray(part.content)) {
      buffer += extractOpenAITextParts(part.content);
    }
  });
  return buffer.trim();
}

function extractOpenAIChatText(payload) {
  if (!payload) return '';
  const choices = Array.isArray(payload.choices) ? payload.choices : [];
  for (const choice of choices) {
    const message = choice && choice.message;
    if (!message) continue;
    if (typeof message.content === 'string' && message.content.trim()) {
      return message.content.trim();
    }
    if (Array.isArray(message.content)) {
      const text = extractOpenAITextParts(message.content);
      if (text) return text;
    }
  }
  if (typeof payload.message === 'string' && payload.message.trim()) {
    return payload.message.trim();
  }
  return '';
}

function extractOpenAIResponsesText(payload) {
  if (!payload) return '';
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }
  const streams = Array.isArray(payload.output)
    ? payload.output
    : Array.isArray(payload.responses)
    ? payload.responses
    : [];
  for (const entry of streams) {
    if (!entry) continue;
    const parts = entry.content || entry.outputs || entry.parts || entry.message?.content;
    const text = extractOpenAITextParts(parts);
    if (text) return text;
  }
  if (Array.isArray(payload.messages)) {
    for (const message of payload.messages) {
      if (message?.role === 'assistant') {
        const text =
          typeof message.content === 'string'
            ? message.content.trim()
            : extractOpenAITextParts(message.content);
        if (text) return text;
      }
    }
  }
  return '';
}

function buildOpenAIResponsesInput(messages) {
  return messages.map((message) => ({
    role: message.role || 'user',
    content: [
      {
        type: 'text',
        text: typeof message.content === 'string' ? message.content : '',
      },
    ],
  }));
}

function shouldRetryWithResponses(error) {
  if (!error) return false;
  const message = typeof error.message === 'string' ? error.message.toLowerCase() : '';
  if (!message) return false;
  if (message.includes('responses api') || message.includes('responses endpoint')) return true;
  if (message.includes('unrecognized request argument') && message.includes('messages')) return true;
  return false;
}

async function callBuddyOpenAICompletions({ key, model, messages }) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.7,
    }),
  });
  const raw = await response.text();
  if (response.status === 401) {
    const error = new Error('unauthorized');
    error.status = response.status;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(parseOpenAIError(raw, `OpenAI chat failed (${response.status})`));
    error.status = response.status;
    error.responseText = raw;
    throw error;
  }
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (error) {
    throw new Error('Invalid JSON returned from OpenAI.');
  }
  const reply = extractOpenAIChatText(payload);
  if (!reply) {
    throw new Error('Empty response from OpenAI');
  }
  return reply;
}

async function callBuddyOpenAIResponses({ key, model, messages }) {
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      input: buildOpenAIResponsesInput(messages),
    }),
  });
  const raw = await response.text();
  if (response.status === 401) {
    const error = new Error('unauthorized');
    error.status = response.status;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(parseOpenAIError(raw, `OpenAI chat failed (${response.status})`));
    error.status = response.status;
    error.responseText = raw;
    throw error;
  }
  let payload = {};
  try {
    payload = raw ? JSON.parse(raw) : {};
  } catch (error) {
    throw new Error('Invalid JSON returned from OpenAI.');
  }
  const reply = extractOpenAIResponsesText(payload) || extractOpenAIChatText(payload);
  if (!reply) {
    throw new Error('Empty response from OpenAI');
  }
  return reply;
}

async function callBuddyOpenAI({ key, model, messages }) {
  if (shouldUseOpenAIResponses(model)) {
    return callBuddyOpenAIResponses({ key, model, messages });
  }
  try {
    return await callBuddyOpenAICompletions({ key, model, messages });
  } catch (error) {
    if (shouldRetryWithResponses(error)) {
      return callBuddyOpenAIResponses({ key, model, messages });
    }
    throw error;
  }
}

function maybeHandleAppletQuestion(text) {
  if (!text) return false;
  const normalized = text.toLowerCase();
  const mentionsApplet = /applet|apps|programs|catalog/.test(normalized);
  const requestsList = /list|available|show|what|which|options/.test(normalized);
  if (!mentionsApplet || !requestsList) {
    return false;
  }
  if (!buddyState.appletPreviewList?.length) {
    const fallback = state.records?.length
      ? 'I do not see any registered applets right now.'
      : 'No applets are registered yet, but new ones can be added to the dashboard.';
    appendBuddyLogEntry({ role: 'assistant', content: fallback, tone: 'local' });
    buddyState.conversation.push({ role: 'assistant', content: fallback });
    trimBuddyConversation();
    setBuddyStatus('Here is what I know.');
    playBuddySound('buddyReply');
    return true;
  }
  const response = `Here are some applets you can open:\n${buddyState.appletPreviewList.join('\n')}`;
  appendBuddyLogEntry({ role: 'assistant', content: response, tone: 'local' });
  buddyState.conversation.push({ role: 'assistant', content: response });
  trimBuddyConversation();
  setBuddyStatus('Here are a few desktop picks.');
  playBuddySound('buddyReply');
  return true;
}

async function handleBuddySubmit(event) {
  event.preventDefault();
  if (buddyState.awaitingResponse) return;
  const value = buddyInput?.value?.trim();
  if (!value) return;
  buddyInput.value = '';
  appendBuddyLogEntry({ role: 'user', content: value });
  playBuddySound('buddySend');
  clearBuddyBubble();
  buddyState.conversation.push({ role: 'user', content: value });
  trimBuddyConversation();
  if (maybeHandleAppletQuestion(value)) {
    scheduleBuddyIdle();
    return;
  }
  buddyState.awaitingResponse = true;
  buddySendButton?.setAttribute('disabled', 'true');
  setBuddyStatus('Thinking…');
  try {
    if (!buddyState.openAiKey) {
      throw new Error('missing-key');
    }
    if (!buddyState.models) {
      await refreshBuddyModels();
    }
    const model =
      buddyState.selectedModel ||
      buddyState.models?.chat?.[0] ||
      buddyState.models?.vision?.[0] ||
      buddyState.models?.images?.[0] ||
      buddyState.models?.audio?.[0];
    if (!model) {
      throw new Error('missing-model');
    }
    const messages = buildBuddyMessages();
    const reply = await callBuddyOpenAI({ key: buddyState.openAiKey, model, messages });
    buddyState.conversation.push({ role: 'assistant', content: reply });
    trimBuddyConversation();
    appendBuddyLogEntry({ role: 'assistant', content: reply });
    setBuddyStatus('Glad to help!');
    playBuddySound('buddyReply');
  } catch (error) {
    console.error('Cirrus chat failed', error);
    let feedback = 'I ran into an issue reaching OpenAI.';
    if (error.message === 'missing-key') {
      feedback = 'Add an OpenAI API key so I can respond.';
      setBuddyModelStatus('Add an API key to fetch models.');
    } else if (error.message === 'unauthorized') {
      feedback = 'OpenAI rejected the API key. Double-check it and try again.';
      setBuddyModelStatus('OpenAI rejected the API key. Update it to continue.');
    } else if (error.message === 'missing-model') {
      feedback = 'Refresh the model list so I know which model to use.';
    }
    appendBuddyLogEntry({ role: 'system', content: feedback });
    setBuddyStatus(feedback);
  } finally {
    buddyState.awaitingResponse = false;
    buddySendButton?.removeAttribute('disabled');
    scheduleBuddyIdle();
  }
}

function openBuddyPanel() {
  if (!buddyPanel || buddyState.isPanelOpen) return;
  buddyState.isPanelOpen = true;
  buddyPanel.hidden = false;
  buddyPanel.setAttribute('aria-hidden', 'false');
  buddyAvatar?.setAttribute('aria-expanded', 'true');
  playBuddySound('buddyWake');
  setBuddyStatus(buddyState.statusMessage ?? 'Ready to chat.');
  setBuddyModelStatus(buddyState.modelStatus);
  cancelBuddyIdle();
  clearBuddyBubble();
  requestAnimationFrame(() => {
    buddyInput?.focus();
  });
}

function closeBuddyPanel(options = {}) {
  if (!buddyPanel || !buddyState.isPanelOpen) return;
  buddyState.isPanelOpen = false;
  buddyPanel.hidden = true;
  buddyPanel.setAttribute('aria-hidden', 'true');
  buddyAvatar?.setAttribute('aria-expanded', 'false');
  if (!options.silent) {
    playBuddySound('menuClose');
  }
  scheduleBuddyIdle();
}

function toggleBuddyPanel(force) {
  const shouldOpen = typeof force === 'boolean' ? force : !buddyState.isPanelOpen;
  if (shouldOpen) {
    openBuddyPanel();
  } else {
    closeBuddyPanel();
  }
}

function handleBuddyPointerDown(event) {
  if (!buddyState.enabled || !buddyContainer) return;
  buddyDragState.pointerId = event.pointerId;
  buddyDragState.startX = event.clientX;
  buddyDragState.startY = event.clientY;
  const rect = buddyContainer.getBoundingClientRect();
  buddyDragState.originLeft = rect.left;
  buddyDragState.originTop = rect.top;
  buddyDragState.moved = false;
  buddyDragState.justDragged = false;
  if (typeof buddyAvatar?.setPointerCapture === 'function') {
    buddyAvatar.setPointerCapture(event.pointerId);
  }
  buddyContainer.classList.add('is-dragging');
  cancelBuddyIdle();
  clearBuddyBubble();
}

function handleBuddyPointerMove(event) {
  if (buddyDragState.pointerId !== event.pointerId || !buddyContainer) return;
  const dx = event.clientX - buddyDragState.startX;
  const dy = event.clientY - buddyDragState.startY;
  if (!buddyDragState.moved && Math.hypot(dx, dy) > 6) {
    buddyDragState.moved = true;
  }
  if (!buddyDragState.moved) return;
  const bounds = getBuddyBounds();
  let left = buddyDragState.originLeft + dx;
  let top = buddyDragState.originTop + dy;
  left = Math.min(Math.max(left, bounds.minLeft), bounds.maxLeft);
  top = Math.min(Math.max(top, bounds.minTop), bounds.maxTop);
  buddyContainer.style.left = `${left}px`;
  buddyContainer.style.top = `${top}px`;
}

function handleBuddyPointerUp(event) {
  if (buddyDragState.pointerId !== event.pointerId || !buddyContainer) return;
  if (typeof buddyAvatar?.releasePointerCapture === 'function') {
    buddyAvatar.releasePointerCapture(event.pointerId);
  }
  buddyContainer.classList.remove('is-dragging');
  const rect = buddyContainer.getBoundingClientRect();
  buddyState.position = { left: rect.left, top: rect.top };
  persistBuddySettings();
  buddyDragState.justDragged = buddyDragState.moved;
  if (buddyDragState.moved) {
    playBuddySound('buddyMove', { throttleMs: 150 });
  }
  buddyDragState.pointerId = null;
  buddyDragState.moved = false;
  scheduleBuddyIdle();
}

function handleBuddyPointerCancel(event) {
  if (buddyDragState.pointerId !== event.pointerId) return;
  buddyDragState.pointerId = null;
  buddyDragState.moved = false;
  buddyContainer?.classList.remove('is-dragging');
  scheduleBuddyIdle();
}

function initDesktopBuddy() {
  if (buddyState.hasInitialized || !buddyContainer || !buddyAvatar) return;
  buddyState.hasInitialized = true;
  restoreBuddySettings();
  renderBuddySkinOptions();
  applyBuddySkin(buddyState.skin, { skipPersist: true });
  applyBuddyPosition({ skipPersist: true });
  updateBuddyVisibility();
  scheduleBuddyIdle();

  buddyAvatar.addEventListener('pointerdown', handleBuddyPointerDown);
  buddyAvatar.addEventListener('pointermove', handleBuddyPointerMove);
  buddyAvatar.addEventListener('pointerup', handleBuddyPointerUp);
  buddyAvatar.addEventListener('pointercancel', handleBuddyPointerCancel);
  buddyAvatar.addEventListener('click', (event) => {
    if (buddyDragState.justDragged) {
      event.preventDefault();
      buddyDragState.justDragged = false;
      return;
    }
    toggleBuddyPanel();
  });
  buddyAvatar.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleBuddyPanel();
    }
  });

  buddyCloseButton?.addEventListener('click', () => closeBuddyPanel());
  buddyOpenSettingsButton?.addEventListener('click', () => {
    toggleSettings(true);
    toggleStartMenu(false);
    requestAnimationFrame(() => {
      if (buddyKeyInput instanceof HTMLElement) {
        buddyKeyInput.focus();
      }
    });
  });
  buddyForm?.addEventListener('submit', handleBuddySubmit);
  buddyRefreshButton?.addEventListener('click', () => refreshBuddyModels());
  buddyModelSelect?.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    buddyState.selectedModel = event.target.value || null;
    persistBuddyModelCache();
    setBuddyStatus(buddyState.selectedModel ? `Model set to ${buddyState.selectedModel}.` : 'Select a model to chat.');
  });
  buddyKeyInput?.addEventListener('change', () => {
    buddyState.openAiKey = buddyKeyInput.value.trim();
    if (buddyState.openAiKey) {
      setBuddyStatus('Key captured. Refresh models to sync.');
      setBuddyModelStatus('Refresh models to sync with OpenAI.');
    } else {
      setBuddyStatus('Add an OpenAI API key so I can help.');
      setBuddyModelStatus('Add an API key to fetch models.');
    }
    persistBuddyKey();
    buddyState.models = null;
    renderBuddyModelOptions();
  });
  buddyRememberKey?.addEventListener('change', () => {
    buddyState.rememberKey = buddyRememberKey.checked;
    persistBuddySettings();
    persistBuddyKey();
  });
  buddyEnabledToggle?.addEventListener('change', () => {
    buddyState.enabled = buddyEnabledToggle.checked;
    persistBuddySettings();
    if (buddyState.enabled) {
      setBuddyStatus('Cirrus is ready to help.');
    } else {
      setBuddyStatus('Cirrus is resting.');
    }
    updateBuddyVisibility();
  });
  buddyIdleToggle?.addEventListener('change', () => {
    buddyState.idleMessages = buddyIdleToggle.checked;
    persistBuddySettings();
    if (buddyState.idleMessages) {
      scheduleBuddyIdle();
    } else {
      cancelBuddyIdle();
      clearBuddyBubble();
    }
  });
  buddySoundToggle?.addEventListener('change', () => {
    buddyState.playSounds = buddySoundToggle.checked;
    persistBuddySettings();
  });
  buddyResetPositionButton?.addEventListener('click', () => {
    resetBuddyPosition();
  });
  buddySkinList?.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    if (event.target.name !== 'buddy-skin') return;
    applyBuddySkin(event.target.value);
  });

  window.addEventListener('resize', () => {
    applyBuddyPosition({ skipPersist: true });
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && buddyState.isPanelOpen) {
      closeBuddyPanel();
      buddyAvatar?.focus();
    }
  });

  if (buddyState.openAiKey) {
    setBuddyStatus('Key loaded. Refresh models to sync.');
    loadBuddyCachedModels();
  } else if (!buddyState.enabled) {
    setBuddyStatus('Cirrus is resting.');
  } else {
    setBuddyStatus('Say hello!');
  }
  setBuddyModelStatus(buddyState.modelStatus);
}

function clearBootTimers() {
  bootState.timers.forEach((id) => window.clearTimeout(id));
  bootState.timers = [];
}

function setBootStage(stage) {
  bootState.stage = stage;
  if (bootScreen) {
    bootScreen.setAttribute('data-stage', String(stage));
  }

  const ringDeg = stage < 1 ? 0 : stage === 1 ? 540 : 720;
  if (bootRing) {
    const ringTransition =
      stage === 0
        ? 'none'
        : stage === 1
        ? 'transform 1100ms cubic-bezier(.23,1,.32,1)'
        : 'transform 600ms cubic-bezier(.2,1.1,.2,1)';
    bootRing.style.transition = ringTransition;
    bootRing.style.transform = `translate(-50%, -50%) rotate(${ringDeg}deg)`;
  }

  bootCubes.forEach((cube, index) => {
    const angle = BOOT_ANGLES[index];
    let tx = 0;
    let ty = 0;
    let rot = 0;
    let scale = 0;
    let opacity = 0;

    if (stage <= 0) {
      scale = 0;
      opacity = 0;
    } else if (stage === 1) {
      const radians = (angle * Math.PI) / 180;
      tx = Math.cos(radians) * BOOT_CONFIG.radius;
      ty = Math.sin(radians) * BOOT_CONFIG.radius;
      rot = angle + 90;
      scale = 1;
      opacity = 1;
    } else {
      const target = BOOT_GRID[index % 4];
      tx = target.x;
      ty = target.y;
      rot = 0;
      scale = 1;
      opacity = 1;
    }

    const transition =
      stage === 0
        ? 'none'
        : stage === 1
        ? 'transform 1100ms cubic-bezier(.23,1,.32,1), opacity 500ms ease'
        : 'transform 600ms cubic-bezier(.2,1.1,.2,1)';
    cube.style.transition = transition;
    cube.style.transform = `translate(-50%, -50%) translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(${scale})`;
    cube.style.opacity = String(opacity);
  });

  if (bootBloom) {
    const isVisible = stage >= 2;
    bootBloom.style.width = isVisible ? '60px' : '0px';
    bootBloom.style.height = isVisible ? '60px' : '0px';
    bootBloom.style.opacity = isVisible ? '1' : '0';
  }

  if (bootPop) {
    if (stage === 3) {
      bootPop.classList.remove('is-pop');
      void bootPop.offsetWidth;
      bootPop.classList.add('is-pop');
    } else {
      bootPop.classList.remove('is-pop');
    }
  }

  if (bootTitle) {
    if (stage >= 4) {
      bootTitle.classList.add('is-visible');
    } else {
      bootTitle.classList.remove('is-visible');
    }
  }
}

function showBootScreen() {
  if (!bootScreen) return;
  bootScreen.classList.add('is-visible');
  bootScreen.setAttribute('aria-hidden', 'false');
  if (document.body) {
    document.body.classList.add('is-booting');
  }
}

function hideBootScreen() {
  if (!bootScreen) return;
  bootScreen.classList.remove('is-visible');
  bootScreen.setAttribute('aria-hidden', 'true');
  if (document.body) {
    document.body.classList.remove('is-booting');
  }
}

function finishBoot() {
  hideBootScreen();
  bootState.isPlaying = false;
  bootState.hasPlayed = true;
  clearBootTimers();
}

function playBootAnimation() {
  if (!bootScreen) return;
  clearBootTimers();
  showBootScreen();
  bootState.isPlaying = true;
  if (bootHint) {
    bootHint.textContent = bootState.reduceMotion ? 'Reduced motion mode' : 'Click to replay';
  }
  setBootStage(0);
  void bootScreen.offsetWidth;

  if (bootState.reduceMotion) {
    setBootStage(2);
    setBootStage(4);
    const timerId = window.setTimeout(() => {
      finishBoot();
    }, 400);
    bootState.timers.push(timerId);
    return;
  }

  bootState.timers.push(window.setTimeout(() => setBootStage(1), 60));
  bootState.timers.push(window.setTimeout(() => setBootStage(2), 1200));
  bootState.timers.push(window.setTimeout(() => setBootStage(3), 1900));
  bootState.timers.push(window.setTimeout(() => setBootStage(4), 2200));
  bootState.timers.push(window.setTimeout(() => finishBoot(), 3200));
}

function restartDesktop() {
  if (bootState.isPlaying) {
    return;
  }
  toggleStartMenu(false);
  allAppsPanel?.classList.remove('is-open');
  allAppsPanel?.setAttribute('aria-hidden', 'true');
  toggleSettings(false);
  closeActiveApplet({ skipFocus: true });
  playBootAnimation();
}

const PINNED_CONFIG = [
  {
    slug: 'retrocalc-console',
    label: 'RetroCalc Console',
    hint: 'Classic tape-roll calculator',
    emoji: '🧮',
    categories: ['Utilities'],
  },
  {
    slug: 'geniepad-95',
    label: 'GeniePad 95',
    hint: 'Notebook with AI helpers',
    emoji: '📝',
    categories: ['Utilities', 'Chatbots'],
  },
  {
    slug: 'pixelcanvas-studio',
    label: 'PixelCanvas Studio',
    hint: 'Chunky pixel paint tools',
    emoji: '🎨',
    categories: ['Creative'],
  },
  {
    slug: 'diskette-explorer',
    label: 'Diskette Explorer',
    hint: 'Retro file navigator',
    emoji: '🗂️',
    categories: ['Utilities'],
  },
  {
    slug: 'gridweave-analyst',
    label: 'Gridweave Analyst',
    hint: 'Scenario-savvy grid workbook',
    emoji: '📊',
    categories: ['Utilities'],
  },
  {
    slug: 'timekeeper-agenda',
    label: 'Timekeeper Agenda',
    hint: 'Planner with sticky notes',
    emoji: '🗓️',
    categories: ['Utilities'],
  },
  {
    slug: 'youtube-search-theater',
    label: 'YouTube Search Theater',
    hint: 'Search and watch YouTube videos',
    emoji: '📺',
    categories: ['Creative'],
  },
  {
    slug: 'wiki-frame-carnival',
    label: 'Wiki Frame Carnival',
    hint: 'Explore playful Wikipedia frames',
    emoji: '📚',
    categories: ['Utilities'],
  },
];

const WALLPAPERS = [
  {
    id: 'deep-current',
    label: 'Deep Current',
    top: '#1d3b73',
    bottom: '#1e7665',
    accent: '#1d82d2',
    accentLight: 'rgba(29, 130, 210, 0.12)',
  },
  {
    id: 'citrus-pop',
    label: 'Citrus Pop',
    top: '#f6d365',
    bottom: '#fda085',
    accent: '#ff7e39',
    accentLight: 'rgba(255, 126, 57, 0.18)',
  },
  {
    id: 'lagoon-shift',
    label: 'Lagoon Shift',
    top: '#0f2027',
    bottom: '#2c5364',
    accent: '#36cfc9',
    accentLight: 'rgba(54, 207, 201, 0.18)',
  },
  {
    id: 'skyline-glow',
    label: 'Skyline Glow',
    top: '#0b63ce',
    bottom: '#5ad4e6',
    accent: '#0f8af0',
    accentLight: 'rgba(15, 138, 240, 0.18)',
  },
];

const THEME_STORAGE_KEY = 'applet-dashboard-theme';
const DEFAULT_WALLPAPER = WALLPAPERS[0];

const CATEGORY_ORDER = ['All', 'Games', 'Creative', 'Chatbots', 'Utilities'];

const state = {
  records: [],
  pinned: [],
  search: '',
  category: 'All',
  desktopShortcuts: [],
  selectedWallpaperId: DEFAULT_WALLPAPER.id,
  customImage: null,
  wallpaper: DEFAULT_WALLPAPER,
  isCustomWallpaper: false,
};

const osState = {
  current: null,
  minimized: false,
  isFullSize: true,
};

let activeTaskbarButton = null;

function getAppletRecord(slug) {
  return (
    state.records.find((record) => record.slug === slug) ||
    state.pinned.find((record) => record.slug === slug) ||
    null
  );
}

function updateTaskbarSafeArea() {
  const safeArea = taskbar ? Math.round(taskbar.getBoundingClientRect().height) : 0;
  document.documentElement?.style.setProperty('--taskbar-safe-area', `${safeArea}px`);
}

function syncWindowLayout() {
  updateTaskbarSafeArea();
  const shouldFullscreen = Boolean(osState.current) && osState.isFullSize;
  if (osShell) {
    osShell.classList.toggle('is-fullscreen', shouldFullscreen);
  }
  if (osResizeButton) {
    const label = osState.isFullSize ? 'Restore window size' : 'Maximize window';
    osResizeButton.setAttribute('aria-label', label);
    osResizeButton.setAttribute('title', osState.isFullSize ? 'Restore' : 'Maximize');
    osResizeButton.setAttribute('aria-pressed', String(osState.isFullSize));
    osResizeButton.textContent = osState.isFullSize ? '❐' : '▢';
  }
}

syncWindowLayout();
window.addEventListener('resize', syncWindowLayout);

function updateClock() {
  if (!clockDisplay) return;
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const timeString = `${hours}:${minutes}`;
  clockDisplay.textContent = timeString;
  const clockRecord = getAppletRecord(CLOCK_APPLET_SLUG);
  const label = clockRecord?.name ?? CLOCK_APPLET_FALLBACK_NAME;
  clockDisplay.setAttribute('aria-label', `Open ${label} (current time ${timeString})`);
}

function attemptLaunchClockApplet() {
  const record = getAppletRecord(CLOCK_APPLET_SLUG);
  if (record?.entryUrl) {
    pendingClockLaunch = false;
    launchApplet(record);
    return true;
  }
  if (state.records.length || state.pinned.length) {
    pendingClockLaunch = false;
    console.warn(`Clock applet "${CLOCK_APPLET_SLUG}" is not available to launch.`);
  }
  return false;
}

setInterval(updateClock, 30_000);
updateClock();

if (clockDisplay) {
  clockDisplay.addEventListener('click', () => {
    pendingClockLaunch = true;
    attemptLaunchClockApplet();
  });
}

function normalizeAppletRecord(record) {
  if (!record || typeof record.entryUrl !== 'string' || !record.entryUrl) {
    return null;
  }
  const name = typeof record.name === 'string' && record.name.trim() ? record.name.trim() : 'Applet';
  return {
    slug: record.slug ?? record.entryUrl,
    name,
    entryUrl: record.entryUrl,
    iconUrl: record.iconUrl ?? null,
    emoji: record.emoji ?? fallbackGlyph(name),
  };
}

function updateOsChrome(record) {
  if (osTitle) {
    osTitle.textContent = record.name;
  }
  if (osWindow) {
    osWindow.setAttribute('aria-label', `${record.name} window`);
  }
  if (osFrame) {
    osFrame.title = `${record.name} applet`;
  }
  if (osIconSlot) {
    osIconSlot.replaceChildren();
    const icon = createIconElement({
      iconUrl: record.iconUrl,
      emoji: record.emoji,
      label: record.name,
      className: 'os-window__icon-visual',
    });
    osIconSlot.appendChild(icon);
  }
}

function updateTaskbarSessionButton() {
  if (!taskbarSessions) return;
  taskbarSessions.replaceChildren();
  if (!osState.current) {
    activeTaskbarButton = null;
    return;
  }
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'taskbar__session';
  button.dataset.slug = osState.current.slug;
  const actionVerb = osState.minimized ? 'Restore' : 'Minimize';
  const actionLabel = `${actionVerb} ${osState.current.name}`;
  button.title = actionLabel;
  button.setAttribute('aria-label', actionLabel);
  button.setAttribute('aria-pressed', String(!osState.minimized));
  if (osState.minimized) {
    button.classList.add('is-minimized');
  }
  button.addEventListener('click', () => {
    if (osState.minimized) {
      restoreActiveApplet();
    } else {
      minimizeActiveApplet();
    }
  });

  const icon = createIconElement({
    iconUrl: osState.current.iconUrl,
    emoji: osState.current.emoji,
    label: osState.current.name,
    className: 'taskbar__session-icon',
  });
  const label = document.createElement('span');
  label.className = 'taskbar__session-label';
  label.textContent = osState.current.name;

  button.append(icon, label);
  taskbarSessions.appendChild(button);
  activeTaskbarButton = button;
}

function minimizeActiveApplet() {
  if (!osShell || !osState.current) return;
  osState.minimized = true;
  osShell.classList.add('is-minimized');
  osShell.setAttribute('aria-hidden', 'true');
  updateTaskbarSessionButton();
  playSound('appMinimize');
  requestAnimationFrame(() => {
    activeTaskbarButton?.focus();
  });
}

function restoreActiveApplet() {
  if (!osShell || !osState.current) return;
  osState.minimized = false;
  osShell.classList.add('is-active');
  osShell.classList.remove('is-minimized');
  osShell.setAttribute('aria-hidden', 'false');
  syncWindowLayout();
  updateTaskbarSessionButton();
  playSound('appRestore');
  requestAnimationFrame(() => {
    try {
      osFrame?.contentWindow?.focus();
    } catch (error) {
      if (osFrame instanceof HTMLElement) {
        osFrame.focus();
      }
    }
  });
}

function closeActiveApplet(options = {}) {
  const { skipFocus = false } = options;
  if (!osState.current) return;
  playSound('appClose');
  osState.current = null;
  osState.minimized = false;
  osState.isFullSize = true;
  if (osShell) {
    osShell.classList.remove('is-active', 'is-minimized');
    osShell.setAttribute('aria-hidden', 'true');
  }
  if (osTitle) {
    osTitle.textContent = '';
  }
  if (osIconSlot) {
    osIconSlot.replaceChildren();
  }
  if (osWindow) {
    osWindow.removeAttribute('aria-label');
  }
  if (osFrame) {
    osFrame.src = 'about:blank';
    osFrame.title = '';
  }
  syncWindowLayout();
  updateTaskbarSessionButton();
  updateBuddyVisibility();
  if (!skipFocus) {
    startButton?.focus();
  }
}

function launchApplet(record) {
  const normalized = normalizeAppletRecord(record);
  if (!normalized) return;
  const isSameApplet = osState.current?.slug === normalized.slug;
  osState.current = normalized;
  osState.minimized = false;
  osState.isFullSize = true;

  if (osShell) {
    osShell.classList.add('is-active');
    osShell.classList.remove('is-minimized');
    osShell.setAttribute('aria-hidden', 'false');
  }

  syncWindowLayout();
  playSound('appLaunch');

  const currentSrc = osFrame?.getAttribute('src');
  if (osFrame && (!isSameApplet || !currentSrc || currentSrc === 'about:blank')) {
    osFrame.src = normalized.entryUrl;
  }

  updateOsChrome(normalized);
  updateTaskbarSessionButton();
  updateBuddyVisibility();
  toggleStartMenu(false);
  allAppsPanel?.classList.remove('is-open');
  allAppsPanel?.setAttribute('aria-hidden', 'true');

  requestAnimationFrame(() => {
    try {
      osFrame?.contentWindow?.focus();
    } catch (error) {
      if (osFrame instanceof HTMLElement) {
        osFrame.focus();
      }
    }
  });
}

function toggleStartMenu(force) {
  if (!startMenu) return;
  const wasOpen = startMenu.classList.contains('is-open');
  const shouldOpen = typeof force === 'boolean' ? force : !wasOpen;
  startMenu.classList.toggle('is-open', shouldOpen);
  startMenu.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  if (shouldOpen && !wasOpen) {
    playSound('menuOpen');
  } else if (!shouldOpen && wasOpen) {
    playSound('menuClose');
  }
  if (shouldOpen) {
    requestAnimationFrame(() => startSearch?.focus());
  }
}

function toggleSettings(force) {
  if (!settingsPanel) return;
  const wasOpen = settingsPanel.classList.contains('is-open');
  const shouldOpen = typeof force === 'boolean' ? force : !wasOpen;
  settingsPanel.classList.toggle('is-open', shouldOpen);
  settingsPanel.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  if (shouldOpen && !wasOpen) {
    playSound('settingsToggleOn');
  } else if (!shouldOpen && wasOpen) {
    playSound('settingsToggleOff');
  }
  if (shouldOpen) {
    const focusable = settingsPanel.querySelector(
      'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
    );
    if (focusable instanceof HTMLElement) {
      requestAnimationFrame(() => focusable.focus());
    }
  } else if (wasOpen && settingsToggle instanceof HTMLElement) {
    settingsToggle.focus();
  }
}

function handleOutsideClick(event) {
  if (!startMenu?.classList.contains('is-open')) return;
  if (startMenu.contains(event.target) || startButton?.contains(event.target)) {
    return;
  }
  if (taskbarSearchWrapper?.contains(event.target) || taskbarSearch?.contains(event.target)) {
    return;
  }
  toggleStartMenu(false);
}

document.addEventListener('click', handleOutsideClick);

osMinimizeButton?.addEventListener('click', () => {
  if (osState.current) {
    minimizeActiveApplet();
  }
});

osResizeButton?.addEventListener('click', () => {
  if (!osState.current) return;
  osState.isFullSize = !osState.isFullSize;
  syncWindowLayout();
});

osCloseButton?.addEventListener('click', () => {
  if (osState.current) {
    closeActiveApplet();
  }
});

restartButton?.addEventListener('click', () => {
  restartDesktop();
});

bootScreen?.addEventListener('click', () => {
  playBootAnimation();
});

startButton?.addEventListener('click', () => toggleStartMenu());
startClose?.addEventListener('click', () => toggleStartMenu(false));

[startSearch, taskbarSearch].forEach((input) => {
  input?.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
    playSound('search', { throttleMs: 120, throttleKey: input === taskbarSearch ? 'taskbar-search' : 'menu-search' });
    if (input === taskbarSearch) {
      if (state.search) toggleStartMenu(true);
      if (startSearch && startSearch !== input) {
        startSearch.value = event.target.value;
      }
    } else if (taskbarSearch && taskbarSearch !== input) {
      taskbarSearch.value = event.target.value;
    }
    renderStartMenu();
  });
});

taskbarSearch?.addEventListener('focus', () => toggleStartMenu(true));

function deriveCategories(slug, name = '', description = '', tags = [], fallback = []) {
  const categories = new Set(['All', ...fallback]);
  const normalized = `${slug} ${name} ${description}`.toLowerCase();
  const lowerTags = tags.map((tag) => String(tag).toLowerCase());
  const matches = (...needles) =>
    needles.some((needle) => lowerTags.includes(needle) || normalized.includes(needle));

  if (matches('game', 'arcade', 'puzzle', 'play', 'quest', 'catch', 'runner', 'labyrinth')) {
    categories.add('Games');
  }
  if (matches('chat', 'chatbot', 'conversation', 'pen pal', 'pen-pal', 'story', 'assistant')) {
    categories.add('Chatbots');
  }
  if (matches('creative', 'art', 'paint', 'music', 'sound', 'design', 'garden', 'flavor', 'canvas', 'fossil')) {
    categories.add('Creative');
  }
  if (matches('utility', 'tool', 'note', 'planner', 'schedule', 'calendar', 'calculator', 'explorer', 'cartographer', 'workshop', 'agenda')) {
    categories.add('Utilities');
  }

  return Array.from(categories);
}

function fallbackGlyph(name) {
  return name ? name.trim().charAt(0).toUpperCase() : '🧩';
}

function updateWallpaperStatusMessage(message) {
  if (wallpaperStatus) {
    wallpaperStatus.textContent = message;
  }
}

function setThemeVariables(theme) {
  const root = document.documentElement;
  if (!root) return;
  root.style.setProperty('--wallpaper-top', theme.top);
  root.style.setProperty('--wallpaper-bottom', theme.bottom);
  if (theme.accent) {
    root.style.setProperty('--accent', theme.accent);
  }
  if (theme.accentLight) {
    root.style.setProperty('--accent-light', theme.accentLight);
  }
  root.style.setProperty('--wallpaper-image', 'none');
  if (document.body) {
    document.body.dataset.wallpaper = theme.id;
    delete document.body.dataset.customWallpaper;
  }
}

function renderWallpaperOptions() {
  if (!wallpaperList) return;
  wallpaperList.replaceChildren();
  WALLPAPERS.forEach((wallpaper) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'settings__wallpaper';
    button.style.setProperty('--preview-top', wallpaper.top);
    button.style.setProperty('--preview-bottom', wallpaper.bottom);
    const isActive = !state.isCustomWallpaper && state.selectedWallpaperId === wallpaper.id;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
    const preview = document.createElement('div');
    preview.className = 'settings__wallpaper-preview';
    const label = document.createElement('span');
    label.textContent = wallpaper.label;
    button.append(preview, label);
    button.addEventListener('click', () => {
      applyWallpaper(wallpaper);
    });
    wallpaperList.appendChild(button);
  });
}

function persistTheme() {
  try {
    const payload = {
      selectedWallpaperId: state.selectedWallpaperId,
      customImage: state.customImage?.dataUrl ?? null,
      isCustomWallpaper: state.isCustomWallpaper,
    };
    window.localStorage?.setItem(THEME_STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Unable to save theme settings', error);
  }
}

function applyWallpaper(wallpaper, options = {}) {
  if (!wallpaper) return;
  state.wallpaper = wallpaper;
  state.selectedWallpaperId = wallpaper.id;
  state.isCustomWallpaper = false;
  state.customImage = null;
  setThemeVariables(wallpaper);
  if (wallpaperClear) {
    wallpaperClear.disabled = true;
  }
  updateWallpaperStatusMessage(`${wallpaper.label} wallpaper applied.`);
  renderWallpaperOptions();
  if (!options.skipPersist) {
    persistTheme();
  }
}

function applyCustomImage(dataUrl, options = {}) {
  if (!dataUrl) return;
  const root = document.documentElement;
  if (!root) return;
  state.isCustomWallpaper = true;
  state.customImage = { dataUrl };
  const fallback = WALLPAPERS.find((item) => item.id === state.selectedWallpaperId) ?? DEFAULT_WALLPAPER;
  root.style.setProperty('--wallpaper-image', `url("${dataUrl}")`);
  root.style.setProperty('--wallpaper-top', 'rgba(13, 34, 55, 0.78)');
  root.style.setProperty('--wallpaper-bottom', 'rgba(8, 23, 41, 0.78)');
  if (fallback.accent) {
    root.style.setProperty('--accent', fallback.accent);
  }
  if (fallback.accentLight) {
    root.style.setProperty('--accent-light', fallback.accentLight);
  }
  if (document.body) {
    document.body.dataset.customWallpaper = 'true';
  }
  updateWallpaperStatusMessage('Custom image active. Stored locally on this device.');
  if (wallpaperClear) {
    wallpaperClear.disabled = false;
  }
  renderWallpaperOptions();
  if (!options.skipPersist) {
    persistTheme();
  }
}

function clearCustomImage() {
  if (!state.isCustomWallpaper) return;
  const fallback = WALLPAPERS.find((item) => item.id === state.selectedWallpaperId) ?? DEFAULT_WALLPAPER;
  applyWallpaper(fallback);
}

function restoreTheme() {
  let saved;
  try {
    const stored = window.localStorage?.getItem(THEME_STORAGE_KEY);
    if (stored) {
      saved = JSON.parse(stored);
    }
  } catch (error) {
    console.warn('Unable to restore theme settings', error);
  }
  const fallback = WALLPAPERS.find((item) => item.id === saved?.selectedWallpaperId) ?? DEFAULT_WALLPAPER;
  applyWallpaper(fallback, { skipPersist: true });
  if (saved?.customImage && saved.isCustomWallpaper) {
    applyCustomImage(saved.customImage, { skipPersist: true });
  }
}

function createIconElement({ iconUrl, emoji, label, className }) {
  const wrapper = document.createElement('div');
  wrapper.className = className;
  if (iconUrl) {
    const img = document.createElement('img');
    img.src = iconUrl;
    img.alt = `${label} icon`;
    wrapper.appendChild(img);
  } else {
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = emoji ?? fallbackGlyph(label);
    wrapper.appendChild(span);
  }
  return wrapper;
}

function createPinnedItem(record) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'start-menu__pin';
  if (!record.entryUrl) {
    button.classList.add('is-disabled');
    button.title = `${record.name} (coming soon)`;
    button.setAttribute('aria-disabled', 'true');
  } else {
    button.title = `Open ${record.name}`;
    button.addEventListener('click', () => {
      launchApplet(record);
    });
  }

  const icon = createIconElement({
    iconUrl: record.iconUrl,
    emoji: record.emoji,
    label: record.name,
    className: 'start-menu__pin-icon',
  });

  const title = document.createElement('span');
  title.className = 'start-menu__pin-title';
  title.textContent = record.name;

  const desc = document.createElement('p');
  desc.className = 'start-menu__pin-desc';
  desc.textContent = record.description;

  button.append(icon, title, desc);
  return button;
}

function createMenuItem(record) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'start-menu__item';
  if (!record.entryUrl) {
    button.classList.add('is-disabled');
    button.title = `${record.name} (coming soon)`;
    button.setAttribute('aria-disabled', 'true');
  } else {
    button.title = `Open ${record.name}`;
    button.addEventListener('click', () => {
      launchApplet(record);
    });
  }

  const icon = createIconElement({
    iconUrl: record.iconUrl,
    emoji: record.emoji,
    label: record.name,
    className: 'start-menu__item-icon',
  });

  const content = document.createElement('div');
  content.className = 'start-menu__item-content';

  const title = document.createElement('span');
  title.className = 'start-menu__item-title';
  title.textContent = record.name;

  const desc = document.createElement('p');
  desc.className = 'start-menu__item-desc';
  desc.textContent = record.description;

  content.append(title, desc);
  button.append(icon, content);
  return button;
}

function clearDeleteTimer(element) {
  const timerId = deleteRevealTimers.get(element);
  if (typeof timerId === 'number') {
    window.clearTimeout(timerId);
  }
  deleteRevealTimers.delete(element);
}

function hasDesktopShortcut(slug) {
  return state.desktopShortcuts.some((shortcut) => shortcut.slug === slug);
}

function getShortcutRecord(slug) {
  return getAppletRecord(slug);
}

function syncShortcutButton(slug) {
  const button = shortcutButtonMap.get(slug);
  if (!button) return;
  const isAdded = hasDesktopShortcut(slug);
  button.disabled = isAdded;
  button.textContent = isAdded ? 'Shortcut added' : 'Add shortcut';
  const appName = button.dataset.appName || 'this applet';
  const addTitle = button.dataset.titleAdd;
  const addedTitle = button.dataset.titleAdded;
  if (isAdded) {
    button.title = addedTitle || button.title;
    button.setAttribute('aria-label', `${appName} already has a desktop shortcut`);
  } else {
    button.title = addTitle || button.title;
    button.setAttribute('aria-label', `Add ${appName} to desktop`);
  }
}

function syncShortcutButtons() {
  shortcutButtonMap.forEach((_, slug) => {
    syncShortcutButton(slug);
  });
}

function addDesktopShortcut(slug, fallbackRecord) {
  if (hasDesktopShortcut(slug)) return;
  const source = getShortcutRecord(slug) || fallbackRecord;
  if (!source) return;
  const entry = {
    slug: source.slug ?? slug,
    name: source.name ?? slug,
    entryUrl: source.entryUrl ?? null,
    iconUrl: source.iconUrl ?? null,
    emoji: source.emoji ?? fallbackGlyph(source.name ?? slug),
  };
  state.desktopShortcuts.push(entry);
  renderShortcuts();
}

function removeDesktopShortcut(slug) {
  const index = state.desktopShortcuts.findIndex((shortcut) => shortcut.slug === slug);
  if (index === -1) return;
  state.desktopShortcuts.splice(index, 1);
  renderShortcuts();
}

function moveDesktopShortcut(slug, targetSlug = null, placeAfter = false) {
  if (slug === targetSlug) return;
  const currentIndex = state.desktopShortcuts.findIndex((shortcut) => shortcut.slug === slug);
  if (currentIndex === -1) return;
  const [entry] = state.desktopShortcuts.splice(currentIndex, 1);
  let nextIndex;
  if (!targetSlug) {
    nextIndex = state.desktopShortcuts.length;
  } else {
    nextIndex = state.desktopShortcuts.findIndex((shortcut) => shortcut.slug === targetSlug);
    if (nextIndex === -1) {
      nextIndex = state.desktopShortcuts.length;
    } else if (placeAfter) {
      nextIndex += 1;
    }
  }
  state.desktopShortcuts.splice(nextIndex, 0, entry);
  renderShortcuts();
}

function handleShortcutDragStart(event) {
  const shortcut = event.currentTarget;
  if (!(shortcut instanceof HTMLElement)) return;
  const slug = shortcut.dataset.slug;
  if (!slug) return;
  draggedShortcutSlug = slug;
  shortcut.classList.add('is-dragging');
  if (event.dataTransfer) {
    event.dataTransfer.setData('text/plain', slug);
    event.dataTransfer.effectAllowed = 'move';
  }
}

function handleShortcutDragEnd(event) {
  const shortcut = event.currentTarget;
  if (shortcut instanceof HTMLElement) {
    shortcut.classList.remove('is-dragging');
  }
  draggedShortcutSlug = null;
}

function handleShortcutDragOver(event) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }
}

function handleShortcutDrop(event) {
  event.preventDefault();
  const slug = draggedShortcutSlug || event.dataTransfer?.getData('text/plain');
  if (!slug) return;
  const target = event.target instanceof Element ? event.target.closest('.shortcut') : null;
  if (target && target instanceof HTMLElement && target.dataset.slug) {
    const bounds = target.getBoundingClientRect();
    const isAfter = event.clientY > bounds.top + bounds.height / 2;
    moveDesktopShortcut(slug, target.dataset.slug, isAfter);
  } else {
    moveDesktopShortcut(slug, null, false);
  }
  draggedShortcutSlug = null;
}

function createShortcut(record) {
  const shortcut = document.createElement('div');
  shortcut.className = 'shortcut';
  shortcut.dataset.slug = record.slug;
  shortcut.setAttribute('role', 'button');
  shortcut.setAttribute('tabindex', '0');
  shortcut.draggable = true;

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'shortcut__delete';
  deleteButton.setAttribute('aria-label', `Remove ${record.name} shortcut`);
  deleteButton.textContent = '×';
  deleteButton.tabIndex = -1;

  const showDelete = () => {
    clearDeleteTimer(shortcut);
    shortcut.classList.add('show-delete');
    deleteButton.tabIndex = 0;
  };

  const hideDelete = () => {
    clearDeleteTimer(shortcut);
    shortcut.classList.remove('show-delete');
    deleteButton.tabIndex = -1;
  };

  if (!record.entryUrl) {
    shortcut.classList.add('is-disabled');
    shortcut.title = `${record.name} (coming soon)`;
    shortcut.setAttribute('aria-disabled', 'true');
  } else {
    shortcut.title = `Open ${record.name}`;
    const openShortcut = () => {
      launchApplet(record);
    };
    shortcut.addEventListener('dblclick', openShortcut);
    shortcut.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openShortcut();
      }
    });
  }

  shortcut.addEventListener('mouseenter', () => {
    if (shortcut.classList.contains('show-delete')) return;
    clearDeleteTimer(shortcut);
    const timerId = window.setTimeout(() => {
      showDelete();
    }, DELETE_REVEAL_DELAY);
    deleteRevealTimers.set(shortcut, timerId);
  });

  shortcut.addEventListener('mouseleave', (event) => {
    const next = event.relatedTarget;
    if (next instanceof HTMLElement && shortcut.contains(next)) {
      return;
    }
    hideDelete();
  });

  shortcut.addEventListener('focus', () => {
    showDelete();
  });

  shortcut.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if (next instanceof HTMLElement && shortcut.contains(next)) {
      return;
    }
    hideDelete();
  });

  shortcut.addEventListener('dragstart', handleShortcutDragStart);
  shortcut.addEventListener('dragend', (event) => {
    handleShortcutDragEnd(event);
    hideDelete();
  });

  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    removeDesktopShortcut(record.slug);
  });

  deleteButton.addEventListener('focus', showDelete);

  const icon = createIconElement({
    iconUrl: record.iconUrl,
    emoji: record.emoji,
    label: record.name,
    className: 'shortcut__icon',
  });

  const label = document.createElement('span');
  label.className = 'shortcut__label';
  label.textContent = record.name;

  shortcut.append(deleteButton, icon, label);
  return shortcut;
}

function renderPinned() {
  if (!pinnedList) return;
  pinnedList.replaceChildren();
  state.pinned.forEach((record) => {
    const pin = createPinnedItem(record);
    pinnedList.appendChild(pin);
  });
  if (pinnedSection) {
    pinnedSection.hidden = state.pinned.length === 0;
  }
}

function renderCategories() {
  if (!categoryList) return;
  categoryList.replaceChildren();
  CATEGORY_ORDER.forEach((category) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = category;
    button.classList.toggle('is-active', state.category === category);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      state.category = category;
      renderCategories();
      renderStartMenu();
    });
    categoryList.appendChild(button);
  });
}

function renderMenuList(records) {
  if (!menuList || !emptyState) return;
  menuList.replaceChildren();
  if (!records.length) {
    emptyState.hidden = false;
    return;
  }
  emptyState.hidden = true;
  records.forEach((record) => {
    const item = createMenuItem(record);
    menuList.appendChild(item);
  });
}

function renderShortcuts() {
  if (!shortcutContainer) return;
  shortcutContainer.replaceChildren();
  state.desktopShortcuts.forEach((record) => {
    const shortcut = createShortcut(record);
    shortcutContainer.appendChild(shortcut);
  });
  syncShortcutButtons();
}

shortcutContainer?.addEventListener('dragover', handleShortcutDragOver);
shortcutContainer?.addEventListener('drop', handleShortcutDrop);

function renderStartMenu() {
  const query = state.search;
  const category = state.category;

  const filtered = state.records.filter((record) => {
    const matchesCategory = category === 'All' || record.categories.includes(category);
    const matchesSearch = !query || `${record.name} ${record.description}`.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (pinnedSection) {
    const shouldHidePinned = Boolean(query);
    pinnedSection.style.display = shouldHidePinned ? 'none' : '';
  }

  const listRecords = filtered.filter((record) => {
    if (!query && (record.isPinned || record.placeholder)) return false;
    if (record.placeholder) return Boolean(query);
    return true;
  });

  renderMenuList(listRecords);
}

function initSettings() {
  renderWallpaperOptions();
  restoreTheme();
  settingsToggle?.addEventListener('click', () => {
    toggleSettings();
    toggleStartMenu(false);
  });
  settingsClose?.addEventListener('click', () => toggleSettings(false));
  settingsPanel?.addEventListener('click', (event) => {
    if (event.target === settingsPanel) {
      toggleSettings(false);
    }
  });
  wallpaperUpload?.addEventListener('change', (event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || !input.files?.length) return;
    const [file] = input.files;
    if (file.size > 6 * 1024 * 1024) {
      updateWallpaperStatusMessage('Please choose an image smaller than 6 MB.');
      input.value = '';
      return;
    }
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string') {
        applyCustomImage(reader.result);
      }
    });
    reader.readAsDataURL(file);
    input.value = '';
  });
  wallpaperClear?.addEventListener('click', () => {
    clearCustomImage();
  });
  if (wallpaperClear) {
    wallpaperClear.disabled = !state.isCustomWallpaper;
  }
}

function createFallbackTile(title, description) {
  const tile = document.createElement('article');
  tile.className = 'tile tile--fallback';
  tile.innerHTML = `
    <div class="tile__icon tile__icon--fallback" aria-hidden="true">
      <span>⚠️</span>
    </div>
    <h2 class="tile__heading">${title}</h2>
    <p class="tile__description">${description}</p>
  `;
  return tile;
}

function applyFallbackIcon(wrapper) {
  wrapper.classList.add('tile__icon--fallback');
  wrapper.replaceChildren();
  const span = document.createElement('span');
  span.setAttribute('aria-hidden', 'true');
  span.textContent = '🧩';
  wrapper.appendChild(span);
}

function createTile(slug, metadata, resolvedEntryUrl, iconUrl) {
  const tile = document.createElement('article');
  tile.className = 'tile';
  tile.setAttribute('tabindex', '-1');

  const iconWrapper = document.createElement('div');
  iconWrapper.className = 'tile__icon';

  if (iconUrl) {
    const img = document.createElement('img');
    img.alt = `${metadata.name} icon`;
    img.src = iconUrl;
    img.addEventListener('error', () => {
      applyFallbackIcon(iconWrapper);
    });
    iconWrapper.appendChild(img);
  } else {
    applyFallbackIcon(iconWrapper);
  }

  const heading = document.createElement('h2');
  heading.className = 'tile__heading';
  heading.textContent = metadata.name;

  const description = document.createElement('p');
  description.className = 'tile__description';
  description.textContent = metadata.description;

  tile.append(iconWrapper, heading, description);

  if (Array.isArray(metadata.tags) && metadata.tags.length) {
    const tagList = document.createElement('ul');
    tagList.className = 'tile__tags';
    for (const tag of metadata.tags) {
      if (typeof tag !== 'string' || !tag.trim()) continue;
      const li = document.createElement('li');
      li.className = 'tile__tag';
      li.textContent = tag;
      tagList.appendChild(li);
    }
    if (tagList.childElementCount) {
      tile.appendChild(tagList);
    }
  }

  const actions = document.createElement('div');
  actions.className = 'tile__actions';

  const shortcutButton = document.createElement('button');
  shortcutButton.type = 'button';
  shortcutButton.className = 'tile__action tile__action--ghost';
  shortcutButton.dataset.slug = slug;
  shortcutButton.textContent = 'Add shortcut';
  const addTitle = `Create a desktop shortcut for ${metadata.name}`;
  const addedTitle = `${metadata.name} is already on the desktop`;
  shortcutButton.title = addTitle;
  shortcutButton.dataset.titleAdd = addTitle;
  shortcutButton.dataset.titleAdded = addedTitle;
  shortcutButton.dataset.appName = metadata.name;
  shortcutButton.setAttribute('aria-label', `Add ${metadata.name} to desktop`);

  const fallbackRecord = {
    slug,
    name: metadata.name,
    description: metadata.description,
    entryUrl: resolvedEntryUrl,
    iconUrl,
    emoji: fallbackGlyph(metadata.name),
  };

  shortcutButton.addEventListener('click', () => {
    addDesktopShortcut(slug, fallbackRecord);
  });

  if (slug) {
    shortcutButtonMap.set(slug, shortcutButton);
    syncShortcutButton(slug);
  }

  const openLink = document.createElement('a');
  openLink.className = 'tile__action tile__action--primary';
  openLink.href = resolvedEntryUrl;
  openLink.setAttribute('aria-label', `Open ${metadata.name}`);
  openLink.textContent = 'Open';
  openLink.addEventListener('click', (event) => {
    event.preventDefault();
    launchApplet(fallbackRecord);
  });

  actions.append(shortcutButton, openLink);
  tile.appendChild(actions);
  return tile;
}

async function loadApplet(slug, metadataPath) {
  let response;
  try {
    response = await fetch(metadataPath);
  } catch (error) {
    console.error(`Network error while fetching metadata for "${slug}":`, error);
    return {
      status: 'error',
      slug,
      tile: createFallbackTile(
        `${slug} unavailable`,
        'We could not contact the metadata endpoint for this applet. Please try again later.'
      ),
    };
  }

  if (!response.ok) {
    console.error(`Failed to fetch metadata for "${slug}". HTTP status ${response.status}`);
    return {
      status: 'error',
      slug,
      tile: createFallbackTile(
        `${slug} unavailable`,
        'The metadata file could not be retrieved. Check the registry configuration.'
      ),
    };
  }

  let metadata;
  try {
    metadata = await response.json();
  } catch (error) {
    console.error(`Invalid JSON in metadata for "${slug}":`, error);
    return {
      status: 'error',
      slug,
      tile: createFallbackTile(
        `${slug} unavailable`,
        'The metadata file is not valid JSON. Contact the applet maintainer.'
      ),
    };
  }

  const resolvedEntryUrl = (() => {
    if (typeof metadata.entry !== 'string' || !metadata.entry.trim()) {
      console.error(`Missing entry URL in metadata for "${slug}"`);
      return null;
    }
    try {
      return new URL(metadata.entry, response.url).href;
    } catch (error) {
      console.error(`Could not resolve entry URL for "${slug}":`, error);
      return null;
    }
  })();

  if (!resolvedEntryUrl || typeof metadata.name !== 'string' || typeof metadata.description !== 'string') {
    return {
      status: 'error',
      slug,
      tile: createFallbackTile(
        `${metadata.name ?? slug} unavailable`,
        'Required metadata fields are missing. Please update the applet configuration.'
      ),
    };
  }

  let iconUrl = null;
  if (typeof metadata.icon === 'string' && metadata.icon.trim()) {
    try {
      iconUrl = new URL(metadata.icon, response.url).href;
    } catch (error) {
      console.error(`Could not resolve icon URL for "${slug}":`, error);
    }
  }

  const tile = createTile(slug, metadata, resolvedEntryUrl, iconUrl);

  return {
    status: 'ok',
    slug,
    metadata,
    entryUrl: resolvedEntryUrl,
    iconUrl,
    tile,
  };
}

function buildPinnedRecords(map) {
  return PINNED_CONFIG.map((config) => {
    const match = map.get(config.slug);
    if (match) {
      return {
        slug: match.slug,
        name: match.metadata.name,
        description: match.metadata.description,
        entryUrl: match.entryUrl,
        iconUrl: match.iconUrl,
        emoji: config.emoji,
        categories: deriveCategories(
          match.slug,
          match.metadata.name,
          match.metadata.description,
          match.metadata.tags ?? [],
          config.categories
        ),
        isPinned: true,
      };
    }
    return {
      slug: config.slug,
      name: config.label,
      description: `${config.hint} • Install pending`,
      entryUrl: null,
      iconUrl: null,
      emoji: config.emoji,
      categories: ['All', ...config.categories],
      placeholder: true,
      isPinned: true,
    };
  });
}

function buildAllRecords(map, pinned) {
  const pinnedSlugs = new Set(pinned.map((record) => record.slug));
  const records = pinned.map((record) => ({ ...record }));

  map.forEach((value, slug) => {
    if (pinnedSlugs.has(slug)) return;
    records.push({
      slug,
      name: value.metadata.name,
      description: value.metadata.description,
      entryUrl: value.entryUrl,
      iconUrl: value.iconUrl,
      emoji: fallbackGlyph(value.metadata.name),
      categories: deriveCategories(slug, value.metadata.name, value.metadata.description, value.metadata.tags ?? []),
      isPinned: false,
    });
  });

  return records.sort((a, b) => a.name.localeCompare(b.name));
}

function initializeDesktop(results) {
  const map = new Map(results.map((result) => [result.slug, result]));
  state.pinned = buildPinnedRecords(map);
  state.records = buildAllRecords(map, state.pinned);
  state.desktopShortcuts = state.pinned.map((record) => ({
    slug: record.slug,
    name: record.name,
    entryUrl: record.entryUrl,
    iconUrl: record.iconUrl,
    emoji: record.emoji,
  }));
  updateBuddyAppletDigest();
  renderPinned();
  renderCategories();
  renderStartMenu();
  renderShortcuts();
  if (pendingClockLaunch) {
    attemptLaunchClockApplet();
  }
}

function initAllAppsPanel() {
  openAllAppsButton?.addEventListener('click', () => {
    allAppsPanel?.classList.add('is-open');
    allAppsPanel?.setAttribute('aria-hidden', 'false');
    toggleStartMenu(false);
  });
  closeAllAppsButton?.addEventListener('click', () => {
    allAppsPanel?.classList.remove('is-open');
    allAppsPanel?.setAttribute('aria-hidden', 'true');
  });
  allAppsPanel?.addEventListener('click', (event) => {
    if (event.target === allAppsPanel) {
      allAppsPanel.classList.remove('is-open');
      allAppsPanel.setAttribute('aria-hidden', 'true');
    }
  });
}

function updateStatus(message) {
  if (status) {
    status.textContent = message;
  }
}

function initKeyboardShortcuts() {
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      toggleStartMenu(false);
      allAppsPanel?.classList.remove('is-open');
      allAppsPanel?.setAttribute('aria-hidden', 'true');
      toggleSettings(false);
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      toggleStartMenu(true);
    }
    if ((event.metaKey || event.ctrlKey) && event.key === ',') {
      event.preventDefault();
      toggleSettings(true);
    }
  });
}

async function init() {
  updateStatus('Loading applets…');
  initAllAppsPanel();
  initKeyboardShortcuts();
  initSettings();
  initDesktopBuddy();
  let registry;
  try {
    const res = await fetch('./applets.json');
    if (!res.ok) {
      throw new Error(`Failed to load registry. HTTP status ${res.status}`);
    }
    registry = await res.json();
  } catch (error) {
    console.error('Unable to load applet registry:', error);
    if (grid) {
      grid.appendChild(
        createFallbackTile(
          'No applets available',
          'The dashboard could not load the registry configuration. Refresh to retry or contact support.'
        )
      );
    }
    updateStatus('Unable to load applets.');
    return;
  }

  const entries = Object.entries(registry || {});
  if (!entries.length) {
    if (grid) {
      grid.appendChild(
        createFallbackTile(
          'No applets registered',
          'There are currently no applets in the registry. Add entries to dashboard/applets.json to get started.'
        )
      );
    }
    updateStatus('No applets registered.');
    return;
  }

  const results = [];
  for (const [slug, metadataPath] of entries) {
    const outcome = await loadApplet(slug, metadataPath);
    if (grid) {
      grid.appendChild(outcome.tile);
    }
    if (outcome.status === 'ok') {
      results.push(outcome);
    }
  }

  updateStatus('Applet list loaded.');
  initializeDesktop(results);
}

playBootAnimation();
init();
