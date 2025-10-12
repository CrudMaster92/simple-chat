const drives = [
  {
    id: "drive-a",
    letter: "A:/",
    label: "Drive A: Studio Diskette",
    description: "Creative tooling and palettes",
    capacityMb: 1.44,
    usedMb: 0.73,
    temperatureC: 36,
    status: "Mounted",
    tree: [
      {
        name: "Projects",
        path: "A:/Projects",
        hint: "Concept builds",
        children: [
          { name: "Mockups", path: "A:/Projects/Mockups", hint: "UI captures" },
          { name: "Soundscapes", path: "A:/Projects/Soundscapes", hint: "Sample loops" }
        ]
      },
      { name: "Utilities", path: "A:/Utilities", hint: "Batch helpers" },
      { name: "Archive", path: "A:/Archive", hint: "Legacy notes" }
    ],
    rootPath: "A:/"
  },
  {
    id: "drive-b",
    letter: "B:/",
    label: "Drive B: Field Notes",
    description: "Field recordings and captures",
    capacityMb: 1.44,
    usedMb: 0.91,
    temperatureC: 41,
    status: "Mounted",
    tree: [
      { name: "Windswept", path: "B:/Windswept", hint: "Atmos layers" },
      { name: "Telemetry", path: "B:/Telemetry", hint: "Sensor logs" }
    ],
    rootPath: "B:/"
  },
  {
    id: "drive-d",
    letter: "D:/",
    label: "Drive D: Transfer Bay",
    description: "Gateway for disk-to-disk copy",
    capacityMb: 1.44,
    usedMb: 0.22,
    temperatureC: 29,
    status: "Mounted",
    tree: [
      { name: "Inbox", path: "D:/Inbox", hint: "Awaiting verification" },
      { name: "Outgoing", path: "D:/Outgoing", hint: "Stamped for send" }
    ],
    rootPath: "D:/"
  }
];

