const form = document.getElementById("search-form");
const input = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const resultsNode = document.getElementById("results");
const statusNode = document.getElementById("status");
const storyTemplate = document.getElementById("story-template");

const API_BASE = "https://hn.algolia.com/api/v1";
const DEFAULT_QUERY = "technology";
let activeRequest = 0;

const relativeTimeFormat = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
});

const timeUnits = [
  { unit: "year", ms: 1000 * 60 * 60 * 24 * 365 },
  { unit: "month", ms: 1000 * 60 * 60 * 24 * 30 },
  { unit: "day", ms: 1000 * 60 * 60 * 24 },
  { unit: "hour", ms: 1000 * 60 * 60 },
  { unit: "minute", ms: 1000 * 60 },
];

function formatRelativeTime(timestamp) {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diff = then - now;
  const absDiff = Math.abs(diff);

  for (const { unit, ms } of timeUnits) {
    if (absDiff >= ms || unit === "minute") {
      const value = Math.round(diff / ms);
      return relativeTimeFormat.format(value, unit);
    }
  }
  return "just now";
}

function createExcerpt(story) {
  if (story._highlightResult?.story_text?.value) {
    return stripHtml(story._highlightResult.story_text.value);
  }
  if (story.story_text) {
    return story.story_text.slice(0, 200);
  }
  if (story._snippetResult?.title?.value) {
    return stripHtml(story._snippetResult.title.value);
  }
  return "";
}

function stripHtml(value) {
  const tmp = document.createElement("div");
  tmp.innerHTML = value;
  return tmp.textContent ?? tmp.innerText ?? "";
}

function renderStories(stories) {
  const fragment = document.createDocumentFragment();
  stories.forEach((story) => {
    const node = storyTemplate.content.cloneNode(true);
    const link = node.querySelector(".story-link");
    link.textContent = story.title || "Untitled story";
    link.href = story.url || `https://news.ycombinator.com/item?id=${story.objectID}`;

    const meta = node.querySelector(".story-meta");
    const source = new URL(link.href).hostname.replace(/^www\./, "");
    meta.textContent = `${source} · by ${story.author || "unknown"} · ${formatRelativeTime(
      story.created_at
    )}`;

    const excerptNode = node.querySelector(".story-excerpt");
    const excerpt = createExcerpt(story);
    excerptNode.textContent = excerpt ? excerpt : "No excerpt available.";

    node.querySelector(".story-score").textContent = story.points ?? 0;
    node.querySelector(".story-comments").textContent = story.num_comments ?? 0;

    fragment.appendChild(node);
  });

  resultsNode.innerHTML = "";
  resultsNode.appendChild(fragment);
}

async function fetchStories(query, sort) {
  const trimmedQuery = query.trim();
  const endpoint = sort === "popularity" ? "search" : "search_by_date";
  const url = new URL(`${API_BASE}/${endpoint}`);
  url.searchParams.set("tags", "story");
  url.searchParams.set("hitsPerPage", "24");
  if (trimmedQuery) {
    url.searchParams.set("query", trimmedQuery);
  }

  const requestId = ++activeRequest;
  statusNode.textContent = "Fetching the latest stories...";
  resultsNode.setAttribute("aria-busy", "true");

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const data = await response.json();
    if (requestId !== activeRequest) {
      return;
    }

    if (!data.hits?.length) {
      statusNode.textContent = "No stories found. Try a different topic.";
      resultsNode.innerHTML = "";
      return;
    }

    statusNode.textContent = `Showing ${data.hits.length} stories for “${
      trimmedQuery || "latest web trends"
    }”.`;
    renderStories(data.hits);
  } catch (error) {
    if (requestId !== activeRequest) {
      return;
    }
    console.error(error);
    statusNode.textContent =
      "We hit a snag while reaching the web service. Please try again in a moment.";
    resultsNode.innerHTML = "";
  } finally {
    if (requestId === activeRequest) {
      resultsNode.removeAttribute("aria-busy");
    }
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  fetchStories(input.value || DEFAULT_QUERY, sortSelect.value);
});

input.addEventListener("input", () => {
  statusNode.textContent = "";
});

fetchStories(DEFAULT_QUERY, sortSelect.value);

