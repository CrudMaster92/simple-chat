const WIDTH = 5;
const HEIGHT = 7;
const LETTERS = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const PREVIEW_TEXT = "Sphinx of black quartz, judge my vow.";
const PREVIEW_SCALE = 8;

const baseAlphabet = (() => {
  const patterns = {
    A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
    D: ["11100", "10010", "10001", "10001", "10001", "10010", "11100"],
    E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    G: ["01110", "10001", "10000", "10111", "10001", "10001", "01110"],
    H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    J: ["01111", "00010", "00010", "00010", "10010", "10010", "01100"],
    K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    M: ["10001", "11011", "10101", "10001", "10001", "10001", "10001"],
    N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    W: ["10001", "10001", "10001", "10001", "10101", "11011", "10001"],
    X: ["10001", "01010", "00100", "00100", "01010", "10001", "10001"],
    Y: ["10001", "01010", "00100", "00100", "00100", "00100", "00100"],
    Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  };

  return LETTERS.reduce((acc, letter) => {
    const rows = patterns[letter];
    const cells = new Array(WIDTH * HEIGHT).fill(false);
    rows.forEach((row, y) => {
      row.split("").forEach((bit, x) => {
        cells[y * WIDTH + x] = bit === "1";
      });
    });
    acc[letter] = cells;
    return acc;
  }, {});
})();

const glyphState = LETTERS.reduce((acc, letter) => {
  acc[letter] = new Array(WIDTH * HEIGHT).fill(false);
  return acc;
}, {});

let activeLetter = "A";
let activeTool = "draw";
let mirrorX = false;
let mirrorY = false;
let isPointerDown = false;
let pointerDrawValue = true;

const letterGrid = document.getElementById("letterGrid");
const editorGrid = document.getElementById("editorGrid");
const currentGlyphLabel = document.getElementById("currentGlyphLabel");
const presetSelect = document.getElementById("presetSelect");
const previewCanvas = document.getElementById("previewCanvas");
const previewContext = previewCanvas.getContext("2d");
const exportNote = document.getElementById("exportNote");

const PRESETS = [
  { id: "blank", label: "Blank slate", loader: createBlankPreset },
  { id: "lcd", label: "LCD segments", loader: createLCDPreset },
  { id: "runic", label: "Runic tilt", loader: createRunicPreset },
  { id: "rounded", label: "Soft rounded", loader: createRoundedPreset },
];

function cloneGlyphs(source) {
  return LETTERS.reduce((acc, letter) => {
    acc[letter] = source[letter].slice();
    return acc;
  }, {});
}

function createBlankPreset() {
  return LETTERS.reduce((acc, letter) => {
    acc[letter] = new Array(WIDTH * HEIGHT).fill(false);
    return acc;
  }, {});
}

function createLCDPreset() {
  const base = cloneGlyphs(baseAlphabet);
  const lcdGlyphs = {};
  LETTERS.forEach((letter) => {
    const source = base[letter];
    const target = new Array(WIDTH * HEIGHT).fill(false);
    // Horizontal segments
    for (let y = 0; y < HEIGHT; y += 1) {
      let rowCount = 0;
      for (let x = 0; x < WIDTH; x += 1) {
        if (source[y * WIDTH + x]) rowCount += 1;
      }
      if (rowCount >= 2) {
        for (let x = 0; x < WIDTH; x += 1) {
          target[y * WIDTH + x] = true;
        }
      } else {
        for (let x = 0; x < WIDTH; x += 1) {
          target[y * WIDTH + x] = target[y * WIDTH + x] || source[y * WIDTH + x];
        }
      }
    }
    // Vertical segments
    for (let x = 0; x < WIDTH; x += 1) {
      let columnCount = 0;
      for (let y = 0; y < HEIGHT; y += 1) {
        if (source[y * WIDTH + x]) columnCount += 1;
      }
      if (columnCount >= 2) {
        for (let y = 0; y < HEIGHT; y += 1) {
          target[y * WIDTH + x] = true;
        }
      }
    }
    lcdGlyphs[letter] = target;
  });
  return lcdGlyphs;
}

