/* ============================================
   PAINEL DE CONTROLE v3.0 - Tabs + Presets
   Maratona Mineira de Programação
   ============================================ */

const socket = io();
let selectedColor = '#FF3366';
let activeLiveToggles = {};

// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================

const SETTINGS_KEY = 'broadcast_settings';

function getSettings() {
  try { return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {}; }
  catch (e) { return {}; }
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

function loadSettings() {
  const s = getSettings();
  if (s.marathonName) {
    document.getElementById('global-marathon-name').value = s.marathonName;
    updateMarathonName();
  }
}

function updateMarathonName() {
  const name = document.getElementById('global-marathon-name').value.trim();
  if (!name) return;
  const s = getSettings();
  s.marathonName = name;
  saveSettings(s);
  // Atualiza header
  document.getElementById('header-marathon-name').textContent = name;
  // Envia para o display
  socket.emit('update-settings', { marathonName: name });
  toast('⚙️ Nome da maratona atualizado!', 'success');
}

// Indicador AO VIVO
function setLiveIndicator(id, active) {
  activeLiveToggles[id] = active;
  const dot = document.getElementById('live-' + id);
  if (dot) {
    if (active) dot.classList.add('active');
    else dot.classList.remove('active');
  }
}

// ============================================
// CONEXÃO
// ============================================

const statusEl = document.getElementById('connection-status');
socket.on('connect', () => {
  statusEl.classList.add('connected');
  statusEl.querySelector('.status-text').textContent = 'Conectado';
  loadAllPresets();
});
socket.on('disconnect', () => {
  statusEl.classList.remove('connected');
  statusEl.querySelector('.status-text').textContent = 'Desconectado';
});

// ============================================
// TABS
// ============================================

function switchTab(name) {
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector(`.tab-btn[onclick*="${name}"]`).classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
}

// ============================================
// CORES GLOBAIS
// ============================================

function applyGlobalColors() {
  const g = (id) => document.getElementById('global-' + id).value;
  const logoUrl = document.getElementById('global-logo-url').value.trim();

  // Pessoas
  setVal('lt-top-bg', g('top-bg')); setVal('lt-bottom-bg', g('bottom-bg'));
  setVal('lt-logo-bg', g('logo-bg')); setVal('lt-name-color', g('name-color'));
  setVal('lt-role-color', g('role-color')); setVal('lt-geo1', g('geo1'));
  setVal('lt-geo2', g('geo2')); setVal('lt-logo-url', logoUrl);

  // Time
  setVal('team-lt-top-bg', g('top-bg')); setVal('team-lt-bottom-bg', g('bottom-bg'));
  setVal('team-lt-logo-bg', g('logo-bg')); setVal('team-lt-name-color', g('name-color'));
  setVal('team-lt-members-color', g('role-color')); setVal('team-lt-logo', logoUrl);

  // Barra
  setVal('sports-top-bg', g('top-bg')); setVal('sports-bottom-bg', g('bottom-bg'));
  setVal('sports-logo-bg', g('logo-bg')); setVal('sports-top-text', g('name-color'));
  setVal('sports-bottom-text', g('role-color')); setVal('sports-geo1', g('geo1'));
  setVal('sports-geo2', g('geo2')); setVal('sports-logo-url', logoUrl);

  toast('🎨 Cores globais aplicadas!', 'success');
}

function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

// ============================================
// PRESETS (sistema unificado por tipo)
// ============================================

function presetKey(type) { return 'broadcast_preset_' + type; }

function getPresets(type) {
  try { return JSON.parse(localStorage.getItem(presetKey(type))) || []; }
  catch (e) { return []; }
}

function savePresetsArr(type, arr) {
  localStorage.setItem(presetKey(type), JSON.stringify(arr));
  loadPresetDropdown(type);
}

function loadPresetDropdown(type) {
  const select = document.getElementById('preset-' + type);
  if (!select) return;
  const presets = getPresets(type);
  select.innerHTML = '<option value="">-- Preset --</option>';
  presets.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.label;
    select.appendChild(opt);
  });
}

function loadAllPresets() {
  ['pessoas', 'time', 'barra', 'medaltable', 'problemstats'].forEach(loadPresetDropdown);
  initProblems();
  renderScoreboardManager();
  renderMedalEditor();
  renderProblemStatsEditor();
  loadSettings();
  loadYTConfig();
  renderYTFavorites();
  injectLiveDots();
}

// Injeta bolinhas AO VIVO ao lado de cada toggle
function injectLiveDots() {
  const toggles = {
    'lt-left-toggle': 'lt-left',
    'lt-right-toggle': 'lt-right',
    'team-lt-toggle': 'team-lt',
    'sports-lt-toggle': 'sports-lt',
    'problem-lt-toggle': 'problem-lt',
    'medaltable-toggle': 'medal-table',
    'problemstats-toggle': 'problem-stats',
    'yt-chat-toggle': 'yt-chat',
    'comment-display-toggle': 'comment-display'
  };
  Object.entries(toggles).forEach(([checkboxId, liveId]) => {
    const cb = document.getElementById(checkboxId);
    if (!cb) return;
    // Remove dot anterior se existir
    const existing = document.getElementById('live-' + liveId);
    if (existing) existing.remove();
    // Cria nova dot
    const dot = document.createElement('span');
    dot.id = 'live-' + liveId;
    dot.className = 'live-dot';
    cb.parentElement.parentElement.appendChild(dot);
  });
}

// --- Salvar ---