const directoryIndex = {
  "A:/": {
    driveId: "drive-a",
    items: [
      {
        name: "Projects",
        type: "Folder",
        size: "—",
        modified: "1996-02-08 14:10",
        attributes: "DIR",
        icon: "📁",
        isFolder: true,
        targetPath: "A:/Projects",
        description: "Organised builds and references",
        contains: "3 folders, 2 files"
      },
      {
        name: "Utilities",
        type: "Folder",
        size: "—",
        modified: "1995-11-18 09:26",
        attributes: "DIR",
        icon: "🛠️",
        isFolder: true,
        targetPath: "A:/Utilities",
        description: "Helper batch scripts and viewers",
        contains: "2 files"
      },
      {
        name: "Archive",
        type: "Folder",
        size: "—",
        modified: "1994-07-29 22:17",
        attributes: "DIR",
        icon: "🗄️",
        isFolder: true,
        targetPath: "A:/Archive",
        description: "Older exports and notes",
        contains: "5 files"
      },
      {
        name: "AUTOEXEC.BAT",
        type: "System Batch",
        size: "1 KB",
        modified: "1994-02-12 08:12",
        attributes: "S, H",
        icon: "⚙️",
        description: "Boot sequence for palette prep",
        origin: "MS-DOS 6.22",
        checksum: "7B3A-1F2D"
      },
      {
        name: "PALETTE.INI",
        type: "Settings",
        size: "2 KB",
        modified: "1996-01-03 19:42",
        attributes: "R",
        icon: "🎛️",
        description: "Swatches used by concept suites",
        origin: "Diskette Explorer",
        checksum: "AC9D-44B2"
      }
    ]
  },
  "A:/Projects": {
    driveId: "drive-a",
    items: [
      {
        name: "Mockups",
        type: "Folder",
        size: "—",
        modified: "1996-02-07 08:51",
        attributes: "DIR",
        icon: "🗂️",
        isFolder: true,
        targetPath: "A:/Projects/Mockups",
        description: "Slides and pixel composites",
        contains: "2 files"
      },
      {
        name: "Soundscapes",
        type: "Folder",
        size: "—",
        modified: "1996-02-06 12:14",
        attributes: "DIR",
        icon: "🎧",
        isFolder: true,
        targetPath: "A:/Projects/Soundscapes",
        description: "Loop layers and ambience",
        contains: "3 files"
      },
      {
        name: "README.TXT",
        type: "Text Document",
        size: "4 KB",
        modified: "1996-02-05 10:05",
        attributes: "A",
        icon: "📄",
        description: "Project index and guidelines",
        origin: "Crew Archive",
        checksum: "19F0-EE4C"
      }
    ]
  },
  "A:/Projects/Mockups": {
    driveId: "drive-a",
    items: [
      {
        name: "Interface.PCX",
        type: "Bitmap",
        size: "128 KB",
        modified: "1996-02-04 18:37",
        attributes: "A",
        icon: "🖼️",
        description: "Main window pixel render",
        origin: "GrafX2",
        checksum: "4FA2-9920"
      },
      {
        name: "Dialogs.PCX",
        type: "Bitmap",
        size: "96 KB",
        modified: "1996-02-04 19:02",
        attributes: "A",
        icon: "🗔",
        description: "Retro dialog sprite sheet",
        origin: "GrafX2",
        checksum: "B83E-145A"
      }
    ]
  },
  "A:/Projects/Soundscapes": {
    driveId: "drive-a",
    items: [
      {
        name: "Startup.VOC",
        type: "Audio Sample",
        size: "42 KB",
        modified: "1996-02-03 06:42",
        attributes: "A",
        icon: "🔊",
        description: "Chime triggered at boot",
        origin: "SoundBlaster Capture",
        checksum: "22C1-92FA"
      },
      {
        name: "Click1.VOC",
        type: "Audio Sample",
        size: "8 KB",
        modified: "1996-02-02 21:17",
        attributes: "A",
        icon: "🎚️",
        description: "Primary button click",
        origin: "Field Booth",
        checksum: "7A17-0BA2"
      },
      {
        name: "Hover.VOC",
        type: "Audio Sample",
        size: "6 KB",
        modified: "1996-02-02 21:21",
        attributes: "A",
        icon: "🌬️",
        description: "Airy hover confirmation",
        origin: "Field Booth",
        checksum: "1B3D-4E12"
      }
    ]
  },
  "A:/Utilities": {
    driveId: "drive-a",
    items: [
      {
        name: "BACKUP.BAT",
        type: "Batch Script",
        size: "3 KB",
        modified: "1995-11-18 09:24",
        attributes: "A",
        icon: "🧰",
        description: "Rapid copy to transfer bay",
        origin: "Diskette Explorer",
        checksum: "F94C-21BB"
      },
      {
        name: "VERIFY.EXE",
        type: "Executable",
        size: "48 KB",
        modified: "1995-09-11 13:05",
        attributes: "A",
        icon: "💾",
        description: "Byte-level integrity checker",
        origin: "Studio Build",
        checksum: "3F7E-9CDA"
      }
    ]
  },
  "A:/Archive": {
    driveId: "drive-a",
    items: [
      {
        name: "LOG1993.TXT",
        type: "Text Document",
        size: "12 KB",
        modified: "1994-07-29 20:01",
        attributes: "A",
        icon: "📜",
        description: "Historic commit notes",
        origin: "Crew Archive",
        checksum: "A7D1-4AC3"
      },
      {
        name: "SPRITES.BIN",
        type: "Binary",
        size: "256 KB",
        modified: "1994-05-12 17:15",
        attributes: "A",
        icon: "🧊",
        description: "Tile atlas cache",
        origin: "Assembler Toolkit",
        checksum: "902F-7788"
      },
      {
        name: "NOTES.RTF",
        type: "Rich Text",
        size: "7 KB",
        modified: "1994-05-02 09:55",
        attributes: "A",
        icon: "📝",
        description: "Layer breakdowns",
        origin: "WordPad",
        checksum: "4E0A-1023"
      },
      {
        name: "PALETTE.BIN",
        type: "Binary",
        size: "16 KB",
        modified: "1993-12-22 18:45",
        attributes: "A",
        icon: "🎨",
        description: "Indexed palette store",
        origin: "Studio Calibrator",
        checksum: "55AA-77C2"
      },
      {
        name: "README.OLD",
        type: "Text Document",
        size: "3 KB",
        modified: "1993-12-01 12:10",
        attributes: "R",
        icon: "📄",
        description: "Prior spec instructions",
        origin: "Archive",
        checksum: "00FE-1188"
      }
    ]
  },
  "B:/": {
    driveId: "drive-b",
    items: [
      {
        name: "Windswept",
        type: "Folder",
        size: "—",
        modified: "1995-10-03 07:12",
        attributes: "DIR",
        icon: "🌬️",
        isFolder: true,
        targetPath: "B:/Windswept",
        description: "Outdoor ambience takes",
        contains: "4 files"
      },
      {
        name: "Telemetry",
        type: "Folder",
        size: "—",
        modified: "1995-09-22 16:54",
        attributes: "DIR",
        icon: "📡",
        isFolder: true,
        targetPath: "B:/Telemetry",
        description: "Sensor sweeps and logs",
        contains: "2 files"
      },
      {
        name: "FIELDLOG.TXT",
        type: "Text Document",
        size: "6 KB",
        modified: "1995-09-20 18:03",
        attributes: "A",
        icon: "📔",
        description: "Daily annotation roll",
        origin: "Portable Writer",
        checksum: "9DD5-CC18"
      }
    ]
  },
  "B:/Windswept": {
    driveId: "drive-b",
    items: [
      {
        name: "ROOFTOP.VOC",
        type: "Audio Sample",
        size: "38 KB",
        modified: "1995-09-28 12:04",
        attributes: "A",
        icon: "🎙️",
        description: "Roofline gust capture",
        origin: "Field Deck",
        checksum: "2AC1-81EF"
      },
      {
        name: "ALLEY.VOC",
        type: "Audio Sample",
        size: "44 KB",
        modified: "1995-09-28 12:42",
        attributes: "A",
        icon: "📼",
        description: "Whistling alley draft",
        origin: "Field Deck",
        checksum: "7EC0-4AB0"
      },
      {
        name: "RIDGE.VOC",
        type: "Audio Sample",
        size: "31 KB",
        modified: "1995-09-28 18:17",
        attributes: "A",
        icon: "🗻",
        description: "High ridge sweep",
        origin: "Field Deck",
        checksum: "53DE-A41C"
      },
      {
        name: "NOTES.TXT",
        type: "Text Document",
        size: "2 KB",
        modified: "1995-09-29 08:02",
        attributes: "A",
        icon: "📝",
        description: "Take notes and conditions",
        origin: "Portable Writer",
        checksum: "22AA-0084"
      }
    ]
  },
  "B:/Telemetry": {
    driveId: "drive-b",
    items: [
      {
        name: "BARO.LOG",
        type: "Data Log",
        size: "10 KB",
        modified: "1995-09-21 10:16",
        attributes: "A",
        icon: "🛰️",
        description: "Barometric sweep samples",
        origin: "Sensor Deck",
        checksum: "FF23-1180"
      },
      {
        name: "COMPASS.CSV",
        type: "CSV Data",
        size: "5 KB",
        modified: "1995-09-21 10:18",
        attributes: "A",
        icon: "🧭",
        description: "Orientation jitter capture",
        origin: "Sensor Deck",
        checksum: "0CB1-55DC"
      }
    ]
  },
  "D:/": {
    driveId: "drive-d",
    items: [
      {
        name: "Inbox",
        type: "Folder",
        size: "—",
        modified: "1996-02-05 09:04",
        attributes: "DIR",
        icon: "📥",
        isFolder: true,
        targetPath: "D:/Inbox",
        description: "Fresh arrivals awaiting sort",
        contains: "1 file"
      },
      {
        name: "Outgoing",
        type: "Folder",
        size: "—",
        modified: "1996-02-01 18:44",
        attributes: "DIR",
        icon: "📤",
        isFolder: true,
        targetPath: "D:/Outgoing",
        description: "Prepared copies",
        contains: "0 files"
      },
      {
        name: "QUEUE.IDX",
        type: "Index",
        size: "1 KB",
        modified: "1996-02-05 08:58",
        attributes: "A",
        icon: "🗒️",
        description: "Transfer bay queue",
        origin: "Diskette Explorer",
        checksum: "1180-AAC4"
      }
    ]
  },
  "D:/Inbox": {
    driveId: "drive-d",
    items: [
      {
        name: "PATCH.ZIP",
        type: "Archive",
        size: "212 KB",
        modified: "1996-02-05 09:03",
        attributes: "A",
        icon: "🗜️",
        description: "Latest feature patch",
        origin: "Courier",
        checksum: "42F1-77A0"
      }
    ]
  },
  "D:/Outgoing": {
    driveId: "drive-d",
    items: []
  }
};

