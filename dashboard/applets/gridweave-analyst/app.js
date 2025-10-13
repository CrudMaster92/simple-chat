const sheetListEl = document.querySelector('[data-role="sheet-list"]');
const headerRowEl = document.querySelector('[data-role="header-row"]');
const gridBodyEl = document.querySelector('[data-role="grid-body"]');
const gridWrapperEl = document.querySelector('.grid-wrapper');
const sheetDescriptionEl = document.getElementById('sheetDescription');
const selectionStatusEl = document.getElementById('selectionStatus');
const formulaInputEl = document.getElementById('formulaInput');
const scenarioSwitcherEl = document.querySelector('.scenario-switcher');
const scenarioNoteEl = document.getElementById('scenarioNote');
const commitButton = document.getElementById('commitFormula');
const explainButton = document.getElementById('explainFormula');
const aiTooltipEl = document.getElementById('aiTooltip');
const explainContextEl = document.getElementById('explainContext');
const formulaExplanationEl = document.getElementById('formulaExplanation');
const openaiKeyInput = document.getElementById('openaiKeyInput');
const storeKeyButton = document.getElementById('storeKey');
const refreshModelsButton = document.getElementById('refreshModels');
const modelStatusEl = document.getElementById('modelStatus');
const modelSelectEl = document.getElementById('modelSelect');
const modelHintEl = document.getElementById('modelHint');
const sparkListEl = document.querySelector('[data-role="spark-list"]');
const sparkContextEl = document.getElementById('sparkContext');
const conditionalColumnSelect = document.getElementById('conditionalColumn');
const conditionalPresetSelect = document.getElementById('conditionalPreset');
const importDrawerEl = document.getElementById('importDrawer');
const openImportButton = document.getElementById('openImport');
const closeImportButton = document.getElementById('closeImport');
const importForm = document.getElementById('importForm');
const importTextArea = document.getElementById('importText');
const importFeedbackEl = document.getElementById('importFeedback');
const importStatusPreviewEl = document.getElementById('importStatusPreview');
const drawerBackdropEl = document.getElementById('drawerBackdrop');
const clearImportButton = document.getElementById('clearImport');

const FALLBACK_MODELS = {
  chat: ['gpt-4o-mini', 'gpt-4.1-mini', 'gpt-3.5-turbo'],
  vision: ['gpt-4o-mini-vision'],
  images: ['dall-e-3'],
  audio: ['gpt-4o-realtime-preview'],
  embeddings: ['text-embedding-3-large', 'text-embedding-3-small'],
};

const CONDITIONAL_PRESETS = [
  { id: 'none', label: 'None' },
  { id: 'peaks', label: 'Peaks vs troughs' },
  { id: 'divergence', label: 'Diverging split' },
  { id: 'stability', label: 'Stability band', hint: 'Highlights entries hugging the median.' },
  { id: 'dataBars', label: 'Data bars' },
];

const SCENARIOS = [
  {
    id: 'steady',
    label: 'Steady Loom',
    short: 'Steady',
    description: 'Baseline forecast grounded in consensus pacing and last quarter actuals.',
    note: 'Use this as the control weave for board-ready narratives.',
    multipliers: {
      demand: 1,
      price: 1,
      expense: 1,
      effort: 1,
      quality: 1,
      automation: 1,
      cashIn: 1,
      cashOut: 1,
      margin: 1,
    },
    offsets: {
      automation: 0,
      margin: 0,
    },
  },
  {
    id: 'momentum',
    label: 'Momentum Uplift',
    short: 'Momentum',
    description: 'Campaign surge lifts demand +16% and price +3%, while expenses swell modestly.',
    note: 'Expect richer margins but watch the slight drift in rework time.',
    multipliers: {
      demand: 1.16,
      price: 1.03,
      expense: 1.06,
      effort: 1.08,
      quality: 0.92,
      automation: 1,
      cashIn: 1.18,
      cashOut: 1.08,
      margin: 1.05,
    },
    offsets: {
      automation: 0.04,
      margin: 0.02,
    },
  },
  {
    id: 'storm',
    label: 'Stormcell Buffer',
    short: 'Stormcell',
    description: 'Supply drag trims demand -18% with -5% price pressure and +9% unit cost.',
    note: 'Model a protective buffer while automation coverage softens slightly.',
    multipliers: {
      demand: 0.82,
      price: 0.95,
      expense: 1.09,
      effort: 0.94,
      quality: 1.18,
      automation: 1,
      cashIn: 0.86,
      cashOut: 1.12,
      margin: 0.88,
    },
    offsets: {
      automation: -0.03,
      margin: -0.03,
    },
  },
];

const c = (value, options = {}) => ({
  raw: value,
  scenarioKey: options.scenarioKey ?? null,
  readOnly: options.readOnly ?? false,
  note: options.note ?? '',
});

const createRow = (label, cells, options = {}) => ({
  label,
  cells,
  isSummary: options.isSummary ?? false,
});

