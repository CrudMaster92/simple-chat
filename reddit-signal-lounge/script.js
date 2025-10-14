const posts = [
  {
    id: "futurology-1",
    subreddit: "r/Futurology",
    title: "Fusion startups are sharing open research notebooks to accelerate clean energy breakthroughs",
    flair: "Innovation",
    upvotes: 14200,
    comments: 1340,
    growth: 82,
    sentiment: 0.74,
    tone: "Optimistic",
    ageHours: 5,
    category: "Future Tech",
    tags: ["fusion", "climate", "open science"],
    takeaway: "Share a digest comparing open lab policies across energy communities.",
  },
  {
    id: "dataisbeautiful-1",
    subreddit: "r/dataisbeautiful",
    title: "Visualizing 48 hours of subreddit crossposts about ocean heatwaves",
    flair: "OC",
    upvotes: 9800,
    comments: 620,
    growth: 68,
    sentiment: 0.63,
    tone: "Curious",
    ageHours: 9,
    category: "Data Stories",
    tags: ["visualization", "climate", "storytelling"],
    takeaway: "Create a companion thread asking for datasets readers want mapped next.",
  },
  {
    id: "askscience-1",
    subreddit: "r/askscience",
    title: "How close are we to carbon-negative cement? Researchers weigh in",
    flair: "Answered",
    upvotes: 6400,
    comments: 880,
    growth: 54,
    sentiment: 0.59,
    tone: "Analytical",
    ageHours: 14,
    category: "Future Tech",
    tags: ["materials", "climate", "expert"],
    takeaway: "Host a crosspost with architects collecting use cases.",
  },
  {
    id: "gaming-1",
    subreddit: "r/gaming",
    title: "Indie devs are building co-op cozy games around local folklore",
    flair: "Discussion",
    upvotes: 8700,
    comments: 1940,
    growth: 73,
    sentiment: 0.82,
    tone: "Wholesome",
    ageHours: 7,
    category: "Culture",
    tags: ["indie", "cozy", "folklore"],
    takeaway: "Invite players to share folk stories to inspire level design.",
  },
  {
    id: "entrepreneur-1",
    subreddit: "r/Entrepreneur",
    title: "Bootstrapped founders are trading automations for community perks",
    flair: "Growth",
    upvotes: 5200,
    comments: 460,
    growth: 61,
    sentiment: 0.65,
    tone: "Practical",
    ageHours: 20,
    category: "Entrepreneurship",
    tags: ["automation", "no-code", "community"],
    takeaway: "Draft a collaboration guide with r/SideProject on perk swaps.",
  },
  {
    id: "art-1",
    subreddit: "r/Art",
    title: "Analog collage artists are remixing satellite imagery into speculative city posters",
    flair: "Creative",
    upvotes: 7200,
    comments: 540,
    growth: 57,
    sentiment: 0.79,
    tone: "Inspired",
    ageHours: 11,
    category: "Culture",
    tags: ["collage", "satellite", "urban"],
    takeaway: "Pair with r/MapPorn for a community moodboard challenge.",
  },
  {
    id: "productivity-1",
    subreddit: "r/productivity",
    title: "Focus blocks meet community sprints: how teams are adapting Pomodoro clubs",
    flair: "Case Study",
    upvotes: 4800,
    comments: 710,
    growth: 52,
    sentiment: 0.71,
    tone: "Encouraging",
    ageHours: 16,
    category: "Learning",
    tags: ["habits", "teams", "pomodoro"],
    takeaway: "Run a joint sprint with r/GetDisciplined using shared leaderboards.",
  },
  {
    id: "ux-1",
    subreddit: "r/userexperience",
    title: "Design critiques are trending toward 'slow interfaces' that reward curiosity",
    flair: "Discussion",
    upvotes: 3900,
    comments: 510,
    growth: 48,
    sentiment: 0.67,
    tone: "Reflective",
    ageHours: 18,
    category: "Design",
    tags: ["ux", "slow tech", "critique"],
    takeaway: "Share a community brief asking for calm design experiments.",
  },
  {
    id: "india-1",
    subreddit: "r/india",
    title: "Citizen scientists are mapping urban heat from their balconies",
    flair: "News",
    upvotes: 5600,
    comments: 860,
    growth: 65,
    sentiment: 0.58,
    tone: "Determined",
    ageHours: 12,
    category: "Civic",
    tags: ["urban", "heat", "community science"],
    takeaway: "Collect low-cost hardware tips for emerging city groups.",
  },
  {
    id: "cookbook-1",
    subreddit: "r/recipes",
    title: "Foraged ingredient swaps are trending in zero-waste cooking threads",
    flair: "Recipe",
    upvotes: 6100,
    comments: 420,
    growth: 47,
    sentiment: 0.76,
    tone: "Playful",
    ageHours: 22,
    category: "Culture",
    tags: ["zero waste", "foraging", "recipes"],
    takeaway: "Launch a seasonal swap with r/FoodWaste for pantry inspo.",
  },
];

