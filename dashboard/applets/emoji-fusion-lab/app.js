const reelsData = {
  mood: [
    { emoji: "😊", name: "Gleeful Nova", blurb: "Brimming with sparkles and ready to celebrate.", vibe: "gleeful nova" },
    { emoji: "🤖", name: "Curious Circuit", blurb: "A gentle buzz of wonder and beeps of excitement.", vibe: "curious circuit" },
    { emoji: "😎", name: "Chill Comet", blurb: "Cruising through space with neon sunglasses on.", vibe: "chill comet" },
    { emoji: "🤩", name: "Starstruck Glow", blurb: "Eyes wide, dazzled by the cosmic stage lights.", vibe: "starstruck glow" },
    { emoji: "🤠", name: "Cosmic Wrangler", blurb: "Yeehaw energy wrangling meteors into confetti.", vibe: "cosmic wrangler" },
    { emoji: "🧘", name: "Zen Ripple", blurb: "Calm waves of thought ripple across the galaxy.", vibe: "zen ripple" }
  ],
  creature: [
    { emoji: "🦄", name: "Nebula Unicorn", blurb: "A prismatic pal who loves moonlight picnics.", title: "Nebula Unicorn" },
    { emoji: "🐙", name: "DJ Octopus", blurb: "Eight arms, eight turntables, endless beats.", title: "DJ Octopus" },
    { emoji: "🐉", name: "Glitter Dragon", blurb: "Breathes shimmering confetti instead of fire.", title: "Glitter Dragon" },
    { emoji: "🦋", name: "Hologram Butterfly", blurb: "Flutters through thoughts leaving pixel dust.", title: "Hologram Butterfly" },
    { emoji: "🦜", name: "Galaxy Parrot", blurb: "Repeats wishes whispered under shooting stars.", title: "Galaxy Parrot" },
    { emoji: "🦈", name: "Lunar Shark", blurb: "Surfs sound waves around the moonlit seas.", title: "Lunar Shark" }
  ],
  activity: [
    { emoji: "🎨", name: "Cosmic Painting", blurb: "Spattering nebula colors across a starry canvas.", action: "painting a nebula masterpiece on the midnight sky" },
    { emoji: "🕺", name: "Zero-G Dance-Off", blurb: "Moonwalking while orbiting a disco planet.", action: "floating through a zero-g dance-off" },
    { emoji: "🎮", name: "Pixel Quest", blurb: "Speedrunning a retro arcade hidden in the rings of Saturn.", action: "blasting through a retro pixel quest" },
    { emoji: "🍨", name: "Astro Sundae Bar", blurb: "Stacking cosmic scoops with stardust sprinkles.", action: "crafting a towering astro sundae" },
    { emoji: "🎈", name: "Balloon Expedition", blurb: "Drifting in rainbow balloons to map dream clouds.", action: "charting a rainbow balloon expedition" },
    { emoji: "🎤", name: "Comet Karaoke", blurb: "Singing duets with passing shooting stars.", action: "belting comet karaoke to the cosmos" }
  ]
};

const storyTemplates = [
  ({ mood, creature, activity }) => `${mood.name} vibes swirl around the ${creature.name}, who is ${activity.action}. Where does the adventure lead?`,
  ({ mood, creature, activity }) => `Today, a ${mood.vibe} energy teams up with the legendary ${creature.name} and starts ${activity.action}. Add the next plot twist!`,
  ({ mood, creature, activity }) => `Rumor has it that the ${creature.name} only appears when ${mood.name} days arrive—and that's when ${activity.action}. What do they discover?`
];

const reels = Array.from(document.querySelectorAll('.reel'));
const spinButton = document.querySelector('.spin');
const storyParagraph = document.querySelector('[data-role="story"]');

function getRandomItem(items, currentName) {
  if (items.length === 1) return items[0];
  let candidate;
  do {
    candidate = items[Math.floor(Math.random() * items.length)];
  } while (candidate.name === currentName);
  return candidate;
}

function updateReel(reel, data) {
  const emojiEl = reel.querySelector('[data-role="emoji"]');
  const nameEl = reel.querySelector('[data-role="name"]');
  const blurbEl = reel.querySelector('[data-role="blurb"]');

  emojiEl.textContent = data.emoji;
  nameEl.textContent = data.name;
  blurbEl.textContent = data.blurb;

  reel.dataset.currentName = data.name;
  reel.dataset.currentData = JSON.stringify(data);
}

function spinReel(reel) {
  const lockButton = reel.querySelector('.lock');
  if (lockButton.getAttribute('aria-pressed') === 'true') {
    const stored = reel.dataset.currentData;
    return stored ? JSON.parse(stored) : null;
  }

  const category = reel.dataset.category;
  const items = reelsData[category];
  const currentName = reel.dataset.currentName;
  const selection = getRandomItem(items, currentName);
  updateReel(reel, selection);

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    reel.classList.add('reel--spinning');
    setTimeout(() => reel.classList.remove('reel--spinning'), 600);
  }

  return selection;
}

function ensureInitialState() {
  reels.forEach((reel) => {
    const category = reel.dataset.category;
    const items = reelsData[category];
    const selection = items[Math.floor(Math.random() * items.length)];
    updateReel(reel, selection);
  });
  renderStory();
}

function renderStory() {
  const payload = reels.reduce((acc, reel) => {
    acc[reel.dataset.category] = JSON.parse(reel.dataset.currentData);
    return acc;
  }, {});

  const template = storyTemplates[Math.floor(Math.random() * storyTemplates.length)];
  storyParagraph.textContent = template(payload);
}

function spinAll() {
  const results = reels.map(spinReel);
  if (results.some(Boolean)) {
    renderStory();
  }
}

function toggleLock(event) {
  const button = event.currentTarget;
  const locked = button.getAttribute('aria-pressed') === 'true';
  const nextState = !locked;
  button.setAttribute('aria-pressed', String(nextState));
  button.textContent = nextState ? '🔒' : '🔓';
}

spinButton.addEventListener('click', spinAll);
reels.forEach((reel) => {
  reel.querySelector('.lock').addEventListener('click', toggleLock);
});

document.addEventListener('keydown', (event) => {
  if (event.code === 'Space') {
    event.preventDefault();
    spinAll();
  }
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', ensureInitialState);
} else {
  ensureInitialState();
}
