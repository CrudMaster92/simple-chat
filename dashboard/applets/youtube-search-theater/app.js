const API_KEY = "sk-proj-X8U3_Ax-rLUXFgUiwReW2Gc8VWW3WPxefsYJkpJJu8TgyJuf3Nt26T0xIFNJk_KPGI4";
const STORAGE_KEY = "youtubeSearchTheater.apiKey";
const API_KEY_INVALID_ERROR = "API_KEY_INVALID";
const API_KEY_STATUS_LABELS = {
  missing: "Set API key",
  ready: "Update API key",
  invalid: "Fix API key",
};

const storage = {
  get(key) {
    try {
      return window.localStorage?.getItem(key) ?? null;
    } catch (error) {
      console.warn("localStorage get failed", error);
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage?.setItem(key, value);
    } catch (error) {
      console.warn("localStorage set failed", error);
    }
  },
  remove(key) {
    try {
      window.localStorage?.removeItem(key);
    } catch (error) {
      console.warn("localStorage remove failed", error);
    }
  },
};

const state = {
  apiKey: API_KEY,
  query: "",
  order: "relevance",
  safeSearch: "moderate",
  nextPageToken: null,
  prevPageToken: null,
  results: [],
  selectedVideoId: null,
  apiKeyStatus: "unknown",
};

const elements = {
  searchForm: document.querySelector(".search-form"),
  queryInput: document.querySelector("#query"),
  orderSelect: document.querySelector("#order"),
  safeSearchSelect: document.querySelector("#safeSearch"),
  resultsGrid: document.querySelector(".results-grid"),
  resultsStatus: document.querySelector(".results-status"),
  navButtons: Array.from(document.querySelectorAll(".nav-button")),
  playerShell: document.querySelector("[data-player-shell]"),
  videoMeta: document.querySelector(".video-meta"),
  apiKeyButton: document.querySelector("[data-api-key-button]"),
  apiKeyLabel: document.querySelector("[data-api-key-label]"),
};

function init() {
  hydrateApiKeyFromStorage();
  updateApiKeyDisplay();
  if (!hasLikelyValidApiKey()) {
    setStatus(
      elements.resultsStatus,
      "Add your YouTube Data API key using the key button in the header before searching."
    );
  }

  elements.searchForm.addEventListener("submit", handleSearchSubmit);
  elements.orderSelect.addEventListener("change", (event) => {
    state.order = event.target.value;
    if (state.query) {
      performSearch();
    }
  });
  elements.safeSearchSelect.addEventListener("change", (event) => {
    state.safeSearch = event.target.value;
    if (state.query) {
      performSearch();
    }
  });

  if (elements.apiKeyButton) {
    elements.apiKeyButton.addEventListener("click", handleApiKeyButtonClick);
  }

  window.addEventListener("storage", handleStorageUpdate);

  elements.navButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.direction;
      if (direction === "prev" && state.prevPageToken) {
        performSearch({ pageToken: state.prevPageToken, isPageChange: true });
      }
      if (direction === "next" && state.nextPageToken) {
        performSearch({ pageToken: state.nextPageToken, isPageChange: true });
      }
    });
  });
}

function hydrateApiKeyFromStorage() {
  const stored = getStoredApiKey();
  if (stored) {
    state.apiKey = stored;
  }
}

function handleStorageUpdate(event) {
  if (event.key !== STORAGE_KEY) return;
  const nextValue = (event.newValue ?? "").trim();
  state.apiKey = nextValue || API_KEY;
  updateApiKeyDisplay();
  if (!hasLikelyValidApiKey()) {
    setStatus(
      elements.resultsStatus,
      "Add your YouTube Data API key using the key button in the header before searching."
    );
    return;
  }
  if (state.query) {
    performSearch();
  }
}

