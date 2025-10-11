(function(){
  const el = id => document.getElementById(id);

  // View management
  const viewSetup = el('viewSetup');
  const viewChat = el('viewChat');
  const btnSetup = el('btnSetup');
  const btnChat = el('btnChat');
  const startBtn = el('startBtn');
  const themeToggle = el('themeToggle');
  const themeLabelEl = el('themeLabel');
  const themeIconEl = el('themeIcon');
  const THEME_KEY = 'cracktroThemeMode';
  const prefersDarkMedia = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  let themeTransitionTimer = 0;
  function applyThemeMode(mode,{store=true, animate=true}={}){
    const normalized = mode === 'dark' ? 'dark' : 'light';
    const bodyEl = document.body;
    bodyEl.dataset.theme = normalized;
    bodyEl.setAttribute('data-theme', normalized);
    if(animate){
      bodyEl.classList.add('theme-transition');
      if(themeTransitionTimer) window.clearTimeout(themeTransitionTimer);
      themeTransitionTimer = window.setTimeout(()=>{
        bodyEl.classList.remove('theme-transition');
      }, 650);
    }else{
      bodyEl.classList.remove('theme-transition');
    }
    if(store){
      try{ localStorage.setItem(THEME_KEY, normalized); }
      catch(_){ }
    }
    if(themeToggle){
      const isDark = normalized === 'dark';
      if(themeToggle.checked !== isDark) themeToggle.checked = isDark;
      themeToggle.setAttribute('aria-checked', isDark ? 'true' : 'false');
    }
    if(themeLabelEl){
      themeLabelEl.textContent = normalized === 'dark' ? 'Dark Mode' : 'Light Mode';
    }
    if(themeIconEl){
      themeIconEl.textContent = normalized === 'dark' ? '🌙' : '🌞';
    }
  }
  function getStoredTheme(){
    try{ return localStorage.getItem(THEME_KEY); }
    catch(_){ return null; }
  }
  const storedTheme = getStoredTheme();
  const hasStoredTheme = storedTheme === 'dark' || storedTheme === 'light';
  const prefersDark = prefersDarkMedia && prefersDarkMedia.matches;
  const fallbackTheme = document.body.dataset.theme === 'dark' ? 'dark' : 'light';
  const initialTheme = hasStoredTheme ? storedTheme : (prefersDark ? 'dark' : fallbackTheme);
  applyThemeMode(initialTheme, { store: hasStoredTheme, animate:false });
  if(themeToggle){
    themeToggle.checked = initialTheme === 'dark';
    themeToggle.setAttribute('aria-checked', themeToggle.checked ? 'true' : 'false');
    themeToggle.addEventListener('change', ()=>{
      applyThemeMode(themeToggle.checked ? 'dark' : 'light');
    });
  }
  if(prefersDarkMedia){
    const handlePrefChange = evt => {
      const storedPref = getStoredTheme();
      if(storedPref === 'dark' || storedPref === 'light') return;
      applyThemeMode(evt.matches ? 'dark' : 'light', { store:false });
    };
    if(typeof prefersDarkMedia.addEventListener === 'function'){
      prefersDarkMedia.addEventListener('change', handlePrefChange);
    }else if(typeof prefersDarkMedia.addListener === 'function'){
      prefersDarkMedia.addListener(handlePrefChange);
    }
  }
  const accordionItems = Array.from(document.querySelectorAll('[data-accordion-item]'));
  accordionItems.forEach((item, idx)=>{
    const header = item.querySelector('.accordion-header');
    if(!header) return;
    const isDefaultOpen = item.classList.contains('open') || idx===0;
    if(isDefaultOpen){
      item.classList.add('open');
      header.setAttribute('aria-expanded','true');
    }else{
      header.setAttribute('aria-expanded','false');
    }
    header.addEventListener('click', ()=>{
      const wasOpen = item.classList.contains('open');
      accordionItems.forEach(other=>{
        if(other===item) return;
        other.classList.remove('open');
        const h = other.querySelector('.accordion-header');
        if(h) h.setAttribute('aria-expanded','false');
      });
      if(wasOpen){
        item.classList.remove('open');
        header.setAttribute('aria-expanded','false');
      }else{
        item.classList.add('open');
        header.setAttribute('aria-expanded','true');
      }
    });
  });

  const wizardStepButtons = Array.from(document.querySelectorAll('.wizard-step-btn'));
  const wizardPanels = Array.from(document.querySelectorAll('.wizard-panel'));
  const wizardNextButtons = Array.from(document.querySelectorAll('.wizard-next'));
  const wizardPrevButtons = Array.from(document.querySelectorAll('.wizard-prev'));
  function setWizardStep(step){
    if(!wizardPanels.length) return;
    const total = wizardPanels.length;
    const clamped = Math.max(1, Math.min(total, step));
    wizardPanels.forEach(panel=>{
      const match = Number(panel.dataset.step) === clamped;
      panel.classList.toggle('active', match);
      panel.setAttribute('aria-hidden', match ? 'false' : 'true');
    });
    wizardStepButtons.forEach(btn=>{
      const match = Number(btn.dataset.step) === clamped;
      btn.classList.toggle('active', match);
      btn.setAttribute('aria-current', match ? 'step' : 'false');
    });
  }
  if(wizardPanels.length){
    setWizardStep(1);
    wizardStepButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        setWizardStep(Number(btn.dataset.step)||1);
      });
    });
    wizardNextButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const target = Number(btn.dataset.goto);
        setWizardStep(target || 1);
      });
    });
    wizardPrevButtons.forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const target = Number(btn.dataset.goto);
        setWizardStep(target || 1);
      });
    });
  }
  function showView(view){
    viewSetup.classList.toggle('active', view==='setup');
    viewChat.classList.toggle('active', view==='chat');
  }
  btnSetup.addEventListener('click', ()=>showView('setup'));
  btnChat.addEventListener('click', ()=>showView('chat'));

  // Elements
  const apiKeyEl = el('apiKey');
  const rememberKeyEl = el('rememberKey');
  const exchangesEl = el('exchanges');
  const temperatureEl = el('temperature');
  const tempValEl = el('tempVal');
  const modelEl = el('model');
  const customModelEl = el('customModel');
  const btnPaste = el('btnPaste');
  const refreshModelsBtn = el('refreshModels');
  const modelStatusEl = el('modelStatus');
  const builtinModelOptions = modelEl ? Array.from(modelEl.options).map(opt=>({ value: opt.value, label: opt.textContent })) : [];

  // Audio feedback for new messages
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioCtx;
  function ensureAudioCtx(){
    if(!AudioContextClass) return null;
    if(!audioCtx){
      try{ audioCtx = new AudioContextClass(); }
      catch(_){ audioCtx = null; return null; }
    }
    return audioCtx;
  }
  function resumeAudioIfNeeded(ctx){
    if(ctx && ctx.state === 'suspended'){
      try{ return ctx.resume(); }
      catch(_){ }
    }
    return null;
  }
  function primeAudio(){
    const ctx = ensureAudioCtx();
    if(!ctx) return;
    const resumed = resumeAudioIfNeeded(ctx);
    if(ctx.state === 'running'){
      document.removeEventListener('pointerdown', primeAudio);
      document.removeEventListener('keydown', primeAudio);
    }else if(resumed && typeof resumed.then === 'function'){
      resumed.then(()=>{
        if(ctx.state === 'running'){
          document.removeEventListener('pointerdown', primeAudio);
          document.removeEventListener('keydown', primeAudio);
        }
      }).catch(()=>{});
    }
  }
  if(AudioContextClass){
    document.addEventListener('pointerdown', primeAudio, { passive:true });
    document.addEventListener('keydown', primeAudio);
  }
  function playMessageSound(isA){
    const ctx = ensureAudioCtx();
    if(!ctx) return;
    if(ctx.state !== 'running'){
      const resumed = resumeAudioIfNeeded(ctx);
      if(resumed && typeof resumed.then === 'function'){
        resumed.then(()=>{
          if(ctx.state === 'running') playMessageSound(isA);
        }).catch(()=>{});
      }
      return;
    }
    try{
      const now = ctx.currentTime;
      const primary = ctx.createOscillator();
      const primaryGain = ctx.createGain();
      const base = isA ? 520 : 360;
      const glideTarget = isA ? base * 1.32 : Math.max(120, base * 0.54);
      primary.type = isA ? 'triangle' : 'sine';
      primary.frequency.setValueAtTime(base, now);
      primary.frequency.exponentialRampToValueAtTime(glideTarget, now + 0.32);
      primaryGain.gain.setValueAtTime(0.0001, now);
      primaryGain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
      primaryGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      primary.connect(primaryGain);
      primaryGain.connect(ctx.destination);
      primary.start(now);
      primary.stop(now + 0.38);

      const overtone = ctx.createOscillator();
      const overtoneGain = ctx.createGain();
      const overtoneBase = isA ? base * 2 : base * 0.82;
      overtone.type = isA ? 'sine' : 'triangle';
      overtone.frequency.setValueAtTime(overtoneBase, now);
      overtone.frequency.exponentialRampToValueAtTime(isA ? overtoneBase * 1.18 : Math.max(90, overtoneBase * 0.6), now + 0.22);
      overtoneGain.gain.setValueAtTime(0.0001, now);
      overtoneGain.gain.exponentialRampToValueAtTime(isA ? 0.07 : 0.05, now + 0.03);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      overtone.connect(overtoneGain);
      overtoneGain.connect(ctx.destination);
      overtone.start(now);
      overtone.stop(now + 0.28);
    }catch(_){ }
  }

  const nameAEl = el('nameA'), nameBEl = el('nameB');
  const emojiAEl = el('emojiA'), emojiBEl = el('emojiB');
  const colorAEl = el('colorA'), colorBEl = el('colorB');
  const promptAEl = el('promptA'), promptBEl = el('promptB');
  const chipAName = el('chipAName'), chipBName = el('chipBName');
  const chipAEmoji = el('chipAEmoji'), chipBEmoji = el('chipBEmoji');

  const convEl = el('conv');
  const extendBtn = el('extendBtn');
  const extendCountEl = el('extendCount');
  const moderatorMsgEl = el('moderatorMsg');
  const moderatorPrepromptEl = el('moderatorPreprompt');
  const presetScenarioEl = el('presetScenario');
  const applyScenarioBtn = el('applyScenario');
  const newBtn = el('newBtn');

  const presetAEl = el('presetA');
  const presetBEl = el('presetB');
  const applyPresetABtn = el('applyPresetA');
  const applyPresetBBtn = el('applyPresetB');
  const savePersonaABtn = el('savePersonaA');
  const savePersonaBBtn = el('savePersonaB');

  const generatorSeedEl = el('generatorSeed');
  const generateForABtn = el('generateForA');
  const generateForBBtn = el('generateForB');
  const swapGeneratorSeedBtn = el('swapGeneratorSeed');
  const generatorStatusEl = el('generatorStatus');
  const generatorTopicsEl = el('generatorTopics');

  const historyList = el('historyList');
  const refreshHistoryBtn = el('refreshHistory');
  const clearHistoryBtn = el('clearHistory');
  const chatHistoryList = el('chatHistoryList');
  const saveScenarioBtn = el('saveScenario');

  const summaryAName = el('summaryAName'), summaryBName = el('summaryBName');
  const summaryAEmoji = el('summaryAEmoji'), summaryBEmoji = el('summaryBEmoji');
  const summaryADetail = el('summaryADetail'), summaryBDetail = el('summaryBDetail');
  const summaryTopicText = el('summaryTopicText');
  const summaryTopicDetail = el('summaryTopicDetail');
  const reviewAName = el('reviewAName');
  const reviewAPrompt = el('reviewAPrompt');
  const reviewBName = el('reviewBName');
  const reviewBPrompt = el('reviewBPrompt');
  const reviewTopic = el('reviewTopic');
  const reviewTopicDetail = el('reviewTopicDetail');

  // Local storage for key
  const savedKey = localStorage.getItem('openaiKey');
  if(savedKey){ apiKeyEl.value = savedKey; rememberKeyEl.checked = true; }
  rememberKeyEl.addEventListener('change', ()=>{
    if(rememberKeyEl.checked && apiKeyEl.value){ localStorage.setItem('openaiKey', apiKeyEl.value); }
    else { localStorage.removeItem('openaiKey'); }
  });
  apiKeyEl.addEventListener('input', ()=>{
    if(rememberKeyEl.checked){ localStorage.setItem('openaiKey', apiKeyEl.value); }
  });
  btnPaste.addEventListener('click', async ()=>{
    try{
      const t = await navigator.clipboard.readText();
      if(t){ apiKeyEl.value = t.trim().replace(/\s+/g,''); if(rememberKeyEl.checked){ localStorage.setItem('openaiKey', apiKeyEl.value); } }
    }catch(e){ alert('Clipboard blocked. Long-press, then Paste.'); }
  });

  function setModelOptions(options, preserveValue){
    if(!modelEl) return;
    const previous = preserveValue !== undefined ? preserveValue : modelEl.value;
    modelEl.innerHTML = '';
    options.forEach(optData=>{
      const opt = document.createElement('option');
      opt.value = optData.value;
      opt.textContent = optData.label;
      modelEl.appendChild(opt);
    });
    const values = options.map(opt=>opt.value);
    if(previous && values.includes(previous)){
      modelEl.value = previous;
    }else if(options.length){
      modelEl.value = options[0].value;
    }
  }

  async function refreshModelList(){
    if(!refreshModelsBtn || !modelEl) return;
    if(!apiKeyEl.value){
      alert('Enter your API key before refreshing models.');
      return;
    }
    refreshModelsBtn.disabled = true;
    if(modelStatusEl) modelStatusEl.textContent = 'Fetching models…';
    const previousValue = modelEl.value;
    try{
      const res = await fetch('https://api.openai.com/v1/models',{
        headers:{ 'Authorization':'Bearer '+apiKeyEl.value.trim() }
      });
      if(!res.ok){
        const text = await res.text();
        throw new Error(text || res.statusText || 'Failed to fetch models');
      }
      const data = await res.json();
      const ids = Array.isArray(data.data) ? data.data.map(item=>item.id).filter(Boolean) : [];
      const uniqueIds = Array.from(new Set(ids)).filter(id=>typeof id==='string');
      uniqueIds.sort();
      if(uniqueIds.length){
        const options = uniqueIds.map(id=>({ value:id, label:id }));
        if(!options.some(opt=>opt.value==='custom')){
          options.push({ value:'custom', label:'Custom…' });
        }
        setModelOptions(options, previousValue);
        if(modelStatusEl) modelStatusEl.textContent = `Loaded ${uniqueIds.length} models.`;
      }else{
        setModelOptions(builtinModelOptions, previousValue);
        if(modelStatusEl) modelStatusEl.textContent = 'No models returned; showing defaults.';
      }
    }catch(err){
      console.error(err);
      if(modelStatusEl) modelStatusEl.textContent = 'Model refresh failed.';
      alert('Model refresh failed: '+err.message);
      setModelOptions(builtinModelOptions, previousValue);
    }finally{
      refreshModelsBtn.disabled = false;
    }
  }

  if(refreshModelsBtn) refreshModelsBtn.addEventListener('click', refreshModelList);

  // Temperature label
  const updateTemp = ()=> tempValEl.textContent = Number(temperatureEl.value).toFixed(1);
  temperatureEl.addEventListener('input', updateTemp);
  updateTemp();

  function updateSummary(){
    if(summaryAName){
      const name = nameAEl.value || 'Persona A';
      const emoji = (emojiAEl.value && emojiAEl.value.trim()) ? emojiAEl.value.trim() : '🅰️';
      summaryAName.textContent = name;
      if(summaryAEmoji) summaryAEmoji.textContent = emoji;
      if(summaryADetail) summaryADetail.textContent = promptAEl.value ? promptAEl.value : 'No persona prompt provided yet.';
      if(reviewAName) reviewAName.textContent = name;
      if(reviewAPrompt) reviewAPrompt.textContent = promptAEl.value ? promptAEl.value : 'No persona prompt provided yet.';
    }
    if(summaryBName){
      const name = nameBEl.value || 'Persona B';
      const emoji = (emojiBEl.value && emojiBEl.value.trim()) ? emojiBEl.value.trim() : '🅱️';
      summaryBName.textContent = name;
      if(summaryBEmoji) summaryBEmoji.textContent = emoji;
      if(summaryBDetail) summaryBDetail.textContent = promptBEl.value ? promptBEl.value : 'No persona prompt provided yet.';
      if(reviewBName) reviewBName.textContent = name;
      if(reviewBPrompt) reviewBPrompt.textContent = promptBEl.value ? promptBEl.value : 'No persona prompt provided yet.';
    }
    if(summaryTopicText){
      const topic = (moderatorPrepromptEl && moderatorPrepromptEl.value ? moderatorPrepromptEl.value.trim() : '');
      if(topic){
        summaryTopicText.textContent = topic.length>80 ? topic.slice(0,80)+'…' : topic;
        if(summaryTopicDetail) summaryTopicDetail.textContent = topic;
        if(reviewTopic) reviewTopic.textContent = topic.length>60 ? topic.slice(0,60)+'…' : topic;
        if(reviewTopicDetail) reviewTopicDetail.textContent = topic;
      }else{
        summaryTopicText.textContent = 'No topic set';
        if(summaryTopicDetail) summaryTopicDetail.textContent = 'Add a moderator preprompt to define the topic.';
        if(reviewTopic) reviewTopic.textContent = 'No topic set';
        if(reviewTopicDetail) reviewTopicDetail.textContent = 'Add a moderator preprompt to define the topic.';
      }
    }
  }

  // Live chips + emojis (fix)
  function syncChips(){
    chipAName.textContent = nameAEl.value || 'Persona A';
    chipBName.textContent = nameBEl.value || 'Persona B';
    chipAEmoji.textContent = (emojiAEl.value && emojiAEl.value.trim()) ? emojiAEl.value : '🅰️';
    chipBEmoji.textContent = (emojiBEl.value && emojiBEl.value.trim()) ? emojiBEl.value : '🅱️';
    updateSummary();
  }
  nameAEl.addEventListener('input', syncChips);
  nameBEl.addEventListener('input', syncChips);
  emojiAEl.addEventListener('input', syncChips);
  emojiBEl.addEventListener('input', syncChips);
  syncChips();
  if(moderatorPrepromptEl) moderatorPrepromptEl.addEventListener('input', updateSummary);
  updateSummary();

  const samplePersonas = Array.isArray(window.samplePersonas) ? window.samplePersonas : [];
  const sampleScenarios = Array.isArray(window.sampleScenarios) ? window.sampleScenarios : [];

  const SAVED_PERSONAS_KEY = 'personaChat.savedPersonas';
  const SAVED_SCENARIOS_KEY = 'personaChat.savedScenarios';

  function loadSavedList(key){
    try{
      const raw = localStorage.getItem(key);
      if(!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    }catch(_){
      return [];
    }
  }

  let savedPersonas = loadSavedList(SAVED_PERSONAS_KEY);
  let savedScenarios = loadSavedList(SAVED_SCENARIOS_KEY);

  function persistSavedPersonas(){
    try{ localStorage.setItem(SAVED_PERSONAS_KEY, JSON.stringify(savedPersonas)); }
    catch(_){ }
  }
  function persistSavedScenarios(){
    try{ localStorage.setItem(SAVED_SCENARIOS_KEY, JSON.stringify(savedScenarios)); }
    catch(_){ }
  }

  function populatePresetSelects(){
    const selects = [presetAEl, presetBEl];
    const hasAny = (samplePersonas.length + savedPersonas.length) > 0;
    selects.forEach(select=>{
      if(!select) return;
      select.innerHTML = '';
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = hasAny ? 'Choose a persona…' : 'No personas available';
      select.appendChild(blank);
      if(savedPersonas.length){
        const group = document.createElement('optgroup');
        group.label = 'Saved personas';
        savedPersonas.forEach(p=>{
          const opt = document.createElement('option');
          opt.value = 'saved:'+p.id;
          opt.textContent = p.label || p.name || 'Untitled persona';
          group.appendChild(opt);
        });
        select.appendChild(group);
      }
      if(samplePersonas.length){
        const group = document.createElement('optgroup');
        group.label = 'Sample personas';
        samplePersonas.forEach(p=>{
          const opt = document.createElement('option');
          opt.value = 'sample:'+p.id;
          opt.textContent = p.label || p.name || p.id;
          group.appendChild(opt);
        });
        select.appendChild(group);
      }
      select.disabled = !hasAny;
    });
    if(applyPresetABtn) applyPresetABtn.disabled = !hasAny;
    if(applyPresetBBtn) applyPresetBBtn.disabled = !hasAny;
  }

  populatePresetSelects();

  function populateScenarioSelect(){
    if(!presetScenarioEl) return;
    const hasAny = (sampleScenarios.length + savedScenarios.length) > 0;
    presetScenarioEl.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = hasAny ? 'Choose a scenario…' : 'No scenarios available';
    presetScenarioEl.appendChild(blank);
    if(savedScenarios.length){
      const group = document.createElement('optgroup');
      group.label = 'Saved scenarios';
      savedScenarios.forEach(s=>{
        const opt = document.createElement('option');
        opt.value = 'saved:'+s.id;
        opt.textContent = s.label || 'Untitled scenario';
        group.appendChild(opt);
      });
      presetScenarioEl.appendChild(group);
    }
    if(sampleScenarios.length){
      const group = document.createElement('optgroup');
      group.label = 'Sample scenarios';
      sampleScenarios.forEach(s=>{
        const opt = document.createElement('option');
        opt.value = 'sample:'+s.id;
        opt.textContent = s.label || s.id;
        group.appendChild(opt);
      });
      presetScenarioEl.appendChild(group);
    }
    presetScenarioEl.disabled = !hasAny;
    if(applyScenarioBtn) applyScenarioBtn.disabled = !hasAny;
  }

  populateScenarioSelect();

  function resolveScenarioByValue(value){
    if(!value) return null;
    if(value.startsWith('saved:')){
      const id = value.slice(6);
      return savedScenarios.find(s=>s.id===id) || null;
    }
    if(value.startsWith('sample:')){
      const id = value.slice(7);
      return sampleScenarios.find(s=>s.id===id) || null;
    }
    return sampleScenarios.find(s=>s.id===value) || savedScenarios.find(s=>s.id===value) || null;
  }

  function applyScenario(options){
    const skipAlert = options && options.skipAlert;
    if(!presetScenarioEl) return;
    const id = presetScenarioEl.value;
    if(!id){
      if(!skipAlert) alert('Pick a scenario to load.');
      return;
    }
    const scenario = resolveScenarioByValue(id);
    if(!scenario){
      if(!skipAlert) alert('Scenario not found.');
      return;
    }
    if(moderatorPrepromptEl) moderatorPrepromptEl.value = scenario.prompt || '';
    setGeneratorStatus(`Loaded scenario "${scenario.label || scenario.id}" into the moderator guidance.`, false);
    updateSummary();
  }

  if(applyScenarioBtn) applyScenarioBtn.addEventListener('click', ()=>applyScenario());
  if(presetScenarioEl) presetScenarioEl.addEventListener('change', ()=>applyScenario({ skipAlert:true }));

  function applyPreset(side){
    const select = side==='A' ? presetAEl : presetBEl;
    if(!select) return;
    const id = select.value;
    if(!id){
      alert('Pick a persona to load.');
      return;
    }
    let persona = null;
    let source = 'persona';
    if(id.startsWith('saved:')){
      const lookup = id.slice(6);
      persona = savedPersonas.find(p=>p.id===lookup) || null;
      source = 'saved persona';
    }else if(id.startsWith('sample:')){
      const lookup = id.slice(7);
      persona = samplePersonas.find(p=>p.id===lookup) || null;
      source = 'sample persona';
    }else{
      persona = samplePersonas.find(p=>p.id===id) || savedPersonas.find(p=>p.id===id) || null;
    }
    if(!persona){
      alert('Persona not found.');
      return;
    }
    if(side==='A'){
      nameAEl.value = persona.name || '';
      emojiAEl.value = persona.emoji || '';
      promptAEl.value = persona.prompt || '';
      if(persona.bubbleColor) colorAEl.value = persona.bubbleColor;
    }else{
      nameBEl.value = persona.name || '';
      emojiBEl.value = persona.emoji || '';
      promptBEl.value = persona.prompt || '';
      if(persona.bubbleColor) colorBEl.value = persona.bubbleColor;
    }
    syncChips();
    setGeneratorStatus(`Loaded ${source} "${persona.label || persona.name || persona.id}" for Persona ${side}.`, false);
  }

  if(applyPresetABtn) applyPresetABtn.addEventListener('click', ()=>applyPreset('A'));
  if(applyPresetBBtn) applyPresetBBtn.addEventListener('click', ()=>applyPreset('B'));

  function savePersonaLocal(side){
    const isA = side==='A';
    const nameField = isA ? nameAEl : nameBEl;
    const emojiField = isA ? emojiAEl : emojiBEl;
    const promptField = isA ? promptAEl : promptBEl;
    const colorField = isA ? colorAEl : colorBEl;
    if(!promptField){ return; }
    const promptValue = promptField.value;
    const trimmedPrompt = promptValue.trim();
    if(!trimmedPrompt){
      alert('Add a persona prompt before saving.');
      return;
    }
    const nameValue = nameField ? nameField.value.trim() : '';
    const emojiValue = emojiField ? emojiField.value.trim() : '';
    const bubbleValue = colorField ? colorField.value : '';
    const defaultLabel = nameValue || `Persona ${side}`;
    const labelInput = window.prompt('Label this saved persona', defaultLabel);
    if(!labelInput) return;
    const label = labelInput.trim();
    if(!label){
      alert('Persona label cannot be empty.');
      return;
    }
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
      label,
      name: nameValue,
      emoji: emojiValue,
      prompt: trimmedPrompt,
      bubbleColor: bubbleValue
    };
    savedPersonas.push(entry);
    persistSavedPersonas();
    populatePresetSelects();
    const select = isA ? presetAEl : presetBEl;
    if(select){
      select.value = 'saved:'+entry.id;
    }
    setGeneratorStatus(`Saved persona "${entry.label}" for Persona ${side}.`, false);
  }

  if(savePersonaABtn) savePersonaABtn.addEventListener('click', ()=>savePersonaLocal('A'));
  if(savePersonaBBtn) savePersonaBBtn.addEventListener('click', ()=>savePersonaLocal('B'));

  function saveScenarioLocal(){
    if(!moderatorPrepromptEl) return;
    const promptValue = moderatorPrepromptEl.value;
    const trimmed = promptValue.trim();
    if(!trimmed){
      alert('Add moderator guidance before saving a scenario.');
      return;
    }
    const defaultLabel = trimmed.length>60 ? trimmed.slice(0,60)+'…' : trimmed;
    const labelInput = window.prompt('Label this scenario', defaultLabel || 'Scenario');
    if(!labelInput) return;
    const label = labelInput.trim();
    if(!label){
      alert('Scenario label cannot be empty.');
      return;
    }
    const entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,8),
      label,
      prompt: trimmed
    };
    savedScenarios.push(entry);
    persistSavedScenarios();
    populateScenarioSelect();
    if(presetScenarioEl){
      presetScenarioEl.value = 'saved:'+entry.id;
    }
    setGeneratorStatus(`Saved scenario "${entry.label}" locally.`, false);
  }

  if(saveScenarioBtn) saveScenarioBtn.addEventListener('click', saveScenarioLocal);

  function swapPersonas(){
    const nameA = nameAEl.value, nameB = nameBEl.value;
    const emojiA = emojiAEl.value, emojiB = emojiBEl.value;
    const promptA = promptAEl.value, promptB = promptBEl.value;
    const colorA = colorAEl.value, colorB = colorBEl.value;

    nameAEl.value = nameB;
    nameBEl.value = nameA;
    emojiAEl.value = emojiB;
    emojiBEl.value = emojiA;
    promptAEl.value = promptB;
    promptBEl.value = promptA;
    colorAEl.value = colorB;
    colorBEl.value = colorA;
    syncChips();
  }

  if(swapGeneratorSeedBtn) swapGeneratorSeedBtn.addEventListener('click', ()=>{
    swapPersonas();
    setGeneratorStatus('Personas swapped.', false);
  });

  function setGeneratorBusy(flag){
    const targets = [generateForABtn, generateForBBtn, swapGeneratorSeedBtn];
    targets.forEach(btn=>{ if(btn) btn.disabled = flag; });
    if(generatorSeedEl) generatorSeedEl.disabled = flag;
  }

  function setGeneratorStatus(message, isError){
    if(!generatorStatusEl) return;
    generatorStatusEl.textContent = message;
    generatorStatusEl.style.color = isError ? '#b91c1c' : '';
  }

  function assignGeneratedPersona(side, data){
    const name = data.name || '';
    const emoji = data.emoji || '';
    const prompt = data.prompt || '';
    const bubble = data.bubbleColor || data.color || '';
    const topics = Array.isArray(data.topics) ? data.topics : [];
    if(side==='A'){
      if(name) nameAEl.value = name;
      if(emoji) emojiAEl.value = emoji;
      if(prompt) promptAEl.value = prompt;
      if(bubble && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bubble.trim())) colorAEl.value = bubble.trim();
    }else{
      if(name) nameBEl.value = name;
      if(emoji) emojiBEl.value = emoji;
      if(prompt) promptBEl.value = prompt;
      if(bubble && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(bubble.trim())) colorBEl.value = bubble.trim();
    }
    if(generatorTopicsEl){
      generatorTopicsEl.value = topics.length ? topics.join('\n') : '';
    }
    syncChips();
  }

  async function generatePersona(side){
    if(!apiKeyEl.value){ alert('Please enter your API key in Setup.'); return; }
    const seed = (generatorSeedEl && generatorSeedEl.value ? generatorSeedEl.value.trim() : '');
    if(!seed){ alert('Describe a theme, role, or mood to generate a persona.'); return; }
    setGeneratorBusy(true);
    setGeneratorStatus('Step 1/2: Drafting persona blueprint…', false);
    if(generatorTopicsEl) generatorTopicsEl.value = '';
    try{
      const blueprintText = await chatCompletion([
        { role:'system', content:'You are a persona concept architect. Respond ONLY with valid JSON.' },
        { role:'user', content:`Seed idea: ${seed}\n\nReturn a JSON object with the following keys:\n- name: imaginative persona name (if the seed requests an existing public figure or fictional character, use that canonical name exactly)\n- roleTagline: a short role or mission statement\n- emoji: a single emoji that matches the vibe\n- toneDescriptors: array of 3 short adjectives for the tone\n- signatureOpinions: array of 3 bold opinions the persona holds (ground them in canon if the seed references a known character)\n- communicationStyle: 2 sentences describing how they speak, mirroring any requested voice (e.g. \'Homer Simpson\' should speak like Homer)\n- suggestedColor: a hex color (e.g. #34d399) that fits the vibe.\n\nDo not invent a different persona than the one explicitly requested in the seed.` }
      ], 1.0);
      const blueprint = extractJSON(blueprintText);
      if(!blueprint){ throw new Error('Could not parse persona blueprint response.'); }
      setGeneratorStatus('Step 2/2: Expanding tone, opinions, and topics…', false);
      const detailText = await chatCompletion([
        { role:'system', content:'You turn persona blueprints into detailed chat persona prompts. Respond ONLY with valid JSON.' },
        { role:'user', content:`Seed request: ${seed}\nBlueprint data:\n${JSON.stringify(blueprint, null, 2)}\n\nReturn JSON with keys:\n- name\n- emoji\n- bubbleColor (hex, fallback to ${side==='A'?colorAEl.value:colorBEl.value})\n- prompt (concise instructions that include persona background, tone descriptors, signature opinions, and explicit guidance on response style. Make sure the prompt contains a clear line noting that the conversation partner already understands this is a playful portrayal and commanding the persona to stay fully in-character without ever volunteering disclaimers about not being the real individual.)\n- topics (array of 3-5 specific conversation topics related to the persona).\nThe prompt must explicitly instruct the assistant to speak in the voice that matches the seed (e.g. if asked for Homer Simpson, the prompt should make the assistant respond exactly like Homer Simpson with canon-consistent references).\nDo not include any statements about the assistant not being the real person.\nIf the seed named an existing character or person, ensure the name and characterization match that identity precisely, without substituting another persona.` }
      ], 1.0);
      const detail = extractJSON(detailText);
      if(!detail){ throw new Error('Could not parse persona detail response.'); }
      const reinforcementLine = 'The user already understands this is a playful portrayal; stay fully in-character and never mention you are not the real individual.';
      if(typeof detail.prompt === 'string'){
        const trimmedPrompt = detail.prompt.trim();
        const normalized = trimmedPrompt.toLowerCase();
        if(trimmedPrompt && (!normalized.includes('playful portrayal') || !normalized.includes('never mention you are not the real individual'))){
          detail.prompt = trimmedPrompt + '\n\n' + reinforcementLine;
        }else if(!trimmedPrompt){
          detail.prompt = reinforcementLine;
        }else{
          detail.prompt = trimmedPrompt;
        }
      }else{
        detail.prompt = reinforcementLine;
      }
      assignGeneratedPersona(side, detail);
      setGeneratorStatus(`Generated persona applied to Persona ${side}.`, false);
    }catch(err){
      console.error(err);
      setGeneratorStatus(`Generator error: ${err.message}`, true);
    }finally{
      setGeneratorBusy(false);
    }
  }

  if(generateForABtn) generateForABtn.addEventListener('click', ()=>generatePersona('A'));
  if(generateForBBtn) generateForBBtn.addEventListener('click', ()=>generatePersona('B'));

  // Conversation state
  let running = false;
  let messages = []; // { who:'A'|'B', text:string }
  let currentSessionId = null;

  // Helpers
  function clampTemp(v){
    const n = parseFloat(v);
    if(!isFinite(n)) return 1.0;
    return Math.min(2, Math.max(0, n));
  }

  async function chatCompletion(messages, tempOverride){
    const chosenModel = (modelEl.value==='custom' ? (customModelEl.value || 'gpt-5') : modelEl.value);
    const temperature = clampTemp(tempOverride ?? temperatureEl.value);
    const res = await fetch('https://api.openai.com/v1/chat/completions',{
      method:'POST',
      headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+apiKeyEl.value.trim() },
      body: JSON.stringify({ model: chosenModel, messages, temperature })
    });
    if(!res.ok){
      const t = await res.text();
      throw new Error(t);
    }
    const data = await res.json();
    const reply = ((data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'').trim();
    return reply;
  }

  function extractJSON(text){
    if(!text) return null;
    const trimmed = text.trim();
    try{ return JSON.parse(trimmed); }catch(_){ }
    const match = trimmed.match(/\{[\s\S]*\}/);
    if(match){
      try{ return JSON.parse(match[0]); }catch(_){ }
    }
    return null;
  }
  function transcript(){
    return messages.map(m=>{
      const name = m.who==='A' ? (nameAEl.value || 'Persona A') : (nameBEl.value || 'Persona B');
      const emoji = m.who==='A' ? (emojiAEl.value || '') : (emojiBEl.value || '');
      const label = (emoji ? emoji+' ' : '') + name;
      return label + ': ' + m.text;
    }).join('\n');
  }
  // UI builders
  function makeAvatar(side, emoji){
    const av = document.createElement('div');
    av.className = 'avatar ' + (side==='a'?'a':'b');
    av.textContent = (emoji && emoji.trim()) ? emoji : (side==='a'?'🅰️':'🅱️');
    return av;
  }
  function makeBubble(side, name, emoji, text, bgColor){
    const b = document.createElement('div');
    b.className = 'bubble';
    b.style.background = bgColor || '#fff';
    b.style.borderColor = side==='a' ? '#bfdbfe' : '#a7f3d0';
    const label = document.createElement('div');
    label.className = 'name';
    if(emoji && emoji.trim()){ const e = document.createElement('span'); e.textContent = emoji; label.appendChild(e); }
    const n = document.createElement('span'); n.textContent = name || (side==='a'?'Persona A':'Persona B');
    label.appendChild(n);
    const body = document.createElement('div');
    body.className = 'text';
    body.textContent = text;
    b.appendChild(label); b.appendChild(body);
    return b;
  }
  function appendMessage(who, name, emoji, text, options = {}){
    const row = document.createElement('div');
    const isA = who==='A';
    row.className = 'msg-row ' + (isA ? 'left' : 'right');
    row.style.setProperty('--bubble-glow', isA ? 'rgba(59,130,246,0.32)' : 'rgba(16,185,129,0.32)');
    const bg = isA ? colorAEl.value : colorBEl.value;
    if(isA){
      row.appendChild(makeAvatar('a', emoji));
      row.appendChild(makeBubble('a', name, emoji, text, bg));
    }else{
      row.appendChild(makeBubble('b', name, emoji, text, bg));
      row.appendChild(makeAvatar('b', emoji));
    }
    convEl.appendChild(row);
    const scrollToBottom = ()=>{ convEl.scrollTop = convEl.scrollHeight; };
    scrollToBottom();
    requestAnimationFrame(()=>{
      row.classList.add('animate-in');
      scrollToBottom();
    });
    if(!options.silent){
      playMessageSound(isA);
    }
  }
  function showTyping(side, name, emoji){
    const row = document.createElement('div');
    const isA = side==='A';
    row.className = 'msg-row ' + (isA ? 'left' : 'right');
    row.dataset.typing = '1';

    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.background = isA ? colorAEl.value : colorBEl.value;
    bubble.style.borderColor = isA ? '#bfdbfe' : '#a7f3d0';

    const label = document.createElement('div');
    label.className = 'name';
    if(emoji && emoji.trim()){ const e = document.createElement('span'); e.textContent = emoji; label.appendChild(e); }
    const n = document.createElement('span'); n.textContent = name || (isA?'Persona A':'Persona B');
    label.appendChild(n);

    const dots = document.createElement('div');
    dots.className = 'typing-dots';
    dots.innerHTML = '<span></span><span></span><span></span>';

    if(isA){ row.appendChild(makeAvatar('a', emoji)); row.appendChild(bubble); }
    else { row.appendChild(bubble); row.appendChild(makeAvatar('b', emoji)); }
    bubble.appendChild(label); bubble.appendChild(dots);

    convEl.appendChild(row);
    convEl.scrollTop = convEl.scrollHeight;
    return row;
  }
  function removeTyping(row){
    if(row && row.parentNode){ row.parentNode.removeChild(row); }
  }

  // API call for one persona turn
  async function personaTurn(current, moderatorNote){
    const isA = current==='A';
    const personaPrompt = isA ? promptAEl.value : promptBEl.value;
    const name = isA ? nameAEl.value : nameBEl.value;
    const emoji = isA ? emojiAEl.value : emojiBEl.value;

    const typingRow = showTyping(current, name, emoji);
    const temp = clampTemp(temperatureEl.value);

    const otherName = isA ? (nameBEl.value || 'Persona B') : (nameAEl.value || 'Persona A');
    const setupNote = moderatorPrepromptEl.value && moderatorPrepromptEl.value.trim() ? `Moderator setup note: ${moderatorPrepromptEl.value.trim()}\n\n` : '';
    const modLine = moderatorNote && moderatorNote.trim() ? `Moderator note: ${moderatorNote.trim()}\n\n` : '';
    const userContent = `${setupNote}${modLine}Context transcript so far:\n${transcript()}\n\nYou are ${name}${emoji ? ' ('+emoji+')' : ''}. Reply briefly to ${otherName}.`;

    try{
      const reply = await chatCompletion([
        { role:'system', content: personaPrompt },
        { role:'user', content: userContent }
      ], temp);
      removeTyping(typingRow);
      appendMessage(current, name, emoji, reply);
      messages.push({ who: current, text: reply });
      persistSession();
      return true;
    }catch(err){
      console.error(err);
      removeTyping(typingRow);
      appendMessage(current, name, emoji, '⚠️ API error: '+err.message);
      return false;
    }
  }

  async function runSegment(pairs, moderatorNote){
    if(!apiKeyEl.value){ alert('Please enter your API key in Setup.'); return; }
    if(!promptAEl.value || !promptBEl.value){ alert('Both personas need prompts.'); return; }
    if(running) return;
    running = true;

    let current = (messages.length % 2 === 0) ? 'A' : 'B'; // alternate; start with A on fresh chat
    for(let i=0;i<pairs*2;i++){
      const ok = await personaTurn(current, moderatorNote);
      if(!ok) break;
      current = (current==='A' ? 'B' : 'A');
    }

    running = false;
  }

  // Start Chat (new session)
  startBtn.addEventListener('click', ()=>{
    messages = [];
    convEl.innerHTML = '';
    currentSessionId = 'sess_'+Date.now();
    renderHistory();
    showView('chat');
    const pairs = Math.max(1, parseInt(exchangesEl.value)||1);
    runSegment(pairs, '');
  });

  // Extend
  extendBtn.addEventListener('click', ()=>{
    const pairs = Math.max(1, parseInt(extendCountEl.value)||1);
    runSegment(pairs, moderatorMsgEl.value || '');
  });

  // New chat (keep settings)
  newBtn.addEventListener('click', ()=>{
    if(messages.length>0 && !confirm('Start a new chat? Your current conversation is already saved automatically.')) return;
    messages = [];
    convEl.innerHTML = '';
    currentSessionId = 'sess_'+Date.now();
    renderHistory();
  });

  // Save conversation to memory
  function getMemory(){
    try{ return JSON.parse(localStorage.getItem('personaChat.sessions')||'[]'); }catch{ return []; }
  }
  function setMemory(arr){
    localStorage.setItem('personaChat.sessions', JSON.stringify(arr));
  }
  function ensureSessionId(){
    if(!currentSessionId) currentSessionId = 'sess_'+Date.now();
  }
  function buildSessionRecord(){
    ensureSessionId();
    return {
      id: currentSessionId,
      ts: Date.now(),
      a: { name: nameAEl.value, emoji: emojiAEl.value, prompt: promptAEl.value, color: colorAEl.value },
      b: { name: nameBEl.value, emoji: emojiBEl.value, prompt: promptBEl.value, color: colorBEl.value },
      model: (modelEl.value==='custom' ? (customModelEl.value || 'gpt-5') : modelEl.value),
      temperature: clampTemp(temperatureEl.value),
      messages: messages.slice(),
      moderatorPreprompt: moderatorPrepromptEl.value
    };
  }
  function persistSession(){
    if(!messages.length) return;
    const rec = buildSessionRecord();
    const all = getMemory();
    const idx = all.findIndex(s=>s.id===rec.id);
    if(idx>=0){
      all.splice(idx, 1);
    }
    all.unshift(rec);
    setMemory(all);
    renderHistory();
  }

  function formatHistoryTitle(rec){
    const aLabel = `${rec.a.emoji||''} ${rec.a.name||'Persona A'}`.trim();
    const bLabel = `${rec.b.emoji||''} ${rec.b.name||'Persona B'}`.trim();
    return `${aLabel} vs ${bLabel}`;
  }

  function renderHistoryList(container, records, variant){
    if(!container) return;
    container.innerHTML = '';
    if(!records.length){
      const empty = document.createElement('div');
      empty.className = variant==='chat' ? 'memory-empty muted' : 'muted';
      empty.textContent = 'No saved conversations yet.';
      container.appendChild(empty);
      return;
    }
    records.forEach(rec=>{
      if(variant==='chat'){
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'memory-item' + (rec.id===currentSessionId ? ' active' : '');
        const title = document.createElement('div');
        title.className = 'memory-title';
        title.textContent = formatHistoryTitle(rec);
        const meta = document.createElement('div');
        meta.className = 'memory-meta';
        meta.textContent = new Date(rec.ts).toLocaleString();
        btn.appendChild(title);
        btn.appendChild(meta);
        btn.addEventListener('click', ()=>loadSession(rec.id));
        container.appendChild(btn);
      }else{
        const item = document.createElement('div');
        item.className = 'hist-item' + (rec.id===currentSessionId ? ' active' : '');
        const left = document.createElement('div');
        left.className = 'hist-title';
        left.textContent = `${new Date(rec.ts).toLocaleString()} — ${formatHistoryTitle(rec)}`;
        const right = document.createElement('div');
        right.className = 'row';
        const btnLoad = document.createElement('button');
        btnLoad.className = 'btn light';
        btnLoad.textContent = 'Load';
        btnLoad.addEventListener('click', ()=>loadSession(rec.id));
        const btnDel = document.createElement('button');
        btnDel.className = 'btn warn';
        btnDel.textContent = 'Delete';
        btnDel.addEventListener('click', ()=>{
          if(!confirm('Delete this conversation?')) return;
          const arr = getMemory().filter(x=>x.id!==rec.id);
          setMemory(arr);
          renderHistory();
        });
        right.appendChild(btnLoad); right.appendChild(btnDel);
        item.appendChild(left); item.appendChild(right);
        container.appendChild(item);
      }
    });
  }

  // History list
  function renderHistory(){
    const all = getMemory();
    renderHistoryList(historyList, all, 'setup');
    renderHistoryList(chatHistoryList, all, 'chat');
  }
  function loadSession(id){
    const rec = getMemory().find(x=>x.id===id);
    if(!rec){ alert('Not found.'); return; }
    // Load settings
    nameAEl.value = rec.a.name || 'Persona A';
    emojiAEl.value = rec.a.emoji || '';
    promptAEl.value = rec.a.prompt || '';
    colorAEl.value = rec.a.color || '#ffffff';

    nameBEl.value = rec.b.name || 'Persona B';
    emojiBEl.value = rec.b.emoji || '';
    promptBEl.value = rec.b.prompt || '';
    colorBEl.value = rec.b.color || '#ffffff';

    if(rec.model){
      const opt = Array.from(modelEl.options).some(o=>o.value===rec.model);
      if(opt){ modelEl.value = rec.model; customModelEl.value=''; }
      else{ modelEl.value='custom'; customModelEl.value=rec.model; }
    }
    temperatureEl.value = rec.temperature ?? 1.0; updateTemp();
    moderatorPrepromptEl.value = rec.moderatorPreprompt || '';
    syncChips();

    // Load messages
    currentSessionId = rec.id;
    messages = rec.messages || [];
    convEl.innerHTML='';
    messages.forEach(m=>{
      const name = m.who==='A'? nameAEl.value : nameBEl.value;
      const emoji = m.who==='A'? emojiAEl.value : emojiBEl.value;
      appendMessage(m.who, name, emoji, m.text, { silent:true });
    });
    renderHistory();
    showView('chat');
  }

  refreshHistoryBtn.addEventListener('click', renderHistory);
  clearHistoryBtn.addEventListener('click', ()=>{
    if(!confirm('Clear ALL saved conversations?')) return;
    localStorage.removeItem('personaChat.sessions');
    renderHistory();
  });
  // initial history render
  renderHistory();
})();