function savePreset(type) {
  const label = prompt('Nome do preset:');
  if (!label) return;

  let data = { label };

  if (type === 'pessoas') {
    data.leftName = document.getElementById('lt-left-name').value.trim();
    data.leftRole = document.getElementById('lt-left-role').value.trim();
    data.rightName = document.getElementById('lt-right-name').value.trim();
    data.rightRole = document.getElementById('lt-right-role').value.trim();
    data.colors = {
      topBg: document.getElementById('lt-top-bg').value,
      bottomBg: document.getElementById('lt-bottom-bg').value,
      logoBg: document.getElementById('lt-logo-bg').value,
      nameColor: document.getElementById('lt-name-color').value,
      roleColor: document.getElementById('lt-role-color').value,
      geo1: document.getElementById('lt-geo1').value,
      geo2: document.getElementById('lt-geo2').value,
      logoUrl: document.getElementById('lt-logo-url').value.trim()
    };
  } else if (type === 'time') {
    data.teamName = document.getElementById('team-lt-name').value.trim();
    data.m1 = document.getElementById('team-lt-m1').value.trim();
    data.m2 = document.getElementById('team-lt-m2').value.trim();
    data.m3 = document.getElementById('team-lt-m3').value.trim();
    data.colors = {
      topBg: document.getElementById('team-lt-top-bg').value,
      bottomBg: document.getElementById('team-lt-bottom-bg').value,
      logoBg: document.getElementById('team-lt-logo-bg').value,
      nameColor: document.getElementById('team-lt-name-color').value,
      membersColor: document.getElementById('team-lt-members-color').value,
      logoUrl: document.getElementById('team-lt-logo').value.trim()
    };
  } else if (type === 'problemstats') {
    data.rows = getProblemStats();
  } else if (type === 'medaltable') {
    data.rows = getMedalRows();
  } else if (type === 'barra') {
    data.titleText = document.getElementById('sports-title').value.trim();
    data.subtitleText = document.getElementById('sports-subtitle').value.trim();
    data.colors = {
      topBg: document.getElementById('sports-top-bg').value,
      bottomBg: document.getElementById('sports-bottom-bg').value,
      logoBg: document.getElementById('sports-logo-bg').value,
      topText: document.getElementById('sports-top-text').value,
      bottomText: document.getElementById('sports-bottom-text').value,
      geo1: document.getElementById('sports-geo1').value,
      geo2: document.getElementById('sports-geo2').value,
      logoUrl: document.getElementById('sports-logo-url').value.trim()
    };
  }

  const presets = getPresets(type);
  presets.push(data);
  savePresetsArr(type, presets);
  toast(`💾 "${label}" salvo!`, 'success');
}

// --- Carregar ---

function loadPreset(type) {
  const select = document.getElementById('preset-' + type);
  const idx = select.value;
  if (idx === '') return;

  const presets = getPresets(type);
  const p = presets[parseInt(idx)];
  if (!p) return;

  if (type === 'pessoas') {
    setVal('lt-left-name', p.leftName || ''); setVal('lt-left-role', p.leftRole || '');
    setVal('lt-right-name', p.rightName || ''); setVal('lt-right-role', p.rightRole || '');
    if (p.colors) loadColors(p.colors, { top:'lt-top-bg', bottom:'lt-bottom-bg', logo:'lt-logo-bg',
      name:'lt-name-color', role:'lt-role-color', geo1:'lt-geo1', geo2:'lt-geo2', logoUrl:'lt-logo-url',
      topText:'', bottomText:'' });
  } else if (type === 'time') {
    setVal('team-lt-name', p.teamName || '');
    setVal('team-lt-m1', p.m1 || ''); setVal('team-lt-m2', p.m2 || ''); setVal('team-lt-m3', p.m3 || '');
    if (p.colors) loadColors(p.colors, { top:'team-lt-top-bg', bottom:'team-lt-bottom-bg', logo:'team-lt-logo-bg',
      name:'team-lt-name-color', role:'team-lt-members-color', logoUrl:'team-lt-logo' });
  } else if (type === 'problemstats') {
    if (p.rows) { localStorage.setItem(PROBLEMSTATS_KEY, JSON.stringify(p.rows)); renderProblemStatsEditor(); }
  } else if (type === 'medaltable') {
    if (p.rows) { localStorage.setItem(MEDALTABLE_KEY, JSON.stringify(p.rows)); renderMedalEditor(); }
  } else if (type === 'barra') {
    setVal('sports-title', p.titleText || ''); setVal('sports-subtitle', p.subtitleText || '');
    if (p.colors) loadColors(p.colors, { top:'sports-top-bg', bottom:'sports-bottom-bg', logo:'sports-logo-bg',
      name:'sports-top-text', role:'sports-bottom-text', geo1:'sports-geo1', geo2:'sports-geo2', logoUrl:'sports-logo-url' });
  }

  toast(`📋 "${p.label}" carregado!`, 'success');
}

function loadColors(c, ids) {
  if (c.topBg && ids.top) setVal(ids.top, c.topBg);
  if (c.bottomBg && ids.bottom) setVal(ids.bottom, c.bottomBg);
  if (c.logoBg && ids.logo) setVal(ids.logo, c.logoBg);
  if (c.nameColor && ids.name) setVal(ids.name, c.nameColor);
  if (c.roleColor && ids.role) setVal(ids.role, c.roleColor);
  if (c.membersColor && ids.role) setVal(ids.role, c.membersColor);
  if (c.topText && ids.name) setVal(ids.name, c.topText);
  if (c.bottomText && ids.role) setVal(ids.role, c.bottomText);
  if (c.geo1 && ids.geo1) setVal(ids.geo1, c.geo1);
  if (c.geo2 && ids.geo2) setVal(ids.geo2, c.geo2);
  if (c.logoUrl !== undefined && ids.logoUrl) setVal(ids.logoUrl, c.logoUrl);
}

// --- Deletar ---

function deletePreset(type) {
  const select = document.getElementById('preset-' + type);
  const idx = select.value;
  if (idx === '') { toast('Selecione um preset!', 'error'); return; }
  const presets = getPresets(type);
  const p = presets[parseInt(idx)];
  if (!confirm(`Deletar "${p.label}"?`)) return;
  presets.splice(parseInt(idx), 1);
  savePresetsArr(type, presets);
  toast('🗑 Deletado!', 'success');
}