function handleApiKeyButtonClick() {
  const existing = getStoredApiKey();
  const promptSeed = existing || (hasLikelyValidApiKey() ? state.apiKey : "");
  const input = window.prompt("Enter your YouTube Data API key:", promptSeed || "");
  if (input === null) {
    return;
  }

  const trimmed = input.trim();
  if (!trimmed) {
    clearStoredApiKey();
    state.apiKey = API_KEY;
    updateApiKeyDisplay();
    setStatus(
      elements.resultsStatus,
      "Add your YouTube Data API key using the key button in the header before searching."
    );
    return;
  }

  if (isLikelyPlaceholderKey(trimmed)) {
    clearStoredApiKey();
    state.apiKey = trimmed;
    updateApiKeyDisplay("missing");
    setStatus(
      elements.resultsStatus,
      "That key looks like a placeholder. Paste your actual YouTube Data API key to search."
    );
    return;
  }

  setStoredApiKey(trimmed);
  state.apiKey = trimmed;
  updateApiKeyDisplay("ready");

  if (state.query) {
    performSearch();
  } else {
    setStatus(elements.resultsStatus, "API key saved. Search for something to get started.");
  }
}

function getStoredApiKey() {
  const stored = storage.get(STORAGE_KEY);
  if (!stored) return null;
  const trimmed = stored.trim();
  return trimmed || null;
}

function setStoredApiKey(value) {
  storage.set(STORAGE_KEY, value);
}

function clearStoredApiKey() {
  storage.remove(STORAGE_KEY);
}

function hasLikelyValidApiKey() {
  return !isLikelyPlaceholderKey(state.apiKey);
}

function isLikelyPlaceholderKey(key) {
  if (!key) return true;
  const trimmed = String(key).trim();
  if (!trimmed) return true;
  if (API_KEY.startsWith("sk-") && trimmed.startsWith("sk-")) {
    return true;
  }
  if (API_KEY.startsWith("sk-") && trimmed === API_KEY) {
    return true;
  }
  return false;
}

function updateApiKeyDisplay(statusOverride) {
  const status = statusOverride ?? (hasLikelyValidApiKey() ? "ready" : "missing");
  state.apiKeyStatus = status;
  if (elements.apiKeyButton) {
    elements.apiKeyButton.dataset.keyState = status;
    const label = API_KEY_STATUS_LABELS[status] ?? API_KEY_STATUS_LABELS.ready;
    elements.apiKeyButton.title = `${label} for YouTube requests`;
    if (elements.apiKeyLabel) {
      elements.apiKeyLabel.textContent = label;
    }
  }
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const query = elements.queryInput.value.trim();
  if (!query) {
    setStatus(elements.resultsStatus, "Type a topic or phrase to explore videos.");
    return;
  }

  state.query = query;
  performSearch();
}

async function performSearch({ pageToken = "", isPageChange = false } = {}) {
  if (!hasLikelyValidApiKey()) {
    updateApiKeyDisplay("missing");
    toggleNavButtons(false);
    setStatus(
      elements.resultsStatus,
      "Add your YouTube Data API key using the key button in the header before searching."
    );
    return;
  }

  try {
    setStatus(elements.resultsStatus, "Searching YouTube…");
    toggleNavButtons(true);
    if (!isPageChange) {
      state.selectedVideoId = null;
      clearPlayer();
    }

    const params = new URLSearchParams({
      key: state.apiKey,
      part: "snippet",
      q: state.query,
      type: "video",
      maxResults: "9",
      order: state.order,
      safeSearch: state.safeSearch,
    });

    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const endpoint = `https://www.googleapis.com/youtube/v3/search?${params.toString()}`;
    const { ok, status, data } = await requestJson(endpoint);
    if (!ok) {
      if (isInvalidApiKeyResponse(data)) {
        handleInvalidApiKeyResponse({ clearResults: !isPageChange });
        return;
      }
      throw new Error(`Search request failed: ${status}`);
    }

    const payload = data ?? {};
    const videos = payload.items ?? [];
    state.nextPageToken = payload.nextPageToken ?? null;
    state.prevPageToken = payload.prevPageToken ?? null;

    if (!videos.length) {
      state.results = [];
      renderResults();
      toggleNavButtons(false);
      updateApiKeyDisplay("ready");
      setStatus(elements.resultsStatus, "No videos found. Try another phrase or loosen filters.");
      return;
    }

    const ids = videos
      .map((item) => item.id && item.id.videoId)
      .filter(Boolean);

    let details;
    try {
      details = await fetchVideoDetails(ids);
    } catch (error) {
      if (error?.message === API_KEY_INVALID_ERROR) {
        handleInvalidApiKeyResponse({ clearResults: !isPageChange });
        return;
      }
      throw error;
    }

    state.results = videos.map((item) => {
      const videoId = item.id.videoId;
      return {
        id: videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        channelTitle: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        thumbnail: selectBestThumbnail(item.snippet.thumbnails),
        statistics: details.get(videoId)?.statistics ?? null,
        contentDetails: details.get(videoId)?.contentDetails ?? null,
      };
    });

    renderResults();
    updateApiKeyDisplay("ready");
    setStatus(elements.resultsStatus, `Showing ${state.results.length} videos for “${state.query}”.`);
    toggleNavButtons(false);
  } catch (error) {
    if (error?.message === API_KEY_INVALID_ERROR) {
      handleInvalidApiKeyResponse({ clearResults: !isPageChange });
      return;
    }
    console.error(error);
    state.nextPageToken = null;
    state.prevPageToken = null;
    setStatus(elements.resultsStatus, "We couldn't reach YouTube right now. Try again in a moment.");
    toggleNavButtons(false);
  }
}

