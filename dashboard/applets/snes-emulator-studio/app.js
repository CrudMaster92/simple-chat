const romInput = document.getElementById("romInput");
const dropzone = document.getElementById("dropzone");
const statusMessage = document.getElementById("statusMessage");
const placeholder = document.getElementById("placeholder");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const resetBtn = document.getElementById("resetBtn");
const muteBtn = document.getElementById("muteBtn");
const viewport = document.getElementById("emulatorViewport");
const emulatorScript = document.getElementById("emulatorScript");

let lastRom = null;
let isMuted = false;

function setStatus(message, tone = "info") {
  statusMessage.textContent = message;
  statusMessage.classList.remove("status--success", "status--warning");
  if (tone === "success") {
    statusMessage.classList.add("status--success");
  } else if (tone === "warning") {
    statusMessage.classList.add("status--warning");
  }
}

if (emulatorScript) {
  const watchdog = window.setTimeout(() => {
    const runtimeLoaded =
      window.EJS_loadFile ||
      (window.EJS && typeof window.EJS.loadRom === "function") ||
      window.EJS_Emulator ||
      window.EJS_emulator ||
      window.emulator;

    if (!runtimeLoaded && emulatorScript.dataset.failed !== "true") {
      emulatorScript.dataset.failed = "timeout";
      setStatus(
        "The emulator runtime is taking unusually long to load. Ensure jsDelivr isn't blocked and reload the page.",
        "warning",
      );
    }
  }, 15000);

  emulatorScript.addEventListener("error", () => {
    emulatorScript.dataset.failed = "true";
    setStatus(
      "Failed to download the SNES runtime. Check your connection or unblock jsDelivr, then reload the page.",
      "warning",
    );
  });

  emulatorScript.addEventListener("load", () => {
    window.clearTimeout(watchdog);
  });
}

function clearFileInput() {
  if (romInput) {
    romInput.value = "";
  }
}

function fileTooLarge(file) {
  const maxSize = 32 * 1024 * 1024; // 32 MB safety ceiling
  return file.size > maxSize;
}

async function waitForEmulator(maxAttempts = 60) {
  let attempts = 0;
  return new Promise((resolve, reject) => {
    const probe = () => {
      const ready =
        typeof window.EJS_loadFile === "function" ||
        (window.EJS && typeof window.EJS.loadRom === "function") ||
        window.EJS_Emulator ||
        window.EJS_emulator ||
        window.emulator;

      if (ready) {
        resolve();
        return;
      }

      attempts += 1;
      if (attempts >= maxAttempts) {
        reject(new Error("Emulator runtime did not finish loading"));
        return;
      }

      window.setTimeout(probe, 250);
    };

    probe();
  });
}

async function tryLoadRom({ file, name, buffer }) {
  const ensureBuffer = async () => {
    if (buffer) {
      return buffer;
    }
    const arrayBuffer = await file.arrayBuffer();
    buffer = new Uint8Array(arrayBuffer);
    return buffer;
  };

  const tryStrategies = [
    async () => {
      if (typeof window.EJS_loadFile === "function") {
        window.EJS_loadFile(file);
        return true;
      }
      return false;
    },
    async () => {
      if (window.EJS && typeof window.EJS.loadRom === "function") {
        window.EJS.loadRom(file);
        return true;
      }
      return false;
    },
    async () => {
      const instance = window.EJS_Emulator || window.EJS_emulator || window.emulator;
      if (!instance) {
        return false;
      }

      const directLoader = instance.loadFile || instance.loadRom || instance.loadGame;
      if (typeof directLoader === "function") {
        directLoader.call(instance, file);
        return true;
      }
      return false;
    },
    async () => {
      const dataLoader =
        window.EJS_sendFileToEmulator ||
        window.EJS_loadData ||
        window.EJS_startGame ||
        (window.EJS && window.EJS.loadData);

      if (typeof dataLoader === "function") {
        const romBuffer = await ensureBuffer();
        dataLoader.call(window.EJS || window, romBuffer, name);
        return true;
      }

      const instance = window.EJS_Emulator || window.EJS_emulator || window.emulator;
      if (!instance) {
        return false;
      }

      const loadBufferFn =
        instance.loadData || instance.loadRomFromBuffer || instance.loadBuffer || instance.loadBinary;
      if (typeof loadBufferFn === "function") {
        const romBuffer = await ensureBuffer();
        loadBufferFn.call(instance, romBuffer, name);
        return true;
      }

      return false;
    },
  ];

  for (const attempt of tryStrategies) {
    try {
      const worked = await attempt();
      if (worked) {
        if (!buffer) {
          await ensureBuffer();
        }
        lastRom = { name, buffer };
        return true;
      }
    } catch (error) {
      console.warn("ROM load attempt failed", error);
    }
  }

  return false;
}

