const videoEl = document.getElementById("liveVideo");
const canvasEl = document.getElementById("captureCanvas");
const permissionNotice = document.getElementById("permissionNotice");
const statusBadge = document.getElementById("statusBadge");
const permissionButton = document.getElementById("permissionButton");
const cameraSelect = document.getElementById("cameraSelect");
const timerSelect = document.getElementById("timerSelect");
const sceneSelect = document.getElementById("sceneSelect");
const flipButton = document.getElementById("flipButton");
const mirrorButton = document.getElementById("mirrorButton");
const gridButton = document.getElementById("gridButton");
const captureButton = document.getElementById("captureButton");
const retakeButton = document.getElementById("retakeButton");
const downloadButton = document.getElementById("downloadButton");
const clearGalleryButton = document.getElementById("clearGalleryButton");
const countdownEl = document.getElementById("countdown");
const gridOverlay = document.getElementById("gridOverlay");
const galleryEl = document.getElementById("gallery");
const previewShell = document.getElementById("previewShell");

const detailStatus = document.getElementById("detailStatus");
const detailLens = document.getElementById("detailLens");
const detailResolution = document.getElementById("detailResolution");
const detailScene = document.getElementById("detailScene");
const detailLastCapture = document.getElementById("detailLastCapture");

const exposureSlider = document.getElementById("exposureSlider");
const vibranceSlider = document.getElementById("vibranceSlider");
const warmthSlider = document.getElementById("warmthSlider");
const sharpnessSlider = document.getElementById("sharpnessSlider");

const SCENE_PRESETS = {
  natural: { exposure: 1, vibrance: 1.1, warmth: 0, sharpness: 0.2, label: "Natural Balance" },
  vivid: { exposure: 1.12, vibrance: 1.4, warmth: 8, sharpness: 0.4, label: "Vivid Pop" },
  mono: { exposure: 1.05, vibrance: 0.9, warmth: 0, sharpness: 0.35, label: "Monochrome" },
  nocturne: { exposure: 0.88, vibrance: 1.05, warmth: -12, sharpness: 0.3, label: "Nocturne" }
};

const state = {
  stream: null,
  devices: [],
  activeDeviceId: null,
  facingMode: "environment",
  isMirrored: false,
  gridEnabled: false,
  countdownTimer: null,
  captures: [],
  activeCaptureId: null,
  scene: "natural"
};

function updateStatusBadge(variant, text) {
  statusBadge.textContent = text;
  statusBadge.className = "status-badge";
  statusBadge.classList.add(`status-badge--${variant}`);
}

function supportsCamera() {
  return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

async function refreshDeviceList() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    state.devices = devices.filter((device) => device.kind === "videoinput");
    cameraSelect.innerHTML = "";

    if (state.devices.length === 0) {
      const option = document.createElement("option");
      option.textContent = "No cameras found";
      option.value = "";
      cameraSelect.append(option);
      cameraSelect.disabled = true;
      detailLens.textContent = "Unavailable";
      return;
    }

    cameraSelect.disabled = false;

    state.devices.forEach((device, index) => {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = device.label || `Camera ${index + 1}`;
      cameraSelect.append(option);
    });

    if (state.activeDeviceId) {
      cameraSelect.value = state.activeDeviceId;
    } else {
      state.activeDeviceId = cameraSelect.value;
    }

    const activeDevice = state.devices.find((d) => d.deviceId === state.activeDeviceId);
    if (activeDevice) {
      detailLens.textContent = activeDevice.label || "Active camera";
    }
  } catch (error) {
    console.error("Unable to refresh device list", error);
  }
}