const state = {
  driveId: drives[0].id,
  path: drives[0].rootPath,
  view: "details",
  selectedItemName: null,
  copyTimer: null,
  copyProgress: 0
};

const dom = {
  driveList: document.getElementById("driveList"),
  mountedCount: document.getElementById("mountedCount"),
  fileList: document.getElementById("fileList"),
  iconGrid: document.getElementById("iconGrid"),
  browserContent: document.getElementById("browserContent"),
  viewButtons: document.querySelectorAll(".view-button"),
  currentPath: document.getElementById("currentPath"),
  pathUp: document.getElementById("pathUp"),
  usageFill: document.getElementById("usageFill"),
  tempFill: document.getElementById("tempFill"),
  inspectorHint: document.getElementById("inspectorHint"),
  metadataDetails: document.getElementById("metadataDetails"),
  startCopy: document.getElementById("startCopy"),
  copyProgress: document.getElementById("copyProgress"),
  copyFill: document.getElementById("copyFill"),
  copyStatus: document.getElementById("copyStatus"),
  footerStatus: document.getElementById("footerStatus"),
  showDiskInfo: document.getElementById("showDiskInfo"),
  dialogOverlay: document.getElementById("dialogOverlay"),
  dialogBody: document.getElementById("dialogBody"),
  closeDialog: document.getElementById("closeDialog"),
  dialogAcknowledge: document.getElementById("dialogAcknowledge"),
  runScan: document.getElementById("runScan"),
  toggleNightMode: document.getElementById("toggleNightMode")
};