const prompts = [
  "Crosspost a question asking how these communities would remix the highlighted idea.",
  "Create a shared infographic summarizing takeaways from three different subreddits.",
  "Host a 24-hour comment sprint inviting experts to stress-test the top insight.",
  "Pair a niche subreddit with a mainstream one for a themed AMA night.",
  "Turn the top sentiment into a weekly challenge for your community.",
];

const state = {
  searchTerm: "",
  sortMode: "momentum",
  categories: new Set(),
};

const postFeed = document.getElementById("post-feed");
const metricGrid = document.getElementById("metric-grid");
const radarList = document.getElementById("radar-list");
const trendStrip = document.getElementById("trend-strip");
const feedSummary = document.getElementById("feed-summary");
const searchInput = document.getElementById("search");
const segmentButtons = document.querySelectorAll(".segment-btn");
const categoryContainer = document.getElementById("category-chips");
const resetFilters = document.getElementById("reset-filters");
const ideaOutput = document.getElementById("idea-output");
const ideaButton = document.getElementById("idea-button");
const promptList = document.getElementById("prompt-list");

const numberFormatter = new Intl.NumberFormat("en", { notation: "compact" });

function getFilteredPosts() {
  let filtered = posts;

  if (state.searchTerm) {
    const term = state.searchTerm.toLowerCase();
    filtered = filtered.filter((post) => {
      return (
        post.subreddit.toLowerCase().includes(term) ||
        post.title.toLowerCase().includes(term) ||
        post.tags.some((tag) => tag.includes(term))
      );
    });
  }

  if (state.categories.size) {
    filtered = filtered.filter((post) => state.categories.has(post.category));
  }

  return [...filtered];
}

function sortPosts(list) {
  const sorted = [...list];
  switch (state.sortMode) {
    case "engagement":
      sorted.sort((a, b) => b.upvotes + b.comments * 2 - (a.upvotes + a.comments * 2));
      break;
    case "conversation":
      sorted.sort((a, b) => b.comments - a.comments);
      break;
    case "fresh":
      sorted.sort((a, b) => a.ageHours - b.ageHours);
      break;
    default:
      sorted.sort((a, b) => b.growth - a.growth);
  }
  return sorted;
}

function renderFeed() {
  const filtered = sortPosts(getFilteredPosts());
  postFeed.innerHTML = "";

  if (!filtered.length) {
    postFeed.innerHTML = `<p class="empty">No threads match your filters yet. Try broadening the search or clearing a theme.</p>`;
    feedSummary.textContent = "No matches yet — adjust your filters to catch a new signal.";
    return;
  }

  const uniqueCategories = new Set(filtered.map((post) => post.category));
  const descriptor =
    state.sortMode === "momentum"
      ? "momentum"
      : state.sortMode === "engagement"
      ? "audience reach"
      : state.sortMode === "conversation"
      ? "comment heat"
      : "fresh arrivals";

  feedSummary.textContent = `Showing ${filtered.length} spotlight threads across ${uniqueCategories.size} focus areas sorted by ${descriptor}.`;

  filtered.forEach((post) => {
    const card = document.createElement("article");
    card.className = "post-card";
    card.innerHTML = `
      <div class="post-meta">
        <span class="subreddit">${post.subreddit}</span>
        <span class="flair">${post.flair}</span>
        <span>${numberFormatter.format(post.upvotes)} upvotes</span>
        <span>${numberFormatter.format(post.comments)} comments</span>
        <span>${post.ageHours}h ago</span>
      </div>
      <h3>${post.title}</h3>
      <div class="post-insights">
        <span class="insight-pill"><span class="momentum">${post.growth}</span> momentum</span>
        <span class="insight-pill">Sentiment: <span class="sentiment">${Math.round(
          post.sentiment * 100
        )}%</span> ${post.tone}</span>
        <span class="insight-pill">Tags: ${post.tags.join(" · ")}</span>
      </div>
      <p class="metric-detail">${post.takeaway}</p>
    `;
    postFeed.appendChild(card);
  });

  updateMetrics(filtered);
  updateRadar(filtered);
  updateTrends(filtered);
}