function countNeighbors(cells, x, y) {
  let count = 0;
  for (let dy = -1; dy <= 1; dy += 1) {
    for (let dx = -1; dx <= 1; dx += 1) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || nx >= WIDTH || ny < 0 || ny >= HEIGHT) continue;
      if (cells[ny * WIDTH + nx]) count += 1;
    }
  }
  return count;
}

function createRunicPreset() {
  const base = cloneGlyphs(baseAlphabet);
  const runicGlyphs = {};
  LETTERS.forEach((letter) => {
    const source = base[letter];
    const target = new Array(WIDTH * HEIGHT).fill(false);
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        if (!source[y * WIDTH + x]) continue;
        const neighbors = countNeighbors(source, x, y);
        if (neighbors <= 2 || x === 0 || x === WIDTH - 1 || y === 0 || y === HEIGHT - 1) {
          let shiftedX = x + (y % 2 === 0 ? 0 : -1);
          if (shiftedX < 0) shiftedX = 0;
          target[y * WIDTH + shiftedX] = true;
          if (neighbors <= 1 && y + 1 < HEIGHT && shiftedX + 1 < WIDTH) {
            target[(y + 1) * WIDTH + shiftedX + 1] = true;
          }
        }
      }
    }
    // Ensure structure remains by falling back to base outline if glyph is too sparse
    const litPixels = target.filter(Boolean).length;
    if (litPixels < 5) {
      for (let y = 0; y < HEIGHT; y += 1) {
        for (let x = 0; x < WIDTH; x += 1) {
          const isEdge = x === 0 || x === WIDTH - 1 || y === 0 || y === HEIGHT - 1;
          if (isEdge && source[y * WIDTH + x]) {
            target[y * WIDTH + x] = true;
          }
        }
      }
    }
    runicGlyphs[letter] = target;
  });
  return runicGlyphs;
}

function createRoundedPreset() {
  const base = cloneGlyphs(baseAlphabet);
  const roundedGlyphs = {};
  LETTERS.forEach((letter) => {
    const source = base[letter];
    const target = source.slice();
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        const index = y * WIDTH + x;
        if (!source[index]) continue;
        const orthogonal = [
          x > 0 && source[y * WIDTH + (x - 1)],
          x < WIDTH - 1 && source[y * WIDTH + (x + 1)],
          y > 0 && source[(y - 1) * WIDTH + x],
          y < HEIGHT - 1 && source[(y + 1) * WIDTH + x],
        ].filter(Boolean).length;
        if (orthogonal <= 1) {
          target[index] = false;
        }
      }
    }
    // Add soft corners by reinstating diagonals when both adjacent orthogonal pixels exist
    for (let y = 0; y < HEIGHT - 1; y += 1) {
      for (let x = 0; x < WIDTH - 1; x += 1) {
        const bottomRight = (y + 1) * WIDTH + (x + 1);
        if (!target[bottomRight]) {
          const right = y * WIDTH + (x + 1);
          const down = (y + 1) * WIDTH + x;
          if (target[right] && target[down]) {
            target[bottomRight] = true;
          }
        }
      }
    }
    if (target.every((cell) => !cell)) {
      roundedGlyphs[letter] = source.slice();
    } else {
      roundedGlyphs[letter] = target;
    }
  });
  return roundedGlyphs;
}

function resetGlyphs(newGlyphs) {
  LETTERS.forEach((letter) => {
    glyphState[letter] = newGlyphs[letter].slice();
  });
  updateLetterButtons();
  renderEditor();
  drawPreview();
}

function updateLetterButtons() {
  const buttons = letterGrid.querySelectorAll("button");
  buttons.forEach((button) => {
    button.setAttribute("aria-selected", button.dataset.letter === activeLetter ? "true" : "false");
  });
}

function renderLetterGrid() {
  LETTERS.forEach((letter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = letter;
    button.dataset.letter = letter;
    button.setAttribute("role", "tab");
    if (letter === activeLetter) {
      button.setAttribute("aria-selected", "true");
    }
    button.addEventListener("click", () => {
      activeLetter = letter;
      currentGlyphLabel.textContent = activeLetter;
      updateLetterButtons();
      renderEditor();
    });
    letterGrid.appendChild(button);
  });
}

