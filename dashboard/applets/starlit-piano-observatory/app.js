const noteConfig = [
  { note: "C4", frequency: 261.63, key: "a" },
  { note: "D4", frequency: 293.66, key: "s" },
  { note: "E4", frequency: 329.63, key: "d" },
  { note: "F4", frequency: 349.23, key: "f" },
  { note: "G4", frequency: 392.0, key: "g" },
  { note: "A4", frequency: 440.0, key: "h" },
  { note: "B4", frequency: 493.88, key: "j" },
  { note: "C5", frequency: 523.25, key: "k" },
  { note: "D5", frequency: 587.33, key: "l" },
  { note: "E5", frequency: 659.25, key: ";" },
  { note: "F5", frequency: 698.46, key: "'" },
  { note: "G5", frequency: 783.99, key: "enter" }
];

const dom = {
  keyGrid: document.getElementById("keyGrid"),
  statusLabel: document.getElementById("statusLabel"),
  recordButton: document.getElementById("recordButton"),
  playButton: document.getElementById("playButton"),
  clearButton: document.getElementById("clearButton"),
  orbitFeed: document.getElementById("orbitFeed"),
  closeButton: document.getElementById("closeButton"),
  canvas: document.getElementById("constellationCanvas")
};

const canvasContext = dom.canvas.getContext("2d");
let animationFrameId;

const state = {
  audioContext: null,
  gainNode: null,
  isRecording: false,
  sequenceStart: null,
  sequence: [],
  stars: [],
  orbitPath: [],
  canvasWidth: 0,
  canvasHeight: 0
};

const keyMap = new Map();

const widthHalf = () => (state.canvasWidth || dom.canvas.clientWidth) / 2;
const heightHalf = () => (state.canvasHeight || dom.canvas.clientHeight) / 2;

function setupKeyboard() {
  const fragment = document.createDocumentFragment();
  noteConfig.forEach((config) => {
    const button = document.createElement("button");
    button.className = "piano-key";
    button.type = "button";
    button.dataset.note = config.note;
    button.dataset.key = config.key;
    button.innerHTML = `
      <span class="piano-key__note">${config.note}</span>
      <span class="piano-key__hint">${config.key.toUpperCase()}</span>
    `;

    button.addEventListener("mousedown", () => triggerNote(config));
    button.addEventListener("touchstart", (event) => {
      event.preventDefault();
      triggerNote(config);
    });

    button.addEventListener("mouseup", () => releaseKey(button));
    button.addEventListener("mouseleave", () => releaseKey(button));
    button.addEventListener("touchend", () => releaseKey(button));
    button.addEventListener("touchcancel", () => releaseKey(button));

    fragment.appendChild(button);
    keyMap.set(config.key, button);
  });
  dom.keyGrid.appendChild(fragment);
}

function ensureAudioContext() {
  if (state.audioContext) {
    return state.audioContext;
  }

  const AudioContextConstructor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextConstructor) {
    dom.statusLabel.textContent = "Your browser does not support the Web Audio API.";
    return null;
  }

  const audioContext = new AudioContextConstructor();
  const masterGain = audioContext.createGain();
  masterGain.gain.value = 0.18;
  masterGain.connect(audioContext.destination);

  state.audioContext = audioContext;
  state.gainNode = masterGain;

  return audioContext;
}

function triggerNote(config, options = {}) {
  const audioContext = ensureAudioContext();
  if (!audioContext) {
    return;
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  const button = keyMap.get(config.key);
  if (button) {
    button.classList.add("is-active");
    setTimeout(() => releaseKey(button), 180);
  }

  const oscillator = audioContext.createOscillator();
  const noteGain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = config.frequency;

  noteGain.gain.setValueAtTime(0, audioContext.currentTime);
  noteGain.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.02);
  noteGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);

  oscillator.connect(noteGain);
  noteGain.connect(state.gainNode);

  oscillator.start();
  oscillator.stop(audioContext.currentTime + 1.3);

  const star = renderStar(config.note, options.starCoordinates);
  logOrbitEvent(config.note, options.source ?? "live", star);

  if (state.isRecording && options.source !== "playback") {
    const now = performance.now();
    if (state.sequenceStart === null) {
      state.sequenceStart = now;
    }
    state.sequence.push({
      note: config.note,
      frequency: config.frequency,
      offset: now - state.sequenceStart,
      hue: star.hue,
      x: star.x,
      y: star.y,
      radius: star.radius
    });
    dom.playButton.disabled = false;
    updateStatus(`${state.sequence.length} star${state.sequence.length === 1 ? "" : "s"} secured in orbit.`);
  }
}

function releaseKey(button) {
  button?.classList.remove("is-active");
}

