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

function createShortcut(record) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'shortcut';
  if (!record.entryUrl) {
    button.classList.add('is-disabled');
    button.title = `${record.name} (coming soon)`;
    button.setAttribute('aria-disabled', 'true');
  } else {
    button.title = `Open ${record.name}`;
    button.addEventListener('dblclick', () => {
      window.open(record.entryUrl, '_blank', 'noopener');
    });
  }

  const icon = createIconElement({
    iconUrl: record.iconUrl,
    emoji: record.emoji,
    label: record.name,
    className: 'shortcut__icon',
  });

  const label = document.createElement('span');
  label.className = 'shortcut__label';
  label.textContent = record.name;

  button.append(icon, label);
  return button;
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
  state.pinned.forEach((record) => {
    const shortcut = createShortcut(record);
    shortcutContainer.appendChild(shortcut);
  });
}

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

function createTile(metadata, resolvedEntryUrl, iconUrl) {
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

  const openLink = document.createElement('a');
  openLink.className = 'tile__action';
  openLink.href = resolvedEntryUrl;
  openLink.target = '_blank';
  openLink.rel = 'noopener noreferrer';
  openLink.setAttribute('aria-label', `Open ${metadata.name}`);
  openLink.textContent = 'Open';

  tile.appendChild(openLink);
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

  const tile = createTile(metadata, resolvedEntryUrl, iconUrl);

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