const WORKBOOK = [
  {
    id: 'revenue-loom',
    name: 'Revenue Loom',
    description: 'Track unit demand, pricing, and contribution margin for each flagship weave line.',
    sparkContext: 'Trailing five-month bookings scaled by the active scenario.',
    columns: [
      { id: 'thread', label: 'Thread family', type: 'text', scenarioKey: null },
      { id: 'units', label: 'Units sold', type: 'number', scenarioKey: 'demand' },
      { id: 'price', label: 'Unit price ($)', type: 'currency', scenarioKey: 'price' },
      { id: 'cost', label: 'Unit cost ($)', type: 'currency', scenarioKey: 'expense' },
      { id: 'revenue', label: 'Net revenue ($)', type: 'currency', scenarioKey: null },
      { id: 'cogs', label: 'COGS ($)', type: 'currency', scenarioKey: null },
      { id: 'margin', label: 'Gross margin %', type: 'percent', scenarioKey: null },
    ],
    rows: [
      createRow('Solar Sail Bolts', {
        thread: c('Solar Sail Bolts', { readOnly: true }),
        units: c(1840, { scenarioKey: 'demand' }),
        price: c(52, { scenarioKey: 'price' }),
        cost: c(28, { scenarioKey: 'expense' }),
        revenue: c('=B2*C2'),
        cogs: c('=B2*D2'),
        margin: c('=IF(E2=0,0,(E2-F2)/E2)'),
      }),
      createRow('Aurora Loom Kits', {
        thread: c('Aurora Loom Kits', { readOnly: true }),
        units: c(1120, { scenarioKey: 'demand' }),
        price: c(118, { scenarioKey: 'price' }),
        cost: c(62, { scenarioKey: 'expense' }),
        revenue: c('=B3*C3'),
        cogs: c('=B3*D3'),
        margin: c('=IF(E3=0,0,(E3-F3)/E3)'),
      }),
      createRow('Tidal Braid Wraps', {
        thread: c('Tidal Braid Wraps', { readOnly: true }),
        units: c(970, { scenarioKey: 'demand' }),
        price: c(86, { scenarioKey: 'price' }),
        cost: c(41, { scenarioKey: 'expense' }),
        revenue: c('=B4*C4'),
        cogs: c('=B4*D4'),
        margin: c('=IF(E4=0,0,(E4-F4)/E4)'),
      }),
      createRow('Nebula Filament Sets', {
        thread: c('Nebula Filament Sets', { readOnly: true }),
        units: c(540, { scenarioKey: 'demand' }),
        price: c(132, { scenarioKey: 'price' }),
        cost: c(74, { scenarioKey: 'expense' }),
        revenue: c('=B5*C5'),
        cogs: c('=B5*D5'),
        margin: c('=IF(E5=0,0,(E5-F5)/E5)'),
      }),
      createRow('Totals & Weighted', {
        thread: c('Totals & Weighted', { readOnly: true }),
        units: c('=SUM(B2:B5)', { readOnly: true }),
        price: c('=IF(B6=0,0,E6/B6)', { readOnly: true }),
        cost: c('=IF(B6=0,0,F6/B6)', { readOnly: true }),
        revenue: c('=SUM(E2:E5)', { readOnly: true }),
        cogs: c('=SUM(F2:F5)', { readOnly: true }),
        margin: c('=IF(E6=0,0,(E6-F6)/E6)', { readOnly: true }),
      }, { isSummary: true }),
    ],
    sparklines: [
      {
        label: 'Solar Sail Bolts',
        caption: 'Bookings (thousands)',
        values: [120, 138, 152, 164, 176],
        scenarioKey: 'demand',
        color: '#e6842f',
        format: 'number',
      },
      {
        label: 'Aurora Loom Kits',
        caption: 'Bookings (thousands)',
        values: [68, 72, 80, 87, 95],
        scenarioKey: 'demand',
        color: '#0f6957',
        format: 'number',
      },
      {
        label: 'Gross margin',
        caption: 'Weighted margin %',
        values: [0.34, 0.35, 0.36, 0.37, 0.39],
        scenarioKey: 'margin',
        color: '#d4671d',
        format: 'percent',
      },
    ],
  },
  {
    id: 'efficiency-net',
    name: 'Efficiency Net',
    description: 'Blend crew effort, rework drag, and automation coverage to size productivity.',
    sparkContext: 'Weekly telemetry rolled into four-sprint views.',
    columns: [
      { id: 'squad', label: 'Squad', type: 'text', scenarioKey: null },
      { id: 'crewHours', label: 'Crew hours', type: 'number', scenarioKey: 'effort' },
      { id: 'outputUnits', label: 'Output units', type: 'number', scenarioKey: 'demand' },
      { id: 'outputPerHour', label: 'Output per hr', type: 'number', scenarioKey: null },
      { id: 'reworkHours', label: 'Rework hours', type: 'number', scenarioKey: 'quality' },
      { id: 'reworkRate', label: 'Rework rate %', type: 'percent', scenarioKey: null },
      { id: 'automation', label: 'Automation coverage %', type: 'percent', scenarioKey: 'automation' },
      { id: 'productivity', label: 'Productivity index', type: 'number', scenarioKey: null },
    ],
    rows: [
      createRow('Meridian Spindle', {
        squad: c('Meridian Spindle', { readOnly: true }),
        crewHours: c(420, { scenarioKey: 'effort' }),
        outputUnits: c(760, { scenarioKey: 'demand' }),
        outputPerHour: c('=IF(B2=0,0,C2/B2)'),
        reworkHours: c(34, { scenarioKey: 'quality' }),
        reworkRate: c('=IF(B2=0,0,E2/B2)'),
        automation: c(0.58, { scenarioKey: 'automation' }),
        productivity: c('=ROUND((C2-E2)/(B2+1)*(1+G2),2)'),
      }),
      createRow('Turbine Frame', {
        squad: c('Turbine Frame', { readOnly: true }),
        crewHours: c(360, { scenarioKey: 'effort' }),
        outputUnits: c(690, { scenarioKey: 'demand' }),
        outputPerHour: c('=IF(B3=0,0,C3/B3)'),
        reworkHours: c(28, { scenarioKey: 'quality' }),
        reworkRate: c('=IF(B3=0,0,E3/B3)'),
        automation: c(0.62, { scenarioKey: 'automation' }),
        productivity: c('=ROUND((C3-E3)/(B3+1)*(1+G3),2)'),
      }),
      createRow('Helix Loom', {
        squad: c('Helix Loom', { readOnly: true }),
        crewHours: c(340, { scenarioKey: 'effort' }),
        outputUnits: c(720, { scenarioKey: 'demand' }),
        outputPerHour: c('=IF(B4=0,0,C4/B4)'),
        reworkHours: c(24, { scenarioKey: 'quality' }),
        reworkRate: c('=IF(B4=0,0,E4/B4)'),
        automation: c(0.66, { scenarioKey: 'automation' }),
        productivity: c('=ROUND((C4-E4)/(B4+1)*(1+G4),2)'),
      }),
      createRow('Quilt Forge', {
        squad: c('Quilt Forge', { readOnly: true }),
        crewHours: c(280, { scenarioKey: 'effort' }),
        outputUnits: c(540, { scenarioKey: 'demand' }),
        outputPerHour: c('=IF(B5=0,0,C5/B5)'),
        reworkHours: c(32, { scenarioKey: 'quality' }),
        reworkRate: c('=IF(B5=0,0,E5/B5)'),
        automation: c(0.54, { scenarioKey: 'automation' }),
        productivity: c('=ROUND((C5-E5)/(B5+1)*(1+G5),2)'),
      }),
      createRow('Composite summary', {
        squad: c('Composite summary', { readOnly: true }),
        crewHours: c('=SUM(B2:B5)', { readOnly: true }),
        outputUnits: c('=SUM(C2:C5)', { readOnly: true }),
        outputPerHour: c('=IF(B6=0,0,C6/B6)', { readOnly: true }),
        reworkHours: c('=SUM(E2:E5)', { readOnly: true }),
        reworkRate: c('=IF(B6=0,0,E6/B6)', { readOnly: true }),
        automation: c('=AVERAGE(G2:G5)', { readOnly: true }),
        productivity: c('=ROUND(AVERAGE(H2:H5),2)', { readOnly: true }),
      }, { isSummary: true }),
    ],
    sparklines: [
      {
        label: 'Output per hr',
        caption: 'Crew efficiency trend',
        values: [1.68, 1.72, 1.78, 1.82, 1.86],
        scenarioKey: 'demand',
        color: '#2c8c6b',
        format: 'number',
      },
      {
        label: 'Rework rate',
        caption: 'Share of hours lost to rework',
        values: [0.09, 0.085, 0.08, 0.076, 0.072],
        scenarioKey: 'quality',
        color: '#d0671f',
        format: 'percent',
      },
      {
        label: 'Automation lift',
        caption: 'Coverage share across squads',
        values: [0.55, 0.57, 0.6, 0.63, 0.66],
        scenarioKey: 'automation',
        color: '#0f6957',
        format: 'percent',
      },
    ],
  },
  {
    id: 'cash-canvas',
    name: 'Cashflow Canvas',
    description: 'Quarterly inflow, burn, and runway coverage stitched from treasury pulses.',
    sparkContext: 'Rolling four-month cash pulse with the scenario multiplier applied.',
    columns: [
      { id: 'month', label: 'Month', type: 'text', scenarioKey: null },
      { id: 'cashIn', label: 'Cash in ($K)', type: 'currency', scenarioKey: 'cashIn' },
      { id: 'cashOut', label: 'Cash out ($K)', type: 'currency', scenarioKey: 'cashOut' },
      { id: 'net', label: 'Net flow ($K)', type: 'currency', scenarioKey: null },
      { id: 'balance', label: 'Rolling balance ($K)', type: 'currency', scenarioKey: null },
      { id: 'coverage', label: 'Coverage (months)', type: 'number', scenarioKey: null },
    ],
    rows: [
      createRow('Jan', {
        month: c('Jan', { readOnly: true }),
        cashIn: c(620, { scenarioKey: 'cashIn' }),
        cashOut: c(508, { scenarioKey: 'cashOut' }),
        net: c('=B2-C2'),
        balance: c('=2000+D2', { readOnly: true }),
        coverage: c('=IF(C2=0,0,E2/C2)'),
      }),
      createRow('Feb', {
        month: c('Feb', { readOnly: true }),
        cashIn: c(640, { scenarioKey: 'cashIn' }),
        cashOut: c(522, { scenarioKey: 'cashOut' }),
        net: c('=B3-C3'),
        balance: c('=E2+D3'),
        coverage: c('=IF(C3=0,0,E3/C3)'),
      }),
      createRow('Mar', {
        month: c('Mar', { readOnly: true }),
        cashIn: c(688, { scenarioKey: 'cashIn' }),
        cashOut: c(548, { scenarioKey: 'cashOut' }),
        net: c('=B4-C4'),
        balance: c('=E3+D4'),
        coverage: c('=IF(C4=0,0,E4/C4)'),
      }),
      createRow('Apr', {
        month: c('Apr', { readOnly: true }),
        cashIn: c(704, { scenarioKey: 'cashIn' }),
        cashOut: c(560, { scenarioKey: 'cashOut' }),
        net: c('=B5-C5'),
        balance: c('=E4+D5'),
        coverage: c('=IF(C5=0,0,E5/C5)'),
      }),
      createRow('Quarter wrap', {
        month: c('Quarter wrap', { readOnly: true }),
        cashIn: c('=SUM(B2:B5)', { readOnly: true }),
        cashOut: c('=SUM(C2:C5)', { readOnly: true }),
        net: c('=SUM(D2:D5)', { readOnly: true }),
        balance: c('=E5', { readOnly: true }),
        coverage: c('=AVERAGE(F2:F5)', { readOnly: true }),
      }, { isSummary: true }),
    ],
    sparklines: [
      {
        label: 'Net flow',
        caption: 'Monthly net change ($K)',
        values: [112, 118, 140, 144],
        scenarioKey: 'cashIn',
        color: '#e6842f',
        format: 'currency',
      },
      {
        label: 'Cash out',
        caption: 'Operating burn ($K)',
        values: [508, 522, 548, 560],
        scenarioKey: 'cashOut',
        color: '#bd5a18',
        format: 'currency',
      },
      {
        label: 'Balance runway',
        caption: 'Rolling balance ($K)',
        values: [2112, 2230, 2370, 2514],
        scenarioKey: 'cashIn',
        color: '#0f6957',
        format: 'currency',
      },
    ],
  },
];