async function startCamera({ deviceId, facingMode } = {}) {
  if (!supportsCamera()) {
    updateStatusBadge("error", "Camera unsupported");
    detailStatus.textContent = "Device does not expose a camera";
    return;
  }

  const constraints = {
    audio: false,
    video: {
      width: { ideal: 1920 },
      height: { ideal: 1080 },
      facingMode: facingMode || state.facingMode
    }
  };

  if (deviceId) {
    constraints.video.deviceId = { exact: deviceId };
  }

  stopStream();
  updateStatusBadge("idle", "Requesting camera");
  detailStatus.textContent = "Requesting permission";

  try {
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    state.stream = stream;
    permissionNotice.hidden = true;
    videoEl.srcObject = stream;
    updateStatusBadge("ready", "Camera live");
    permissionButton.textContent = "Restart Camera";
    detailStatus.textContent = "Live preview";
    const [track] = stream.getVideoTracks();
    const inferredLabel = track?.label?.trim();
    if (inferredLabel) {
      detailLens.textContent = inferredLabel;
    } else {
      detailLens.textContent = state.facingMode === "user" ? "Front lens" : "Rear lens";
    }
    state.activeDeviceId = deviceId || getStreamDeviceId(stream) || state.activeDeviceId;

    if (state.activeDeviceId) {
      cameraSelect.value = state.activeDeviceId;
    }

    if (stream) {
      await refreshDeviceList();
    }
  } catch (error) {
    console.error("Camera access error", error);
    permissionNotice.hidden = false;
    updateStatusBadge("error", "Permission needed");
    permissionButton.textContent = "Enable Camera";
    detailStatus.textContent = formatErrorMessage(error);
    state.stream = null;
  }
}

function getStreamDeviceId(stream) {
  const [track] = stream.getVideoTracks();
  return track ? track.getSettings().deviceId || track.getSettings().groupId : null;
}

function stopStream() {
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }
}

function formatErrorMessage(error) {
  if (error.name === "NotAllowedError") {
    return "Permission denied – enable camera access in browser settings.";
  }
  if (error.name === "NotFoundError") {
    return "No camera detected.";
  }
  return "Unable to start the camera.";
}

function applyFilterToPreview() {
  const filter = computeFilter();
  videoEl.style.filter = filter.css;
}

function computeFilter() {
  const exposure = parseFloat(exposureSlider.value);
  const vibrance = parseFloat(vibranceSlider.value);
  const warmth = parseFloat(warmthSlider.value);
  const sharpness = parseFloat(sharpnessSlider.value);
  const scene = state.scene;

  const contrast = 1 + sharpness * 0.6;
  const saturate = vibrance;

  const parts = [`brightness(${exposure})`, `contrast(${contrast.toFixed(2)})`, `saturate(${saturate})`, `hue-rotate(${warmth}deg)`];
  if (scene === "mono") {
    parts.push("grayscale(1)");
  }
  if (scene === "nocturne") {
    parts.push("drop-shadow(0 0 22px rgba(0, 12, 28, 0.45))");
  }

  return {
    css: parts.join(" "),
    exposure,
    vibrance,
    warmth,
    sharpness,
    scene
  };
}

function updateScenePreset(sceneKey) {
  const preset = SCENE_PRESETS[sceneKey];
  if (!preset) return;

  state.scene = sceneKey;
  sceneSelect.value = sceneKey;
  exposureSlider.value = preset.exposure;
  vibranceSlider.value = preset.vibrance;
  warmthSlider.value = preset.warmth;
  sharpnessSlider.value = preset.sharpness;
  detailScene.textContent = preset.label;
  applyFilterToPreview();
}

function handleSliderChange() {
  applyFilterToPreview();
  const preset = SCENE_PRESETS[state.scene];
  if (!preset) return;
  const matchesPreset =
    Math.abs(parseFloat(exposureSlider.value) - preset.exposure) < 0.01 &&
    Math.abs(parseFloat(vibranceSlider.value) - preset.vibrance) < 0.01 &&
    Math.abs(parseFloat(warmthSlider.value) - preset.warmth) < 1.1 &&
    Math.abs(parseFloat(sharpnessSlider.value) - preset.sharpness) < 0.05;
  detailScene.textContent = matchesPreset ? preset.label : `${preset.label} • custom`;
}

function toggleMirror() {
  state.isMirrored = !state.isMirrored;
  if (state.isMirrored) {
    videoEl.style.transform = "scaleX(-1)";
    canvasEl.style.transform = "scaleX(-1)";
    mirrorButton.classList.add("btn--active");
    mirrorButton.textContent = "Mirror On";
  } else {
    videoEl.style.transform = "";
    canvasEl.style.transform = "";
    mirrorButton.classList.remove("btn--active");
    mirrorButton.textContent = "Mirror";
  }
}

function toggleGrid() {
  state.gridEnabled = !state.gridEnabled;
  gridOverlay.dataset.active = String(state.gridEnabled);
  gridButton.classList.toggle("btn--active", state.gridEnabled);
  gridButton.textContent = state.gridEnabled ? "Grid On" : "Grid";
}

