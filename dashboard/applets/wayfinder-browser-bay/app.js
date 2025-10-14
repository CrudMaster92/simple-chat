const addressInput = document.querySelector('#address-input');
const launchButton = document.querySelector('#launch-button');
const clearButton = document.querySelector('#clear-button');
const searchModeSelect = document.querySelector('#search-mode');
const activeDomain = document.querySelector('#active-domain');
const historyList = document.querySelector('#history-list');
const pinButton = document.querySelector('#pin-button');
const pinNote = document.querySelector('#pin-note');
const pinList = document.querySelector('#pin-list');
const viewerStatus = document.querySelector('#viewer-status');
const focusToggle = document.querySelector('#focus-toggle');
const viewerFrame = document.querySelector('#viewer-frame');
const iframe = document.querySelector('#browser-frame');
const frameOverlay = document.querySelector('#frame-overlay');

let currentUrl = '';
let overlayTimer = null;
const visitHistory = [];

function announce(text) {
  viewerStatus.textContent = text;
}

function normaliseInput(rawValue) {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  const containsWhitespace = /\s/.test(value);
  const hasProtocol = /^(https?:|file:)/i.test(value);
  const hasDot = /\.[a-z]{2,}(\/|$)/i.test(value);

  if (!containsWhitespace && (hasProtocol || hasDot)) {
    return ensureProtocol(value);
  }

  return buildSearchUrl(value, searchModeSelect.value);
}

function ensureProtocol(value) {
  try {
    const parsed = new URL(value);
    return parsed.href;
  } catch (error) {
    try {
      const withProtocol = new URL(`https://${value}`);
      return withProtocol.href;
    } catch (innerError) {
      return null;
    }
  }
}

function buildSearchUrl(query, mode) {
  const encoded = encodeURIComponent(query);
  switch (mode) {
    case 'wikipedia':
      return `https://en.wikipedia.org/wiki/Special:Search?search=${encoded}`;
    case 'mdn':
      return `https://developer.mozilla.org/en-US/search?q=${encoded}`;
    case 'duckduckgo':
    default:
      return `https://duckduckgo.com/?q=${encoded}`;
  }
}

function updateDomainDisplay(url) {
  try {
    const parsed = new URL(url);
    activeDomain.textContent = parsed.hostname.replace(/^www\./, '');
  } catch (error) {
    activeDomain.textContent = '—';
  }
}

function recordHistory(url) {
  const label = extractLabel(url);
  const existingIndex = visitHistory.findIndex((entry) => entry.url === url);
  if (existingIndex !== -1) {
    visitHistory.splice(existingIndex, 1);
  }
  visitHistory.unshift({ url, label });
  if (visitHistory.length > 8) {
    visitHistory.length = 8;
  }
  renderHistory();
}

function extractLabel(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (error) {
    return url;
  }
}

function renderHistory() {
  historyList.innerHTML = '';
  visitHistory.forEach(({ url, label }) => {
    const item = document.createElement('li');
    const span = document.createElement('span');
    span.textContent = label;

    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'Load';
    button.addEventListener('click', () => navigateTo(url));

    item.append(span, button);
    historyList.append(item);
  });
}

function renderOverlayWithDelay() {
  if (overlayTimer) {
    clearTimeout(overlayTimer);
  }
  frameOverlay.classList.add('hidden');
  overlayTimer = window.setTimeout(() => {
    frameOverlay.classList.remove('hidden');
  }, 6500);
}

function navigateTo(url) {
  if (!url) {
    announce('Enter an address or query to begin exploring.');
    return;
  }

  currentUrl = url;
  updateDomainDisplay(url);
  announce('Loading canvas…');
  renderOverlayWithDelay();
  iframe.src = url;
  recordHistory(url);
}

function handleLaunch() {
  const target = normaliseInput(addressInput.value);
  if (!target) {
    announce('Enter a full address or search phrase first.');
    return;
  }
  navigateTo(target);
}

function handleClear() {
  addressInput.value = '';
  announce('Console cleared. Ready for a fresh heading.');
  addressInput.focus();
}

function formatTimestamp(date) {
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

function handlePin() {
  if (!currentUrl) {
    announce('Launch a page before pinning a note.');
    return;
  }

  const pinnedUrl = currentUrl;
  const noteText = pinNote.value.trim();
  const label = extractLabel(pinnedUrl);
  const timestamp = formatTimestamp(new Date());

  const listItem = document.createElement('li');
  const link = document.createElement('a');
  link.href = pinnedUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.textContent = label;

  const note = document.createElement('p');
  note.className = 'pin-note';
  note.textContent = noteText || 'Saved without a note.';

  const meta = document.createElement('span');
  meta.className = 'pin-meta';
  meta.textContent = `Pinned at ${timestamp}`;

  const actions = document.createElement('div');
  actions.className = 'pin-actions';

  const loadButton = document.createElement('button');
  loadButton.type = 'button';
  loadButton.className = 'pin-action';
  loadButton.textContent = 'Load in canvas';
  loadButton.addEventListener('click', () => navigateTo(pinnedUrl));

  const copyButton = document.createElement('button');
  copyButton.type = 'button';
  copyButton.className = 'pin-action';
  copyButton.textContent = 'Copy link';
  copyButton.addEventListener('click', () => copyLink(pinnedUrl));

  actions.append(loadButton, copyButton);
  listItem.append(link, note, meta, actions);
  pinList.prepend(listItem);
  pinNote.value = '';
  announce('Pin added to the session board.');
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url);
    announce('Link copied to clipboard.');
  } catch (error) {
    announce('Unable to access clipboard in this context.');
  }
}

launchButton.addEventListener('click', handleLaunch);
clearButton.addEventListener('click', handleClear);
pinButton.addEventListener('click', handlePin);
focusToggle.addEventListener('click', () => {
  viewerFrame.classList.toggle('focused');
});

addressInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    handleLaunch();
  }
});

iframe.addEventListener('load', () => {
  if (overlayTimer) {
    clearTimeout(overlayTimer);
  }
  frameOverlay.classList.add('hidden');
  if (currentUrl) {
    announce(`Docked at ${extractLabel(currentUrl)}.`);
  } else {
    announce('Ready for launch.');
  }
});

frameOverlay.addEventListener('click', () => {
  frameOverlay.classList.add('hidden');
});

announce('Enter an address or search phrase to begin.');