const state = {
  activeSheetId: WORKBOOK[0].id,
  scenarioId: SCENARIOS[0].id,
  selection: { sheetId: WORKBOOK[0].id, rowIndex: 0, colIndex: 1 },
  conditional: { columnIndex: 1, presetId: 'peaks' },
  models: clone(FALLBACK_MODELS),
  selectedModel: FALLBACK_MODELS.chat[0],
  openaiKey: '',
  lastModelRefresh: null,
  importSummary: '',
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function getActiveScenario() {
  return SCENARIOS.find((scenario) => scenario.id === state.scenarioId) ?? SCENARIOS[0];
}

function getActiveSheet() {
  return WORKBOOK.find((sheet) => sheet.id === state.activeSheetId) ?? WORKBOOK[0];
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
  const match = /^([A-Z]+)(\d+)$/.exec(address.toUpperCase());
  if (!match) return { rowIndex: -1, colIndex: -1 };
  const [, col, rowStr] = match;
  const colIndex = nameToColumnIndex(col);
  const rowNumber = Number(rowStr);
  return { rowIndex: rowNumber - 2, colIndex };
}

function adjustForScenario(value, scenarioKey, type) {
  if (typeof value !== 'number' || Number.isNaN(value)) return value;
  if (!scenarioKey) return value;
  const scenario = getActiveScenario();
  const multiplier = scenario.multipliers?.[scenarioKey] ?? 1;
  const offset = scenario.offsets?.[scenarioKey] ?? 0;
  let adjusted = value * multiplier + offset;
  if (type === 'percent') {
    adjusted = Math.min(1, Math.max(0, adjusted));
  }
  return adjusted;
}

function getCell(sheet, rowIndex, colIndex) {
  const column = sheet.columns[colIndex];
  const row = sheet.rows[rowIndex];
  if (!column || !row) return null;
  return row.cells?.[column.id] ?? null;
}

function evaluateCell(sheet, rowIndex, colIndex, visited = new Set()) {
  const column = sheet.columns[colIndex];
  const row = sheet.rows[rowIndex];
  if (!column || !row) return '';
  const cell = getCell(sheet, rowIndex, colIndex);
  if (!cell) return '';
  const raw = cell.raw;
  if (typeof raw === 'number') {
    return adjustForScenario(raw, cell.scenarioKey ?? column.scenarioKey, column.type);
  }
  if (typeof raw === 'string') {
    if (raw.startsWith('=')) {
      const key = `${sheet.id}:${rowIndex}:${colIndex}`;
      if (visited.has(key)) return '#CYCLE';
      visited.add(key);
      const result = evaluateFormula(raw.slice(1), sheet, visited);
      visited.delete(key);
      return result;
    }
    return raw;
  }
  if (raw === null || raw === undefined) return '';
  return raw;
}

function evaluateFormula(expression, sheet, visited) {
  let prepared = expression.toUpperCase();
  const rangeTokens = [];
  prepared = prepared.replace(/([A-Z]+\d+:[A-Z]+\d+)/g, (match) => {
    const token = `__R${rangeTokens.length}__`;
    rangeTokens.push({ token, value: match });
    return token;
  });
  const cellTokens = [];
  prepared = prepared.replace(/([A-Z]+\d+)/g, (match) => {
    const token = `__C${cellTokens.length}__`;
    cellTokens.push({ token, value: match });
    return token;
  });
  rangeTokens.forEach(({ token, value }) => {
    prepared = prepared.replace(token, `__range("${value}")`);
  });
  cellTokens.forEach(({ token, value }) => {
    prepared = prepared.replace(token, `__cell("${value}")`);
  });

  const scenario = getActiveScenario();

  const context = {
    SUM: (...args) => flattenArgs(args).reduce((acc, value) => acc + toNumber(value), 0),
    AVERAGE: (...args) => {
      const numbers = flattenArgs(args).map((value) => toNumber(value)).filter((value) => Number.isFinite(value));
      if (!numbers.length) return 0;
      return numbers.reduce((acc, value) => acc + value, 0) / numbers.length;
    },
    MIN: (...args) => {
      const numbers = flattenArgs(args).map((value) => toNumber(value)).filter((value) => Number.isFinite(value));
      return numbers.length ? Math.min(...numbers) : 0;
    },
    MAX: (...args) => {
      const numbers = flattenArgs(args).map((value) => toNumber(value)).filter((value) => Number.isFinite(value));
      return numbers.length ? Math.max(...numbers) : 0;
    },
    ROUND: (value, digits = 0) => {
      const num = Number(value);
      const precision = 10 ** Number(digits ?? 0);
      return Math.round(num * precision) / precision;
    },
    ABS: (value) => Math.abs(Number(value)),
    IF: (condition, whenTrue, whenFalse) => (condition ? whenTrue : whenFalse),
    SCENARIO: (key) => scenario.multipliers?.[String(key).trim()] ?? 1,
    __cell: (ref) => {
      const { rowIndex, colIndex } = parseAddress(ref);
      if (rowIndex < 0 || colIndex < 0) return 0;
      const key = `${sheet.id}:${rowIndex}:${colIndex}`;
      if (visited.has(key)) return '#CYCLE';
      visited.add(key);
      const value = evaluateCell(sheet, rowIndex, colIndex, visited);
      visited.delete(key);
      return value;
    },
    __range: (ref) => {
      const [startRef, endRef] = ref.split(':');
      const start = parseAddress(startRef);
      const end = parseAddress(endRef);
      const rows = [];
      const rStart = Math.min(start.rowIndex, end.rowIndex);
      const rEnd = Math.max(start.rowIndex, end.rowIndex);
      const cStart = Math.min(start.colIndex, end.colIndex);
      const cEnd = Math.max(start.colIndex, end.colIndex);
      for (let r = rStart; r <= rEnd; r += 1) {
        for (let c = cStart; c <= cEnd; c += 1) {
          const key = `${sheet.id}:${r}:${c}`;
          if (visited.has(key)) {
            rows.push('#CYCLE');
          } else {
            visited.add(key);
            rows.push(evaluateCell(sheet, r, c, visited));
            visited.delete(key);
          }
        }
      }
      return rows;
    },
  };

  try {
    const fn = new Function('context', `with(context){ return ${prepared}; }`);
    const result = fn(context);
    if (typeof result === 'number') {
      if (Number.isNaN(result)) return '#ERR';
      return result;
    }
    return result ?? '';
  } catch (error) {
    return '#ERR';
  }
}

function flattenArgs(args) {
  const values = [];
  args.forEach((value) => {
    if (Array.isArray(value)) {
      values.push(...flattenArgs(value));
    } else {
      values.push(value);
    }
  });
  return values;
}

function toNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function formatValue(value, type) {
  if (value === '#ERR' || value === '#CYCLE') return value;
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value !== 'number' || Number.isNaN(value)) return '';
  const abs = Math.abs(value);
  if (type === 'currency') {
    return abs >= 1000
      ? value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
      : value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }
  if (type === 'percent') {
    return (value * 100).toLocaleString('en-US', {
      minimumFractionDigits: value < 0.2 ? 2 : 1,
      maximumFractionDigits: 2,
    });
  }
  if (type === 'number') {
    if (abs >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: value % 1 === 0 ? 0 : 1 });
  }
  return String(value);
}