function handleInvalidApiKeyResponse({ clearResults = false } = {}) {
  updateApiKeyDisplay("invalid");
  state.nextPageToken = null;
  state.prevPageToken = null;
  toggleNavButtons(false);
  if (clearResults) {
    state.results = [];
    renderResults();
    state.selectedVideoId = null;
    clearPlayer();
  }
  setStatus(
    elements.resultsStatus,
    "The API key was rejected. Update it using the key button in the header."
  );
}

async function fetchVideoDetails(ids) {
  const results = new Map();
  if (!ids.length) return results;
  const params = new URLSearchParams({
    key: state.apiKey,
    part: "statistics,contentDetails",
    id: ids.join(","),
  });
  const endpoint = `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`;
  const { ok, data } = await requestJson(endpoint);
  if (!ok) {
    if (isInvalidApiKeyResponse(data)) {
      throw new Error(API_KEY_INVALID_ERROR);
    }
    return results;
  }

  (data?.items ?? []).forEach((item) => {
    results.set(item.id, {
      statistics: item.statistics || null,
      contentDetails: item.contentDetails || null,
    });
  });
  return results;
}

async function requestJson(url) {
  const response = await fetch(url);
  let payload = null;
  try {
    payload = await response.json();
  } catch (error) {
    payload = null;
  }
  return { ok: response.ok, status: response.status, data: payload };
}

function isInvalidApiKeyResponse(payload) {
  if (!payload || typeof payload !== "object") return false;
  const error = payload.error;
  if (!error) return false;
  const message = typeof error.message === "string" ? error.message.toLowerCase() : "";
  if (message.includes("api key not valid")) {
    return true;
  }
  const errors = Array.isArray(error.errors) ? error.errors : [];
  if (
    errors.some((entry) => {
      const reason = typeof entry.reason === "string" ? entry.reason.toLowerCase() : "";
      const msg = typeof entry.message === "string" ? entry.message.toLowerCase() : "";
      return reason.includes("api_key") || msg.includes("api key not valid");
    })
  ) {
    return true;
  }
  const details = Array.isArray(error.details) ? error.details : [];
  return details.some((entry) => entry?.reason === "API_KEY_INVALID");
}

function selectBestThumbnail(thumbnails = {}) {
  return (
    thumbnails.maxres?.url ||
    thumbnails.standard?.url ||
    thumbnails.high?.url ||
    thumbnails.medium?.url ||
    thumbnails.default?.url ||
    ""
  );
}

function renderResults() {
  elements.resultsGrid.innerHTML = "";
  if (!state.results.length) {
    return;
  }

  const fragment = document.createDocumentFragment();

  state.results.forEach((video) => {
    const card = document.createElement("article");
    card.className = "result-card";
    card.setAttribute("role", "listitem");
    card.dataset.videoId = video.id;

    if (state.selectedVideoId === video.id) {
      card.classList.add("selected");
    }

    const img = document.createElement("img");
    img.src = video.thumbnail;
    img.alt = `${video.title} thumbnail`;

    const content = document.createElement("div");
    content.className = "result-content";

    const title = document.createElement("h3");
    title.className = "result-title";
    title.textContent = video.title;

    const meta = document.createElement("div");
    meta.className = "result-meta";
    const channelLine = document.createElement("span");
    channelLine.textContent = video.channelTitle;
    const publishedLine = document.createElement("span");
    publishedLine.textContent = formatPublishedDate(video.publishedAt);
    meta.append(channelLine, publishedLine);

    content.append(title, meta);
    card.append(img, content);
    card.addEventListener("click", () => selectVideo(video.id));

    fragment.appendChild(card);
  });

  elements.resultsGrid.appendChild(fragment);
}