function toggleFacingMode() {
  state.facingMode = state.facingMode === "environment" ? "user" : "environment";
  state.isMirrored = state.facingMode === "user";
  toggleMirrorIndicator();
  startCamera({ facingMode: state.facingMode });
}

function toggleMirrorIndicator() {
  if (state.isMirrored) {
    videoEl.style.transform = "scaleX(-1)";
    canvasEl.style.transform = "scaleX(-1)";
    mirrorButton.classList.add("btn--active");
    mirrorButton.textContent = "Mirror On";
  } else {
    videoEl.style.transform = "";
    canvasEl.style.transform = "";
    mirrorButton.classList.remove("btn--active");
    mirrorButton.textContent = "Mirror";
  }
}

async function handleCameraSelect(event) {
  const deviceId = event.target.value;
  if (!deviceId) return;
  state.activeDeviceId = deviceId;
  state.facingMode = "environment";
  state.isMirrored = false;
  toggleMirrorIndicator();
  await startCamera({ deviceId });
}

function updateResolutionDetails() {
  if (!videoEl.videoWidth || !videoEl.videoHeight) return;
  detailResolution.textContent = `${videoEl.videoWidth} × ${videoEl.videoHeight}`;
}

function disableCaptureControls(isCapturing) {
  captureButton.disabled = isCapturing;
}

function performCapture(filterInfo) {
  if (!videoEl.videoWidth || !videoEl.videoHeight) {
    detailStatus.textContent = "Preview warming up – try again in a moment.";
    updateStatusBadge("idle", "Preview warming up");
    captureButton.disabled = false;
    return;
  }

  const context = canvasEl.getContext("2d");
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
  canvasEl.hidden = false;
  videoEl.hidden = true;

  context.save();
  if (state.isMirrored) {
    context.translate(canvasEl.width, 0);
    context.scale(-1, 1);
  }
  context.filter = filterInfo.css.replace(/drop-shadow\([^)]*\)/g, "");
  context.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
  context.restore();

  const dataUrl = canvasEl.toDataURL("image/png");
  const capture = {
    id: `${Date.now()}`,
    url: dataUrl,
    timestamp: new Date(),
    resolution: `${canvasEl.width} × ${canvasEl.height}`,
    scene: SCENE_PRESETS[state.scene]?.label || state.scene,
    filter: filterInfo,
    lens: detailLens.textContent || "Camera"
  };
  state.captures.unshift(capture);
  state.captures = state.captures.slice(0, 12);
  state.activeCaptureId = capture.id;
  detailLastCapture.textContent = formatCaptureTime(capture.timestamp);
  renderGallery();
  downloadButton.disabled = false;
  retakeButton.disabled = false;
  captureButton.disabled = false;
  detailStatus.textContent = "Photo captured";
}

function formatCaptureTime(date) {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function renderGallery() {
  galleryEl.innerHTML = "";
  if (state.captures.length === 0) {
    const empty = document.createElement("p");
    empty.className = "panel-hint";
    empty.textContent = "No captures yet. Your shots will land here.";
    galleryEl.append(empty);
    return;
  }

  state.captures.forEach((capture) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "gallery__item";
    item.setAttribute("role", "listitem");
    item.dataset.captureId = capture.id;
    if (capture.id === state.activeCaptureId) {
      item.classList.add("gallery__item--active");
    }

    const img = document.createElement("img");
    img.src = capture.url;
    img.alt = `Capture ${capture.timestamp.toLocaleTimeString()}`;

    const meta = document.createElement("div");
    meta.className = "gallery__meta";
    meta.textContent = `${capture.scene} • ${capture.resolution}`;

    item.append(img, meta);
    item.addEventListener("click", () => showCapture(capture.id));
    galleryEl.append(item);
  });
}

function showCapture(captureId) {
  const capture = state.captures.find((c) => c.id === captureId);
  if (!capture) return;
  state.activeCaptureId = captureId;

  const image = new Image();
  image.onload = () => {
    const context = canvasEl.getContext("2d");
    canvasEl.width = image.width;
    canvasEl.height = image.height;
    canvasEl.hidden = false;
    videoEl.hidden = true;
    context.clearRect(0, 0, canvasEl.width, canvasEl.height);
    context.drawImage(image, 0, 0);
    downloadButton.disabled = false;
    retakeButton.disabled = false;
    detailStatus.textContent = "Previewing capture";
    detailResolution.textContent = capture.resolution;
    detailScene.textContent = capture.scene;
    detailLastCapture.textContent = formatCaptureTime(capture.timestamp);
  };
  image.src = capture.url;
}