function renderStar(note, providedCoordinates) {
  const width = state.canvasWidth || dom.canvas.clientWidth;
  const height = state.canvasHeight || dom.canvas.clientHeight;

  const baseHue = 38 + Math.random() * 70;
  const star = {
    x: providedCoordinates?.x ?? Math.random() * width,
    y: providedCoordinates?.y ?? Math.random() * height,
    radius: providedCoordinates?.radius ?? (6 + Math.random() * 14),
    hue: providedCoordinates?.hue ?? baseHue,
    alpha: 1,
    note
  };

  state.stars.push(star);
  state.orbitPath.push(star);
  if (state.orbitPath.length > 48) {
    state.orbitPath.shift();
  }

  if (!animationFrameId) {
    animationLoop();
  }

  return star;
}

function animationLoop() {
  animationFrameId = requestAnimationFrame(animationLoop);
  const width = state.canvasWidth || dom.canvas.clientWidth;
  const height = state.canvasHeight || dom.canvas.clientHeight;

  canvasContext.fillStyle = "rgba(2, 10, 22, 0.4)";
  canvasContext.fillRect(0, 0, width, height);

  // draw subtle grid glow
  canvasContext.strokeStyle = "rgba(20, 90, 130, 0.15)";
  canvasContext.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    canvasContext.beginPath();
    const x = (i / 5) * width;
    canvasContext.moveTo(x, 0);
    canvasContext.lineTo(x, height);
    canvasContext.stroke();
  }

  state.orbitPath.forEach((star, index) => {
    if (index === 0) {
      return;
    }
    const previous = state.orbitPath[index - 1];
    canvasContext.strokeStyle = `hsla(${star.hue}, 86%, 68%, ${0.18 + index / (state.orbitPath.length * 1.8)})`;
    canvasContext.lineWidth = 2;
    canvasContext.beginPath();
    canvasContext.moveTo(previous.x, previous.y);
    canvasContext.quadraticCurveTo(
      (previous.x + star.x) / 2 + Math.sin(index) * 18,
      (previous.y + star.y) / 2 + Math.cos(index) * 18,
      star.x,
      star.y
    );
    canvasContext.stroke();
  });

  state.stars = state.stars.filter((star) => {
    star.alpha -= 0.012;
    if (star.alpha <= 0) {
      return false;
    }
    canvasContext.fillStyle = `hsla(${star.hue}, 90%, 72%, ${star.alpha})`;
    canvasContext.beginPath();
    canvasContext.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
    canvasContext.fill();

    canvasContext.lineWidth = 1;
    canvasContext.strokeStyle = `hsla(${star.hue}, 100%, 85%, ${star.alpha * 0.4})`;
    canvasContext.beginPath();
    canvasContext.arc(star.x, star.y, star.radius + 3, 0, Math.PI * 2);
    canvasContext.stroke();

    canvasContext.fillStyle = `hsla(${star.hue}, 95%, 95%, ${star.alpha * 0.8})`;
    canvasContext.beginPath();
    canvasContext.arc(star.x, star.y, Math.max(2, star.radius * 0.3), 0, Math.PI * 2);
    canvasContext.fill();

    return true;
  });

  if (!state.stars.length && !state.orbitPath.length) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = undefined;
  }
}

function logOrbitEvent(note, source, star) {
  const phrases = {
    live: [
      "drifted across the north rim",
      "twirled around the aurora ring",
      "etched a quicksilver arc",
      "kindled a lantern flare",
      "braided into the midnight lattice"
    ],
    playback: [
      "echoed through the observatory",
      "reignited its recorded shimmer",
      "looped back into focus",
      "completed the remembered orbit",
      "sang in the playback halo"
    ]
  };

  const listItem = document.createElement("li");
  const noteLabel = document.createElement("span");
  noteLabel.textContent = note;
  listItem.appendChild(noteLabel);

  const description = document.createElement("p");
  description.textContent = `${source === "live" ? "New star" : "Replay"} ${note} ${
    phrases[source][Math.floor(Math.random() * phrases[source].length)]
  }.`;
  listItem.appendChild(description);

  if (star) {
    const swatch = document.createElement("span");
    swatch.setAttribute("aria-hidden", "true");
    swatch.style.width = "12px";
    swatch.style.height = "12px";
    swatch.style.borderRadius = "50%";
    swatch.style.boxShadow = "0 0 12px rgba(0,0,0,0.35)";
    swatch.style.background = `hsl(${star.hue}, 88%, 70%)`;
    listItem.appendChild(swatch);
  }

  dom.orbitFeed.prepend(listItem);
  while (dom.orbitFeed.children.length > 12) {
    dom.orbitFeed.removeChild(dom.orbitFeed.lastChild);
  }

  if (source === "live") {
    const quadrant = star
      ? star.x < widthHalf() && star.y < heightHalf()
        ? "north-west"
        : star.x >= widthHalf() && star.y < heightHalf()
        ? "north-east"
        : star.x < widthHalf() && star.y >= heightHalf()
        ? "south-west"
        : "south-east"
      : "the skyline";
    updateStatus(`${note} now glows over the ${quadrant.replace("-", " ")}.`);
  } else {
    updateStatus(`Replaying ${note} from the constellation archive.`);
  }
}