function hidePlaceholder() {
  if (placeholder) {
    placeholder.classList.add("is-hidden");
  }
}

function showPlaceholder() {
  if (placeholder) {
    placeholder.classList.remove("is-hidden");
  }
}

async function bootRom(source) {
  const file = source instanceof File ? source : source?.file;
  const name = (source instanceof File ? source.name : source?.name) || "SNES ROM";

  if (!file && !source?.buffer) {
    setStatus("Unable to read the selected ROM.", "warning");
    return;
  }

  if (file && fileTooLarge(file)) {
    setStatus("ROM larger than 32 MB. Please choose a smaller dump.", "warning");
    return;
  }

  setStatus(`Preparing ${name}…`);

  try {
    if (emulatorScript?.dataset.failed) {
      throw new Error(emulatorScript.dataset.failed === "true" ? "download-failed" : "download-timeout");
    }

    await waitForEmulator();
  } catch (error) {
    console.error(error);
    if (error?.message === "download-failed") {
      setStatus(
        "The emulator core could not be downloaded. Please verify your network connection and reload the studio.",
        "warning",
      );
    } else if (error?.message === "download-timeout") {
      setStatus(
        "The emulator runtime never finished loading. Confirm the CDN is reachable before trying again.",
        "warning",
      );
    } else {
      setStatus("Emulator core is still downloading. Try again in a moment.", "warning");
    }
    return;
  }

  const romDescriptor = {
    file: file || (source?.buffer ? new File([source.buffer], name, { type: "application/octet-stream" }) : null),
    name,
    buffer: source?.buffer || null,
  };

  const loaded = await tryLoadRom(romDescriptor);

  if (loaded) {
    hidePlaceholder();
    lastRom = {
      name,
      buffer: romDescriptor.buffer,
    };
    setStatus(`Running ${name}.`, "success");
  } else {
    setStatus("Could not hand the ROM to the emulator runtime.", "warning");
  }
}

function handleFileList(fileList) {
  if (!fileList || fileList.length === 0) {
    return;
  }

  const [file] = fileList;
  if (!file) {
    return;
  }

  bootRom(file);
  clearFileInput();
}

if (romInput) {
  romInput.addEventListener("change", (event) => {
    const target = event.target;
    if (!target || !target.files) {
      return;
    }
    handleFileList(target.files);
  });
}

if (dropzone) {
  dropzone.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("dragover");
    handleFileList(event.dataTransfer?.files);
  });
}

if (fullscreenBtn) {
  fullscreenBtn.addEventListener("click", async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }
      if (viewport?.requestFullscreen) {
        await viewport.requestFullscreen();
      }
    } catch (error) {
      console.error(error);
      setStatus("Fullscreen request was blocked by the browser.", "warning");
    }
  });
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (!lastRom) {
      setStatus("Load a ROM before using reset.", "warning");
      return;
    }
    bootRom({ name: lastRom.name, buffer: lastRom.buffer.slice ? lastRom.buffer.slice() : lastRom.buffer });
  });
}

function toggleMute() {
  const instance = window.EJS_Emulator || window.EJS_emulator || window.EJS || window.emulator;
  const candidates = [
    window.EJS_toggleMute,
    window.EJS_toggleSound,
    instance?.toggleMute,
    instance?.toggleSound,
    instance?.mute,
  ];

  for (const fn of candidates) {
    if (typeof fn === "function") {
      fn.call(instance || window.EJS || window);
      return true;
    }
  }

  return false;
}

if (muteBtn) {
  muteBtn.addEventListener("click", () => {
    const toggled = toggleMute();
    if (!toggled) {
      setStatus("Audio toggle not available in this build. Use the emulator toolbar if present.", "warning");
      return;
    }

    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? "Unmute" : "Mute";
    setStatus(isMuted ? "Audio muted." : "Audio restored.", "success");
  });
}

window.addEventListener("message", (event) => {
  if (!event?.data || typeof event.data !== "object") {
    return;
  }

  if (event.data.type === "EJS_onGameReady") {
    hidePlaceholder();
    if (event.data.name) {
      setStatus(`Running ${event.data.name}.`, "success");
    }
  }
});

setStatus("Waiting for a ROM…");
showPlaceholder();
