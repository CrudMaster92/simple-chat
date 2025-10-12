const heroOptions = [
  'Skyship Cartographer',
  'Runic Librarian',
  'Starlit Chef',
  'Clockwork Ranger',
  'Whale Song Archivist',
  'Thunder Alchemist',
  'Luminous Mycologist',
  'Desert Cloud Weaver',
  'Aurora Druid',
  'Lantern-Tide Navigator',
  'Chronicle Acrobat',
  'Golem Whisperer'
];

const questOptions = [
  'Map the music hidden in auroras',
  'Rescue the last syllable of a forgotten spell',
  'Host a peace dinner between rival storms',
  'Repair a lighthouse made of fireflies',
  'Smuggle a sunrise past the horizon police',
  'Bake a cake that predicts the future',
  'Unwind the knot that tangles time rivers',
  'Guide migrating constellations to their nests',
  'Choreograph the annual eclipse parade',
  'Translate the dreams of a sleepy volcano',
  'Brew tea that calms rebellious comets',
  'Teach a mountain how to dance again'
];

const twistOptions = [
  'A mischievous moon fox keeps swapping clues',
  'The dice only roll in palindromes tonight',
  'Every ally speaks exclusively in limericks',
  'Gravity takes weekends off in this region',
  'A rival keeps stealing nouns from sentences',
  'The soundtrack rewinds whenever someone yawns',
  'Hero and foe are the same person on alternating hours',
  'Weather spirits demand frequent costume changes',
  'A pocket universe is hiding in the hero’s coat',
  'You must finish before the chorus repeats thrice',
  'Failure unleashes a rain of confetti that never sweeps up',
  'All maps suddenly prefer interpretive dance'
];

const heroDisplay = document.querySelector('#hero-value');
const questDisplay = document.querySelector('#quest-value');
const twistDisplay = document.querySelector('#twist-value');
const promptOutput = document.querySelector('#prompt-output');
const rollButton = document.querySelector('#roll-button');
const copyButton = document.querySelector('#copy-button');
const copyFeedback = document.querySelector('#copy-feedback');
const dieCards = document.querySelectorAll('.die-card');

const lastResult = {
  hero: heroDisplay.textContent,
  quest: questDisplay.textContent,
  twist: twistDisplay.textContent
};

function getRandomOption(list, previous) {
  if (list.length <= 1) return list[0];

  let next = previous;
  while (next === previous) {
    next = list[Math.floor(Math.random() * list.length)];
  }
  return next;
}

function updatePrompt(hero, quest, twist) {
  promptOutput.textContent = `${hero} must ${quest.toLowerCase()}, but ${twist.toLowerCase()}.`;
}

function animateDice() {
  dieCards.forEach((card) => {
    card.classList.remove('animate');
    // force reflow for restarting animation
    void card.offsetWidth;
    card.classList.add('animate');
  });
}

async function rollDice() {
  rollButton.disabled = true;
  copyButton.disabled = true;
  animateDice();

  await new Promise((resolve) => setTimeout(resolve, 240));

  const hero = getRandomOption(heroOptions, lastResult.hero);
  const quest = getRandomOption(questOptions, lastResult.quest);
  const twist = getRandomOption(twistOptions, lastResult.twist);

  lastResult.hero = hero;
  lastResult.quest = quest;
  lastResult.twist = twist;

  heroDisplay.textContent = hero;
  questDisplay.textContent = quest;
  twistDisplay.textContent = twist;
  updatePrompt(hero, quest, twist);

  rollButton.disabled = false;
  copyButton.disabled = false;
}

async function copyPrompt() {
  const text = promptOutput.textContent.trim();

  try {
    await navigator.clipboard.writeText(text);
    copyFeedback.textContent = 'Prompt copied to clipboard!';
  } catch (error) {
    copyFeedback.textContent = 'Unable to copy automatically. You can select manually!';
  }

  setTimeout(() => {
    copyFeedback.textContent = '';
  }, 3000);
}

rollButton.addEventListener('click', rollDice);
copyButton.addEventListener('click', copyPrompt);

updatePrompt(lastResult.hero, lastResult.quest, lastResult.twist);
