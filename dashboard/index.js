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

const shortcutButtonMap = new Map();
const deleteRevealTimers = new WeakMap();
let draggedShortcutSlug = null;
const DELETE_REVEAL_DELAY = 1200;

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
];

const CATEGORY_ORDER = ['All', 'Games', 'Creative', 'Chatbots', 'Utilities'];

const state = {
  records: [],
  pinned: [],
  search: '',
  category: 'All',
  desktopShortcuts: [],
};

function updateClock() {
  if (!clockDisplay) return;
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  clockDisplay.textContent = `${hours}:${minutes}`;
}

setInterval(updateClock, 30_000);
updateClock();

function toggleStartMenu(force) {
  if (!startMenu) return;
  const shouldOpen = typeof force === 'boolean' ? force : !startMenu.classList.contains('is-open');
  startMenu.classList.toggle('is-open', shouldOpen);
  startMenu.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  if (shouldOpen) {
    requestAnimationFrame(() => startSearch?.focus());
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

startButton?.addEventListener('click', () => toggleStartMenu());
startClose?.addEventListener('click', () => toggleStartMenu(false));

[startSearch, taskbarSearch].forEach((input) => {
  input?.addEventListener('input', (event) => {
    state.search = event.target.value.trim().toLowerCase();
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
      window.open(record.entryUrl, '_blank', 'noopener');
      toggleStartMenu(false);
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
      window.open(record.entryUrl, '_blank', 'noopener');
      toggleStartMenu(false);
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
      window.open(record.entryUrl, '_blank', 'noopener');
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
    button.addEventListener('click', () => {
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
  openLink.target = '_blank';
  openLink.rel = 'noopener noreferrer';
  openLink.setAttribute('aria-label', `Open ${metadata.name}`);
  openLink.textContent = 'Open';

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
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'e') {
      event.preventDefault();
      toggleStartMenu(true);
    }
  });
}

async function init() {
  updateStatus('Loading applets…');
  initAllAppsPanel();
  initKeyboardShortcuts();
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