// ============================================
// SELEÇÃO DE COR (balão)
// ============================================

function selectColor(btn) {
  document.querySelectorAll('.color-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selectedColor = btn.dataset.color;
}

// ============================================
// MEDALHA
// ============================================

function triggerMedal() {
  const input = document.getElementById('medal-team');
  const teamName = input.value.trim();
  if (!teamName) { toast('Digite o nome do time!', 'error'); input.focus(); return; }
  const medalType = document.getElementById('medal-type').value;
  const position = document.getElementById('medal-position').value;
  socket.emit('trigger-medal', { teamName, medalType, position });
  toast(`🏅 Medalha: ${teamName}`, 'success');
  input.value = '';
}

// ============================================
// BALÃO
// ============================================

function triggerBalloon() {
  const input = document.getElementById('balloon-team');
  const teamName = input.value.trim();
  if (!teamName) { toast('Digite o nome do time!', 'error'); input.focus(); return; }
  socket.emit('trigger-balloon', { teamName, color: selectedColor });
  toast(`🎈 Balão: ${teamName}`, 'success');
  input.value = '';
}

// ============================================
// ALERTAS
// ============================================

function triggerAlert(type, message) { socket.emit('trigger-alert', { type, message }); }

function triggerCustomAlert() {
  const message = document.getElementById('alert-message').value.trim();
  if (!message) { toast('Digite uma mensagem!', 'error'); return; }
  socket.emit('trigger-alert', { type: 'accepted', message });
  toast('📢 ' + message, 'success');
  document.getElementById('alert-message').value = '';
}

// ============================================
// LOWER THIRDS (Pessoas)
// ============================================

function getLowerThirdOptions() {
  return {
    topBgColor: document.getElementById('lt-top-bg').value,
    bottomBgColor: document.getElementById('lt-bottom-bg').value,
    logoBgColor: document.getElementById('lt-logo-bg').value,
    nameColor: document.getElementById('lt-name-color').value,
    roleColor: document.getElementById('lt-role-color').value,
    geoColor1: document.getElementById('lt-geo1').value,
    geoColor2: document.getElementById('lt-geo2').value,
    logoUrl: document.getElementById('lt-logo-url').value.trim()
  };
}

function triggerLowerThird(side) {
  const name = document.getElementById(`lt-${side}-name`).value.trim();
  const role = document.getElementById(`lt-${side}-role`).value.trim();
  if (!name) { toast('Digite o nome!', 'error'); return; }
  if (!role) { toast('Digite a função!', 'error'); return; }
  socket.emit('show-lowerthird', { side, name, role, options: getLowerThirdOptions() });
  toast(`📺 ${name}`, 'success');
}

function toggleLowerThird(side, active) {
  if (active) { triggerLowerThird(side); setLiveIndicator('lt-' + side, true); }
  else { hideLowerThird(side); setLiveIndicator('lt-' + side, false); }
}

function hideLowerThird(side) {
  socket.emit('hide-lowerthird', { side });
  document.getElementById(`lt-${side}-toggle`).checked = false;
}

function applyBothLTs() {
  const leftName = document.getElementById('lt-left-name').value.trim();
  const leftRole = document.getElementById('lt-left-role').value.trim();
  const rightName = document.getElementById('lt-right-name').value.trim();
  const rightRole = document.getElementById('lt-right-role').value.trim();
  if (!leftName && !rightName) { toast('Preencha ao menos um lado!', 'error'); return; }
  const options = getLowerThirdOptions();
  if (leftName || leftRole) {
    socket.emit('show-lowerthird', { side: 'left', name: leftName || '', role: leftRole || '', options });
    document.getElementById('lt-left-toggle').checked = true;
  }
  if (rightName || rightRole) {
    socket.emit('show-lowerthird', { side: 'right', name: rightName || '', role: rightRole || '', options });
    document.getElementById('lt-right-toggle').checked = true;
  }
  toast('📺 LTs atualizados!', 'success');
}

// ============================================
// LT DE COMPETIDORES (Time)
// ============================================

function applyTeamLT() {
  const teamName = document.getElementById('team-lt-name').value.trim();
  if (!teamName) { toast('Digite o nome do time!', 'error'); return; }
  const options = {
    logoBgColor: document.getElementById('team-lt-logo-bg').value,
    topBgColor: document.getElementById('team-lt-top-bg').value,
    bottomBgColor: document.getElementById('team-lt-bottom-bg').value,
    nameColor: document.getElementById('team-lt-name-color').value,
    membersColor: document.getElementById('team-lt-members-color').value,
    geoColor1: '#FF1493', geoColor2: '#FFD700',
    logoUrl: document.getElementById('team-lt-logo').value.trim()
  };
  const m1 = document.getElementById('team-lt-m1').value.trim();
  const m2 = document.getElementById('team-lt-m2').value.trim();
  const m3 = document.getElementById('team-lt-m3').value.trim();
  socket.emit('trigger-team-lt', { teamName, m1, m2, m3, options });
  document.getElementById('team-lt-toggle').checked = true;
  toast('👥 ' + teamName, 'success');
}

function toggleTeamLT(active) {
  if (active) { applyTeamLT(); setLiveIndicator('team-lt', true); }
  else { socket.emit('trigger-team-lt-hide'); setLiveIndicator('team-lt', false); toast('Time removido', 'success'); }
}

// ============================================
// BARRA ESPORTIVA
// ============================================

function getSportsLTOptions() {
  return {
    logoBgColor: document.getElementById('sports-logo-bg').value,
    topBgColor: document.getElementById('sports-top-bg').value,
    bottomBgColor: document.getElementById('sports-bottom-bg').value,
    topTextColor: document.getElementById('sports-top-text').value,
    bottomTextColor: document.getElementById('sports-bottom-text').value,
    geoColor1: document.getElementById('sports-geo1').value,
    geoColor2: document.getElementById('sports-geo2').value,
    titleText: document.getElementById('sports-title').value.trim(),
    subtitleText: document.getElementById('sports-subtitle').value.trim(),
    logoUrl: document.getElementById('sports-logo-url').value.trim()
  };
}

function applySportsLT() {
  const titleText = document.getElementById('sports-title').value.trim();
  const subtitleText = document.getElementById('sports-subtitle').value.trim();
  if (!titleText && !subtitleText) { toast('Preencha ao menos um campo!', 'error'); return; }
  socket.emit('trigger-sports-lt', { options: getSportsLTOptions() });
  document.getElementById('sports-lt-toggle').checked = true;
  toast('🏟️ Barra atualizada!', 'success');
}

function toggleSportsLT(active) {
  if (active) { applySportsLT(); setLiveIndicator('sports-lt', true); }
  else { socket.emit('trigger-sports-lt-hide'); setLiveIndicator('sports-lt', false); toast('Barra removida', 'success'); }
}

// ============================================
// TICKER
// ============================================

function triggerTicker() {
  const text = document.getElementById('ticker-text').value.trim();
  if (!text) { toast('Digite o texto!', 'error'); return; }
  socket.emit('trigger-ticker', { text, options: {
    color: document.getElementById('ticker-color').value,
    bgColor: document.getElementById('ticker-bg').value + 'CC',
    speed: parseInt(document.getElementById('ticker-speed').value)
  }});
  toast('📜 Letreiro ativado!', 'success');
}

function stopTicker() { socket.emit('trigger-ticker-stop'); }

// ============================================
// EVENTOS DA PROVA
// ============================================

function triggerContestStart() { socket.emit('trigger-start'); toast('⏰ Início!', 'success'); }
function triggerContestEnd() { socket.emit('trigger-end'); toast('⏹ Fim!', 'success'); }
function triggerFrozen() { socket.emit('trigger-frozen'); toast('🥶 Congelado!', 'success'); }
function triggerBlind() { socket.emit('trigger-blind'); toast('👁️ Modo Cego!', 'success'); }

function triggerRankUp() {
  const teamName = document.getElementById('rankup-team').value.trim();
  const position = parseInt(document.getElementById('rankup-position').value);
  if (!teamName) { toast('Digite o time!', 'error'); return; }
  if (!position || position < 1) { toast('Digite a posição!', 'error'); return; }
  socket.emit('trigger-rankup', { teamName, position });
  toast(`🚀 ${teamName} #${position}!`, 'success');
  document.getElementById('rankup-team').value = '';
  document.getElementById('rankup-position').value = '';
}

function triggerCountdown() {
  const from = parseInt(document.getElementById('countdown-from').value);
  socket.emit('trigger-countdown', { from });
  toast('⏱ Contagem!', 'success');
}

function applyProblemLT() {
  const select = document.getElementById('prob-problem-select');
  const letter = select.value;
  const acs = document.getElementById('prob-acs-input').value.trim();

  if (!letter) { toast('Selecione o problema!', 'error'); return; }

  const opt = select.options[select.selectedIndex];
  const name = opt.dataset.name || '';

  socket.emit('trigger-problem-lt', { letter, name, acs: acs || '0' });
  document.getElementById('problem-lt-toggle').checked = true;
  toast('📋 Problema ' + letter, 'success');
}

function toggleProblemLT(active) {
  if (active) { applyProblemLT(); setLiveIndicator('problem-lt', true); }
  else { socket.emit('trigger-problem-lt-hide'); setLiveIndicator('problem-lt', false); toast('LT Problema removido', 'success'); }
}

// ============================================
// REGISTRO CENTRAL DE PROBLEMAS
// ============================================

const DEFAULT_PROBLEM_COLORS = [
  '#FF3366', '#00BFFF', '#FFD700', '#00FF88', '#FF6B35', '#7B68EE',
  '#FF69B4', '#E0E0E0', '#4169E1', '#CD853F', '#00CED1', '#ADFF2F'
];

const PROBLEMS_KEY = 'broadcast_problems';

function getProblems() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROBLEMS_KEY));
    if (saved && saved.length > 0) return saved;
  } catch (e) {}
  // Default: A-L com cores ICPC
  const letters = 'ABCDEFGHIJKL';
  return letters.split('').map((l, i) => ({
    letter: l,
    name: '',
    color: DEFAULT_PROBLEM_COLORS[i]
  }));
}

