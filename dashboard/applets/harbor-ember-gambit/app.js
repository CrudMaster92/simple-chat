const SUITS = [
  {
    name: "Tideglass",
    accent: "#4ac4e0",
    description: "+1 strength from the steady current.",
    score: (value) => value + 1
  },
  {
    name: "Emberwake",
    accent: "#ff8a27",
    description: "Cards 8-12 gather +2 spark.",
    score: (value) => (value >= 8 ? value + 2 : value)
  },
  {
    name: "Galeweave",
    accent: "#6de39d",
    description: "Cards 1-5 gain a tailwind worth +3.",
    score: (value) => (value <= 5 ? value + 3 : value)
  },
  {
    name: "Stonebound",
    accent: "#d7c69a",
    description: "On ties, Stonebound claims the wave.",
    score: (value) => value
  }
];

const TARGET_PENNANTS = 7;

const state = {
  deck: [],
  playerHand: [],
  aiHand: [],
  playerScore: 0,
  aiScore: 0,
  round: 0,
  lockHand: false,
  gameOver: false
};

const playerHandEl = document.getElementById("player-hand");
const aiCardEl = document.getElementById("ai-card");
const roundCountEl = document.getElementById("round-count");
const playerScoreEl = document.getElementById("player-score");
const aiScoreEl = document.getElementById("ai-score");
const cardsRemainingEl = document.getElementById("cards-remaining");
const resultBannerEl = document.getElementById("result-banner");
const nextRoundBtn = document.getElementById("next-round");
const restartBtn = document.getElementById("restart");

