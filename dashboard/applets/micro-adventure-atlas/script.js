const timeRange = document.getElementById("time-range");
const timeOutput = document.getElementById("time-output");
const energyButtons = Array.from(document.querySelectorAll(".pill"));
const terrainChips = Array.from(document.querySelectorAll(".chip"));
const moodSelect = document.getElementById("mood-select");
const spinButton = document.getElementById("spin-button");
const wildcardButton = document.getElementById("wildcard-button");

const titleEl = document.getElementById("adventure-title");
const taglineEl = document.getElementById("adventure-tagline");
const durationEl = document.getElementById("duration-pill");
const energyEl = document.getElementById("energy-pill");
const terrainEl = document.getElementById("terrain-pill");
const moodEl = document.getElementById("mood-pill");
const stepsEl = document.getElementById("adventure-steps");
const gearEl = document.getElementById("adventure-gear");
const flavorEl = document.getElementById("adventure-flavor");
const wildcardEl = document.getElementById("wildcard");

const adventures = [
  {
    title: "Sunrise Rooftop Listen",
    tagline: "Capture city wake-up rhythms from a quiet vantage point.",
    energy: "low",
    terrain: ["urban", "indoors"],
    mood: ["serene", "curious"],
    minTime: 1,
    maxTime: 3,
    steps: [
      "Climb to a rooftop, parking structure, or balcony facing the dawn horizon.",
      "Record the changing soundscape for five minutes every half hour.",
      "Sketch or note the three most surprising transitions before heading out."
    ],
    gear: ["Thermos of tea", "Notebook or voice recorder", "Light layer for wind"],
    flavor:
      "Notice how light reflects on surfaces around you. Write a sentence pairing color with sound to remember it later."
  },
  {
    title: "Canal Drift Photo Relay",
    tagline: "Follow the waterline and trade snapshots with a partner.",
    energy: "medium",
    terrain: ["urban", "nature"],
    mood: ["social", "curious"],
    minTime: 1.5,
    maxTime: 4,
    steps: [
      "Trace a nearby canal, river, or aqueduct for 20 minutes in one direction.",
      "Every 10 minutes, pause to photograph contrasting textures (stone, metal, ripples).",
      "Send your three favorite photos to a friend and ask for their interpretations."
    ],
    gear: ["Camera or phone", "Comfortable shoes", "Reusable water bottle"],
    flavor:
      "Collect a tiny found object from the shoreline. Give it a new name inspired by the mood of the day."
  },
  {
    title: "Library Curiosity Loop",
    tagline: "Dive into shelves using dice-led wanderings.",
    energy: "low",
    terrain: ["urban", "indoors"],
    mood: ["curious", "serene"],
    minTime: 1,
    maxTime: 3,
    steps: [
      "Roll a die to pick an aisle; if none available, number tables or sections yourself.",
      "Spend 15 minutes exploring whatever you find at that number.",
      "Note one idea to try within the week inspired by your discoveries."
    ],
    gear: ["Library card", "Small notebook", "Coin or die for randomization"],
    flavor: "Copy one sentence that delights you and hide it in your pocket to revisit later."
  },
  {
    title: "Hidden Stair Intervals",
    tagline: "Seek tucked-away staircases and build a rhythmic loop.",
    energy: "high",
    terrain: ["urban"],
    mood: ["energized", "curious"],
    minTime: 1,
    maxTime: 2.5,
    steps: [
      "Identify three staircases within walking distance using a quick map glance.",
      "Jog or climb each staircase twice, timing yourself on the second round.",
      "Cool down with a slow stroll noting architectural details and textures."
    ],
    gear: ["Supportive shoes", "Water bottle", "Timer or fitness watch"],
    flavor: "Name each staircase after a fictional landmark to make the loop memorable."
  },
  {
    title: "Pocket Forest Field Lab",
    tagline: "Document micro-ecosystems tucked in the city.",
    energy: "medium",
    terrain: ["urban", "nature"],
    mood: ["curious", "serene"],
    minTime: 2,
    maxTime: 4,
    steps: [
      "Locate three green pockets (planters, medians, courtyards).",
      "Spend 10 minutes cataloging plants or insects at each site.",
      "Map your findings with sketches or snapshots and compare variations."
    ],
    gear: ["Macro lens attachment", "Field notebook", "Reusable container for litter pickup"],
    flavor: "Pair each site with a scent memory and record it in your notes."
  },
  {
    title: "Neighborhood Flavor Swap",
    tagline: "Taste-test snacks from three cultures within a few blocks.",
    energy: "medium",
    terrain: ["urban", "indoors"],
    mood: ["social", "curious"],
    minTime: 1,
    maxTime: 2.5,
    steps: [
      "Set a budget and choose a concentrated neighborhood to explore.",
      "Collect three small snacks or beverages from different cultural shops.",
      "Host a quick sidewalk tasting and jot collective impressions."
    ],
    gear: ["Reusable utensils", "Notebook for flavor notes", "Reusable tote"],
    flavor: "Create a shared flavor scale with friends and rate each find together."
  },
  {
    title: "Nightlight Sound Constellation",
    tagline: "Chart a constellation of evening sound markers.",
    energy: "low",
    terrain: ["urban", "nature"],
    mood: ["serene", "social"],
    minTime: 1.5,
    maxTime: 3.5,
    steps: [
      "Pick five stops within a comfortable walking loop after sunset.",
      "At each stop, record a 20-second ambient clip and note a single-word mood.",
      "Back home, plot the words in a star shape and send to a friend."
    ],
    gear: ["Phone or recorder", "Light jacket", "Sketch pad"],
    flavor: "Match each sound to a corresponding sky color from memory."
  },
  {
    title: "Courtyard Movement Mosaic",
    tagline: "Build a dance phrase inspired by architectural motifs.",
    energy: "high",
    terrain: ["urban", "indoors"],
    mood: ["energized", "curious"],
    minTime: 1,
    maxTime: 2,
    steps: [
      "Scout a plaza, courtyard, or atrium with interesting geometry.",
      "Select three shapes you see (arc, column, spiral) and assign each a movement.",
      "Combine the movements into a repeating phrase and film a single take."
    ],
    gear: ["Comfortable clothing", "Phone camera", "Portable speaker (optional)"],
    flavor: "Name your new dance after the location and share the clip with a friend."
  },
  {
    title: "Rainy Day Story Relay",
    tagline: "Let precipitation soundtrack an improvised story chain.",
    energy: "low",
    terrain: ["indoors"],
    mood: ["social", "serene"],
    minTime: 1,
    maxTime: 3,
    steps: [
      "Gather with a partner near a window or sheltered outdoor nook.",
      "Alternate adding 60-second story chapters prompted by what the rain hits.",
      "Record the full narrative and send it to someone who needs a lift."
    ],
    gear: ["Voice memo app", "Cozy drinks", "Blanket or cushions"],
    flavor: "Capture three rain rhythms and give each a descriptive title."
  },
  {
    title: "Transit Treasure Draft",
    tagline: "Ride one transit line end-to-end collecting micro stories.",
    energy: "medium",
    terrain: ["urban"],
    mood: ["curious", "serene"],
    minTime: 2,
    maxTime: 5,
    steps: [
      "Choose a bus, tram, or metro line with a view you rarely take.",
      "At each stop, jot a sentence describing someone or something that catches your eye.",
      "Compile the notes into a short letter to yourself before the ride ends."
    ],
    gear: ["Transit pass", "Pocket notebook", "Favorite pen"],
    flavor: "Assign each stop a color and create a gradient map afterward."
  }
];

