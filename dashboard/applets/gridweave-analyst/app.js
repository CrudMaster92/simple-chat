const sheetTabsEl = document.querySelector('[data-role="sheet-tabs"]');
const sheetStatsEl = document.getElementById('sheetStats');
const gridWrapperEl = document.getElementById('gridWrapper');
const gridBodyEl = document.querySelector('[data-role="grid-body"]');
const formulaInputEl = document.getElementById('formulaInput');
const applyFormulaButton = document.getElementById('applyFormula');
const selectionStatusEl = document.getElementById('selectionStatus');
const addSheetButton = document.getElementById('addSheet');
const addRowButton = document.getElementById('addRow');
const addColumnButton = document.getElementById('addColumn');
const clearCellButton = document.getElementById('clearCell');

const DEFAULT_ROWS = 30;
const DEFAULT_COLS = 12;
const SESSION_KEY = 'gridweave-spreadsheet-session';

class FormulaValue {
  constructor(value) {
    this.value = value;
  }

  [Symbol.toPrimitive](hint) {
    if (hint === 'string') {
      if (this.value === null || this.value === undefined) return '';
      return String(this.value);
    }
    if (this.value === null || this.value === undefined || this.value === '') {
      return 0;
    }
    if (typeof this.value === 'number') {
      return this.value;
    }
    if (typeof this.value === 'string') {
      const num = Number(this.value);
      if (!Number.isNaN(num)) return num;
      throw new Error('#VALUE!');
    }
    if (this.value instanceof Date) {
      return this.value.getTime();
    }
    const num = Number(this.value);
    if (!Number.isNaN(num)) return num;
    throw new Error('#VALUE!');
  }

  valueOf() {
    return this[Symbol.toPrimitive]('number');
  }

  toString() {
    return this[Symbol.toPrimitive]('string');
  }
}

const state = {
  sheets: [],
  activeSheetId: null,
  selection: { row: 0, col: 0 },
  editing: null,
};