function createDeck() {
  const cards = [];
  SUITS.forEach((suit) => {
    for (let value = 1; value <= 12; value += 1) {
      cards.push({
        suit: suit.name,
        value
      });
    }
  });
  return cards;
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getSuitDetails(suitName) {
  return SUITS.find((suit) => suit.name === suitName);
}

function computePower(card) {
  const suit = getSuitDetails(card.suit);
  const baseScore = suit ? suit.score(card.value) : card.value;
  return baseScore;
}

function describeModifier(card) {
  const suit = getSuitDetails(card.suit);
  if (!suit) return "";
  const base = card.value;
  const boosted = suit.score(card.value);
  if (boosted === base) {
    if (card.suit === "Stonebound") {
      return "Claims ties";
    }
    return "No shift";
  }
  const delta = boosted - base;
  const sign = delta > 0 ? "+" : "-";
  return `${sign}${delta} boost`;
}

function renderCard(card, { clickable = false, selected = false } = {}) {
  const cardEl = document.createElement("button");
  cardEl.className = "card";
  cardEl.type = "button";
  cardEl.setAttribute("data-clickable", clickable);
  cardEl.disabled = !clickable;
  const suitInfo = getSuitDetails(card.suit);
  if (suitInfo) {
    cardEl.style.borderColor = suitInfo.accent;
  }
  if (selected) {
    cardEl.classList.add("selected");
  }

  const valueEl = document.createElement("span");
  valueEl.className = "value";
  valueEl.textContent = card.value;

  const suitEl = document.createElement("span");
  suitEl.className = "suit";
  suitEl.textContent = card.suit;
  if (suitInfo) {
    suitEl.style.color = suitInfo.accent;
  }

  const effectEl = document.createElement("span");
  effectEl.className = "effect";
  effectEl.textContent = `${describeModifier(card)} · ${suitInfo?.description ?? ""}`;

  cardEl.append(valueEl, suitEl, effectEl);
  return cardEl;
}

function clearBoard() {
  playerHandEl.innerHTML = "";
  aiCardEl.innerHTML = "";
  resultBannerEl.textContent = "";
}

function updateScoreboard() {
  roundCountEl.textContent = state.round;
  playerScoreEl.textContent = state.playerScore;
  aiScoreEl.textContent = state.aiScore;
  cardsRemainingEl.textContent = state.deck.length;
}

function dealHands() {
  if (state.deck.length < 6) {
    concludeMatch();
    return;
  }

  state.playerHand = state.deck.splice(0, 3);
  state.aiHand = state.deck.splice(0, 3);
  state.round += 1;
  state.lockHand = false;

  clearBoard();
  updateScoreboard();
  renderPlayerHand();
  nextRoundBtn.style.display = "none";
  restartBtn.style.display = "none";
  aiCardEl.textContent = "Awaiting play…";
}

function renderPlayerHand() {
  state.playerHand.forEach((card, index) => {
    const cardEl = renderCard(card, { clickable: !state.lockHand });
    cardEl.addEventListener("click", () => handlePlayerChoice(index));
    cardEl.addEventListener("keydown", (event) => {
      if (!state.lockHand && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        handlePlayerChoice(index);
      }
    });
    playerHandEl.appendChild(cardEl);
  });
}

function handlePlayerChoice(index) {
  if (state.lockHand || state.gameOver) return;
  state.lockHand = true;
  const playerCard = state.playerHand[index];
  const aiCard = chooseAiCard();
  revealSelections(index, playerCard, aiCard);
  resolveWave(playerCard, aiCard);
}

function chooseAiCard() {
  let bestCard = state.aiHand[0];
  let bestScore = -Infinity;
  state.aiHand.forEach((card) => {
    const score = computePower(card) + Math.random() * 0.6;
    if (score > bestScore) {
      bestScore = score;
      bestCard = card;
    }
  });
  return bestCard;
}

function revealSelections(playerIndex, playerCard, aiCard) {
  playerHandEl.innerHTML = "";
  state.playerHand.forEach((card, index) => {
    const isChosen = index === playerIndex;
    const cardEl = renderCard(card, { clickable: false, selected: isChosen });
    playerHandEl.appendChild(cardEl);
  });

  aiCardEl.innerHTML = "";
  aiCardEl.appendChild(renderCard(aiCard));
}

function resolveWave(playerCard, aiCard) {
  const playerPower = computePower(playerCard);
  const aiPower = computePower(aiCard);

  let winner = "tie";
  if (playerPower > aiPower) {
    winner = "player";
  } else if (aiPower > playerPower) {
    winner = "ai";
  } else {
    const playerStone = playerCard.suit === "Stonebound";
    const aiStone = aiCard.suit === "Stonebound";
    if (playerStone && !aiStone) {
      winner = "player";
    } else if (aiStone && !playerStone) {
      winner = "ai";
    }
  }

  let bannerText = "The wave is a stalemate.";
  if (winner === "player") {
    state.playerScore += 1;
    bannerText = `You claim the pennant! (${playerPower} vs ${aiPower})`;
  } else if (winner === "ai") {
    state.aiScore += 1;
    bannerText = `Rival seizes the pennant. (${aiPower} vs ${playerPower})`;
  }

  resultBannerEl.textContent = bannerText;
  updateScoreboard();

  if (state.playerScore >= TARGET_PENNANTS || state.aiScore >= TARGET_PENNANTS) {
    concludeMatch();
    return;
  }

  if (state.deck.length < 6) {
    concludeMatch();
    return;
  }

  nextRoundBtn.style.display = "inline-flex";
}

function concludeMatch() {
  state.gameOver = true;
  nextRoundBtn.style.display = "none";
  restartBtn.style.display = "inline-flex";

  let message = "The harbor night ends in balance.";
  if (state.playerScore > state.aiScore) {
    message = "You hoist the championship pennant!";
  } else if (state.aiScore > state.playerScore) {
    message = "The harbor rival keeps the pennant this night.";
  }
  resultBannerEl.textContent = message;
}

function resetGame() {
  state.deck = shuffle(createDeck());
  state.playerHand = [];
  state.aiHand = [];
  state.playerScore = 0;
  state.aiScore = 0;
  state.round = 0;
  state.gameOver = false;
  state.lockHand = false;
  updateScoreboard();
  cardsRemainingEl.textContent = state.deck.length;
  dealHands();
}

nextRoundBtn.addEventListener("click", () => {
  if (state.gameOver) return;
  dealHands();
});

restartBtn.addEventListener("click", () => {
  resetGame();
});

resetGame();
