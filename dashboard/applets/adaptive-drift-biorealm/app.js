const canvas = document.getElementById("biome-canvas");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = true;

const uuid = () => (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2));

const populationEl = document.getElementById("population");
const lineageCountEl = document.getElementById("lineage-count");
const traitBreakdownEl = document.getElementById("trait-breakdown");
const eraStatusEl = document.getElementById("era-status");
const logStreamEl = document.getElementById("log-stream");
const eraBadge = document.getElementById("era-label");
const climateNotesEl = document.getElementById("climate-notes");

const mutationRange = document.getElementById("mutation-range");
const mutationOutput = document.getElementById("mutation-output");
const foodRange = document.getElementById("food-range");
const foodOutput = document.getElementById("food-output");
const capInput = document.getElementById("cap-input");
const climateSelect = document.getElementById("climate-select");
const pulseButton = document.getElementById("pulse-event");
const resetButton = document.getElementById("reset-btn");

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const climateLibrary = {
  verdant: {
    title: "Verdant Bloom",
    summary: "Nutrient mists shimmer. Agile foragers and keen sensors flourish.",
    metabolism: 0.92,
    foodRate: 1.2,
    mutationBias: { speed: 0.08, size: -0.05, sense: 0.06, resilience: 0.05 },
  },
  arid: {
    title: "Arid Ember",
    summary: "Sparse embers drift. Stout bodies conserve energy best here.",
    metabolism: 1.2,
    foodRate: 0.7,
    mutationBias: { speed: -0.04, size: 0.1, sense: -0.03, resilience: 0.08 },
  },
  frost: {
    title: "Frost Drift",
    summary: "Chill fronts bite. Slow, resilient morphs outlast the frost storms.",
    metabolism: 1.1,
    foodRate: 0.85,
    mutationBias: { speed: -0.02, size: -0.02, sense: 0.04, resilience: 0.12 },
  },
  toxic: {
    title: "Toxic Surge",
    summary: "Fluorescent spores bloom. Only sharp senses and swift detox survive.",
    metabolism: 1.05,
    foodRate: 0.95,
    mutationBias: { speed: 0.04, size: -0.08, sense: 0.08, resilience: 0.1 },
  },
};

const state = {
  entities: [],
  foods: [],
  lineageCounter: 0,
  era: 0,
  eraClock: 0,
  climate: "verdant",
  lastFoodPulse: 0,
};

const foodColors = ["#b5dd80", "#f1e28f", "#ffd7b5"];
const pickFoodColor = () => foodColors[Math.floor(Math.random() * foodColors.length)];

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function createLineage() {
  state.lineageCounter += 1;
  return state.lineageCounter;
}

function makeCreature({ parent, biasFactor = 1 }) {
  const mutationRate = parseFloat(mutationRange.value);
  const climate = climateLibrary[state.climate];

  if (!parent) {
    const lineage = createLineage();
    return {
      id: uuid(),
      lineage,
      x: randomBetween(80, WIDTH - 80),
      y: randomBetween(80, HEIGHT - 80),
      direction: randomBetween(0, Math.PI * 2),
      speed: randomBetween(0.6, 1.6),
      size: randomBetween(5, 10),
      sense: randomBetween(50, 120),
      resilience: randomBetween(0.2, 0.9),
      energy: 1,
      age: 0,
      generation: 0,
    };
  }

  const lineage = parent.lineage;
  const mutate = (value, amount, key) => {
    const bias = climate.mutationBias[key] || 0;
    const jitter = (Math.random() * 2 - 1) * amount * mutationRate * biasFactor;
    const directional = bias * mutationRate * 0.6;
    return value + jitter + directional;
  };

  return {
    id: uuid(),
    lineage,
    x: clamp(parent.x + randomBetween(-10, 10), 20, WIDTH - 20),
    y: clamp(parent.y + randomBetween(-10, 10), 20, HEIGHT - 20),
    direction: randomBetween(0, Math.PI * 2),
    speed: clamp(mutate(parent.speed, 0.6, "speed"), 0.4, 2.3),
    size: clamp(mutate(parent.size, 1.4, "size"), 4, 12),
    sense: clamp(mutate(parent.sense, 30, "sense"), 30, 180),
    resilience: clamp(mutate(parent.resilience, 0.4, "resilience"), 0.05, 1),
    energy: parent.energy * 0.6,
    age: 0,
    generation: parent.generation + 1,
  };
}