function createSheet(name, rows = DEFAULT_ROWS, cols = DEFAULT_COLS) {
  return {
    id: `sheet-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    name,
    rows,
    cols,
    cells: {},
  };
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function columnIndexToName(index) {
  let dividend = index + 1;
  let name = '';
  while (dividend > 0) {
    const modulo = (dividend - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    dividend = Math.floor((dividend - modulo) / 26);
  }
  return name;
}

function nameToColumnIndex(name) {
  let result = 0;
  for (let i = 0; i < name.length; i += 1) {
    result = result * 26 + (name.charCodeAt(i) - 64);
  }
  return result - 1;
}

function parseAddress(address) {
  const cleaned = address.replace(/\$/g, '').toUpperCase();
  const match = /^([A-Z]+)(\d+)$/.exec(cleaned);
  if (!match) return { rowIndex: -1, colIndex: -1 };
  const [, col, rowStr] = match;
  const colIndex = nameToColumnIndex(col);
  const rowIndex = Number(rowStr) - 1;
  return { rowIndex, colIndex };
}

function isErrorValue(value) {
  return typeof value === 'string' && value.startsWith('#');
}

function normalizeForFormula(value) {
  if (isErrorValue(value)) {
    throw new Error(value);
  }
  return new FormulaValue(value);
}

function flattenArgs(args) {
  const values = [];
  args.forEach((value) => {
    if (Array.isArray(value)) {
      values.push(...flattenArgs(value));
    } else if (value instanceof FormulaValue) {
      values.push(value.value);
    } else {
      values.push(value);
    }
  });
  return values;
}

function toNumber(value) {
  if (value instanceof FormulaValue) return toNumber(value.value);
  if (value === null || value === undefined || value === '') return 0;
  const num = Number(value);
  return Number.isFinite(num) ? num : NaN;
}

function getActiveSheet() {
  return state.sheets.find((sheet) => sheet.id === state.activeSheetId) ?? null;
}

function getCell(sheet, row, col) {
  return sheet.cells[cellKey(row, col)] ?? null;
}

function getCellInput(sheet, row, col) {
  const cell = getCell(sheet, row, col);
  return cell?.input ?? '';
}

function setCellInput(sheet, row, col, input) {
  const key = cellKey(row, col);
  const trimmed = typeof input === 'string' ? input.trim() : input;
  if (!trimmed) {
    delete sheet.cells[key];
    return;
  }
  sheet.cells[key] = { input: trimmed };
}

function evaluateCell(sheet, row, col, visited = new Set()) {
  if (!sheet || row < 0 || col < 0 || row >= sheet.rows || col >= sheet.cols) return '';
  const cell = getCell(sheet, row, col);
  if (!cell) return '';
  const raw = cell.input;
  if (typeof raw !== 'string') return raw ?? '';
  if (!raw) return '';
  if (raw.startsWith('=')) {
    const key = `${sheet.id}:${row}:${col}`;
    if (visited.has(key)) return '#CYCLE!';
    visited.add(key);
    const result = evaluateFormula(raw.slice(1), sheet, visited);
    visited.delete(key);
    return result;
  }
  const num = Number(raw);
  if (!Number.isNaN(num) && /^[-+]?\d*(\.\d+)?$/.test(raw)) {
    return num;
  }
  return raw;
}

function evaluateFormula(expression, sheet, visited) {
  const stringTokens = [];
  let prepared = expression.replace(/"([^"\\]|\\.)*"/g, (match) => {
    const token = `@@S${stringTokens.length}@@`;
    stringTokens.push(match);
    return token;
  });

  prepared = prepared.replace(/\$/g, '');
  prepared = prepared.replace(/\^/g, '**');

  const rangeTokens = [];
  prepared = prepared.replace(/(?<![A-Z0-9_])([A-Z]+\d+:[A-Z]+\d+)(?![A-Z0-9_])/gi, (match) => {
    const token = `__R${rangeTokens.length}__`;
    rangeTokens.push(match.toUpperCase());
    return token;
  });

  const cellTokens = [];
  prepared = prepared.replace(/(?<![A-Z0-9_])([A-Z]+\d+)(?![A-Z0-9_])/gi, (match) => {
    const token = `__C${cellTokens.length}__`;
    cellTokens.push(match.toUpperCase());
    return token;
  });

  rangeTokens.forEach((value, index) => {
    prepared = prepared.replace(`__R${index}__`, `__range("${value}")`);
  });
  cellTokens.forEach((value, index) => {
    prepared = prepared.replace(`__C${index}__`, `__cell("${value}")`);
  });

  prepared = prepared.replace(/@@S(\d+)@@/g, (_, idx) => stringTokens[Number(idx)] ?? '');

  const context = {
    SUM: (...args) => flattenArgs(args).reduce((acc, value) => acc + (toNumber(value) || 0), 0),
    AVERAGE: (...args) => {
      const numbers = flattenArgs(args)
        .map((value) => toNumber(value))
        .filter((num) => Number.isFinite(num));
      if (!numbers.length) return 0;
      return numbers.reduce((acc, num) => acc + num, 0) / numbers.length;
    },
    MIN: (...args) => {
      const numbers = flattenArgs(args)
        .map((value) => toNumber(value))
        .filter((num) => Number.isFinite(num));
      return numbers.length ? Math.min(...numbers) : 0;
    },
    MAX: (...args) => {
      const numbers = flattenArgs(args)
        .map((value) => toNumber(value))
        .filter((num) => Number.isFinite(num));
      return numbers.length ? Math.max(...numbers) : 0;
    },
    COUNT: (...args) =>
      flattenArgs(args).filter((value) => {
        if (value instanceof FormulaValue) return value.value !== '' && value.value !== null && value.value !== undefined;
        return value !== '' && value !== null && value !== undefined;
      }).length,
    COUNTA: (...args) =>
      flattenArgs(args).filter((value) => {
        if (value instanceof FormulaValue) return value.value !== '' && value.value !== null && value.value !== undefined;
        return value !== '' && value !== null && value !== undefined;
      }).length,
    ROUND: (value, digits = 0) => {
      const num = Number(value);
      const precision = 10 ** Number(digits ?? 0);
      if (!Number.isFinite(num) || !Number.isFinite(precision)) return '#VALUE!';
      return Math.round(num * precision) / precision;
    },
    ABS: (value) => Math.abs(Number(value)),
    IF: (condition, whenTrue, whenFalse) => (condition ? whenTrue : whenFalse),
    AND: (...args) => flattenArgs(args).every(Boolean),
    OR: (...args) => flattenArgs(args).some(Boolean),
    NOT: (value) => !value,
    TODAY: () => new Date().toISOString().split('T')[0],
    NOW: () => new Date(),
    TRUE: true,
    FALSE: false,
    __cell: (ref) => {
      const { rowIndex, colIndex } = parseAddress(ref);
      if (rowIndex < 0 || colIndex < 0) throw new Error('#REF!');
      const key = `${sheet.id}:${rowIndex}:${colIndex}`;
      if (visited.has(key)) throw new Error('#CYCLE!');
      visited.add(key);
      const value = evaluateCell(sheet, rowIndex, colIndex, visited);
      visited.delete(key);
      return normalizeForFormula(value);
    },
    __range: (ref) => {
      const [startRef, endRef] = ref.split(':');
      const start = parseAddress(startRef);
      const end = parseAddress(endRef);
      if (start.rowIndex < 0 || start.colIndex < 0 || end.rowIndex < 0 || end.colIndex < 0) {
        throw new Error('#REF!');
      }
      const values = [];
      const rStart = Math.min(start.rowIndex, end.rowIndex);
      const rEnd = Math.max(start.rowIndex, end.rowIndex);
      const cStart = Math.min(start.colIndex, end.colIndex);
      const cEnd = Math.max(start.colIndex, end.colIndex);
      for (let r = rStart; r <= rEnd; r += 1) {
        for (let c = cStart; c <= cEnd; c += 1) {
          const key = `${sheet.id}:${r}:${c}`;
          if (visited.has(key)) {
            throw new Error('#CYCLE!');
          }
          visited.add(key);
          const value = evaluateCell(sheet, r, c, visited);
          visited.delete(key);
          values.push(normalizeForFormula(value));
        }
      }
      return values;
    },
  };

  try {
    const fn = new Function('context', `with(context){ return ${prepared}; }`);
    const result = fn(context);
    if (result instanceof FormulaValue) {
      return result.value;
    }
    if (result === undefined || result === null) return '';
    return result;
  } catch (error) {
    if (typeof error?.message === 'string' && error.message.startsWith('#')) {
      return error.message;
    }
    return '#ERROR!';
  }
}

function formatDisplayValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (Number.isNaN(value)) return '#VALUE!';
    return Number.isInteger(value) ? String(value) : String(parseFloat(value.toPrecision(12)));
  }
  return String(value);
}

function renderSheetTabs() {
  sheetTabsEl.innerHTML = '';
  state.sheets.forEach((sheet, index) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'tab';
    button.textContent = sheet.name;
    button.dataset.sheetId = sheet.id;
    button.setAttribute('aria-selected', sheet.id === state.activeSheetId ? 'true' : 'false');
    const caption = document.createElement('span');
    caption.textContent = `Sheet ${index + 1}`;
    button.appendChild(caption);
    button.addEventListener('click', () => {
      if (sheet.id === state.activeSheetId) return;
      state.activeSheetId = sheet.id;
      state.selection = { row: 0, col: 0 };
      state.editing = null;
      renderAll();
      focusGrid();
    });
    button.addEventListener('dblclick', (event) => {
      event.preventDefault();
      const newName = prompt('Rename sheet', sheet.name);
      if (!newName) return;
      sheet.name = newName.trim().slice(0, 48) || sheet.name;
      saveSession();
      renderSheetTabs();
      updateSelectionStatus();
    });
    li.appendChild(button);
    sheetTabsEl.appendChild(li);
  });
}

function renderGrid() {
  const sheet = getActiveSheet();
  if (!sheet) return;
  const headerRow = gridWrapperEl.querySelector('thead tr');
  headerRow.innerHTML = '';
  const corner = document.createElement('th');
  corner.className = 'corner-cell';
  headerRow.appendChild(corner);
  for (let col = 0; col < sheet.cols; col += 1) {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = columnIndexToName(col);
    headerRow.appendChild(th);
  }

  gridBodyEl.innerHTML = '';
  for (let row = 0; row < sheet.rows; row += 1) {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.scope = 'row';
    th.textContent = String(row + 1);
    tr.appendChild(th);
    for (let col = 0; col < sheet.cols; col += 1) {
      const td = document.createElement('td');
      td.dataset.row = String(row);
      td.dataset.col = String(col);
      td.dataset.address = `${columnIndexToName(col)}${row + 1}`;
      const value = evaluateCell(sheet, row, col);
      const display = formatDisplayValue(value);
      const span = document.createElement('div');
      span.className = 'cell-content';
      span.textContent = display;
      td.appendChild(span);
      if (isErrorValue(value)) {
        td.classList.add('error');
      }
      if (state.selection.row === row && state.selection.col === col) {
        td.classList.add('is-selected');
      }
      tr.appendChild(td);
    }
    gridBodyEl.appendChild(tr);
  }
}

function renderStats() {
  const sheet = getActiveSheet();
  if (!sheet) {
    sheetStatsEl.textContent = '';
    return;
  }
  const activeCells = Object.keys(sheet.cells).length;
  sheetStatsEl.textContent = `${sheet.rows} rows × ${sheet.cols} columns · ${activeCells} populated cells`;
}

function updateFormulaInput() {
  const sheet = getActiveSheet();
  if (!sheet) {
    formulaInputEl.value = '';
    return;
  }
  const { row, col } = state.selection;
  formulaInputEl.value = getCellInput(sheet, row, col);
}

function updateSelectionStatus() {
  const sheet = getActiveSheet();
  if (!sheet) {
    selectionStatusEl.textContent = '';
    return;
  }
  const { row, col } = state.selection;
  const address = `${columnIndexToName(col)}${row + 1}`;
  const value = evaluateCell(sheet, row, col);
  const display = formatDisplayValue(value);
  selectionStatusEl.textContent = `${sheet.name} · ${address} → ${display || 'blank'}`;
}

function renderAll() {
  renderSheetTabs();
  renderGrid();
  renderStats();
  updateFormulaInput();
  updateSelectionStatus();
  saveSession();
}

function setSelection(row, col) {
  const sheet = getActiveSheet();
  if (!sheet) return;
  const clampedRow = Math.min(Math.max(row, 0), sheet.rows - 1);
  const clampedCol = Math.min(Math.max(col, 0), sheet.cols - 1);
  state.selection = { row: clampedRow, col: clampedCol };
  state.editing = null;
  renderGrid();
  updateFormulaInput();
  updateSelectionStatus();
}

function applyInputToSelection(input) {
  const sheet = getActiveSheet();
  if (!sheet) return;
  const { row, col } = state.selection;
  setCellInput(sheet, row, col, input);
  state.editing = null;
  renderAll();
}

function startInlineEdit(initialText = null) {
  const sheet = getActiveSheet();
  if (!sheet) return;
  const { row, col } = state.selection;
  const cellEl = gridBodyEl.querySelector(`td[data-row="${row}"][data-col="${col}"]`);
  if (!cellEl) return;
  if (state.editing) return;
  const existing = getCellInput(sheet, row, col);
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'cell-editor';
  input.value = initialText !== null ? initialText : existing;
  cellEl.classList.add('is-editing');
  cellEl.innerHTML = '';
  cellEl.appendChild(input);
  state.editing = { row, col, inputEl: input };
  input.focus();
  if (initialText === null) {
    input.setSelectionRange(input.value.length, input.value.length);
  }
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitInlineEdit(input.value);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      cancelInlineEdit();
    }
  });
  input.addEventListener('blur', () => {
    if (!state.editing) return;
    commitInlineEdit(input.value);
  });
}

function commitInlineEdit(value) {
  const sheet = getActiveSheet();
  if (!sheet || !state.editing) return;
  const { row, col } = state.editing;
  setCellInput(sheet, row, col, value);
  state.editing = null;
  renderAll();
}

function cancelInlineEdit() {
  state.editing = null;
  renderGrid();
  updateFormulaInput();
  updateSelectionStatus();
}

function focusGrid() {
  requestAnimationFrame(() => {
    gridWrapperEl.focus();
  });
}

function handleGridKeydown(event) {
  if (state.editing) return;
  const sheet = getActiveSheet();
  if (!sheet) return;
  const { row, col } = state.selection;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setSelection(Math.min(row + 1, sheet.rows - 1), col);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    setSelection(Math.max(row - 1, 0), col);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    setSelection(row, Math.min(col + 1, sheet.cols - 1));
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    setSelection(row, Math.max(col - 1, 0));
  } else if (event.key === 'Enter' || event.key === 'F2') {
    event.preventDefault();
    startInlineEdit();
  } else if (event.key === 'Backspace' || event.key === 'Delete') {
    event.preventDefault();
    applyInputToSelection('');
  } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    startInlineEdit(event.key === '=' ? '=' : event.key);
  }
}

function addSheet() {
  const count = state.sheets.length + 1;
  const sheet = createSheet(`Sheet ${count}`);
  state.sheets.push(sheet);
  state.activeSheetId = sheet.id;
  state.selection = { row: 0, col: 0 };
  renderAll();
  focusGrid();
}

function addRow() {
  const sheet = getActiveSheet();
  if (!sheet) return;
  sheet.rows += 1;
  renderAll();
}

function addColumn() {
  const sheet = getActiveSheet();
  if (!sheet) return;
  sheet.cols += 1;
  renderAll();
}

function clearSelectionCell() {
  applyInputToSelection('');
}

function saveSession() {
  try {
    const snapshot = {
      sheets: state.sheets.map((sheet) => ({
        id: sheet.id,
        name: sheet.name,
        rows: sheet.rows,
        cols: sheet.cols,
        cells: sheet.cells,
      })),
      activeSheetId: state.activeSheetId,
      selection: state.selection,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('Unable to persist session', error);
  }
}

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    const snapshot = JSON.parse(raw);
    if (!snapshot?.sheets?.length) return false;
    state.sheets = snapshot.sheets.map((sheet) => ({
      id: sheet.id,
      name: sheet.name,
      rows: sheet.rows,
      cols: sheet.cols,
      cells: sheet.cells ?? {},
    }));
    state.activeSheetId = snapshot.activeSheetId ?? state.sheets[0].id;
    state.selection = snapshot.selection ?? { row: 0, col: 0 };
    return true;
  } catch (error) {
    console.warn('Unable to restore session', error);
    return false;
  }
}

function initialize() {
  const restored = loadSession();
  if (!restored) {
    const first = createSheet('Sheet 1');
    state.sheets = [first];
    state.activeSheetId = first.id;
    state.selection = { row: 0, col: 0 };
  }
  renderAll();
  focusGrid();
}

// Event listeners
gridBodyEl.addEventListener('mousedown', (event) => {
  const cellEl = event.target.closest('td');
  if (!cellEl) return;
  const row = Number(cellEl.dataset.row);
  const col = Number(cellEl.dataset.col);
  setSelection(row, col);
  focusGrid();
});

gridBodyEl.addEventListener('dblclick', (event) => {
  const cellEl = event.target.closest('td');
  if (!cellEl) return;
  const row = Number(cellEl.dataset.row);
  const col = Number(cellEl.dataset.col);
  setSelection(row, col);
  startInlineEdit();
});

gridWrapperEl.addEventListener('keydown', handleGridKeydown);

applyFormulaButton.addEventListener('click', () => {
  applyInputToSelection(formulaInputEl.value);
});

formulaInputEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    applyInputToSelection(formulaInputEl.value);
    focusGrid();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    updateFormulaInput();
    focusGrid();
  }
});

addSheetButton.addEventListener('click', addSheet);
addRowButton.addEventListener('click', addRow);
addColumnButton.addEventListener('click', addColumn);
clearCellButton.addEventListener('click', clearSelectionCell);

initialize();