const folderButtonRegistry = new Map();

function init() {
  renderDriveTree();
  attachEventListeners();
  updateMountedCount();
  selectPath(state.path);
  updateNightModeButton();
}

function attachEventListeners() {
  dom.viewButtons.forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  dom.pathUp.addEventListener("click", handlePathUp);
  dom.startCopy.addEventListener("click", handleStartCopy);
  dom.showDiskInfo.addEventListener("click", showDiskInfoDialog);
  dom.closeDialog.addEventListener("click", closeDialog);
  dom.dialogAcknowledge.addEventListener("click", closeDialog);
  dom.runScan.addEventListener("click", simulateScan);
  dom.dialogOverlay.addEventListener("click", (event) => {
    if (event.target === dom.dialogOverlay) {
      closeDialog();
    }
  });
  dom.toggleNightMode.addEventListener("click", toggleNightMode);
}

function renderDriveTree() {
  dom.driveList.innerHTML = "";
  folderButtonRegistry.clear();

  drives.forEach((drive, index) => {
    const details = document.createElement("details");
    details.className = "drive-node";
    if (drive.id === state.driveId || index === 0) {
      details.open = true;
    }

    const summary = document.createElement("summary");
    summary.innerHTML = `
      <span class="drive-label">${drive.label}</span>
      <span class="drive-meta">
        <span>${Math.round((drive.usedMb / drive.capacityMb) * 100)}% used</span>
        <span>${drive.status}</span>
      </span>
    `;
    summary.addEventListener("click", () => {
      state.driveId = drive.id;
      selectPath(drive.rootPath);
    });
    details.append(summary);

    const folderList = document.createElement("ul");
    folderList.className = "folder-list";

    const rootItem = document.createElement("li");
    rootItem.append(
      createFolderButton({
        driveId: drive.id,
        name: `${drive.letter} root`,
        path: drive.rootPath,
        hint: "Root directory",
        depth: 0
      })
    );
    folderList.append(rootItem);

    drive.tree.forEach((node) => {
      folderList.append(createFolderTree(node, drive.id, 0));
    });

    details.append(folderList);
    dom.driveList.append(details);
  });
}

function createFolderTree(node, driveId, depth) {
  const container = document.createElement("li");
  container.append(
    createFolderButton({
      driveId,
      name: node.name,
      path: node.path,
      hint: node.hint,
      depth: depth + 1
    })
  );

  if (node.children && node.children.length) {
    const nested = document.createElement("ul");
    nested.className = "folder-list";
    node.children.forEach((child) => {
      nested.append(createFolderTree(child, driveId, depth + 1));
    });
    container.append(nested);
  }

  return container;
}

