(function () {
  const LANES = 3;
  const playfield = document.getElementById("playfield");
  const hero = document.getElementById("hero");
  const scoreValue = document.getElementById("scoreValue");
  const bestScore = document.getElementById("bestScore");
  const telemetry = document.getElementById("telemetry");
  const startButton = document.getElementById("startButton");
  const missTrack = document.getElementById("missTrack");
  const pipElements = Array.from(missTrack.querySelectorAll(".pip"));

  const STORAGE_KEY = "quantumOrbitBest";
  const catchPhrases = [
    "Flux tether secured!", "Orbit thread stabilized.", "Photon caught clean.",
    "Lattice hums with power!", "Shimmer locked in place."
  ];
  const missPhrases = [
    "Containment wavered—brace!", "Particle slip! Shields rattled.",
    "Reactor hum destabilizing.", "That one got away… recalibrate!"
  ];
  const introPhrases = [
    "Tap ⬅️ or ➡️ to shift lanes. Catch the particles before they crash.",
    "Intercept luminous particles to fuel the core. Three slips trigger an overload.",
    "Chain catches to speed up the energy stream!"
  ];

  const state = {
    running: false,
    heroLane: 1,
    orbs: [],
    spawnTimer: 0,
    spawnInterval: 1.1,
    lastTime: null,
    score: 0,
    misses: 0,
    best: Number.parseInt(localStorage.getItem(STORAGE_KEY), 10) || 0
  };

  bestScore.textContent = state.best;
  updateHeroLane();

  startButton.addEventListener("click", () => {
    if (state.running) {
      finishRun("aborted");
    } else {
      startRun();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (!state.running) {
      if (event.key === " " || event.code === "Space") {
        event.preventDefault();
        startRun();
      }
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      shiftHero(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      shiftHero(1);
    }
  });

  function startRun() {
    state.running = true;
    state.heroLane = 1;
    state.score = 0;
    state.misses = 0;
    state.spawnTimer = 0;
    state.spawnInterval = 1.1;
    state.lastTime = null;
    clearOrbs();
    playfield.classList.remove("shake");
    updateHeroLane();
    updateScore();
    updateMisses();
    chooseTelemetry(introPhrases);
    startButton.textContent = "Abort Run";
    requestAnimationFrame(gameLoop);
  }

  function finishRun(reason) {
    state.running = false;
    state.lastTime = null;
    startButton.textContent = "Ignite Reactor";
    const finalScore = state.score;
    clearOrbs();
    playfield.classList.remove("shake");
    if (reason === "aborted") {
      telemetry.textContent = `Manual abort. Stored charge: ${finalScore}.`;
    } else if (reason === "overload") {
      telemetry.textContent = `Reactor overloaded at ${finalScore} energy. Breathe, reset, retry.`;
    }
  }

  function clearOrbs() {
    state.orbs.forEach((orb) => {
      if (orb.element.parentElement) {
        orb.element.remove();
      }
    });
    state.orbs = [];
  }

  function gameLoop(timestamp) {
    if (!state.running) {
      return;
    }

    if (!state.lastTime) {
      state.lastTime = timestamp;
    }

    const delta = (timestamp - state.lastTime) / 1000;
    state.lastTime = timestamp;

    state.spawnTimer += delta;
    if (state.spawnTimer >= state.spawnInterval) {
      spawnOrb();
      state.spawnTimer = 0;
      const targetInterval = Math.max(0.55, 1.1 - state.score * 0.025);
      state.spawnInterval = targetInterval;
    }

    updateOrbs(delta);

    requestAnimationFrame(gameLoop);
  }

  function spawnOrb() {
    const lane = Math.floor(Math.random() * LANES);
    const tone = ["aqua", "violet", "amber"][Math.floor(Math.random() * 3)];
    const orb = document.createElement("div");
    orb.className = "orb";
    orb.dataset.tone = tone;
    orb.style.left = `${((lane + 0.5) * 100) / LANES}%`;
    orb.style.top = "-40px";
    playfield.appendChild(orb);

    state.orbs.push({
      element: orb,
      lane,
      y: -40,
      speed: 180 + Math.random() * 80,
      resolved: false,
      done: false
    });
  }

  function updateOrbs(delta) {
    const bounds = playfield.clientHeight;
    const catchLine = bounds - hero.offsetHeight - 36;

    state.orbs.forEach((orb) => {
      if (orb.done) {
        return;
      }

      orb.y += orb.speed * delta;
      orb.element.style.top = `${orb.y}px`;

      if (!orb.resolved && orb.y >= catchLine) {
        orb.resolved = true;
        if (orb.lane === state.heroLane) {
          handleCatch(orb);
        } else {
          handleMiss(orb);
        }
      }

      if (orb.y > bounds + 120) {
        orb.done = true;
        if (orb.element.parentElement) {
          orb.element.remove();
        }
      }
    });

    state.orbs = state.orbs.filter((orb) => !orb.done);
  }

  function handleCatch(orb) {
    state.score += 1;
    updateScore();
    orb.done = true;
    orb.element.classList.add("catch");
    chooseTelemetry(catchPhrases, ` +1 flux (${state.score})`);
    setTimeout(() => orb.element.remove(), 320);
  }

  function handleMiss(orb) {
    state.misses += 1;
    updateMisses();
    orb.done = true;
    if (orb.element.parentElement) {
      orb.element.remove();
    }
    chooseTelemetry(missPhrases);
    triggerShake();
    if (state.misses >= 3) {
      finishRun("overload");
    }
  }

  function triggerShake() {
    playfield.classList.remove("shake");
    void playfield.offsetWidth; // force reflow
    playfield.classList.add("shake");
  }

  function shiftHero(direction) {
    const next = Math.min(Math.max(state.heroLane + direction, 0), LANES - 1);
    if (next !== state.heroLane) {
      state.heroLane = next;
      updateHeroLane();
    }
  }

  function updateHeroLane() {
    hero.style.left = `${((state.heroLane + 0.5) * 100) / LANES}%`;
  }

  function updateScore() {
    scoreValue.textContent = state.score;
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(STORAGE_KEY, String(state.best));
    }
    bestScore.textContent = state.best;
  }

  function updateMisses() {
    missTrack.setAttribute("aria-valuenow", String(state.misses));
    pipElements.forEach((pip, index) => {
      pip.classList.toggle("filled", index < state.misses);
    });
  }

  function chooseTelemetry(pool, suffix = "") {
    const phrase = pool[Math.floor(Math.random() * pool.length)];
    telemetry.textContent = `${phrase}${suffix}`;
  }
})();
