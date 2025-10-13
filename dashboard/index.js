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

const shortcutButtonMap = new Map();
const deleteRevealTimers = new WeakMap();
let draggedShortcutSlug = null;
const DELETE_REVEAL_DELAY = 1200;

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
};

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
  clockDisplay.textContent = `${hours}:${minutes}`;
}

setInterval(updateClock, 30_000);
updateClock();

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

function closeActiveApplet() {
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
  startButton?.focus();
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
  return (
    state.records.find((record) => record.slug === slug) ||
    state.pinned.find((record) => record.slug === slug) ||
    null
  );
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
  renderPinned();
  renderCategories();
  renderStartMenu();
  renderShortcuts();
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

init();