function createFolderButton({ driveId, name, path, hint, depth }) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "folder-button";
  button.dataset.drive = driveId;
  button.dataset.path = path;
  button.style.paddingLeft = `${12 + depth * 14}px`;
  button.innerHTML = `
    <span>${name}</span>
    <span class="folder-hint">${hint ?? ""}</span>
  `;
  button.addEventListener("click", () => {
    state.driveId = driveId;
    selectPath(path);
  });

  folderButtonRegistry.set(path, button);
  return button;
}

function updateMountedCount() {
  const mounted = drives.filter((drive) => drive.status === "Mounted").length;
  dom.mountedCount.textContent = `${mounted} drives online`;
}

function switchView(view) {
  if (state.view === view) return;
  state.view = view;
  dom.viewButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === view);
  });
  if (view === "details") {
    dom.fileList.parentElement.removeAttribute("hidden");
    dom.iconGrid.hidden = true;
  } else {
    dom.fileList.parentElement.setAttribute("hidden", "true");
    dom.iconGrid.hidden = false;
  }
  renderDirectory(state.path);
}

function selectPath(path) {
  if (!directoryIndex[path]) {
    updateFooter(`Path ${path} missing from index.`);
    return;
  }
  const directory = directoryIndex[path];
  state.driveId = directory.driveId;
  state.path = path;
  state.selectedItemName = null;
  renderDirectory(path);
  highlightFolder(path);
  updateGauges();
  updateFooter(`Viewing ${path}`);
}

function renderDirectory(path) {
  const directory = directoryIndex[path];
  const { items } = directory;
  dom.currentPath.textContent = path;

  dom.fileList.innerHTML = "";
  dom.iconGrid.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("tr");
    row.dataset.name = item.name;
    row.addEventListener("click", () => handleItemSelection(item));
    row.innerHTML = `
      <td>${item.icon ?? ""} ${item.name}</td>
      <td>${item.type}</td>
      <td>${item.size}</td>
      <td>${item.modified ?? "—"}</td>
    `;
    dom.fileList.append(row);

    const card = document.createElement("button");
    card.type = "button";
    card.className = "icon-card";
    card.dataset.name = item.name;
    card.innerHTML = `
      <div class="icon-symbol">${item.icon ?? "📄"}</div>
      <div>${item.name}</div>
      <div class="icon-meta">${item.type}</div>
    `;
    card.addEventListener("click", () => handleItemSelection(item));
    dom.iconGrid.append(card);
  });

  clearInspector();
}

function handleItemSelection(item) {
  state.selectedItemName = item.name;

  const rows = dom.fileList.querySelectorAll("tr");
  rows.forEach((row) => {
    row.classList.toggle("is-selected", row.dataset.name === item.name);
  });

  const cards = dom.iconGrid.querySelectorAll(".icon-card");
  cards.forEach((card) => {
    card.classList.toggle("is-selected", card.dataset.name === item.name);
  });

  if (item.isFolder && item.targetPath) {
    selectPath(item.targetPath);
    return;
  }

  updateInspector(item);
  updateFooter(`Selected ${item.name}`);
}

function highlightFolder(path) {
  folderButtonRegistry.forEach((button) => {
    button.dataset.active = button.dataset.path === path ? "true" : "false";
  });
}

function updateInspector(item) {
  dom.inspectorHint.textContent = item.name;
  dom.metadataDetails.innerHTML = "";

  const details = [
    ["Type", item.type],
    ["Size", item.size],
    ["Modified", item.modified ?? "—"],
    ["Attributes", item.attributes ?? "—"],
    ["Origin", item.origin ?? "Unknown"],
    ["Checksum", item.checksum ?? "—"],
    ["Notes", item.description ?? "No description"]
  ];

  if (item.contains) {
    details.push(["Contains", item.contains]);
  }

  details.forEach(([label, value]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const definition = document.createElement("dd");
    definition.textContent = value;
    dom.metadataDetails.append(term, definition);
  });
}

function clearInspector() {
  dom.inspectorHint.textContent = "Select a file to view details";
  dom.metadataDetails.innerHTML = "";
}