function colorForCreature(creature) {
  const hue = clamp(120 + creature.speed * 35 - creature.size * 3, 90, 170);
  const sat = clamp(50 + creature.sense / 4, 40, 80);
  const light = clamp(45 + creature.resilience * 20, 40, 70);
  return `hsl(${hue}, ${sat}%, ${light}%)`;
}

function addLog(message) {
  const li = document.createElement("li");
  li.innerHTML = message;
  logStreamEl.prepend(li);
  while (logStreamEl.children.length > 80) {
    logStreamEl.removeChild(logStreamEl.lastChild);
  }
}

function updateClimateNotes() {
  const climate = climateLibrary[state.climate];
  climateNotesEl.innerHTML = `<strong>${climate.title}:</strong> ${climate.summary}`;
}

function seedWorld() {
  state.entities = [];
  state.foods = [];
  state.lineageCounter = 0;
  state.era = 0;
  state.eraClock = 0;
  state.lastFoodPulse = 0;
  eraBadge.textContent = "Era 0";
  eraStatusEl.textContent = "Biosphere calibrating...";
  for (let i = 0; i < 16; i += 1) {
    const creature = makeCreature({});
    state.entities.push(creature);
  }
  addLog("<strong>World Reset.</strong> Sixteen protomorphs awaken to explore the biorealm.");
}

function spawnFood(delta) {
  state.lastFoodPulse += delta;
  const climate = climateLibrary[state.climate];
  const frequency = parseFloat(foodRange.value) * climate.foodRate;
  const interval = clamp(1.2 / frequency, 0.35, 2);
  if (state.lastFoodPulse >= interval) {
    state.lastFoodPulse = 0;
    const x = randomBetween(24, WIDTH - 24);
    const y = randomBetween(24, HEIGHT - 24);
    const energy = randomBetween(0.5, 0.9);
    state.foods.push({ x, y, energy, life: randomBetween(8, 18), color: pickFoodColor() });
  }
}

function applyClimatePressure(creature, delta) {
  const climate = climateLibrary[state.climate];
  const baseDrain = 0.18 + creature.speed * 0.15 + creature.size * 0.06;
  const resilienceBonus = (0.16 + creature.resilience * 0.24) * creature.resilience;
  const metabolic = baseDrain * climate.metabolism * delta;
  creature.energy -= Math.max(metabolic - resilienceBonus * delta, 0.05 * delta);
}