function resetToLiveView() {
  canvasEl.hidden = true;
  videoEl.hidden = false;
  downloadButton.disabled = state.captures.length === 0;
  retakeButton.disabled = true;
  detailStatus.textContent = "Live preview";
}

function downloadActiveCapture() {
  const capture = state.captures.find((c) => c.id === state.activeCaptureId) || state.captures[0];
  if (!capture) return;

  const link = document.createElement("a");
  link.href = capture.url;
  link.download = `omni-camera-${capture.timestamp.getTime()}.png`;
  link.click();
}

function clearGallery() {
  state.captures = [];
  state.activeCaptureId = null;
  renderGallery();
  resetToLiveView();
  detailLastCapture.textContent = "No photos yet";
  downloadButton.disabled = true;
}

function countdown(seconds, onComplete) {
  if (!seconds) {
    onComplete();
    return;
  }

  let remaining = seconds;
  countdownEl.hidden = false;
  countdownEl.textContent = remaining;
  disableCaptureControls(true);

  state.countdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining > 0) {
      countdownEl.textContent = remaining;
    } else {
      clearInterval(state.countdownTimer);
      state.countdownTimer = null;
      countdownEl.hidden = true;
      disableCaptureControls(false);
      onComplete();
    }
  }, 1000);
}

function cancelCountdown() {
  if (state.countdownTimer) {
    clearInterval(state.countdownTimer);
    state.countdownTimer = null;
  }
  countdownEl.hidden = true;
  disableCaptureControls(false);
}

function handleCapture() {
  if (!state.stream) {
    updateStatusBadge("error", "Camera required");
    detailStatus.textContent = "Enable camera before capturing.";
    return;
  }

  cancelCountdown();
  const seconds = parseInt(timerSelect.value, 10) || 0;
  const filterInfo = computeFilter();

  countdown(seconds, () => {
    performCapture(filterInfo);
  });
}

function init() {
  if (!supportsCamera()) {
    permissionNotice.hidden = false;
    updateStatusBadge("error", "Camera unsupported");
    permissionButton.disabled = true;
    detailStatus.textContent = "This device does not support the MediaDevices API.";
    return;
  }

  permissionNotice.hidden = false;
  cameraSelect.innerHTML = "";
  const placeholderOption = document.createElement("option");
  placeholderOption.value = "";
  placeholderOption.textContent = "Allow access to list cameras";
  cameraSelect.append(placeholderOption);
  cameraSelect.disabled = true;
  updateScenePreset(state.scene);
  applyFilterToPreview();
  renderGallery();

  permissionButton.addEventListener("click", () => startCamera({ facingMode: state.facingMode }));
  flipButton.addEventListener("click", toggleFacingMode);
  mirrorButton.addEventListener("click", toggleMirror);
  gridButton.addEventListener("click", toggleGrid);
  cameraSelect.addEventListener("change", handleCameraSelect);
  captureButton.addEventListener("click", handleCapture);
  retakeButton.addEventListener("click", resetToLiveView);
  downloadButton.addEventListener("click", downloadActiveCapture);
  clearGalleryButton.addEventListener("click", clearGallery);
  sceneSelect.addEventListener("change", (event) => updateScenePreset(event.target.value));
  exposureSlider.addEventListener("input", handleSliderChange);
  vibranceSlider.addEventListener("input", handleSliderChange);
  warmthSlider.addEventListener("input", handleSliderChange);
  sharpnessSlider.addEventListener("input", handleSliderChange);

  videoEl.addEventListener("loadedmetadata", () => {
    updateResolutionDetails();
    detailStatus.textContent = "Live preview";
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stopStream();
      updateStatusBadge("idle", "Camera paused");
      detailStatus.textContent = "Paused while tab hidden";
      permissionNotice.hidden = false;
      permissionButton.textContent = "Enable Camera";
    }
  });

  window.addEventListener("beforeunload", stopStream);
}

init();
