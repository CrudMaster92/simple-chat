(function(){
  const el = id => document.getElementById(id);

  // View management
  const viewSetup = el('viewSetup');
  const viewChat = el('viewChat');
  const btnSetup = el('btnSetup');
  const btnChat = el('btnChat');
  const startBtn = el('startBtn');
  const backToSetup = el('backToSetup');
  function showView(view){
    viewSetup.classList.toggle('active', view==='setup');
    viewChat.classList.toggle('active', view==='chat');
  }
  btnSetup.addEventListener('click', ()=>showView('setup'));
  btnChat.addEventListener('click', ()=>showView('chat'));
  backToSetup.addEventListener('click', ()=>showView('setup'));

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
  const newBtn = el('newBtn');
  const saveBtn = el('saveBtn');
  const copyBtn = el('copyBtn');

  const historyList = el('historyList');
  const refreshHistoryBtn = el('refreshHistory');
  const clearHistoryBtn = el('clearHistory');

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

  // Live chips + emojis (fix)
  function syncChips(){
    chipAName.textContent = nameAEl.value || 'Persona A';
    chipBName.textContent = nameBEl.value || 'Persona B';
    chipAEmoji.textContent = (emojiAEl.value && emojiAEl.value.trim()) ? emojiAEl.value : '🅰️';
    chipBEmoji.textContent = (emojiBEl.value && emojiBEl.value.trim()) ? emojiBEl.value : '🅱️';
  }
  nameAEl.addEventListener('input', syncChips);
  nameBEl.addEventListener('input', syncChips);
  emojiAEl.addEventListener('input', syncChips);
  emojiBEl.addEventListener('input', syncChips);
  syncChips();

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
  function transcript(){
    return messages.map(m=>{
      const name = m.who==='A' ? (nameAEl.value || 'Persona A') : (nameBEl.value || 'Persona B');
      const emoji = m.who==='A' ? (emojiAEl.value || '') : (emojiBEl.value || '');
      const label = (emoji ? emoji+' ' : '') + name;
      return label + ': ' + m.text;
    }).join('\n');
  }
  copyBtn.addEventListener('click', ()=>{
    navigator.clipboard.writeText(transcript());
    alert('Transcript copied.');
  });

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
    const chosenModel = (modelEl.value==='custom' ? (customModelEl.value || 'gpt-5') : modelEl.value);
    const temp = clampTemp(temperatureEl.value);

    const otherName = isA ? (nameBEl.value || 'Persona B') : (nameAEl.value || 'Persona A');
    const setupNote = moderatorPrepromptEl.value && moderatorPrepromptEl.value.trim() ? `Moderator setup note: ${moderatorPrepromptEl.value.trim()}\n\n` : '';
    const modLine = moderatorNote && moderatorNote.trim() ? `Moderator note: ${moderatorNote.trim()}\n\n` : '';
    const userContent = `${setupNote}${modLine}Context transcript so far:\n${transcript()}\n\nYou are ${name}${emoji ? ' ('+emoji+')' : ''}. Reply briefly to ${otherName}.`;

    try{
      const res = await fetch('https://api.openai.com/v1/chat/completions',{
        method:'POST',
        headers:{ 'Content-Type':'application/json','Authorization':'Bearer '+apiKeyEl.value.trim() },
        body: JSON.stringify({
          model: chosenModel,
          messages: [
            { role:'system', content: personaPrompt },
            { role:'user', content: userContent }
          ],
          temperature: temp
        })
      });
      if(!res.ok){
        const t = await res.text();
        throw new Error(t);
      }
      const data = await res.json();
      const reply = ((data.choices&&data.choices[0]&&data.choices[0].message&&data.choices[0].message.content)||'').trim();
      removeTyping(typingRow);
      appendMessage(current, name, emoji, reply);
      messages.push({ who: current, text: reply });
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
    copyBtn.disabled = true;

    let current = (messages.length % 2 === 0) ? 'A' : 'B'; // alternate; start with A on fresh chat
    for(let i=0;i<pairs*2;i++){
      const ok = await personaTurn(current, moderatorNote);
      if(!ok) break;
      current = (current==='A' ? 'B' : 'A');
    }

    running = false;
    copyBtn.disabled = messages.length===0;
  }

  // Start Chat (new session)
  startBtn.addEventListener('click', ()=>{
    messages = [];
    convEl.innerHTML = '';
    currentSessionId = 'sess_'+Date.now();
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
    if(messages.length>0 && !confirm('Start a new chat? (Current conversation will remain unsaved unless you Save.)')) return;
    messages = [];
    convEl.innerHTML = '';
    currentSessionId = 'sess_'+Date.now();
  });

  // Save conversation to memory
  function getMemory(){
    try{ return JSON.parse(localStorage.getItem('personaChat.sessions')||'[]'); }catch{ return []; }
  }
  function setMemory(arr){
    localStorage.setItem('personaChat.sessions', JSON.stringify(arr));
  }
  function saveCurrent(){
    if(!messages.length){ alert('Nothing to save yet.'); return; }
    const rec = {
      id: currentSessionId || ('sess_'+Date.now()),
      ts: Date.now(),
      a: { name: nameAEl.value, emoji: emojiAEl.value, prompt: promptAEl.value, color: colorAEl.value },
      b: { name: nameBEl.value, emoji: emojiBEl.value, prompt: promptBEl.value, color: colorBEl.value },
      model: (modelEl.value==='custom' ? (customModelEl.value || 'gpt-5') : modelEl.value),
      temperature: clampTemp(temperatureEl.value),
      messages,
      moderatorPreprompt: moderatorPrepromptEl.value
    };
    currentSessionId = rec.id;
    const all = getMemory();
    const idx = all.findIndex(s=>s.id===rec.id);
    if(idx>=0) all[idx]=rec; else all.unshift(rec);
    setMemory(all);
    alert('Conversation saved.');
    renderHistory();
  }
  saveBtn.addEventListener('click', saveCurrent);

  // History list
  function renderHistory(){
    const all = getMemory();
    historyList.innerHTML = '';
    if(!all.length){
      const p = document.createElement('div');
      p.className = 'muted';
      p.textContent = 'No saved conversations yet.';
      historyList.appendChild(p);
      return;
    }
    all.forEach(rec=>{
      const item = document.createElement('div');
      item.className = 'hist-item';
      const left = document.createElement('div');
      left.className = 'hist-title';
      const d = new Date(rec.ts);
      const aLabel = `${rec.a.emoji||''} ${rec.a.name||'Persona A'}`.trim();
      const bLabel = `${rec.b.emoji||''} ${rec.b.name||'Persona B'}`.trim();
      left.textContent = `${d.toLocaleString()} — ${aLabel} vs ${bLabel}`;
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
      historyList.appendChild(item);
    });
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
    copyBtn.disabled = messages.length===0;
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