function saveProblems(problems) {
  localStorage.setItem(PROBLEMS_KEY, JSON.stringify(problems));
  refreshProblemDropdowns();
  renderProblemRegistry();
}

function refreshProblemDropdowns() {
  const problems = getProblems();
  // Dropdown do First AC
  const firstacSelect = document.getElementById('firstac-problem-select');
  if (firstacSelect) {
    firstacSelect.innerHTML = '<option value="">-- Selecione --</option>';
    problems.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.letter;
      opt.textContent = p.name ? `Problema ${p.letter} - ${p.name}` : `Problema ${p.letter}`;
      opt.dataset.color = p.color;
      opt.dataset.name = p.name || '';
      firstacSelect.appendChild(opt);
    });
  }
  // Dropdown do LT Problema
  const probSelect = document.getElementById('prob-problem-select');
  if (probSelect) {
    probSelect.innerHTML = '<option value="">-- Selecione --</option>';
    problems.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.letter;
      opt.textContent = p.name ? `Problema ${p.letter} - ${p.name}` : `Problema ${p.letter}`;
      opt.dataset.name = p.name || '';
      probSelect.appendChild(opt);
    });
  }
}

function renderProblemRegistry() {
  const container = document.getElementById('problem-registry');
  if (!container) return;
  const problems = getProblems();

  container.innerHTML = problems.map((p, i) => `
    <div class="problem-row edit-row">
      <div class="problem-letter-badge" style="background:${p.color}">${p.letter}</div>
      <input type="text" value="${escapeHtml(p.name)}" placeholder="Nome do problema ${p.letter}"
             onchange="updateProblem(${i}, 'name', this.value)" maxlength="35">
      <input type="color" value="${p.color}"
             onchange="updateProblem(${i}, 'color', this.value)">
      <button class="btn-mini btn-mini-del" onclick="deleteProblem(${i})" title="Remover">✕</button>
    </div>
  `).join('');
}