function tickCreatures(delta) {
  const cap = parseInt(capInput.value, 10) || 60;
  const foods = state.foods;
  const newCreatures = [];
  const survivors = [];
  const climate = climateLibrary[state.climate];

  for (const creature of state.entities) {
    creature.age += delta;
    const turnForce = (Math.random() * 2 - 1) * 0.8;
    creature.direction += turnForce * delta;
    const wander = randomBetween(-0.4, 0.4) * delta;
    creature.direction += wander;

    const velocity = creature.speed * (1 + creature.energy * 0.15);
    creature.x += Math.cos(creature.direction) * velocity * 24 * delta;
    creature.y += Math.sin(creature.direction) * velocity * 24 * delta;

    if (creature.x < 12 || creature.x > WIDTH - 12) {
      creature.direction = Math.PI - creature.direction;
      creature.x = clamp(creature.x, 12, WIDTH - 12);
    }
    if (creature.y < 12 || creature.y > HEIGHT - 12) {
      creature.direction = -creature.direction;
      creature.y = clamp(creature.y, 12, HEIGHT - 12);
    }

    applyClimatePressure(creature, delta);

    for (let i = foods.length - 1; i >= 0; i -= 1) {
      const food = foods[i];
      const dist = Math.hypot(food.x - creature.x, food.y - creature.y);
      const reach = creature.size + 6;
      if (dist < reach) {
        creature.energy += food.energy;
        creature.energy = Math.min(creature.energy, 2.6);
        foods.splice(i, 1);
        addLog(`<strong>Lineage ${creature.lineage}</strong> metabolised a nutrient mote.`);
      }
    }

    creature.energy -= delta * 0.04 * (creature.generation * 0.1);

    if (creature.age > 65 || creature.energy <= 0) {
      addLog(
        `<strong>Lineage ${creature.lineage}</strong> loses a ${creature.generation > 0 ? "descendant" : "founder"} ` +
          `to entropy.`
      );
      continue;
    }

    const reproductionThreshold = 1.6 - creature.resilience * 0.3 + (climate.metabolism - 1) * 0.2;
    const biasFactor = climate.metabolism > 1 ? 1.1 : 1;
    if (creature.energy > reproductionThreshold && state.entities.length + newCreatures.length < cap) {
      const offspring = makeCreature({ parent: creature, biasFactor });
      creature.energy *= 0.6;
      newCreatures.push(offspring);
      addLog(
        `<strong>Lineage ${offspring.lineage}</strong> splits a new morph (gen ${offspring.generation}).`
      );
    }

    survivors.push(creature);
  }

  state.entities = survivors.concat(newCreatures);
}

function tickFood(delta) {
  for (let i = state.foods.length - 1; i >= 0; i -= 1) {
    const mote = state.foods[i];
    mote.life -= delta;
    if (mote.life <= 0) {
      state.foods.splice(i, 1);
    }
  }
}

function updateStats() {
  const total = state.entities.length;
  populationEl.textContent = total.toString();
  const lineages = new Set(state.entities.map((c) => c.lineage));
  lineageCountEl.textContent = `Lineages: ${lineages.size}`;

  if (total === 0) {
    traitBreakdownEl.innerHTML = "<dt>status</dt><dd>extinct</dd>";
    eraStatusEl.textContent = "All morphs lost. Reseed to continue evolution.";
    return;
  }

  const sums = state.entities.reduce(
    (acc, c) => {
      acc.speed += c.speed;
      acc.size += c.size;
      acc.sense += c.sense;
      acc.resilience += c.resilience;
      acc.generation += c.generation;
      return acc;
    },
    { speed: 0, size: 0, sense: 0, resilience: 0, generation: 0 }
  );

  const avgSpeed = (sums.speed / total).toFixed(2);
  const avgSize = (sums.size / total).toFixed(1);
  const avgSense = Math.round(sums.sense / total);
  const avgResilience = (sums.resilience / total).toFixed(2);
  const avgGen = (sums.generation / total).toFixed(1);

  traitBreakdownEl.innerHTML = `
    <dt>Speed</dt><dd>${avgSpeed}</dd>
    <dt>Mass</dt><dd>${avgSize}</dd>
    <dt>Sense</dt><dd>${avgSense}</dd>
    <dt>Resist</dt><dd>${avgResilience}</dd>
    <dt>Gen</dt><dd>${avgGen}</dd>
  `;

  const climate = climateLibrary[state.climate];
  eraStatusEl.textContent = `${climate.title} • era ${state.era} • average generation ${avgGen}`;
}