function updateStatus(message) {
  dom.statusLabel.textContent = message;
}

function toggleRecording() {
  state.isRecording = !state.isRecording;
  if (state.isRecording) {
    state.sequence = [];
    state.sequenceStart = null;
    dom.recordButton.textContent = "Stop Constellation Capture";
    dom.recordButton.classList.add("is-recording");
    updateStatus("Recording orbit points. Every key secures a new star.");
  } else {
    dom.recordButton.textContent = "Start Constellation Capture";
    dom.recordButton.classList.remove("is-recording");
    if (!state.sequence.length) {
      dom.playButton.disabled = true;
      updateStatus("Constellation capture paused. Play a few notes to begin.");
    } else {
      updateStatus("Constellation locked. Use Replay Orbit to hear it again.");
    }
  }
}

function replaySequence() {
  if (!state.sequence.length) {
    return;
  }

  const audioContext = ensureAudioContext();
  if (!audioContext) {
    return;
  }

  updateStatus("Replaying captured orbit. Listen for the echoes.");
  dom.playButton.disabled = true;

  const start = performance.now();
  const timerIds = [];

  state.sequence.forEach((event) => {
    const timerId = window.setTimeout(() => {
      triggerNote({ note: event.note, frequency: event.frequency, key: findKeyByNote(event.note) }, {
        source: "playback",
        starCoordinates: {
          x: event.x,
          y: event.y,
          radius: event.radius,
          hue: event.hue
        }
      });

      if (event === state.sequence[state.sequence.length - 1]) {
        dom.playButton.disabled = false;
        updateStatus("Playback complete. Add more notes or capture a new orbit.");
      }
    }, event.offset);
    timerIds.push(timerId);
  });

  window.setTimeout(() => {
    timerIds.forEach((id) => window.clearTimeout(id));
    dom.playButton.disabled = false;
  }, Math.max(...state.sequence.map((event) => event.offset)) + 1500);
}

function findKeyByNote(note) {
  const config = noteConfig.find((item) => item.note === note);
  return config ? config.key : noteConfig[0].key;
}

function clearField() {
  state.sequence = [];
  state.sequenceStart = null;
  state.stars = [];
  state.orbitPath = [];
  canvasContext.clearRect(0, 0, state.canvasWidth, state.canvasHeight);
  dom.orbitFeed.innerHTML = "";
  dom.playButton.disabled = true;
  updateStatus("Starfield reset. Ready for a fresh constellation.");
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = undefined;
  }
}

function bindControls() {
  dom.recordButton.addEventListener("click", toggleRecording);
  dom.playButton.addEventListener("click", replaySequence);
  dom.clearButton.addEventListener("click", clearField);

  dom.closeButton.addEventListener("click", () => {
    window.parent?.postMessage?.({ type: "applet-close" }, "*");
    window.location.href = "../../index.html";
  });

  window.addEventListener("keydown", (event) => {
    const key = event.key.toLowerCase();
    if (!keyMap.has(key)) {
      if (event.key.toLowerCase() === "enter") {
        const enterConfig = noteConfig.find((item) => item.key === "enter");
        if (enterConfig) {
          triggerNote(enterConfig);
        }
      }
      return;
    }

    event.preventDefault();
    const config = noteConfig.find((item) => item.key === key);
    if (config) {
      triggerNote(config);
    }
  });
}

function resizeCanvas() {
  const { width, height } = dom.canvas.getBoundingClientRect();
  const pixelRatio = window.devicePixelRatio || 1;
  state.canvasWidth = width;
  state.canvasHeight = height;
  dom.canvas.width = Math.floor(width * pixelRatio);
  dom.canvas.height = Math.floor(height * pixelRatio);
  if (typeof canvasContext.resetTransform === "function") {
    canvasContext.resetTransform();
  } else {
    canvasContext.setTransform(1, 0, 0, 1, 0, 0);
  }
  canvasContext.scale(pixelRatio, pixelRatio);
}

function init() {
  setupKeyboard();
  resizeCanvas();
  bindControls();
  updateStatus("Tap a key to wake the observatory.");
  window.addEventListener("resize", resizeCanvas);
}

init();
