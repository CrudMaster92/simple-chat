const KEY_STORAGE = "youtube-search-theater:api-key";

const state = {
  apiKey: "",
  remember: false,
  query: "",
  order: "relevance",
  safeSearch: "moderate",
  nextPageToken: null,
  prevPageToken: null,
  results: [],
  selectedVideoId: null,
};

const elements = {
  apiKeyForm: document.querySelector(".api-key-form"),
  apiKeyInput: document.querySelector("#apiKey"),
  rememberToggle: document.querySelector("#rememberKey"),
  apiStatus: document.querySelector(".api-status"),
  searchForm: document.querySelector(".search-form"),
  queryInput: document.querySelector("#query"),
  orderSelect: document.querySelector("#order"),
  safeSearchSelect: document.querySelector("#safeSearch"),
  resultsGrid: document.querySelector(".results-grid"),
  resultsStatus: document.querySelector(".results-status"),
  navButtons: Array.from(document.querySelectorAll(".nav-button")),
  playerShell: document.querySelector("[data-player-shell]"),
  videoMeta: document.querySelector(".video-meta"),
};

function init() {
  const storedKey = window.localStorage.getItem(KEY_STORAGE);
  if (storedKey) {
    state.apiKey = storedKey;
    state.remember = true;
    elements.apiKeyInput.value = storedKey;
    elements.rememberToggle.checked = true;
    setStatus(elements.apiStatus, "API key restored from this browser's storage.");
  }

  elements.apiKeyForm.addEventListener("submit", handleApiKeySubmit);
  elements.rememberToggle.addEventListener("change", handleRememberChange);
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

function handleRememberChange(event) {
  state.remember = event.target.checked;
  if (!state.remember) {
    window.localStorage.removeItem(KEY_STORAGE);
  } else if (state.apiKey) {
    window.localStorage.setItem(KEY_STORAGE, state.apiKey);
  }
}

function handleApiKeySubmit(event) {
  event.preventDefault();
  const value = elements.apiKeyInput.value.trim();
  if (!value) {
    state.apiKey = "";
    setStatus(elements.apiStatus, "Cleared the key. Provide a valid key before searching.");
    window.localStorage.removeItem(KEY_STORAGE);
    return;
  }

  state.apiKey = value;
  if (state.remember) {
    window.localStorage.setItem(KEY_STORAGE, value);
  }
  setStatus(elements.apiStatus, "API key saved. You're ready to search.");
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const query = elements.queryInput.value.trim();
  if (!query) {
    setStatus(elements.resultsStatus, "Type a topic or phrase to explore videos.");
    return;
  }
  if (!state.apiKey) {
    setStatus(elements.resultsStatus, "Provide a valid YouTube Data API key above to search.");
    return;
  }

  state.query = query;
  performSearch();
}

async function performSearch({ pageToken = "", isPageChange = false } = {}) {
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
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(`Search request failed: ${response.status}`);
    }

    const data = await response.json();
    const videos = data.items || [];

    if (!videos.length) {
      state.results = [];
      renderResults();
      state.nextPageToken = null;
      state.prevPageToken = null;
      toggleNavButtons(false);
      setStatus(elements.resultsStatus, "No videos found. Try another phrase or loosen filters.");
      return;
    }

    const ids = videos
      .map((item) => item.id && item.id.videoId)
      .filter(Boolean);

    const details = await fetchVideoDetails(ids);

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

    state.nextPageToken = data.nextPageToken ?? null;
    state.prevPageToken = data.prevPageToken ?? null;

    renderResults();
    setStatus(elements.resultsStatus, `Showing ${state.results.length} videos for “${state.query}”.`);
    toggleNavButtons(false);
  } catch (error) {
    console.error(error);
    state.nextPageToken = null;
    state.prevPageToken = null;
    setStatus(
      elements.resultsStatus,
      "We couldn't reach YouTube right now. Double-check your key and network, then try again."
    );
    toggleNavButtons(false);
  }
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
  const response = await fetch(endpoint);
  if (!response.ok) {
    return results;
  }
  const data = await response.json();
  (data.items || []).forEach((item) => {
    results.set(item.id, {
      statistics: item.statistics || null,
      contentDetails: item.contentDetails || null,
    });
  });
  return results;
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
