(() => {
  const recordButton = document.getElementById("recordButton");
  const pauseButton = document.getElementById("pauseButton");
  const resumeButton = document.getElementById("resumeButton");
  const stopButton = document.getElementById("stopButton");
  const dropMarkerButton = document.getElementById("dropMarkerButton");
  const markerNoteInput = document.getElementById("markerNoteInput");
  const liveMarkersList = document.getElementById("liveMarkers");
  const takesList = document.getElementById("takesList");
  const statusIndicator = document.getElementById("statusIndicator");
  const timerDisplay = document.getElementById("timerDisplay");
  const levelFill = document.getElementById("levelFill");
  const focusToggle = document.getElementById("focusModeToggle");
  const roomToneToggle = document.getElementById("roomToneToggle");
  const importInput = document.getElementById("importInput");

  const waveformCanvas = document.getElementById("waveformCanvas");
  const ctx = waveformCanvas.getContext("2d");

  let mediaRecorder = null;
  let audioChunks = [];
  let audioContext = null;
  let analyser = null;
  let analyserData = null;
  let sourceNode = null;
  let gainNode = null;
  let highShelfFilter = null;
  let lowShelfFilter = null;
  let destinationNode = null;
  let stream = null;

  let timerStart = 0;
  let accumulatedTime = 0;
  let timerRunning = false;

  let liveMarkers = [];
  let canvasWidth = waveformCanvas.clientWidth;
  let canvasHeight = waveformCanvas.clientHeight;

  const takes = [];

  const formatDuration = (ms) => {
    if (!Number.isFinite(ms) || ms <= 0) {
      return "00:00.0";
    }
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    const tenths = Math.floor((ms % 1000) / 100);
    return `${minutes}:${seconds}.${tenths}`;
  };

  const formatDate = (date) =>
    new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);

  const setStatus = (text, modifier) => {
    statusIndicator.textContent = text;
    statusIndicator.className = "status-indicator";
    if (modifier) {
      statusIndicator.classList.add(modifier);
    }
  };

  const setUIState = (state) => {
    switch (state) {
      case "recording":
        recordButton.disabled = true;
        pauseButton.disabled = false;
        resumeButton.disabled = true;
        stopButton.disabled = false;
        dropMarkerButton.disabled = false;
        break;
      case "paused":
        recordButton.disabled = true;
        pauseButton.disabled = true;
        resumeButton.disabled = false;
        stopButton.disabled = false;
        dropMarkerButton.disabled = true;
        break;
      default:
        recordButton.disabled = false;
        pauseButton.disabled = true;
        resumeButton.disabled = true;
        stopButton.disabled = true;
        dropMarkerButton.disabled = true;
        break;
    }
  };

  const resetTimer = () => {
    accumulatedTime = 0;
    timerRunning = false;
    timerDisplay.textContent = "00:00.0";
  };

  const startTimer = () => {
    accumulatedTime = 0;
    timerStart = performance.now();
    timerRunning = true;
  };

  const resumeTimer = () => {
    timerStart = performance.now();
    timerRunning = true;
  };

  const pauseTimer = () => {
    if (timerRunning) {
      accumulatedTime += performance.now() - timerStart;
      timerRunning = false;
    }
  };

  const getCurrentDuration = () =>
    timerRunning ? accumulatedTime + (performance.now() - timerStart) : accumulatedTime;

  const resizeCanvas = () => {
    canvasWidth = waveformCanvas.clientWidth;
    canvasHeight = waveformCanvas.clientHeight;
    const ratio = window.devicePixelRatio || 1;
    waveformCanvas.width = canvasWidth * ratio;
    waveformCanvas.height = canvasHeight * ratio;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(ratio, ratio);
  };

  const drawBackground = () => {
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, "rgba(59, 130, 246, 0.08)");
    gradient.addColorStop(1, "rgba(15, 37, 56, 0.12)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    ctx.strokeStyle = "rgba(148, 163, 184, 0.22)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 12]);
    ctx.beginPath();
    ctx.moveTo(0, canvasHeight / 2);
    ctx.lineTo(canvasWidth, canvasHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = "rgba(56, 189, 248, 0.12)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    const segmentWidth = canvasWidth / 12;
    for (let x = 0; x <= canvasWidth; x += segmentWidth) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasHeight);
    }
    ctx.stroke();
  };

  const renderIdlePulse = () => {
    ctx.strokeStyle = "rgba(59, 130, 246, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    const midY = canvasHeight / 2;
    for (let x = 0; x <= canvasWidth; x++) {
      const wave = Math.sin(x * 0.02) * 6;
      ctx.lineTo(x, midY + wave);
    }
    ctx.stroke();
  };

  const updateLiveMarkersList = () => {
    liveMarkersList.innerHTML = "";
    liveMarkers.forEach((marker) => {
      const item = document.createElement("li");
      item.textContent = `${formatDuration(marker.time)} — ${marker.note}`;
      liveMarkersList.appendChild(item);
    });
  };

  const renderLoop = () => {
    drawBackground();

    if (analyser && analyserData) {
      analyser.getByteTimeDomainData(analyserData);
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = "rgba(56, 189, 248, 0.9)";
      ctx.beginPath();
      const sliceWidth = canvasWidth / analyserData.length;
      let x = 0;
      let peak = 0;

      for (let i = 0; i < analyserData.length; i += 1) {
        const v = analyserData[i] / 128.0 - 1.0;
        const y = (v * canvasHeight) / 2 + canvasHeight / 2;
        peak = Math.max(peak, Math.abs(v));
        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }
      ctx.stroke();

      const meterWidth = Math.max(4, Math.min(100, peak * 140));
      levelFill.style.width = `${meterWidth}%`;
    } else {
      renderIdlePulse();
      levelFill.style.width = "4%";
    }

    timerDisplay.textContent = formatDuration(getCurrentDuration());
    requestAnimationFrame(renderLoop);
  };

  const cleanupAudioGraph = async () => {
    if (mediaRecorder) {
      mediaRecorder.ondataavailable = null;
      mediaRecorder.onstop = null;
      mediaRecorder.onerror = null;
      mediaRecorder = null;
    }
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      stream = null;
    }
    if (sourceNode) {
      sourceNode.disconnect();
      sourceNode = null;
    }
    if (gainNode) {
      gainNode.disconnect();
      gainNode = null;
    }
    if (highShelfFilter) {
      highShelfFilter.disconnect();
      highShelfFilter = null;
    }
    if (lowShelfFilter) {
      lowShelfFilter.disconnect();
      lowShelfFilter = null;
    }
    if (destinationNode) {
      destinationNode.disconnect();
      destinationNode = null;
    }
    if (analyser) {
      analyser.disconnect();
      analyser = null;
      analyserData = null;
    }
    if (audioContext) {
      try {
        await audioContext.close();
      } catch (error) {
        // ignore
      }
      audioContext = null;
    }
  };

  const createTakeCard = (take) => {
    const card = document.createElement("article");
    card.className = "take-card";
    card.dataset.id = take.id;

    const header = document.createElement("div");
    header.className = "take-header";

    const titleInput = document.createElement("input");
    titleInput.className = "take-title";
    titleInput.value = take.label;
    titleInput.setAttribute("aria-label", "Rename take");
    titleInput.dataset.field = "label";
    titleInput.dataset.id = take.id;

    const meta = document.createElement("p");
    meta.className = "take-meta";
    meta.textContent = `${formatDuration(take.duration)} · ${formatDate(take.createdAt)}`;

    header.appendChild(titleInput);
    header.appendChild(meta);

    const audioElement = document.createElement("audio");
    audioElement.controls = true;
    audioElement.src = take.url;

    const markerRow = document.createElement("div");
    markerRow.className = "take-marker-row";
    if (take.markers.length) {
      take.markers.forEach((marker) => {
        const chip = document.createElement("span");
        chip.textContent = `${formatDuration(marker.time)} · ${marker.note}`;
        markerRow.appendChild(chip);
      });
    } else {
      const empty = document.createElement("span");
      empty.textContent = "No markers captured";
      markerRow.appendChild(empty);
    }

    const actions = document.createElement("div");
    actions.className = "take-actions";

    const downloadButton = document.createElement("button");
    downloadButton.className = "download";
    downloadButton.type = "button";
    downloadButton.dataset.action = "download";
    downloadButton.dataset.id = take.id;
    downloadButton.textContent = "Download";

    const deleteButton = document.createElement("button");
    deleteButton.className = "delete";
    deleteButton.type = "button";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.id = take.id;
    deleteButton.textContent = "Remove";

    actions.append(downloadButton, deleteButton);

    card.append(header, audioElement, markerRow, actions);
    return card;
  };

  const renderTakes = () => {
    takesList.innerHTML = "";
    takes.forEach((take) => {
      takesList.appendChild(createTakeCard(take));
    });
  };

  const handleDownload = (take) => {
    const link = document.createElement("a");
    const safeLabel = take.label.trim() || "take";
    link.href = take.url;
    const extension = take.blob.type.includes("wav") ? "wav" : "webm";
    link.download = `${safeLabel.replace(/[^a-z0-9-_]+/gi, "-")}-${take.id}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (take) => {
    const index = takes.findIndex((item) => item.id === take.id);
    if (index >= 0) {
      URL.revokeObjectURL(take.url);
      takes.splice(index, 1);
      renderTakes();
    }
  };

  const appendTake = (take) => {
    takes.unshift(take);
    renderTakes();
  };

  const readAudioDuration = (blob) =>
    new Promise((resolve) => {
      const audio = document.createElement("audio");
      audio.preload = "metadata";
      audio.src = URL.createObjectURL(blob);
      const cleanUp = () => {
        URL.revokeObjectURL(audio.src);
      };
      audio.addEventListener("loadedmetadata", () => {
        const duration = Number.isFinite(audio.duration) ? audio.duration * 1000 : 0;
        cleanUp();
        resolve(duration);
      });
      audio.addEventListener("error", () => {
        cleanUp();
        resolve(0);
      });
    });

  const resetLiveSession = async () => {
    await cleanupAudioGraph();
    liveMarkers = [];
    updateLiveMarkersList();
    resetTimer();
    setUIState("idle");
  };

  const startRecording = async () => {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (error) {
      setStatus("Microphone access denied", "is-paused");
      setUIState("idle");
      return;
    }

    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioContext.createMediaStreamSource(stream);

    lowShelfFilter = audioContext.createBiquadFilter();
    lowShelfFilter.type = "lowshelf";
    lowShelfFilter.frequency.value = 120;
    lowShelfFilter.gain.value = roomToneToggle.checked ? 2 : -12;

    highShelfFilter = audioContext.createBiquadFilter();
    highShelfFilter.type = "highshelf";
    highShelfFilter.frequency.value = 1600;
    highShelfFilter.gain.value = focusToggle.checked ? 8 : 0;

    gainNode = audioContext.createGain();
    gainNode.gain.value = 1;

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
    analyserData = new Uint8Array(analyser.frequencyBinCount);

    destinationNode = audioContext.createMediaStreamDestination();

    sourceNode.connect(lowShelfFilter);
    lowShelfFilter.connect(highShelfFilter);
    highShelfFilter.connect(gainNode);
    gainNode.connect(destinationNode);
    gainNode.connect(analyser);

    mediaRecorder = new MediaRecorder(destinationNode.stream);

    audioChunks = [];
    liveMarkers = [];
    updateLiveMarkersList();
    startTimer();
    setStatus("Recording", "is-recording");
    setUIState("recording");

    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        audioChunks.push(event.data);
      }
    };

    mediaRecorder.onstop = async () => {
      pauseTimer();
      const blob = new Blob(audioChunks, { type: audioChunks[0]?.type || "audio/webm" });
      const url = URL.createObjectURL(blob);
      const duration = getCurrentDuration();
      const take = {
        id: Date.now().toString(36),
        label: `Take ${String(takes.length + 1).padStart(2, "0")}`,
        createdAt: new Date(),
        url,
        blob,
        duration,
        markers: liveMarkers.map((marker) => ({ ...marker })),
      };
      appendTake(take);
      await resetLiveSession();
      setStatus("Take saved", "is-paused");
    };

    mediaRecorder.onerror = (event) => {
      console.error("Recorder error", event.error);
      setStatus("Recording error", "is-paused");
      resetLiveSession();
    };

    mediaRecorder.start();
  };

  recordButton.addEventListener("click", () => {
    if (mediaRecorder) {
      return;
    }
    startRecording();
  });

  pauseButton.addEventListener("click", () => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      return;
    }
    mediaRecorder.pause();
    pauseTimer();
    setStatus("Paused", "is-paused");
    setUIState("paused");
  });

  resumeButton.addEventListener("click", () => {
    if (!mediaRecorder || mediaRecorder.state !== "paused") {
      return;
    }
    mediaRecorder.resume();
    resumeTimer();
    setStatus("Recording", "is-recording");
    setUIState("recording");
  });

  stopButton.addEventListener("click", () => {
    if (!mediaRecorder) {
      return;
    }
    if (mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
      setStatus("Processing take", "is-paused");
    }
  });

  dropMarkerButton.addEventListener("click", () => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      return;
    }
    const time = getCurrentDuration();
    const note = markerNoteInput.value.trim() || "Moment";
    liveMarkers.push({ time, note });
    markerNoteInput.value = "";
    updateLiveMarkersList();
  });

  focusToggle.addEventListener("change", () => {
    if (highShelfFilter) {
      highShelfFilter.gain.value = focusToggle.checked ? 8 : 0;
    }
  });

  roomToneToggle.addEventListener("change", () => {
    if (lowShelfFilter) {
      lowShelfFilter.gain.value = roomToneToggle.checked ? 2 : -12;
    }
  });

  takesList.addEventListener("click", (event) => {
    const action = event.target.dataset?.action;
    if (!action) {
      return;
    }
    const id = event.target.dataset.id;
    const take = takes.find((item) => item.id === id);
    if (!take) {
      return;
    }
    if (action === "download") {
      handleDownload(take);
    } else if (action === "delete") {
      handleDelete(take);
    }
  });

  takesList.addEventListener("input", (event) => {
    const { field, id } = event.target.dataset || {};
    if (field !== "label" || !id) {
      return;
    }
    const take = takes.find((item) => item.id === id);
    if (take) {
      take.label = event.target.value;
    }
  });

  const readFileAsTake = async (file) => {
    const blob = file.slice(0, file.size, file.type || "audio/webm");
    const url = URL.createObjectURL(blob);
    const duration = await readAudioDuration(blob);
    return {
      id: `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`,
      label: file.name.replace(/\.[^.]+$/, ""),
      createdAt: new Date(),
      url,
      blob,
      duration,
      markers: [],
    };
  };

  importInput.addEventListener("change", async (event) => {
    const files = Array.from(event.target.files || []);
    for (const file of files) {
      const take = await readFileAsTake(file);
      appendTake(take);
    }
    event.target.value = "";
    setStatus("Imported clip ready", "is-paused");
  });

  window.addEventListener("beforeunload", () => {
    takes.forEach((take) => URL.revokeObjectURL(take.url));
  });

  window.addEventListener("resize", resizeCanvas);

  resizeCanvas();
  renderLoop();
})();