function selectVideo(videoId) {
  const video = state.results.find((item) => item.id === videoId);
  if (!video) return;
  state.selectedVideoId = videoId;
  updateSelectedCards();
  renderPlayer(video);
  renderMeta(video);
}

function updateSelectedCards() {
  const cards = elements.resultsGrid.querySelectorAll(".result-card");
  cards.forEach((card) => {
    if (card.dataset.videoId === state.selectedVideoId) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

function renderPlayer(video) {
  const iframe = document.createElement("iframe");
  iframe.src = `https://www.youtube.com/embed/${video.id}`;
  iframe.title = video.title;
  iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
  iframe.allowFullscreen = true;

  elements.playerShell.innerHTML = "";
  elements.playerShell.appendChild(iframe);
}

function clearPlayer() {
  elements.playerShell.innerHTML = `
    <div class="player-placeholder">
      <div class="placeholder-mark">🍿</div>
      <h2>Queue up a video</h2>
      <p>Select any result to play it here, compare metrics, and keep your search alongside the player.</p>
    </div>
  `;
  elements.videoMeta.innerHTML = "";
}

function renderMeta(video) {
  const statistics = video.statistics || {};
  const details = video.contentDetails || {};
  const views = statistics.viewCount ? formatNumber(statistics.viewCount) : "–";
  const likes = statistics.likeCount ? formatNumber(statistics.likeCount) : "–";
  const comments = statistics.commentCount ? formatNumber(statistics.commentCount) : "–";
  const duration = details.duration ? formatDuration(details.duration) : "Unknown";

  elements.videoMeta.innerHTML = "";

  const title = document.createElement("h2");
  title.textContent = video.title;

  const metaRow = document.createElement("div");
  metaRow.className = "meta-row";
  metaRow.innerHTML = `
    <span>⏱️ ${duration}</span>
    <span>👁️ ${views} views</span>
    <span>👍 ${likes} likes</span>
    <span>💬 ${comments} comments</span>
    <span>📅 ${formatPublishedDate(video.publishedAt)}</span>
  `;

  const channelBadge = document.createElement("div");
  channelBadge.className = "badge";
  channelBadge.textContent = video.channelTitle;

  const description = document.createElement("p");
  description.className = "description";
  description.textContent = video.description || "No description provided.";

  elements.videoMeta.append(title, channelBadge, metaRow, description);
}

function formatPublishedDate(iso) {
  if (!iso) return "Unknown date";
  try {
    const date = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  } catch (error) {
    return iso;
  }
}

function formatNumber(value) {
  return new Intl.NumberFormat().format(Number(value));
}

function formatDuration(isoDuration) {
  try {
    const duration = parseISODuration(isoDuration);
    const parts = [];
    if (duration.hours) parts.push(`${duration.hours}h`);
    if (duration.minutes) parts.push(`${duration.minutes}m`);
    if (duration.seconds) parts.push(`${duration.seconds}s`);
    return parts.length ? parts.join(" ") : "0s";
  } catch (error) {
    return isoDuration;
  }
}

function parseISODuration(duration) {
  const regex = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = duration.match(regex);
  if (!match) return { hours: 0, minutes: 0, seconds: 0 };
  const [, days = "0", hours = "0", minutes = "0", seconds = "0"] = match;
  const totalHours = Number(days) * 24 + Number(hours);
  return {
    hours: totalHours,
    minutes: Number(minutes),
    seconds: Number(seconds),
  };
}

function toggleNavButtons(disable) {
  elements.navButtons.forEach((button) => {
    const direction = button.dataset.direction;
    if (disable) {
      button.disabled = true;
      return;
    }
    if (direction === "prev") {
      button.disabled = !state.prevPageToken;
    }
    if (direction === "next") {
      button.disabled = !state.nextPageToken;
    }
  });
}

function setStatus(element, message) {
  if (!element) return;
  element.textContent = message;
}

init();