function renderEditor() {
  editorGrid.innerHTML = "";
  const glyph = glyphState[activeLetter];
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const index = y * WIDTH + x;
      const cell = document.createElement("button");
      cell.type = "button";
      cell.dataset.index = String(index);
      cell.dataset.active = glyph[index] ? "true" : "false";
      cell.setAttribute("role", "gridcell");
      cell.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        isPointerDown = true;
        pointerDrawValue = activeTool === "draw" ? true : false;
        applyToCell(x, y, pointerDrawValue);
        const cancelPointer = () => {
          isPointerDown = false;
          window.removeEventListener("pointerup", cancelPointer);
        };
        window.addEventListener("pointerup", cancelPointer);
      });
      cell.addEventListener("pointerenter", () => {
        if (!isPointerDown) return;
        applyToCell(x, y, pointerDrawValue);
      });
      cell.addEventListener("pointerup", () => {
        isPointerDown = false;
      });
      editorGrid.appendChild(cell);
    }
  }
  drawPreview();
}

function applyToCell(x, y, value) {
  const glyph = glyphState[activeLetter];
  setCell(glyph, x, y, value);
  if (mirrorX) {
    const mx = WIDTH - 1 - x;
    setCell(glyph, mx, y, value);
  }
  if (mirrorY) {
    const my = HEIGHT - 1 - y;
    setCell(glyph, x, my, value);
    if (mirrorX) {
      const mx = WIDTH - 1 - x;
      setCell(glyph, mx, my, value);
    }
  }
  refreshEditorCells();
  drawPreview();
}

function setCell(glyph, x, y, value) {
  const index = y * WIDTH + x;
  glyph[index] = value;
}

function refreshEditorCells() {
  const glyph = glyphState[activeLetter];
  editorGrid.querySelectorAll("button").forEach((cell) => {
    const index = Number(cell.dataset.index);
    cell.dataset.active = glyph[index] ? "true" : "false";
  });
}

function drawPreview() {
  const ctx = previewContext;
  const text = PREVIEW_TEXT;
  const letters = text.split("");
  const spacing = 1;
  const glyphWidth = WIDTH * PREVIEW_SCALE;
  const glyphHeight = HEIGHT * PREVIEW_SCALE;
  const totalWidth = letters.length * (glyphWidth + spacing * PREVIEW_SCALE);
  const totalHeight = glyphHeight + PREVIEW_SCALE * 2;
  previewCanvas.width = totalWidth;
  previewCanvas.height = totalHeight;
  ctx.fillStyle = "#fff9ee";
  ctx.fillRect(0, 0, totalWidth, totalHeight);
  ctx.fillStyle = "#1f2933";

  let cursorX = 0;
  letters.forEach((character) => {
    if (character === " ") {
      cursorX += glyphWidth / 2;
      return;
    }
    const upper = character.toUpperCase();
    const glyph = glyphState[upper];
    if (!glyph) {
      cursorX += glyphWidth + spacing * PREVIEW_SCALE;
      return;
    }
    drawGlyph(ctx, glyph, cursorX, PREVIEW_SCALE, PREVIEW_SCALE);
    cursorX += glyphWidth + spacing * PREVIEW_SCALE;
  });
}

function drawGlyph(ctx, glyph, offsetX, offsetY, scale) {
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      if (!glyph[y * WIDTH + x]) continue;
      ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
    }
  }
}

function invertGlyph() {
  const glyph = glyphState[activeLetter];
  for (let i = 0; i < glyph.length; i += 1) {
    glyph[i] = !glyph[i];
  }
  refreshEditorCells();
  drawPreview();
}

function clearGlyph() {
  glyphState[activeLetter] = new Array(WIDTH * HEIGHT).fill(false);
  refreshEditorCells();
  drawPreview();
}

function nudgeGlyph(direction) {
  const glyph = glyphState[activeLetter];
  const next = new Array(WIDTH * HEIGHT).fill(false);
  for (let y = 0; y < HEIGHT; y += 1) {
    for (let x = 0; x < WIDTH; x += 1) {
      const value = glyph[y * WIDTH + x];
      if (!value) continue;
      let nx = x;
      let ny = y;
      if (direction === "left" && x > 0) nx -= 1;
      if (direction === "right" && x < WIDTH - 1) nx += 1;
      if (direction === "up" && y > 0) ny -= 1;
      if (direction === "down" && y < HEIGHT - 1) ny += 1;
      next[ny * WIDTH + nx] = true;
    }
  }
  glyphState[activeLetter] = next;
  refreshEditorCells();
  drawPreview();
}