function renderScenarioButtons() {
  scenarioSwitcherEl.innerHTML = '';
  SCENARIOS.forEach((scenario) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = scenario.label;
    button.setAttribute('role', 'radio');
    button.dataset.scenarioId = scenario.id;
    button.setAttribute('aria-checked', scenario.id === state.scenarioId ? 'true' : 'false');
    const subtitle = document.createElement('span');
    subtitle.textContent = scenario.short;
    button.appendChild(subtitle);
    button.addEventListener('click', () => {
      if (state.scenarioId === scenario.id) return;
      state.scenarioId = scenario.id;
      scenarioSwitcherEl.querySelectorAll('button').forEach((el) => el.setAttribute('aria-checked', el === button ? 'true' : 'false'));
      renderScenarioNote();
      renderGrid();
      renderSparklines();
      updateSelectionStatus();
      updateExplanation();
    });
    scenarioSwitcherEl.appendChild(button);
  });
}

function renderScenarioNote() {
  const scenario = getActiveScenario();
  scenarioNoteEl.textContent = `${scenario.description} ${scenario.note ?? ''}`.trim();
}

function renderSheetList() {
  sheetListEl.innerHTML = '';
  WORKBOOK.forEach((sheet) => {
    const li = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = sheet.name;
    button.classList.toggle('is-active', sheet.id === state.activeSheetId);
    button.addEventListener('click', () => {
      if (sheet.id === state.activeSheetId) return;
      state.activeSheetId = sheet.id;
      state.selection = { sheetId: sheet.id, rowIndex: 0, colIndex: 1 };
      sheetListEl.querySelectorAll('button').forEach((btn) => btn.classList.toggle('is-active', btn === button));
      syncConditionalControls();
      renderGrid();
      renderSparklines();
      updateFormulaInput();
      updateSelectionStatus();
      updateExplanation();
    });
    li.appendChild(button);
    sheetListEl.appendChild(li);
  });
}