const wildcards = [
  "Bring a disposable camera and promise to mail the prints to a future you.",
  "Invite someone remote to guide you via video call for five minutes.",
  "Collect a sound sample and turn it into your next morning alarm.",
  "Swap a playlist with a friend before leaving and write them a postcard after.",
  "Gather three texture rubbings and frame them as a triptych.",
  "Pick one stranger-friendly compliment to deliver respectfully during the outing.",
  "Match a pair of socks to the dominant colors you encounter.",
  "Turn a found object into a tiny altar centerpiece when you return home."
];

function updateTimeOutput() {
  const value = parseFloat(timeRange.value);
  timeOutput.textContent = value % 1 === 0 ? value.toString() : value.toFixed(1);
}

function getActiveEnergy() {
  const active = energyButtons.find((btn) => btn.classList.contains("active"));
  return active ? active.dataset.energy : "medium";
}

function getActiveTerrain() {
  const activeTerrains = terrainChips.filter((chip) => chip.classList.contains("active"));
  return activeTerrains.map((chip) => chip.dataset.terrain);
}

function weightedFilter(adventure) {
  const duration = parseFloat(timeRange.value);
  const energy = getActiveEnergy();
  const terrains = getActiveTerrain();
  const mood = moodSelect.value;

  const withinTime = duration >= adventure.minTime && duration <= adventure.maxTime;
  const matchesEnergy = adventure.energy === energy;
  const matchesTerrain = adventure.terrain.some((t) => terrains.includes(t));
  const matchesMood = adventure.mood.includes(mood);

  const score =
    (withinTime ? 2 : 0) +
    (matchesEnergy ? 2 : 0) +
    (matchesTerrain ? 1 : 0) +
    (matchesMood ? 1.5 : 0);

  return { adventure, score, matchesTerrain, withinTime };
}