function updateMetrics(filtered) {
  metricGrid.innerHTML = "";
  const totalUpvotes = filtered.reduce((sum, post) => sum + post.upvotes, 0);
  const totalComments = filtered.reduce((sum, post) => sum + post.comments, 0);
  const avgSentiment =
    filtered.reduce((sum, post) => sum + post.sentiment, 0) / filtered.length;
  const maxGrowth = filtered.reduce((max, post) => (post.growth > max.growth ? post : max), filtered[0]);
  const hottestThread = filtered.reduce((max, post) => (post.comments > max.comments ? post : max), filtered[0]);

  const metrics = [
    {
      label: "Upvote Velocity",
      value: `${numberFormatter.format(totalUpvotes)}`,
      detail: `${filtered.length} threads fueling the surge`,
    },
    {
      label: "Comment Heat",
      value: `${numberFormatter.format(totalComments)}`,
      detail: `Top debate in ${hottestThread.subreddit}`,
    },
    {
      label: "Signal Mood",
      value: `${Math.round(avgSentiment * 100)}% positive`,
      detail: `Peak momentum from ${maxGrowth.subreddit}`,
    },
  ];

  metrics.forEach((metric) => {
    const card = document.createElement("div");
    card.className = "metric-card";
    card.innerHTML = `
      <span class="metric-label">${metric.label}</span>
      <span class="metric-value">${metric.value}</span>
      <p class="metric-detail">${metric.detail}</p>
    `;
    metricGrid.appendChild(card);
  });
}

function updateRadar(filtered) {
  radarList.innerHTML = "";
  const byCategory = filtered.reduce((map, post) => {
    if (!map[post.category]) {
      map[post.category] = {
        posts: 0,
        avgGrowth: 0,
        tone: [],
      };
    }
    map[post.category].posts += 1;
    map[post.category].avgGrowth += post.growth;
    map[post.category].tone.push(post.tone);
    return map;
  }, {});

  const entries = Object.entries(byCategory)
    .map(([category, info]) => ({
      category,
      avgGrowth: Math.round(info.avgGrowth / info.posts),
      posts: info.posts,
      signatureTone: mostFrequent(info.tone),
    }))
    .sort((a, b) => b.avgGrowth - a.avgGrowth)
    .slice(0, 4);

  entries.forEach((entry) => {
    const node = document.createElement("div");
    node.className = "radar-entry";
    node.innerHTML = `
      <strong>${entry.category}</strong>
      <div class="radar-metric">
        <span>${entry.posts} threads</span>
        <span>${entry.avgGrowth} momentum</span>
      </div>
      <p class="metric-detail">Prevailing tone: ${entry.signatureTone}</p>
    `;
    radarList.appendChild(node);
  });
}

function mostFrequent(values) {
  const tally = values.reduce((map, value) => {
    map[value] = (map[value] || 0) + 1;
    return map;
  }, {});
  return Object.entries(tally).sort((a, b) => b[1] - a[1])[0][0];
}

function updateTrends(filtered) {
  trendStrip.innerHTML = "";
  const tagCounts = filtered.reduce((map, post) => {
    post.tags.forEach((tag) => {
      map[tag] = (map[tag] || 0) + 1;
    });
    return map;
  }, {});

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  topTags.forEach(([tag, count]) => {
    const row = document.createElement("div");
    row.className = "trend-item";
    row.innerHTML = `
      <span class="badge">${count} mentions</span>
      <span>#${tag.replace(/\s+/g, "-")}</span>
    `;
    trendStrip.appendChild(row);
  });

  if (!topTags.length) {
    const row = document.createElement("div");
    row.className = "trend-item";
    row.textContent = "No trending tags yet. Try widening the filter.";
    trendStrip.appendChild(row);
  }
}

function renderCategoryChips() {
  const categories = Array.from(new Set(posts.map((post) => post.category)));
  categories.sort();
  categories.forEach((category) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "filter-chip";
    chip.textContent = category;
    chip.dataset.category = category;
    chip.addEventListener("click", () => {
      if (state.categories.has(category)) {
        state.categories.delete(category);
        chip.classList.remove("is-active");
      } else {
        state.categories.add(category);
        chip.classList.add("is-active");
      }
      renderFeed();
    });
    categoryContainer.appendChild(chip);
  });
}

function attachEvents() {
  searchInput.addEventListener("input", (event) => {
    state.searchTerm = event.target.value.trim();
    renderFeed();
  });

  segmentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      segmentButtons.forEach((btn) => btn.classList.remove("is-active"));
      button.classList.add("is-active");
      state.sortMode = button.dataset.sort;
      renderFeed();
    });
  });

  resetFilters.addEventListener("click", () => {
    state.categories.clear();
    state.searchTerm = "";
    searchInput.value = "";
    document.querySelectorAll(".filter-chip").forEach((chip) => chip.classList.remove("is-active"));
    renderFeed();
  });

  ideaButton.addEventListener("click", () => {
    const pool = getFilteredPosts();
    const source = pool.length ? pool[Math.floor(Math.random() * pool.length)] : posts[0];
    const partnerPool = posts.filter((post) => post.category !== source.category);
    const partner = partnerPool[Math.floor(Math.random() * partnerPool.length)];
    ideaOutput.textContent = `Pair ${source.subreddit} with ${partner.subreddit} for a ${partner.tone.toLowerCase()} session. ${source.takeaway}`;
  });
}

function renderPrompts() {
  prompts.forEach((prompt) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>Try:</strong> ${prompt}`;
    promptList.appendChild(li);
  });
}

renderCategoryChips();
attachEvents();
renderPrompts();
renderFeed();