function syncConditionalControls() {
  const sheet = getActiveSheet();
  const numericColumns = sheet.columns
    .map((col, index) => ({ col, index }))
    .filter(({ col }) => col.type !== 'text');
  conditionalColumnSelect.innerHTML = '';
  numericColumns.forEach(({ col, index }) => {
    const option = document.createElement('option');
    option.value = String(index);
    option.textContent = `${columnIndexToName(index)} · ${col.label}`;
    conditionalColumnSelect.appendChild(option);
  });
  if (!numericColumns.some(({ index }) => index === state.conditional.columnIndex)) {
    state.conditional.columnIndex = numericColumns[0]?.index ?? 1;
  }
  conditionalColumnSelect.value = String(state.conditional.columnIndex ?? numericColumns[0]?.index ?? 1);

  conditionalPresetSelect.innerHTML = '';
  CONDITIONAL_PRESETS.forEach((preset) => {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.label;
    if (preset.hint) option.dataset.hint = preset.hint;
    conditionalPresetSelect.appendChild(option);
  });
  conditionalPresetSelect.value = state.conditional.presetId;
}

function renderGrid() {
  const sheet = getActiveSheet();
  sheetDescriptionEl.textContent = sheet.description;
  headerRowEl.innerHTML = '';
  const rowHeader = document.createElement('th');
  rowHeader.scope = 'col';
  rowHeader.textContent = '#';
  headerRowEl.appendChild(rowHeader);
  sheet.columns.forEach((column, index) => {
    const th = document.createElement('th');
    th.scope = 'col';
    th.textContent = `${columnIndexToName(index)} · ${column.label}`;
    headerRowEl.appendChild(th);
  });

  const statsMap = computeColumnStats(sheet);

  gridBodyEl.innerHTML = '';
  sheet.rows.forEach((row, rowIndex) => {
    const tr = document.createElement('tr');
    if (row.isSummary) tr.classList.add('is-summary');
    const rowNumber = rowIndex + 2;
    const th = document.createElement('th');
    th.scope = 'row';
    th.innerHTML = `<div class="row-header"><strong>R${rowNumber}</strong><span>${row.label}</span></div>`;
    tr.appendChild(th);
    sheet.columns.forEach((column, colIndex) => {
      const cell = getCell(sheet, rowIndex, colIndex);
      const td = document.createElement('td');
      td.dataset.rowIndex = String(rowIndex);
      td.dataset.colIndex = String(colIndex);
      td.dataset.address = `${columnIndexToName(colIndex)}${rowNumber}`;
      td.dataset.type = column.type;
      const value = evaluateCell(sheet, rowIndex, colIndex);
      const display = formatValue(value, column.type);
      if (typeof cell?.raw === 'string' && cell.raw.startsWith('=')) {
        td.classList.add('is-formula');
      }
      if (
        state.selection.sheetId === sheet.id &&
        state.selection.rowIndex === rowIndex &&
        state.selection.colIndex === colIndex
      ) {
        td.classList.add('is-selected');
      }

      const conditional = applyConditional(value, column.type, statsMap.get(colIndex), colIndex);
      if (conditional?.className) td.classList.add(conditional.className);
      if (conditional?.style) {
        Object.entries(conditional.style).forEach(([key, val]) => {
          td.style.setProperty(key, val);
        });
      } else {
        td.removeAttribute('style');
      }

      td.textContent = display;
      if (cell?.note) {
        const note = document.createElement('span');
        note.className = 'cell-note';
        note.textContent = cell.note;
        td.appendChild(note);
      }
      tr.appendChild(td);
    });
    gridBodyEl.appendChild(tr);
  });
}

function computeColumnStats(sheet) {
  const map = new Map();
  sheet.columns.forEach((column, colIndex) => {
    if (column.type === 'text') return;
    const values = [];
    sheet.rows.forEach((row, rowIndex) => {
      const value = evaluateCell(sheet, rowIndex, colIndex);
      if (typeof value === 'number' && Number.isFinite(value)) {
        values.push(value);
      }
    });
    map.set(colIndex, buildStats(values));
  });
  return map;
}

function buildStats(values) {
  if (!values.length) {
    return { count: 0, min: 0, max: 0, avg: 0, median: 0, std: 0 };
  }
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((acc, value) => acc + value, 0);
  const avg = sum / values.length;
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  const variance = values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / values.length;
  return {
    count: values.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    avg,
    median,
    std: Math.sqrt(variance),
  };
}

function applyConditional(value, type, stats, colIndex) {
  if (state.conditional.presetId === 'none') return null;
  if (state.conditional.columnIndex !== colIndex) return null;
  if (!stats || stats.count === 0) return null;
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  switch (state.conditional.presetId) {
    case 'peaks': {
      const highThreshold = stats.avg + stats.std * 0.4;
      const lowThreshold = stats.avg - stats.std * 0.4;
      if (value >= highThreshold) return { className: 'cf-high' };
      if (value <= lowThreshold) return { className: 'cf-low' };
      return null;
    }
    case 'divergence': {
      if (value >= stats.avg) return { className: 'cf-warm' };
      return { className: 'cf-cool' };
    }
    case 'stability': {
      const delta = Math.abs(value - stats.median);
      if (delta <= Math.max(stats.std * 0.2, stats.max * 0.01)) {
        return { className: 'cf-neutral' };
      }
      return null;
    }
    case 'dataBars': {
      const range = stats.max - stats.min || 1;
      const ratio = Math.max(0, Math.min(1, (value - stats.min) / range));
      return { className: 'cf-bar', style: { '--data-bar': ratio.toFixed(3) } };
    }
    default:
      return null;
  }
}

