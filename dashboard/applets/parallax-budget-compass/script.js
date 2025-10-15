const defaultCategories = [
  { name: "Housing", planned: 1200, spent: 1185 },
  { name: "Groceries", planned: 450, spent: 320 },
  { name: "Savings", planned: 400, spent: 400 },
  { name: "Learning", planned: 120, spent: 80 }
];

const categories = defaultCategories.map((category) => ({
  id: crypto.randomUUID ? crypto.randomUUID() : `${category.name}-${Date.now()}`,
  ...category
}));

const categoryListEl = document.getElementById("categoryList");
const plannedTotalEl = document.getElementById("plannedTotal");
const spentTotalEl = document.getElementById("spentTotal");
const balanceTotalEl = document.getElementById("balanceTotal");
const insightListEl = document.getElementById("insightList");
const categoryFormEl = document.getElementById("categoryForm");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(isFinite(value) ? value : 0);
}

function updateTotals() {
  const totals = categories.reduce(
    (acc, category) => {
      acc.planned += Number(category.planned) || 0;
      acc.spent += Number(category.spent) || 0;
      return acc;
    },
    { planned: 0, spent: 0 }
  );
  const balance = totals.planned - totals.spent;

  plannedTotalEl.textContent = formatCurrency(totals.planned);
  spentTotalEl.textContent = formatCurrency(totals.spent);
  balanceTotalEl.textContent = formatCurrency(balance);

  renderInsights(totals);
}

function renderInsights(totals) {
  const insights = [];
  const balance = totals.planned - totals.spent;

  if (totals.planned === 0 && categories.length === 0) {
    insights.push("Add categories to start mapping your budget horizon.");
  }

  if (balance > 0) {
    insights.push(
      `You still have ${formatCurrency(balance)} unassigned — consider boosting savings or debt paydown.`
    );
  } else if (balance < 0) {
    insights.push(
      `You are overspending by ${formatCurrency(Math.abs(balance))}. Rebalance high-variance categories first.`
    );
  } else {
    insights.push("Every planned dollar is spoken for. Track progress to stay on target.");
  }

  const topOvers = [...categories]
    .filter((category) => Number(category.planned) > 0)
    .map((category) => ({
      ...category,
      delta: Number(category.spent) - Number(category.planned)
    }))
    .filter((category) => category.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 2);

  topOvers.forEach((category) => {
    insights.push(
      `${category.name} is over by ${formatCurrency(category.delta)} — can you shift from lower-priority areas?`
    );
  });

  if (topOvers.length === 0) {
    const underUtilized = [...categories]
      .filter((category) => Number(category.planned) > 0)
      .map((category) => ({
        ...category,
        ratio: Number(category.spent) / Number(category.planned)
      }))
      .filter((category) => category.ratio < 0.4)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 2);

    underUtilized.forEach((category) => {
      insights.push(
        `${category.name} is under 40% used — consider trimming its plan to free resources.`
      );
    });
  }

  insightListEl.innerHTML = "";
  insights.forEach((text) => {
    const li = document.createElement("li");
    li.textContent = text;
    insightListEl.appendChild(li);
  });
}

function renderCategories() {
  categoryListEl.innerHTML = "";

  categories.forEach((category) => {
    const card = document.createElement("article");
    card.className = "category-card";

    const planned = Number(category.planned) || 0;
    const spent = Number(category.spent) || 0;
    const progress = planned > 0 ? Math.min((spent / planned) * 100, 140) : 0;
    const status =
      planned === 0 && spent === 0
        ? "Unplanned"
        : spent > planned
        ? "Over budget"
        : spent === planned
        ? "On target"
        : "Room to use";

    card.innerHTML = `
      <div class="category-card-header">
        <span class="category-name">${category.name}</span>
        <span class="category-status">${status}</span>
      </div>
      <div class="category-inputs">
        <label>
          <span>Planned</span>
          <input type="number" min="0" step="1" value="${planned}" data-field="planned" data-id="${category.id}" />
        </label>
        <label>
          <span>Spent</span>
          <input type="number" min="0" step="1" value="${spent}" data-field="spent" data-id="${category.id}" />
        </label>
      </div>
      <div class="progress-label">${formatCurrency(spent)} of ${formatCurrency(planned)} used</div>
      <div class="progress-track">
        <div class="progress-bar" style="width: ${progress}%;"></div>
      </div>
    `;

    categoryListEl.appendChild(card);
  });
}

categoryListEl.addEventListener("input", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) return;

  const { id, field } = target.dataset;
  if (!id || !field) return;

  const value = Number(target.value);
  const category = categories.find((item) => item.id === id);
  if (!category) return;

  category[field] = value >= 0 ? value : 0;
  renderCategories();
  updateTotals();
});

categoryFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(categoryFormEl);
  const name = String(formData.get("categoryName") || "").trim();
  const planned = Number(formData.get("categoryPlanned"));
  const spent = Number(formData.get("categorySpent"));

  if (!name) {
    categoryFormEl.categoryName.focus();
    return;
  }

  const newCategory = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${name}-${Date.now()}`,
    name,
    planned: Number.isFinite(planned) && planned >= 0 ? planned : 0,
    spent: Number.isFinite(spent) && spent >= 0 ? spent : 0
  };

  categories.push(newCategory);
  categoryFormEl.reset();
  renderCategories();
  updateTotals();
});

function initParallax() {
  const layers = document.querySelectorAll(".parallax-layer");
  if (!layers.length) return;

  const updateLayerPositions = (event) => {
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const offsetX = (event.clientX - centerX) / centerX;
    const offsetY = (event.clientY - centerY) / centerY;

    layers.forEach((layer) => {
      const depth = Number(layer.dataset.depth) || 0;
      const translateX = offsetX * depth * 35;
      const translateY = offsetY * depth * 35;
      layer.style.transform = `translate3d(${translateX}px, ${translateY}px, 0)`;
    });
  };

  window.addEventListener("pointermove", updateLayerPositions);
}

renderCategories();
updateTotals();
initParallax();