function updateProblem(idx, field, value) {
  const problems = getProblems();
  problems[idx][field] = value;
  localStorage.setItem(PROBLEMS_KEY, JSON.stringify(problems));
  refreshProblemDropdowns();
  if (field === 'color') renderProblemRegistry();
}

function addProblemRow() {
  const problems = getProblems();
  const usedLetters = problems.map(p => p.letter);
  const nextLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(l => !usedLetters.includes(l)) || '?';
  problems.push({ letter: nextLetter, name: '', color: '#FFD700' });
  saveProblems(problems);
}

function deleteProblem(idx) {
  const problems = getProblems();
  if (!confirm(`Remover Problema ${problems[idx].letter}?`)) return;
  problems.splice(idx, 1);
  saveProblems(problems);
}

function clearAllProblems() {
  if (!confirm('Apagar TODOS os problemas?')) return;
  localStorage.removeItem(PROBLEMS_KEY);
  initProblems();
  toast('🧹 Todos os problemas resetados!', 'success');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Inicializa dropdowns ao carregar
function initProblems() {
  renderProblemRegistry();
  refreshProblemDropdowns();
}

// ============================================
// FIRST AC - Tracking e Placar
// ============================================

const FIRSTAC_KEY = 'broadcast_firstac_entries';

function getFirstACEntries() {
  try { return JSON.parse(localStorage.getItem(FIRSTAC_KEY)) || []; }
  catch (e) { return []; }
}

function saveFirstACEntry(team, university, problem, color) {
  const entries = getFirstACEntries();
  entries.push({ team, university, problem, color, time: new Date().toLocaleTimeString() });
  localStorage.setItem(FIRSTAC_KEY, JSON.stringify(entries));
}

function deleteFirstACEntry(idx) {
  const entries = getFirstACEntries();
  if (!confirm(`Remover "${entries[idx].team}" do placar?`)) return;
  entries.splice(idx, 1);
  localStorage.setItem(FIRSTAC_KEY, JSON.stringify(entries));
  toast('Entrada removida!', 'success');
  // Se placar estiver visível, atualiza
  if (scoreboardVisible) refreshScoreboard();
}

function addManualFirstACEntry() {
  const team = prompt('Nome do time:');
  if (!team) return;
  const university = prompt('Universidade:') || '';
  const problem = prompt('Problema (ex: Problema C - DNA):');
  if (!problem) return;
  const color = '#FFD700';
  const entries = getFirstACEntries();
  entries.push({ team, university, problem, color, time: new Date().toLocaleTimeString() });
  localStorage.setItem(FIRSTAC_KEY, JSON.stringify(entries));
  toast('✅ Entrada adicionada!', 'success');
  if (scoreboardVisible) refreshScoreboard();
}

function refreshScoreboard() {
  const entries = getFirstACEntries();
  socket.emit('trigger-scoreboard', { entries });
}

function deleteLastFirstAC() {
  const entries = getFirstACEntries();
  if (entries.length === 0) { toast('Nenhuma entrada!', 'error'); return; }
  const last = entries[entries.length - 1];
  if (!confirm(`Remover última entrada: "${last.team}"?`)) return;
  entries.pop();
  localStorage.setItem(FIRSTAC_KEY, JSON.stringify(entries));
  toast('🗑 Última entrada removida!', 'success');
  renderScoreboardManager();
  if (scoreboardVisible) refreshScoreboard();
}

function renderScoreboardManager() {
  const container = document.getElementById('scoreboard-manager');
  if (!container) return;
  const entries = getFirstACEntries();
  if (entries.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px;">Nenhum First AC registrado.</p>';
    return;
  }
  container.innerHTML = entries.map((e, i) => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 8px;font-size:13px;border-bottom:1px solid var(--border);gap:8px;">
      <span style="color:#fff;font-weight:600;">${i+1}.</span>
      <span style="flex:1;"><strong>${e.team}</strong> ${e.university ? '<small style="color:var(--text-dim)">('+e.university+')</small>' : ''}</span>
      <span style="color:var(--text-dim);font-size:12px;">${e.problem}</span>
      <button class="btn-mini btn-mini-del" onclick="deleteFirstACEntry(${i});renderScoreboardManager();" style="width:28px;height:28px;font-size:12px;" title="Remover">✕</button>
    </div>
  `).join('');
}

function clearFirstACEntries() {
  if (!confirm('Apagar TODAS as entradas do placar?')) return;
  localStorage.removeItem(FIRSTAC_KEY);
  renderScoreboardManager();
  toast('🧹 Placar limpo!', 'success');
}

function onFirstACProblemChange() {
  // O nome do problema já está no dataset da option
}

function onProblemLTSelect() {
  // O nome do problema já está no dataset da option
}

function triggerFirstAC() {
  const select = document.getElementById('firstac-problem-select');
  const letter = select.value;
  const teamName = document.getElementById('firstac-team').value.trim();
  const university = document.getElementById('firstac-university').value.trim();

  if (!letter) { toast('Selecione o problema!', 'error'); return; }
  if (!teamName) { toast('Digite o nome do time!', 'error'); return; }

  const opt = select.options[select.selectedIndex];
  const color = opt.dataset.color || '#FFD700';
  const problemName = opt.dataset.name || '';
  const fullProblemName = `Problema ${letter} - ${problemName}`;

  saveFirstACEntry(teamName, university, fullProblemName, color);
  socket.emit('trigger-firstac', { teamName, problemName: fullProblemName, color });
  toast(`⭐ First AC: ${teamName} - ${fullProblemName}`, 'success');
  document.getElementById('firstac-team').value = '';
  document.getElementById('firstac-university').value = '';
}

let scoreboardVisible = false;

function toggleScoreboard() {
  if (scoreboardVisible) {
    socket.emit('trigger-scoreboard-hide');
    scoreboardVisible = false;
    document.querySelector('#tab-firstac .btn-scoreboard').textContent = '🏆 Placar';
  } else {
    const entries = getFirstACEntries();
    if (entries.length === 0) {
      toast('Nenhum First AC registrado ainda!', 'error');
      return;
    }
    socket.emit('trigger-scoreboard', { entries });
    scoreboardVisible = true;
    document.querySelector('#tab-firstac .btn-scoreboard').textContent = '❌ Fechar';
  }
  renderScoreboardManager();
}

// ============================================
// PLACAR DE MEDALHAS
// ============================================

const MEDALTABLE_KEY = 'broadcast_medal_table';

function getMedalRows() {
  try { return JSON.parse(localStorage.getItem(MEDALTABLE_KEY)) || []; }
  catch (e) { return []; }
}

function saveMedalRows(rows) {
  localStorage.setItem(MEDALTABLE_KEY, JSON.stringify(rows));
  renderMedalEditor();
}

function renderMedalEditor() {
  const container = document.getElementById('medaltable-editor');
  if (!container) return;
  const rows = getMedalRows();
  if (rows.length === 0) {
    container.innerHTML = '<p style="color:var(--text-dim);font-size:13px;padding:8px;">Nenhuma universidade. Clique em + para adicionar.</p>';
    return;
  }
  container.innerHTML = rows.map((r, i) => `
    <div class="medaltable-edit-row edit-row">
      <input type="text" value="${escapeHtml(r.name)}" placeholder="Universidade"
             onchange="updateMedalRow(${i},'name',this.value)" maxlength="30">
      <input type="number" value="${r.gold||0}" min="0" max="99" placeholder="🥇"
             onchange="updateMedalRow(${i},'gold',parseInt(this.value)||0)">
      <input type="number" value="${r.silver||0}" min="0" max="99" placeholder="🥈"
             onchange="updateMedalRow(${i},'silver',parseInt(this.value)||0)">
      <input type="number" value="${r.bronze||0}" min="0" max="99" placeholder="🥉"
             onchange="updateMedalRow(${i},'bronze',parseInt(this.value)||0)">
      <button class="btn-mini btn-mini-del" onclick="deleteMedalRow(${i})" style="width:32px;height:32px;font-size:12px;">✕</button>
    </div>
  `).join('');
}

function updateMedalRow(idx, field, value) {
  const rows = getMedalRows();
  rows[idx][field] = value;
  localStorage.setItem(MEDALTABLE_KEY, JSON.stringify(rows));
}

function addMedalRow() {
  const rows = getMedalRows();
  rows.push({ name: '', gold: 0, silver: 0, bronze: 0 });
  saveMedalRows(rows);
}

function deleteMedalRow(idx) {
  const rows = getMedalRows();
  rows.splice(idx, 1);
  saveMedalRows(rows);
}

function clearMedalTable() {
  if (!confirm('Limpar todas as universidades?')) return;
  localStorage.removeItem(MEDALTABLE_KEY);
  renderMedalEditor();
  toast('🧹 Placar limpo!', 'success');
}

function applyMedalTable() {
  const rows = getMedalRows();
  const filled = rows.filter(r => r.name.trim());
  if (filled.length === 0) { toast('Adicione ao menos uma universidade!', 'error'); return; }
  socket.emit('trigger-medal-table', { rows: filled });
  document.getElementById('medaltable-toggle').checked = true;
  toast('🏅 Placar atualizado!', 'success');
}

function toggleMedalTable(active) {
  if (active) { applyMedalTable(); setLiveIndicator('medal-table', true); }
  else { socket.emit('trigger-medal-table-hide'); setLiveIndicator('medal-table', false); toast('Placar escondido', 'success'); }
}

// Atualiza loadAllPresets e savePreset/loadPreset para suportar medaltable

// ============================================
// ESTATÍSTICAS DE PROBLEMAS (ACs + badges)
// ============================================

const PROBLEMSTATS_KEY = 'broadcast_problem_stats';

function getProblemStats() {
  try { return JSON.parse(localStorage.getItem(PROBLEMSTATS_KEY)) || []; }
  catch (e) { return []; }
}

function getAvailableProblems() {
  const globalProbs = getProblems().filter(p => p.name.trim());
  const statsProbs = getProblemStats();
  const usedLetters = statsProbs.map(s => s.letter);
  return globalProbs.filter(p => !usedLetters.includes(p.letter));
}

function saveProblemStats(rows) {
  localStorage.setItem(PROBLEMSTATS_KEY, JSON.stringify(rows));
  renderProblemStatsEditor();
}

function renderProblemStatsEditor() {
  const container = document.getElementById('problemstats-editor');
  if (!container) return;
  const rows = getProblemStats();
  const available = getAvailableProblems();

  let html = '';
  if (rows.length === 0) {
    html += '<p style="color:var(--text-dim);font-size:13px;padding:8px;">Nenhum problema adicionado. Use o botão abaixo.</p>';
  } else {
    html += rows.map((r, i) => `
      <div class="problemstats-edit-row edit-row">
        <div class="problemstats-letter edit-badge" style="background:${r.color || '#FFD700'}">${r.letter}</div>
        <input type="text" value="${escapeHtml(r.name || '')}" placeholder="Nome" onchange="updateProblemStat(${i},'name',this.value)" maxlength="30" style="text-align:left;">
        <input type="number" value="${r.acs||0}" min="0" max="999" onchange="updateProblemStat(${i},'acs',parseInt(this.value)||0)">
        <select onchange="updateProblemStat(${i},'badge',this.value)">
          <option value="normal" ${r.badge==='normal'?'selected':''}>—</option>
          <option value="balloon-plus" ${r.badge==='balloon-plus'?'selected':''}>🎈++</option>
          <option value="hard" ${r.badge==='hard'?'selected':''}>🔥 Hard</option>
        </select>
        <button class="btn-mini btn-mini-del" onclick="deleteProblemStat(${i})" style="width:32px;height:32px;font-size:12px;">✕</button>
      </div>
    `).join('');
  }

  // Dropdown para adicionar do banco
  if (available.length > 0) {
    html += `
      <div style="display:flex;gap:8px;margin-top:8px;">
        <select id="add-problem-select" style="flex:1;padding:10px 12px;background:rgba(255,255,255,0.04);border:1px solid rgba(0,255,136,0.2);border-radius:10px;color:#00FF88;font-size:13px;font-family:'Montserrat',sans-serif;font-weight:700;cursor:pointer;">
          <option value="">➕ Adicionar do banco...</option>
          ${available.map(p => `<option value="${p.letter}">Problema ${p.letter} - ${p.name}</option>`).join('')}
        </select>
        <button class="btn-mini" onclick="addProblemFromBank()" style="background:rgba(0,255,136,0.1);border-color:rgba(0,255,136,0.3);color:#00FF88;width:42px;height:42px;">✓</button>
      </div>`;
  }

  container.innerHTML = html;
}

function addProblemFromBank() {
  const select = document.getElementById('add-problem-select');
  const letter = select.value;
  if (!letter) { toast('Selecione um problema!', 'error'); return; }

  const globalProbs = getProblems();
  const prob = globalProbs.find(p => p.letter === letter);
  if (!prob) return;

  const rows = getProblemStats();
  rows.push({
    letter: prob.letter,
    name: prob.name,
    color: prob.color,
    acs: 0,
    badge: 'normal'
  });
  saveProblemStats(rows);
  toast('📊 ' + prob.letter + ' adicionado!', 'success');
}

function updateProblemStat(idx, field, value) {
  const rows = getProblemStats();
  rows[idx][field] = value;
  localStorage.setItem(PROBLEMSTATS_KEY, JSON.stringify(rows));
}

function deleteProblemStat(idx) {
  const rows = getProblemStats();
  rows.splice(idx, 1);
  saveProblemStats(rows);
}

function resetProblemStats() {
  if (!confirm('Remover TODOS os problemas da tabela?')) return;
  localStorage.removeItem(PROBLEMSTATS_KEY);
  renderProblemStatsEditor();
  toast('🧹 Tabela limpa!', 'success');
}

function applyProblemStats() {
  const rows = getProblemStats();
  if (rows.length === 0) { toast('Nenhum problema!', 'error'); return; }
  socket.emit('trigger-problem-stats', { rows });
  document.getElementById('problemstats-toggle').checked = true;
  toast('📊 Estatísticas atualizadas!', 'success');
}

function toggleProblemStats(active) {
  if (active) { applyProblemStats(); setLiveIndicator('problem-stats', true); }
  else { socket.emit('trigger-problem-stats-hide'); setLiveIndicator('problem-stats', false); toast('Tabela escondida', 'success'); }
}

// ============================================
// YOUTUBE CHAT
// ============================================

const YT_CONFIG_KEY = 'broadcast_yt_config';
const YT_FAVORITES_KEY = 'broadcast_yt_favorites';
let activeCommentId = null;

function getYTConfig() {
  try { return JSON.parse(localStorage.getItem(YT_CONFIG_KEY)) || {}; }
  catch (e) { return {}; }
}

function saveYTConfig(config) {
  localStorage.setItem(YT_CONFIG_KEY, JSON.stringify(config));
}

function getYTFavorites() {
  try { return JSON.parse(localStorage.getItem(YT_FAVORITES_KEY)) || []; }
  catch (e) { return []; }
}

function saveYTFavorite(author, message) {
  const favs = getYTFavorites();
  // Evita duplicatas
  if (favs.find(f => f.message === message && f.author === author)) {
    toast('Já está nos favoritos!', 'error');
    return;
  }
  favs.unshift({ author, message, time: new Date().toLocaleTimeString() });
  localStorage.setItem(YT_FAVORITES_KEY, JSON.stringify(favs.slice(0, 30)));
  renderYTFavorites();
  toast('⭐ Favorito salvo!', 'success');
}

function clearYTFavorites() {
  if (!confirm('Limpar todos os favoritos?')) return;
  localStorage.removeItem(YT_FAVORITES_KEY);
  renderYTFavorites();
  toast('Favoritos limpos!', 'success');
}

function clickFavorite(author, message, el) {
  // Destaca visualmente
  document.querySelectorAll('.yt-msg').forEach(m => m.classList.remove('active'));
  if (el) el.classList.add('active');
  // Envia pro display
  socket.emit('trigger-show-comment', { author, message });
  document.getElementById('comment-display-toggle').checked = true;
  setLiveIndicator('comment-display', true);
}

function renderYTFavorites() {
  const container = document.getElementById('yt-favorites-list');
  const section = document.getElementById('yt-favorites');
  if (!container || !section) return;

  const favs = getYTFavorites();
  if (favs.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';

  container.innerHTML = favs.map((f, i) => `
    <div class="yt-msg fav-msg" style="border-color:rgba(255,215,0,0.15);" data-author="${f.author.replace(/"/g,'&quot;')}" data-message="${f.message.replace(/"/g,'&quot;')}">
      <div class="yt-msg-header">
        <strong style="color:#FFD700;">⭐ ${f.author}</strong>
        <small>${f.time}</small>
      </div>
      <div class="yt-msg-text">${f.message}</div>
    </div>
  `).join('');

  // Adiciona eventos via JS (mais seguro que inline)
  container.querySelectorAll('.fav-msg').forEach(el => {
    el.onclick = () => {
      const author = el.dataset.author;
      const message = el.dataset.message;
      clickFavorite(author, message, el);
    };
  });
}

function connectYTChat() {
  const apiKey = document.getElementById('yt-apikey').value.trim();
  const liveChatId = document.getElementById('yt-chatid').value.trim();

  if (!apiKey || !liveChatId) {
    toast('Preencha API Key e Live Chat ID!', 'error');
    return;
  }

  saveYTConfig({ apiKey, liveChatId });
  socket.emit('yt-start', { apiKey, liveChatId });
  document.getElementById('yt-chat-toggle').checked = true;
  setLiveIndicator('yt-chat', true);
  toast('🔌 Conectando ao chat do YouTube...', 'success');
}

function toggleYTChat(active) {
  if (active) {
    connectYTChat();
  } else {
    socket.emit('yt-stop');
    setLiveIndicator('yt-chat', false);
    document.getElementById('yt-messages').innerHTML =
      '<p style="color:var(--text-dim);font-size:13px;text-align:center;padding:20px;">Chat desconectado.</p>';
    toast('Chat parado', 'success');
  }
}

// Mostrar/esconder comentário no display (toggle)
function toggleCommentDisplay(active) {
  if (active) {
    const msg = document.querySelector('.yt-msg.active');
    if (!msg) { document.getElementById('comment-display-toggle').checked = false; toast('Clique em um comentário primeiro!', 'error'); return; }
    setLiveIndicator('comment-display', true);
  } else {
    socket.emit('trigger-hide-comment');
    setLiveIndicator('comment-display', false);
    document.querySelectorAll('.yt-msg').forEach(m => m.classList.remove('active'));
    activeCommentId = null;
  }
}

// Quando o display esconde o comentário, sincroniza toggle
socket.on('comment-hidden', () => {
  document.getElementById('comment-display-toggle').checked = false;
  setLiveIndicator('comment-display', false);
  document.querySelectorAll('.yt-msg').forEach(m => m.classList.remove('active'));
  activeCommentId = null;
});

// Recebe mensagens do chat
socket.on('yt-chat-messages', (messages) => {
  const container = document.getElementById('yt-messages');
  if (!container) return;

  messages.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'yt-msg';
    div.id = 'msg-' + msg.id;
    div.title = 'Clique para mostrar no display';

    const header = document.createElement('div');
    header.className = 'yt-msg-header';
    const strong = document.createElement('strong');
    strong.textContent = msg.author;
    const small = document.createElement('small');
    small.textContent = msg.timestamp;
    header.appendChild(strong);
    header.appendChild(small);

    const text = document.createElement('div');
    text.className = 'yt-msg-text';
    text.textContent = msg.message;

    const actions = document.createElement('div');
    actions.className = 'yt-msg-actions';
    const favBtn = document.createElement('button');
    favBtn.className = 'yt-fav-btn';
    favBtn.textContent = '⭐';
    favBtn.title = 'Salvar favorito';
    favBtn.onclick = (e) => {
      e.stopPropagation();
      saveYTFavorite(msg.author, msg.message);
    };
    actions.appendChild(favBtn);

    div.appendChild(header);
    div.appendChild(text);
    div.appendChild(actions);

    div.onclick = () => {
      document.querySelectorAll('.yt-msg').forEach(m => m.classList.remove('active'));
      div.classList.add('active');
      activeCommentId = msg.id;
      socket.emit('trigger-show-comment', { author: msg.author, message: msg.message, id: msg.id });
      document.getElementById('comment-display-toggle').checked = true;
      setLiveIndicator('comment-display', true);
    };

    container.prepend(div);
  });

  while (container.children.length > 100) {
    container.lastChild.remove();
  }
});

// Status do YouTube
socket.on('yt-status', (data) => {
  const toggle = document.getElementById('yt-chat-toggle');
  if (toggle) toggle.checked = data.active;
  if (data.active) setLiveIndicator('yt-chat', true);
});

// Carrega config salva
function loadYTConfig() {
  const config = getYTConfig();
  if (config.apiKey) document.getElementById('yt-apikey').value = config.apiKey;
  if (config.liveChatId) document.getElementById('yt-chatid').value = config.liveChatId;
}

// ============================================
// EFEITOS
// ============================================

function triggerConfetti() { socket.emit('trigger-confetti'); toast('🎊 Confete!', 'success'); }
function triggerClear() { socket.emit('trigger-clear'); toast('🧹 Limpo!', 'success'); }

// ============================================
// TECLAS DE ATALHO
// ============================================

document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' && e.key === 'Enter') {
    const id = e.target.id;
    if (id === 'medal-team') { e.preventDefault(); triggerMedal(); }
    if (id === 'balloon-team') { e.preventDefault(); triggerBalloon(); }
    if (id === 'alert-message') { e.preventDefault(); triggerCustomAlert(); }
    if (id === 'rankup-team' || id === 'rankup-position') { e.preventDefault(); triggerRankUp(); }
  }
  if (e.key === 'Escape' && document.activeElement === document.body) { e.preventDefault(); triggerClear(); }
  if (e.ctrlKey && e.key === 'Enter' && document.activeElement === document.body) { e.preventDefault(); triggerConfetti(); }
});

// ============================================
// TOAST
// ============================================

function toast(message, type) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 2500);
}