function downloadFile(filename, content) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function exportSpriteSheet() {
  const spriteScale = 4;
  const canvas = document.createElement("canvas");
  canvas.width = LETTERS.length * WIDTH * spriteScale;
  canvas.height = HEIGHT * spriteScale;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,0)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  LETTERS.forEach((letter, index) => {
    const glyph = glyphState[letter];
    for (let y = 0; y < HEIGHT; y += 1) {
      for (let x = 0; x < WIDTH; x += 1) {
        if (!glyph[y * WIDTH + x]) continue;
        ctx.fillRect(index * WIDTH * spriteScale + x * spriteScale, y * spriteScale, spriteScale, spriteScale);
      }
    }
  });
  canvas.toBlob((blob) => {
    if (!blob) return;
    downloadFile("glyphsmith.png", blob);
    exportNote.textContent = "PNG sprite exported.";
  });
}

function exportJson() {
  const spriteScale = 4;
  const mapping = {};
  LETTERS.forEach((letter, index) => {
    mapping[letter] = {
      x: index * WIDTH * spriteScale,
      y: 0,
      width: WIDTH * spriteScale,
      height: HEIGHT * spriteScale,
    };
  });
  const jsonBlob = new Blob([
    JSON.stringify({ sprite: "glyphsmith.png", glyphs: mapping }, null, 2),
  ], { type: "application/json" });
  downloadFile("glyphsmith-map.json", jsonBlob);
  exportNote.textContent = "JSON mapping exported.";
}

function exportCss() {
  const spriteScale = 4;
  const lines = [
    ".glyphsmith-char {",
    "  display: inline-block;",
    `  width: ${WIDTH * spriteScale}px;`,
    `  height: ${HEIGHT * spriteScale}px;`,
    "  background-image: url('glyphsmith.png');",
    "  background-repeat: no-repeat;",
    "  image-rendering: pixelated;",
    "}",
  ];
  LETTERS.forEach((letter, index) => {
    const x = index * WIDTH * spriteScale;
    lines.push(`.glyphsmith-${letter} { background-position: -${x}px 0; }`);
  });
  const cssBlob = new Blob([lines.join("\n")], { type: "text/css" });
  downloadFile("glyphsmith.css", cssBlob);
  exportNote.textContent = "CSS class map exported.";
}

function initPresetSelect() {
  PRESETS.forEach((preset) => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    presetSelect.appendChild(option);
  });
  presetSelect.value = PRESETS[0].id;
  presetSelect.addEventListener("change", () => {
    const selected = PRESETS.find((preset) => preset.id === presetSelect.value);
    if (!selected) return;
    const glyphs = selected.loader();
    resetGlyphs(glyphs);
    exportNote.textContent = `${selected.label} preset applied.`;
  });
}

function setupToolControls() {
  document.querySelectorAll("input[name='tool']").forEach((input) => {
    input.addEventListener("change", () => {
      if (input.checked) {
        activeTool = input.value;
      }
    });
  });
  document.getElementById("mirrorHorizontal").addEventListener("change", (event) => {
    mirrorX = event.target.checked;
  });
  document.getElementById("mirrorVertical").addEventListener("change", (event) => {
    mirrorY = event.target.checked;
  });
}

function setupActionButtons() {
  document.getElementById("invertGlyph").addEventListener("click", invertGlyph);
  document.getElementById("clearGlyph").addEventListener("click", clearGlyph);
  document.querySelectorAll(".nudge-controls button").forEach((button) => {
    button.addEventListener("click", () => {
      const direction = button.dataset.direction;
      if (direction) {
        nudgeGlyph(direction);
      }
    });
  });
  document.getElementById("exportPng").addEventListener("click", exportSpriteSheet);
  document.getElementById("exportJson").addEventListener("click", exportJson);
  document.getElementById("exportCss").addEventListener("click", exportCss);
}

function initialise() {
  renderLetterGrid();
  initPresetSelect();
  setupToolControls();
  setupActionButtons();
  resetGlyphs(createBlankPreset());
  exportNote.textContent = "Start drawing or load a preset alphabet.";
}

initialise();