function renderSparklines() {
  const sheet = getActiveSheet();
  sparkContextEl.textContent = sheet.sparkContext ?? '';
  sparkListEl.innerHTML = '';
  sheet.sparklines?.forEach((series) => {
    const li = document.createElement('li');
    li.className = 'spark-item';

    const meta = document.createElement('div');
    meta.className = 'spark-meta';
    const title = document.createElement('strong');
    title.textContent = series.label;
    const caption = document.createElement('span');
    caption.textContent = series.caption;
    meta.appendChild(title);
    meta.appendChild(caption);

    const graph = document.createElement('div');
    graph.className = 'spark-graph';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'sparkline');
    svg.setAttribute('viewBox', '0 0 120 36');

    const scenarioValues = series.values.map((value) =>
      adjustForScenario(value, series.scenarioKey, series.format === 'percent' ? 'percent' : 'number'),
    );

    const min = Math.min(...scenarioValues);
    const max = Math.max(...scenarioValues);
    const range = max - min || 1;
    const points = scenarioValues
      .map((value, index) => {
        const x = (index / Math.max(series.values.length - 1, 1)) * 108 + 6;
        const y = 30 - ((value - min) / range) * 24;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('fill', 'none');
    polyline.setAttribute('stroke', series.color ?? '#e6842f');
    polyline.setAttribute('stroke-width', '2');
    polyline.setAttribute('points', points);
    svg.appendChild(polyline);

    const lastX = (scenarioValues.length - 1) / Math.max(series.values.length - 1, 1) * 108 + 6;
    const lastY = 30 - ((scenarioValues.at(-1) - min) / range) * 24;
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    marker.setAttribute('cx', lastX.toFixed(2));
    marker.setAttribute('cy', lastY.toFixed(2));
    marker.setAttribute('r', '3');
    marker.setAttribute('fill', series.color ?? '#e6842f');
    svg.appendChild(marker);

    const valueEl = document.createElement('span');
    valueEl.className = 'spark-value';
    valueEl.textContent = formatSparkValue(scenarioValues.at(-1), series.format);

    graph.appendChild(svg);
    graph.appendChild(valueEl);

    li.appendChild(meta);
    li.appendChild(graph);
    sparkListEl.appendChild(li);
  });
}

function formatSparkValue(value, format) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '–';
  switch (format) {
    case 'percent':
      return `${(value * 100).toFixed(1)}%`;
    case 'currency':
      return `$${value.toFixed(0)}`;
    default:
      return value.toFixed(value < 10 ? 2 : 0);
  }
}

function updateSelectionStatus() {
  const sheet = getActiveSheet();
  const { rowIndex, colIndex } = state.selection;
  const row = sheet.rows[rowIndex];
  const column = sheet.columns[colIndex];
  if (!row || !column) {
    selectionStatusEl.textContent = '';
    return;
  }
  const value = evaluateCell(sheet, rowIndex, colIndex);
  const address = `${columnIndexToName(colIndex)}${rowIndex + 2}`;
  const formatted = formatValue(value, column.type);
  selectionStatusEl.textContent = `${sheet.name} · ${address} (${row.label}) → ${formatted}`;
}

function updateFormulaInput() {
  const sheet = getActiveSheet();
  const { rowIndex, colIndex } = state.selection;
  const cell = getCell(sheet, rowIndex, colIndex);
  if (!cell) {
    formulaInputEl.value = '';
    return;
  }
  const raw = cell.raw;
  if (typeof raw === 'number') {
    formulaInputEl.value = String(raw);
  } else {
    formulaInputEl.value = raw ?? '';
  }
}

function setSelection(rowIndex, colIndex) {
  const sheet = getActiveSheet();
  if (!sheet.rows[rowIndex] || !sheet.columns[colIndex]) return;
  state.selection = { sheetId: sheet.id, rowIndex, colIndex };
  renderGrid();
  updateFormulaInput();
  updateSelectionStatus();
  updateExplanation();
}

function commitFormulaChange() {
  const sheet = getActiveSheet();
  const { rowIndex, colIndex } = state.selection;
  const cell = getCell(sheet, rowIndex, colIndex);
  if (!cell || cell.readOnly) {
    updateSelectionStatus();
    return;
  }
  const input = formulaInputEl.value.trim();
  if (!input) {
    cell.raw = '';
  } else if (input.startsWith('=')) {
    cell.raw = input;
  } else if (!Number.isNaN(Number(input))) {
    cell.raw = Number(input);
  } else {
    cell.raw = input;
  }
  renderGrid();
  updateSelectionStatus();
  updateExplanation();
}

function handleGridClick(event) {
  const cellEl = event.target.closest('td');
  if (!cellEl) return;
  const rowIndex = Number(cellEl.dataset.rowIndex);
  const colIndex = Number(cellEl.dataset.colIndex);
  setSelection(rowIndex, colIndex);
}

function toggleTooltip(force) {
  const shouldOpen = typeof force === 'boolean' ? force : aiTooltipEl.hasAttribute('hidden');
  if (shouldOpen) {
    aiTooltipEl.removeAttribute('hidden');
    explainButton.setAttribute('aria-expanded', 'true');
  } else {
    aiTooltipEl.setAttribute('hidden', '');
    explainButton.setAttribute('aria-expanded', 'false');
  }
}

function handleDocumentClick(event) {
  if (!aiTooltipEl || aiTooltipEl.hasAttribute('hidden')) return;
  if (aiTooltipEl.contains(event.target) || explainButton.contains(event.target)) return;
  toggleTooltip(false);
}

function ensureKey() {
  const key = openaiKeyInput.value.trim();
  if (!key) return null;
  state.openaiKey = key;
  try {
    localStorage.setItem('gridweave-openai-key', key);
  } catch (error) {
    console.warn('Unable to persist API key', error);
  }
  return key;
}

function loadStoredKey() {
  try {
    const stored = localStorage.getItem('gridweave-openai-key');
    if (stored) {
      state.openaiKey = stored;
      modelStatusEl.textContent = 'Key stored locally. Refresh to sync models.';
      openaiKeyInput.value = '';
    }
  } catch (error) {
    console.warn('Unable to read stored key', error);
  }
}

function fingerprintKey(key) {
  if (!key) return 'anon';
  return `openai-${key.slice(0, 8)}`;
}

function loadCachedModels() {
  try {
    const cacheRaw = localStorage.getItem('gridweave-model-cache');
    if (!cacheRaw) return;
    const cache = JSON.parse(cacheRaw);
    const entry = cache[fingerprintKey(state.openaiKey)];
    if (entry?.models) {
      state.models = entry.models;
      state.selectedModel = entry.selectedModel ?? entry.models.chat?.[0] ?? state.selectedModel;
      state.lastModelRefresh = entry.timestamp ?? null;
      modelStatusEl.textContent = `Loaded ${countModels(entry.models)} cached models.`;
      renderModelSelect();
    }
  } catch (error) {
    console.warn('Unable to load cached models', error);
  }
}

function countModels(models) {
  return Object.values(models).reduce((acc, list) => acc + (Array.isArray(list) ? list.length : 0), 0);
}