function selectAdventure() {
  const scored = adventures.map(weightedFilter);
  const viable = scored.filter((entry) => entry.score >= 3.5);
  const pool = viable.length ? viable : scored;
  const totalScore = pool.reduce((sum, entry) => sum + (entry.score || 0.1), 0);
  let target = Math.random() * totalScore;

  for (const entry of pool) {
    const weight = entry.score || 0.1;
    if (target <= weight) {
      return entry.adventure;
    }
    target -= weight;
  }

  return pool[0].adventure;
}

function renderAdventure(adventure) {
  const duration = parseFloat(timeRange.value);
  titleEl.textContent = adventure.title;
  taglineEl.textContent = adventure.tagline;
  durationEl.textContent = `~${duration % 1 === 0 ? duration : duration.toFixed(1)} hrs`;
  const energyText =
    adventure.energy === "low" ? "Gentle energy" : adventure.energy === "medium" ? "Steady energy" : "Bold energy";
  energyEl.textContent = energyText;
  terrainEl.textContent = adventure.terrain.map(formatTerrain).join(" · ");
  moodEl.textContent = `${capitalize(moodSelect.value)} mood`;

  stepsEl.innerHTML = "";
  adventure.steps.forEach((step) => {
    const li = document.createElement("li");
    li.textContent = step;
    stepsEl.appendChild(li);
  });

  gearEl.innerHTML = "";
  adventure.gear.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    gearEl.appendChild(li);
  });

  flavorEl.textContent = adventure.flavor;
}

function formatTerrain(value) {
  switch (value) {
    case "urban":
      return "Urban nook";
    case "nature":
      return "Nature pocket";
    case "indoors":
      return "Indoor haven";
    default:
      return value;
  }
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function spinAdventure() {
  const adventure = selectAdventure();
  renderAdventure(adventure);
  wildcardEl.textContent = randomWildcard();
}

function randomWildcard() {
  return wildcards[Math.floor(Math.random() * wildcards.length)];
}

function toggleActive(list, button) {
  list.forEach((btn) => {
    if (btn !== button && list === energyButtons) {
      btn.classList.remove("active");
    }
  });
  button.classList.toggle("active");

  if (list === energyButtons && !button.classList.contains("active")) {
    button.classList.add("active");
  }

  if (list === terrainChips && getActiveTerrain().length === 0) {
    button.classList.add("active");
  }
}

timeRange.addEventListener("input", updateTimeOutput);
energyButtons.forEach((button) =>
  button.addEventListener("click", () => {
    toggleActive(energyButtons, button);
  })
);
terrainChips.forEach((chip) =>
  chip.addEventListener("click", () => {
    toggleActive(terrainChips, chip);
  })
);

spinButton.addEventListener("click", spinAdventure);
wildcardButton.addEventListener("click", () => {
  wildcardEl.textContent = randomWildcard();
});

updateTimeOutput();
renderAdventure(adventures[0]);
wildcardEl.textContent = randomWildcard();