function handlePathUp() {
  const parent = getParentPath(state.path);
  if (parent) {
    selectPath(parent);
  } else {
    updateFooter("Already at root");
  }
}

function getParentPath(path) {
  const normalized = path.endsWith("/") ? path.slice(0, -1) : path;
  const segments = normalized.split("/");
  if (segments.length <= 1) {
    return null;
  }
  segments.pop();
  let parent = segments.join("/");
  if (!parent.endsWith("/")) {
    parent += "/";
  }
  return parent;
}

function updateGauges() {
  const drive = drives.find((entry) => entry.id === state.driveId);
  if (!drive) return;
  const usagePercent = Math.min(100, Math.round((drive.usedMb / drive.capacityMb) * 100));
  dom.usageFill.style.width = `${usagePercent}%`;
  const tempPercent = Math.min(100, Math.round((drive.temperatureC / 60) * 100));
  dom.tempFill.style.width = `${tempPercent}%`;
}

function handleStartCopy() {
  if (state.copyTimer) {
    return;
  }
  state.copyProgress = 0;
  dom.copyFill.style.width = "0%";
  dom.copyProgress.setAttribute("aria-valuenow", "0");
  dom.copyStatus.textContent = "Copying... preparing sectors";
  updateFooter("Copy process engaged");

  state.copyTimer = setInterval(() => {
    const increment = Math.random() * 18 + 7;
    state.copyProgress = Math.min(100, state.copyProgress + increment);
    dom.copyFill.style.width = `${state.copyProgress}%`;
    dom.copyProgress.setAttribute("aria-valuenow", `${Math.round(state.copyProgress)}`);

    if (state.copyProgress < 45) {
      dom.copyStatus.textContent = "Copying... allocating clusters";
    } else if (state.copyProgress < 80) {
      dom.copyStatus.textContent = "Copying... verifying bytes";
    } else if (state.copyProgress < 100) {
      dom.copyStatus.textContent = "Copying... sealing directory";
    } else {
      dom.copyStatus.textContent = "Copy complete. Diskette ready for eject.";
      clearInterval(state.copyTimer);
      state.copyTimer = null;
      updateFooter("Copy cycle finished");
    }
  }, 550);
}

function updateFooter(message) {
  dom.footerStatus.textContent = message;
}

function showDialog(content) {
  dom.dialogBody.innerHTML = "";
  content.forEach((block) => {
    const paragraph = document.createElement("p");
    paragraph.textContent = block;
    dom.dialogBody.append(paragraph);
  });
  dom.dialogOverlay.hidden = false;
}

function closeDialog() {
  dom.dialogOverlay.hidden = true;
}

function showDiskInfoDialog() {
  const drive = drives.find((entry) => entry.id === state.driveId);
  if (!drive) return;
  const usagePercent = Math.round((drive.usedMb / drive.capacityMb) * 100);
  const content = [
    `${drive.label}`,
    `Capacity: ${drive.capacityMb.toFixed(2)} MB · Used: ${drive.usedMb.toFixed(2)} MB (${usagePercent}%)`,
    `Temperature: ${drive.temperatureC}°C`,
    drive.description
  ];
  showDialog(content);
  updateFooter(`Diagnostics for ${drive.letter}`);
}

function simulateScan() {
  dom.dialogBody.innerHTML = "";
  const status = document.createElement("p");
  status.textContent = "Surface scan running...";
  const meter = document.createElement("div");
  meter.className = "copy-progress";
  const meterFill = document.createElement("div");
  meterFill.className = "copy-fill";
  meter.append(meterFill);
  dom.dialogBody.append(status, meter);

  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(100, progress + Math.random() * 20 + 5);
    meterFill.style.width = `${progress}%`;
    if (progress >= 100) {
      clearInterval(timer);
      status.textContent = "Surface scan finished. No bad sectors detected.";
    }
  }, 480);
}

function toggleNightMode() {
  document.body.classList.toggle("night-mode");
  updateNightModeButton();
}

function updateNightModeButton() {
  const pressed = document.body.classList.contains("night-mode");
  dom.toggleNightMode.setAttribute("aria-pressed", String(pressed));
  dom.toggleNightMode.textContent = pressed ? "Night Grid On" : "Night Grid";
}

init();