async function refreshModels() {
  const key = state.openaiKey || ensureKey();
  if (!key) {
    modelStatusEl.textContent = 'Add a valid OpenAI API key to refresh models.';
    return;
  }
  modelStatusEl.textContent = 'Fetching models from OpenAI…';
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${key}`,
      },
    });
    if (response.status === 401) {
      modelStatusEl.textContent = 'The API key was rejected. Keeping the last known catalog.';
      return;
    }
    if (!response.ok) {
      const text = await response.text();
      modelStatusEl.textContent = `Failed to refresh models (${response.status}).`;
      console.error('Model refresh failed', text);
      return;
    }
    const payload = await response.json();
    const bucketed = bucketizeModels(payload?.data ?? []);
    if (countModels(bucketed) === 0) {
      modelStatusEl.textContent = 'No models returned; using fallback catalog.';
      return;
    }
    state.models = bucketed;
    state.selectedModel = bucketed.chat?.[0] ?? bucketed.vision?.[0] ?? state.selectedModel;
    state.lastModelRefresh = Date.now();
    modelStatusEl.textContent = `Loaded ${countModels(bucketed)} models from OpenAI.`;
    cacheModels();
    renderModelSelect();
    updateExplanation();
  } catch (error) {
    console.error('Failed to refresh models', error);
    modelStatusEl.textContent = 'Network error while fetching models.';
  }
}

function cacheModels() {
  try {
    const cacheRaw = localStorage.getItem('gridweave-model-cache');
    const cache = cacheRaw ? JSON.parse(cacheRaw) : {};
    cache[fingerprintKey(state.openaiKey)] = {
      models: state.models,
      selectedModel: state.selectedModel,
      timestamp: state.lastModelRefresh ?? Date.now(),
    };
    localStorage.setItem('gridweave-model-cache', JSON.stringify(cache));
  } catch (error) {
    console.warn('Unable to store model cache', error);
  }
}

function bucketizeModels(models) {
  const buckets = {
    chat: new Set(),
    vision: new Set(),
    images: new Set(),
    audio: new Set(),
    embeddings: new Set(),
  };
  models.forEach((model) => {
    const id = typeof model === 'string' ? model : model.id;
    if (!id) return;
    const bucket = resolveBucket(id);
    buckets[bucket].add(id);
  });
  return Object.fromEntries(Object.entries(buckets).map(([key, value]) => [key, Array.from(value).sort()]));
}

function resolveBucket(id) {
  const key = id.toLowerCase();
  if (key.includes('embedding')) return 'embeddings';
  if (key.includes('audio') || key.includes('voice')) return 'audio';
  if (key.includes('image') || key.includes('dall')) return 'images';
  if (key.includes('vision')) return 'vision';
  return 'chat';
}

function renderModelSelect() {
  modelSelectEl.innerHTML = '';
  let first = null;
  Object.entries(state.models).forEach(([bucket, models]) => {
    if (!models || models.length === 0) return;
    const group = document.createElement('optgroup');
    group.label = bucket.charAt(0).toUpperCase() + bucket.slice(1);
    models.forEach((id) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = id;
      group.appendChild(option);
      if (!first) first = id;
    });
    modelSelectEl.appendChild(group);
  });
  if (!state.selectedModel) {
    state.selectedModel = first ?? FALLBACK_MODELS.chat[0];
  }
  modelSelectEl.value = state.selectedModel;
  const count = countModels(state.models);
  const refreshed = state.lastModelRefresh
    ? new Date(state.lastModelRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'never';
  modelHintEl.textContent = `${count} models catalogued · refreshed ${refreshed}`;
}

function updateExplanation() {
  const sheet = getActiveSheet();
  const { rowIndex, colIndex } = state.selection;
  const cell = getCell(sheet, rowIndex, colIndex);
  if (!cell) {
    explainContextEl.textContent = 'Choose any formula cell to unlock a narrative.';
    formulaExplanationEl.textContent = '';
    return;
  }
  const raw = cell.raw;
  if (typeof raw !== 'string' || !raw.startsWith('=')) {
    explainContextEl.textContent = 'The selected cell is a static value. Pick a formula cell to interpret it.';
    formulaExplanationEl.textContent = '';
    return;
  }
  const scenario = getActiveScenario();
  explainContextEl.textContent = `Interpreting ${columnIndexToName(colIndex)}${rowIndex + 2} via ${state.selectedModel ?? 'catalog heuristics'}.`;
  const description = describeFormula(raw, sheet, rowIndex, colIndex, scenario);
  formulaExplanationEl.textContent = description;
}

function describeFormula(formula, sheet, rowIndex, colIndex, scenario) {
  const body = formula.slice(1).toUpperCase();
  const column = sheet.columns[colIndex];
  const row = sheet.rows[rowIndex];
  const address = `${columnIndexToName(colIndex)}${rowIndex + 2}`;
  const referencedCells = [...new Set(body.match(/[A-Z]+\d+/g) ?? [])];
  const refs = referencedCells
    .map((ref) => describeReference(ref, sheet))
    .filter(Boolean);
  if (/^SUM\(/.test(body)) {
    const ranges = [...new Set(body.match(/[A-Z]+\d+:[A-Z]+\d+/g) ?? [])];
    const described = ranges.map((range) => describeRange(range, sheet)).filter(Boolean).join(' and ');
    return `Cell ${address} (${column.label}) sums ${described || 'its referenced cells'} before scenario multipliers ripple through upstream values under the ${scenario.label} weave.`;
  }
  if (/AVERAGE\(/.test(body)) {
    return `Cell ${address} averages ${refs.join(', ')} to smooth volatility. The ${scenario.short} scenario adjusts the source values before averaging.`;
  }
  if (/IF\(/.test(body)) {
    return `Cell ${address} applies a guardrail: it tests ${refs[0] ?? 'its driver'} and branches to protect against divide-by-zero before finishing the ${column.label.toLowerCase()} story.`;
  }
  if (body.includes('*')) {
    const parts = body.split('*');
    const describedParts = parts
      .map((fragment) => {
        const ref = fragment.match(/__CELL\("([A-Z]+\d+)"\)/);
        if (ref) return describeReference(ref[1], sheet, 'short');
        const rawRef = fragment.match(/[A-Z]+\d+/);
        if (rawRef) return describeReference(rawRef[0], sheet, 'short');
        if (fragment.includes('SCENARIO')) return 'scenario multiplier';
        return fragment.trim();
      })
      .filter(Boolean)
      .join(' × ');
    return `Cell ${address} multiplies ${describedParts} to derive ${column.label.toLowerCase()}. ${scenario.short} tweaks demand, price, or expense drivers before the multiplication fires.`;
  }
  if (body.includes('-') || body.includes('+')) {
    return `Cell ${address} layers arithmetic across ${refs.join(', ')} to form ${column.label.toLowerCase()}, already reflecting the ${scenario.short} adjustments.`;
  }
  return `Cell ${address} executes ${body} against ${refs.join(', ') || 'its inputs'}, then inherits the ${scenario.label} modifiers from upstream cells.`;
}

function describeReference(ref, sheet, mode = 'full') {
  const { rowIndex, colIndex } = parseAddress(ref);
  const column = sheet.columns[colIndex];
  const row = sheet.rows[rowIndex];
  if (!column || !row) return null;
  if (mode === 'short') return `${column.label.toLowerCase()} for ${row.label}`;
  return `${column.label.toLowerCase()} for ${row.label}`;
}

function describeRange(range, sheet) {
  const [start, end] = range.split(':');
  const startMeta = describeReference(start, sheet);
  const endMeta = describeReference(end, sheet);
  if (!startMeta || !endMeta) return null;
  const { colIndex: startCol } = parseAddress(start);
  const { colIndex: endCol } = parseAddress(end);
  if (startCol === endCol) {
    return `${sheet.columns[startCol].label.toLowerCase()} from ${startMeta.split(' for ')[1]} through ${endMeta.split(' for ')[1]}`;
  }
  return `${startMeta.split(' for ')[0]} through ${endMeta.split(' for ')[0]}`;
}

function handleConditionalChange() {
  state.conditional.columnIndex = Number(conditionalColumnSelect.value);
  state.conditional.presetId = conditionalPresetSelect.value;
  renderGrid();
}

function openImportDrawer() {
  importDrawerEl.classList.add('is-open');
  importDrawerEl.setAttribute('aria-hidden', 'false');
  requestAnimationFrame(() => {
    importTextArea.focus();
  });
}

function closeImportDrawer() {
  importDrawerEl.classList.remove('is-open');
  importDrawerEl.setAttribute('aria-hidden', 'true');
  importFeedbackEl.textContent = '';
  importFeedbackEl.className = 'drawer-feedback';
  if (openImportButton) {
    openImportButton.focus();
  }
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) throw new Error('No CSV rows found.');
  const rows = lines.map((line) => line.split(',').map((cell) => cell.trim()));
  const width = rows[0].length;
  if (rows.some((row) => row.length !== width)) throw new Error('Rows have inconsistent column counts.');
  if (new Set(rows[0]).size !== rows[0].length) throw new Error('Duplicate column headers detected.');
  const blankCells = rows.slice(1).some((row) => row.some((cell) => cell === ''));
  if (blankCells) throw new Error('Found blank data cells. Fill gaps before importing.');
  return { kind: 'csv', rows, width };
}

function parseJson(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    throw new Error('JSON failed to parse.');
  }
  if (!Array.isArray(parsed) || !parsed.length) throw new Error('JSON must contain a non-empty array.');
  if (Array.isArray(parsed[0])) {
    const width = parsed[0].length;
    if (parsed.some((row) => !Array.isArray(row) || row.length !== width)) {
      throw new Error('Row arrays must share the same length.');
    }
    return { kind: 'json-array', rows: parsed, width };
  }
  if (typeof parsed[0] === 'object') {
    const keys = Object.keys(parsed[0]);
    if (!keys.length) throw new Error('Objects require at least one field.');
    const inconsistent = parsed.some((row) => Object.keys(row).length !== keys.length);
    if (inconsistent) throw new Error('Object entries must share the same fields.');
    return { kind: 'json-object', rows: parsed, width: keys.length, keys };
  }
  throw new Error('JSON array must contain objects or arrays.');
}

function handleImportSubmit(event) {
  event.preventDefault();
  const mode = importForm.elements.importMode.value;
  const text = importTextArea.value.trim();
  if (!text) {
    renderImportFeedback('Paste data before validating.', true);
    return;
  }
  try {
    const result = mode === 'csv' ? parseCsv(text) : parseJson(text);
    const summary = summarizeImport(result);
    renderImportFeedback(summary, false);
    state.importSummary = summary;
    importStatusPreviewEl.textContent = summary;
  } catch (error) {
    renderImportFeedback(error.message, true);
  }
}

function summarizeImport(result) {
  switch (result.kind) {
    case 'csv':
      return `CSV ready · ${result.rows.length - 1} rows × ${result.width} columns.`;
    case 'json-array':
      return `JSON array ready · ${result.rows.length} rows × ${result.width} columns.`;
    case 'json-object':
      return `JSON objects ready · ${result.rows.length} items · fields: ${result.keys.join(', ')}.`;
    default:
      return 'Import parsed successfully.';
  }
}

function renderImportFeedback(message, isError) {
  importFeedbackEl.textContent = message;
  importFeedbackEl.className = `drawer-feedback ${isError ? 'error' : 'success'}`;
}

function clearImport() {
  importTextArea.value = '';
  importFeedbackEl.textContent = '';
  importFeedbackEl.className = 'drawer-feedback';
}

function initialize() {
  renderScenarioButtons();
  renderScenarioNote();
  renderSheetList();
  syncConditionalControls();
  renderGrid();
  renderSparklines();
  updateFormulaInput();
  updateSelectionStatus();
  renderModelSelect();
  updateExplanation();
  loadStoredKey();
  loadCachedModels();
  if (!state.openaiKey && !modelStatusEl.textContent) {
    modelStatusEl.textContent = 'Add an OpenAI API key to refresh the live model list.';
  }
}

conditionalColumnSelect.addEventListener('change', handleConditionalChange);
conditionalPresetSelect.addEventListener('change', handleConditionalChange);

gridBodyEl.addEventListener('click', handleGridClick);

gridWrapperEl.addEventListener('keydown', (event) => {
  const sheet = getActiveSheet();
  const { rowIndex, colIndex } = state.selection;
  if (event.key === 'ArrowDown') {
    event.preventDefault();
    setSelection(Math.min(rowIndex + 1, sheet.rows.length - 1), colIndex);
  } else if (event.key === 'ArrowUp') {
    event.preventDefault();
    setSelection(Math.max(rowIndex - 1, 0), colIndex);
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    setSelection(rowIndex, Math.min(colIndex + 1, sheet.columns.length - 1));
  } else if (event.key === 'ArrowLeft') {
    event.preventDefault();
    setSelection(rowIndex, Math.max(colIndex - 1, 0));
  }
});

commitButton.addEventListener('click', commitFormulaChange);
formulaInputEl.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    commitFormulaChange();
  }
});

explainButton.addEventListener('click', () => {
  toggleTooltip();
});

document.addEventListener('click', handleDocumentClick);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    toggleTooltip(false);
    closeImportDrawer();
  }
});

storeKeyButton.addEventListener('click', () => {
  const key = ensureKey();
  if (key) {
    modelStatusEl.textContent = 'Key stored. Refresh to pull the live catalog.';
  }
});

refreshModelsButton.addEventListener('click', () => {
  refreshModels();
});

modelSelectEl.addEventListener('change', () => {
  state.selectedModel = modelSelectEl.value;
  cacheModels();
  updateExplanation();
});

openImportButton.addEventListener('click', openImportDrawer);
closeImportButton.addEventListener('click', closeImportDrawer);
drawerBackdropEl.addEventListener('click', closeImportDrawer);
importForm.addEventListener('submit', handleImportSubmit);
clearImportButton.addEventListener('click', clearImport);

initialize();