function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  for (const mote of state.foods) {
    ctx.beginPath();
    ctx.fillStyle = mote.color;
    ctx.globalAlpha = 0.65;
    ctx.arc(mote.x, mote.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  for (const creature of state.entities) {
    ctx.beginPath();
    ctx.fillStyle = colorForCreature(creature);
    ctx.strokeStyle = "rgba(20, 60, 56, 0.3)";
    const radius = creature.size;
    ctx.save();
    ctx.translate(creature.x, creature.y);
    ctx.rotate(creature.direction);
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.quadraticCurveTo(-radius * 0.6, radius * 0.8, -radius, 0);
    ctx.quadraticCurveTo(-radius * 0.6, -radius * 0.8, radius, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.strokeStyle = `rgba(20, 60, 56, ${clamp(creature.sense / 180, 0.15, 0.28)})`;
    ctx.arc(creature.x, creature.y, clamp(creature.sense * 0.4, 12, 48), 0, Math.PI * 2);
    ctx.stroke();
  }
}

function tickEra(delta) {
  state.eraClock += delta;
  if (state.eraClock >= 18) {
    state.eraClock = 0;
    state.era += 1;
    eraBadge.textContent = `Era ${state.era}`;
    addLog(`<strong>Era ${state.era}:</strong> Drift metrics recalibrated.`);
  }
}

function loop(timestamp) {
  if (!loop.last) loop.last = timestamp;
  const delta = Math.min((timestamp - loop.last) / 1000, 0.12);
  loop.last = timestamp;

  spawnFood(delta);
  tickFood(delta);
  tickCreatures(delta);
  updateStats();
  draw();
  tickEra(delta);

  requestAnimationFrame(loop);
}

function triggerCataclysm() {
  const events = [
    {
      name: "Solar Flare",
      effect: () => {
        state.entities.forEach((creature) => {
          creature.energy -= 0.3;
          creature.resilience = clamp(creature.resilience + 0.1, 0.05, 1);
        });
        addLog("<strong>Solar flare.</strong> Energy scorches the field; resilient morphs endure.");
      },
    },
    {
      name: "Glacial Surge",
      effect: () => {
        state.climate = "frost";
        updateClimateNotes();
        addLog("<strong>Glacial surge.</strong> Climate locks to Frost Drift.");
      },
    },
    {
      name: "Spore Bloom",
      effect: () => {
        for (let i = 0; i < 6; i += 1) {
          state.foods.push({
            x: randomBetween(40, WIDTH - 40),
            y: randomBetween(40, HEIGHT - 40),
            energy: randomBetween(0.4, 1),
            life: randomBetween(6, 14),
            color: pickFoodColor(),
          });
        }
        addLog("<strong>Spore bloom.</strong> Nutrient motes rain across the biome.");
      },
    },
    {
      name: "Resonant Storm",
      effect: () => {
        state.entities.forEach((creature) => {
          creature.direction += Math.PI * (Math.random() > 0.5 ? 1 : -1);
          creature.speed = clamp(creature.speed + randomBetween(-0.2, 0.4), 0.4, 2.4);
        });
        addLog("<strong>Resonant storm.</strong> Directional chaos and speed mutations ripple outward.");
      },
    },
  ];

  const event = events[Math.floor(Math.random() * events.length)];
  event.effect();
}

mutationRange.addEventListener("input", () => {
  mutationOutput.textContent = `${Math.round(parseFloat(mutationRange.value) * 100)}%`;
});

foodRange.addEventListener("input", () => {
  foodOutput.textContent = `${parseFloat(foodRange.value).toFixed(1)}x`;
});

climateSelect.addEventListener("change", () => {
  state.climate = climateSelect.value;
  updateClimateNotes();
  addLog(`<strong>Climate shift.</strong> Sensors recalibrate to ${climateLibrary[state.climate].title}.`);
});

pulseButton.addEventListener("click", () => {
  triggerCataclysm();
});

resetButton.addEventListener("click", () => {
  seedWorld();
});

function init() {
  updateClimateNotes();
  mutationOutput.textContent = `${Math.round(parseFloat(mutationRange.value) * 100)}%`;
  foodOutput.textContent = `${parseFloat(foodRange.value).toFixed(1)}x`;
  climateSelect.value = state.climate;
  seedWorld();
  requestAnimationFrame(loop);
}

init();
