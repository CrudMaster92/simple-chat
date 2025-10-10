(function(){
  const el = id => document.getElementById(id);

  // View management
  const viewSetup = el('viewSetup');
  const viewChat = el('viewChat');
  const btnSetup = el('btnSetup');
  const btnChat = el('btnChat');
  const startBtn = el('startBtn');
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
  const scenarioPreviewEl = el('scenarioPreview');
  const newBtn = el('newBtn');

  const presetAEl = el('presetA');
  const presetBEl = el('presetB');
  const applyPresetABtn = el('applyPresetA');
  const applyPresetBBtn = el('applyPresetB');

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

  const summaryAName = el('summaryAName'), summaryBName = el('summaryBName');
  const summaryAEmoji = el('summaryAEmoji'), summaryBEmoji = el('summaryBEmoji');
  const summaryADetail = el('summaryADetail'), summaryBDetail = el('summaryBDetail');
  const summaryTopicText = el('summaryTopicText');
  const summaryTopicDetail = el('summaryTopicDetail');

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
    }
    if(summaryBName){
      const name = nameBEl.value || 'Persona B';
      const emoji = (emojiBEl.value && emojiBEl.value.trim()) ? emojiBEl.value.trim() : '🅱️';
      summaryBName.textContent = name;
      if(summaryBEmoji) summaryBEmoji.textContent = emoji;
      if(summaryBDetail) summaryBDetail.textContent = promptBEl.value ? promptBEl.value : 'No persona prompt provided yet.';
    }
    if(summaryTopicText){
      const topic = (moderatorPrepromptEl && moderatorPrepromptEl.value ? moderatorPrepromptEl.value.trim() : '');
      if(topic){
        summaryTopicText.textContent = topic.length>80 ? topic.slice(0,80)+'…' : topic;
        if(summaryTopicDetail) summaryTopicDetail.textContent = topic;
      }else{
        summaryTopicText.textContent = 'No topic set';
        if(summaryTopicDetail) summaryTopicDetail.textContent = 'Add a moderator preprompt to define the topic.';
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

  function populatePresetSelects(){
    const selects = [presetAEl, presetBEl];
    selects.forEach(select=>{
      if(!select) return;
      select.innerHTML = '';
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = samplePersonas.length ? 'Choose a sample persona…' : 'No sample personas available';
      select.appendChild(blank);
      samplePersonas.forEach(p=>{
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.label || p.name || p.id;
        select.appendChild(opt);
      });
      select.disabled = samplePersonas.length===0;
    });
    if(applyPresetABtn) applyPresetABtn.disabled = samplePersonas.length===0;
    if(applyPresetBBtn) applyPresetBBtn.disabled = samplePersonas.length===0;
  }

  populatePresetSelects();

  function populateScenarioSelect(){
    if(!presetScenarioEl) return;
    presetScenarioEl.innerHTML = '';
    const blank = document.createElement('option');
    blank.value = '';
    blank.textContent = sampleScenarios.length ? 'Choose a sample scenario…' : 'No sample scenarios available';
    presetScenarioEl.appendChild(blank);
    sampleScenarios.forEach(s=>{
      const opt = document.createElement('option');
      opt.value = s.id;
      opt.textContent = s.label || s.id;
      presetScenarioEl.appendChild(opt);
    });
    presetScenarioEl.disabled = sampleScenarios.length===0;
    if(applyScenarioBtn) applyScenarioBtn.disabled = sampleScenarios.length===0;
    if(scenarioPreviewEl) scenarioPreviewEl.value = '';
  }

  populateScenarioSelect();

  function updateScenarioPreview(){
    if(!scenarioPreviewEl) return;
    const id = presetScenarioEl ? presetScenarioEl.value : '';
    if(!id){
      scenarioPreviewEl.value = '';
      return;
    }
    const scenario = sampleScenarios.find(s=>s.id===id);
    scenarioPreviewEl.value = scenario ? (scenario.prompt || '') : '';
  }

  if(presetScenarioEl) presetScenarioEl.addEventListener('change', updateScenarioPreview);

  function applyScenario(){
    if(!presetScenarioEl) return;
    const id = presetScenarioEl.value;
    if(!id){
      alert('Pick a sample scenario to load.');
      return;
    }
    const scenario = sampleScenarios.find(s=>s.id===id);
    if(!scenario){
      alert('Sample scenario not found.');
      return;
    }
    if(moderatorPrepromptEl) moderatorPrepromptEl.value = scenario.prompt || '';
    if(scenarioPreviewEl) scenarioPreviewEl.value = scenario.prompt || '';
    setGeneratorStatus(`Loaded sample scenario "${scenario.label || scenario.id}" into the moderator preprompt.`, false);
    updateSummary();
  }

  if(applyScenarioBtn) applyScenarioBtn.addEventListener('click', applyScenario);

  function applyPreset(side){
    const select = side==='A' ? presetAEl : presetBEl;
    const button = side==='A' ? applyPresetABtn : applyPresetBBtn;
    if(!select || !button) return;
    const id = select.value;
    if(!id){
      alert('Pick a sample persona to load.');
      return;
    }
    const persona = samplePersonas.find(p=>p.id===id);
    if(!persona){
      alert('Sample persona not found.');
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
    setGeneratorStatus(`Loaded sample persona "${persona.label || persona.name || persona.id}" for Persona ${side}.`, false);
  }

  if(applyPresetABtn) applyPresetABtn.addEventListener('click', ()=>applyPreset('A'));
  if(applyPresetBBtn) applyPresetBBtn.addEventListener('click', ()=>applyPreset('B'));

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
        { role:'user', content:`Seed idea: ${seed}\n\nReturn a JSON object with the following keys:\n- name: imaginative persona name\n- roleTagline: a short role or mission statement\n- emoji: a single emoji that matches the vibe\n- toneDescriptors: array of 3 short adjectives for the tone\n- signatureOpinions: array of 3 bold opinions the persona holds\n- communicationStyle: 2 sentences describing how they speak\n- suggestedColor: a hex color (e.g. #34d399) that fits the vibe.` }
      ], 1.0);
      const blueprint = extractJSON(blueprintText);
      if(!blueprint){ throw new Error('Could not parse persona blueprint response.'); }
      setGeneratorStatus('Step 2/2: Expanding tone, opinions, and topics…', false);
      const detailText = await chatCompletion([
        { role:'system', content:'You turn persona blueprints into detailed chat persona prompts. Respond ONLY with valid JSON.' },
        { role:'user', content:`Blueprint data:\n${JSON.stringify(blueprint, null, 2)}\n\nReturn JSON with keys:\n- name\n- emoji\n- bubbleColor (hex, fallback to ${side==='A'?colorAEl.value:colorBEl.value})\n- prompt (concise instructions that include persona background, tone descriptors, signature opinions, and explicit guidance on response style)\n- topics (array of 3-5 specific conversation topics related to the persona).\nThe prompt should describe how the persona responds, mention the tone, cite their core opinions, and explain how they engage with others.` }
      ], 1.0);
      const detail = extractJSON(detailText);
      if(!detail){ throw new Error('Could not parse persona detail response.'); }
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
    if(!isFinite(n)) return 0.7;
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
  function appendMessage(who, name, emoji, text){
    const row = document.createElement('div');
    const isA = who==='A';
    row.className = 'msg-row ' + (isA ? 'left' : 'right');
    const bg = isA ? colorAEl.value : colorBEl.value;
    if(isA){
      row.appendChild(makeAvatar('a', emoji));
      row.appendChild(makeBubble('a', name, emoji, text, bg));
    }else{
      row.appendChild(makeBubble('b', name, emoji, text, bg));
      row.appendChild(makeAvatar('b', emoji));
    }
    convEl.appendChild(row);
    convEl.scrollTop = convEl.scrollHeight;
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
    temperatureEl.value = rec.temperature ?? 0.7; updateTemp();
    moderatorPrepromptEl.value = rec.moderatorPreprompt || '';
    syncChips();

    // Load messages
    currentSessionId = rec.id;
    messages = rec.messages || [];
    convEl.innerHTML='';
    messages.forEach(m=>{
      const name = m.who==='A'? nameAEl.value : nameBEl.value;
      const emoji = m.who==='A'? emojiAEl.value : emojiBEl.value;
      appendMessage(m.who, name, emoji, m.text);
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
