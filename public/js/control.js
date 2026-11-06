/* ============================================
   PAINEL DE CONTROLE v3.1 - Persistência Centralizada (Real-Time)
   Maratona SBC de Programação
   ============================================ */

const socket = io();
let selectedColor = '#FF3366';
let activeLiveToggles = {};
let isApplyingRemoteState = false;
let initialThemeHandled = false;

const DEFAULT_PROBLEM_COLORS = [
  '#FF3366', '#00BFFF', '#FFD700', '#00FF88', '#FF6B35', '#7B68EE',
  '#FF69B4', '#E0E0E0', '#4169E1', '#CD853F', '#00CED1', '#ADFF2F'
];

// Estado compartilhado sincronizado com o servidor
let sharedState = {
  settings: {
    marathonName: 'Maratona SBC de Programação',
    activeTheme: 'final2026'
  },
  presets: {
    pessoas: [],
    time: [],
    barra: [],
    medaltable: [],
    problemstats: [],
    globalcolors: []
  },
  problems: 'ABCDEFGHIJKL'.split('').map((l, i) => ({
    letter: l,
    name: '',
    color: DEFAULT_PROBLEM_COLORS[i]
  })),
  firstAcEntries: [],
  medalTable: [],
  problemStats: [],
  ytConfig: { apiKey: '', liveChatId: '' },
  ytFavorites: [],
  inputs: {},
  activeOverlays: {}
};

// ============================================
// SINCRONIZAÇÃO DE FORMULÁRIO E ESTADO
// ============================================

const SYNCED_INPUT_IDS = [
  'global-marathon-name',
  'global-top-bg', 'global-bottom-bg', 'global-logo-bg',
  'global-name-color', 'global-role-color', 'global-geo1', 'global-geo2', 'global-logo-url',
  'lt-left-name', 'lt-left-role', 'lt-right-name', 'lt-right-role',
  'lt-top-bg', 'lt-bottom-bg', 'lt-logo-bg', 'lt-name-color', 'lt-role-color',
  'lt-geo1', 'lt-geo2', 'lt-logo-url',
  'team-lt-name', 'team-lt-m1', 'team-lt-m2', 'team-lt-m3',
  'team-lt-top-bg', 'team-lt-bottom-bg', 'team-lt-logo-bg',
  'team-lt-name-color', 'team-lt-members-color', 'team-lt-logo',
  'sports-title', 'sports-subtitle',
  'sports-top-bg', 'sports-bottom-bg', 'sports-logo-bg',
  'sports-top-text', 'sports-bottom-text', 'sports-geo1', 'sports-geo2', 'sports-logo-url',
  'sponsors-left-bg', 'sponsors-right-bg', 'sponsors-geo-l1', 'sponsors-geo-l2',
  'sponsors-geo-r1', 'sponsors-geo-r2', 'sponsors-content-bg',
  'ticker-text', 'ticker-color', 'ticker-bg', 'ticker-speed',
  'prob-problem-select', 'prob-acs-input',
  'firstac-problem-select', 'firstac-team', 'firstac-university',
  'medal-team', 'medal-type', 'medal-position',
  'balloon-team', 'rankup-team', 'rankup-position',
  'alert-message', 'countdown-from'
];

function bindSyncedInputs() {
  SYNCED_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const handler = () => {
      if (isApplyingRemoteState) return;
      sharedState.inputs[id] = el.value;
      socket.emit('input-change', { id, value: el.value });
    };
    el.addEventListener('input', handler);
    el.addEventListener('change', handler);
  });
}

function applyInputsFromState(inputsMap) {
  if (!inputsMap) return;
  isApplyingRemoteState = true;
  Object.entries(inputsMap).forEach(([id, val]) => {
    const el = document.getElementById(id);
    if (el && document.activeElement !== el && val !== undefined) {
      el.value = val;
    }
  });
  isApplyingRemoteState = false;
}

function syncActiveOverlaysUI(overlays) {
  if (!overlays) return;
  sharedState.activeOverlays = overlays;

  const setToggleState = (checkboxId, liveId, isActive) => {
    const cb = document.getElementById(checkboxId);
    if (cb) cb.checked = !!isActive;
    setLiveIndicator(liveId, !!isActive);
  };

  setToggleState('lt-left-toggle', 'lt-left', !!overlays.ltLeft);
  setToggleState('lt-right-toggle', 'lt-right', !!overlays.ltRight);
  setToggleState('team-lt-toggle', 'team-lt', !!overlays.teamLt);
  setToggleState('sports-lt-toggle', 'sports-lt', !!overlays.sportsLt);
  setToggleState('sponsors-lt-toggle', 'sponsors-lt', !!overlays.sponsorsLt);
  setToggleState('problem-lt-toggle', 'problem-lt', !!overlays.problemLt);
  setToggleState('medaltable-toggle', 'medal-table', !!overlays.medalTable);
  setToggleState('problemstats-toggle', 'problem-stats', !!overlays.problemStats);
  setToggleState('comment-display-toggle', 'comment-display', !!overlays.comment);

  scoreboardVisible = !!overlays.scoreboard;
  const sbBtn = document.querySelector('#tab-firstac .btn-scoreboard');
  if (sbBtn) {
    sbBtn.textContent = scoreboardVisible ? '❌ Fechar' : '🏆 Placar';
  }
}

function renderAllFromState() {
  isApplyingRemoteState = true;
  ['pessoas', 'time', 'barra', 'medaltable', 'problemstats', 'globalcolors'].forEach(loadPresetDropdown);
  initProblems();
  renderScoreboardManager();
  renderMedalEditor();
  renderProblemStatsEditor();
  loadSettings();
  loadYTConfig();
  renderYTFavorites();
  applyInputsFromState(sharedState.inputs);
  syncActiveOverlaysUI(sharedState.activeOverlays);
  isApplyingRemoteState = false;
}

// ============================================
// CONFIGURAÇÕES GERAIS
// ============================================

function getSettings() {
  return sharedState.settings || {};
}

function saveSettings(settings) {
  sharedState.settings = { ...sharedState.settings, ...settings };
  socket.emit('state-update', { settings: sharedState.settings });
}

function loadSettings() {
  const s = getSettings();
  if (s.marathonName) {
    const input = document.getElementById('global-marathon-name');
    if (input && document.activeElement !== input) input.value = s.marathonName;
    const header = document.getElementById('header-marathon-name');
    if (header) header.textContent = s.marathonName;
  }
}

function updateMarathonName() {
  const name = document.getElementById('global-marathon-name').value.trim();
  if (!name) return;
  sharedState.settings.marathonName = name;
  sharedState.inputs['global-marathon-name'] = name;
  document.getElementById('header-marathon-name').textContent = name;
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
// CONEXÃO E EVENTOS DE SINCRONIZAÇÃO
// ============================================

const statusEl = document.getElementById('connection-status');
socket.on('connect', () => {
  statusEl.classList.add('connected');
  statusEl.querySelector('.status-text').textContent = 'Conectado';
  injectLiveDots();
});

socket.on('disconnect', () => {
  statusEl.classList.remove('connected');
  statusEl.querySelector('.status-text').textContent = 'Desconectado';
});

socket.on('state-init', (serverState) => {
  if (!serverState) return;
  sharedState = {
    ...sharedState,
    ...serverState,
    settings: { ...sharedState.settings, ...(serverState.settings || {}) },
    presets: { ...sharedState.presets, ...(serverState.presets || {}) },
    inputs: { ...sharedState.inputs, ...(serverState.inputs || {}) },
    activeOverlays: { ...sharedState.activeOverlays, ...(serverState.activeOverlays || {}) }
  };

  renderAllFromState();

  // Se o operador abriu com ?theme=final2026 ou ?theme=padrao explicitamente na URL (vindo do Hub)
  if (!initialThemeHandled) {
    initialThemeHandled = true;
    const urlParams = new URLSearchParams(window.location.search);
    const themeParam = urlParams.get('theme');
    if (themeParam === 'final2026' || themeParam === 'padrao' || themeParam === 'ufu2026' || themeParam === 'ufu') {
      let targetLabel = 'Maratona Padrão';
      if (themeParam === 'final2026') targetLabel = 'Maratona Final 2026';
      if (themeParam === 'ufu2026' || themeParam === 'ufu') targetLabel = 'Maratona Final 2026 - FACOM UFU';

      const themeValue = (themeParam === 'ufu' || themeParam === 'ufu2026') ? 'ufu2026' : themeParam;
      if (sharedState.settings.activeTheme !== themeValue) {
        sharedState.settings.activeTheme = themeValue;
        socket.emit('update-settings', { activeTheme: themeValue });
      }
      ['globalcolors', 'pessoas', 'time', 'barra'].forEach(type => {
        const presets = getPresets(type);
        const idx = presets.findIndex(p => p.label === targetLabel);
        if (idx !== -1) {
          const select = document.getElementById('preset-' + type);
          if (select) {
            select.value = idx;
            loadPreset(type, true);
          }
        }
      });
    }
  }
});

socket.on('state-patched', (patch) => {
  if (!patch) return;
  isApplyingRemoteState = true;

  if (patch.settings) {
    Object.assign(sharedState.settings, patch.settings);
    loadSettings();
  }
  if (patch.presets) {
    Object.assign(sharedState.presets, patch.presets);
    ['pessoas', 'time', 'barra', 'medaltable', 'problemstats', 'globalcolors'].forEach(loadPresetDropdown);
  }
  if (Array.isArray(patch.problems)) {
    sharedState.problems = patch.problems;
    initProblems();
    renderProblemStatsEditor();
  }
  if (Array.isArray(patch.firstAcEntries)) {
    sharedState.firstAcEntries = patch.firstAcEntries;
    renderScoreboardManager();
  }
  if (Array.isArray(patch.medalTable)) {
    sharedState.medalTable = patch.medalTable;
    renderMedalEditor();
  }
  if (Array.isArray(patch.problemStats)) {
    sharedState.problemStats = patch.problemStats;
    renderProblemStatsEditor();
  }
  if (patch.ytConfig) {
    Object.assign(sharedState.ytConfig, patch.ytConfig);
    loadYTConfig();
  }
  if (Array.isArray(patch.ytFavorites)) {
    sharedState.ytFavorites = patch.ytFavorites;
    renderYTFavorites();
  }
  if (patch.inputs) {
    Object.assign(sharedState.inputs, patch.inputs);
    applyInputsFromState(patch.inputs);
  }

  isApplyingRemoteState = false;
});

socket.on('input-updated', (data) => {
  if (!data || !data.id) return;
  sharedState.inputs[data.id] = data.value;
  const el = document.getElementById(data.id);
  if (el && document.activeElement !== el) {
    isApplyingRemoteState = true;
    el.value = data.value;
    isApplyingRemoteState = false;
  }
});

socket.on('settings-updated', (settings) => {
  if (!settings) return;
  Object.assign(sharedState.settings, settings);
  loadSettings();
});

socket.on('overlays-updated', (overlays) => {
  syncActiveOverlaysUI(overlays);
});

// ============================================
// TABS
// ============================================

function switchTab(name) {
  const clickedBtn = document.querySelector(`.tab-btn[onclick*="'${name}'"]`) || document.querySelector(`.tab-btn[onclick*="${name}"]`);
  const targetTab = document.getElementById('tab-' + name);
  if (!clickedBtn || !targetTab) return;

  const panel = clickedBtn.closest('.tabs-panel');
  if (panel) {
    panel.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    panel.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  } else {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  }

  clickedBtn.classList.add('active');
  targetTab.classList.add('active');
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

  syncInputsSnapshot();
  toast('🎨 Cores globais aplicadas!', 'success');
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) {
    el.value = val;
    sharedState.inputs[id] = val;
  }
}

function syncInputsSnapshot() {
  if (isApplyingRemoteState) return;
  const snapshot = {};
  SYNCED_INPUT_IDS.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      snapshot[id] = el.value;
      sharedState.inputs[id] = el.value;
    }
  });
  socket.emit('state-update', { inputs: snapshot });
}

// ============================================
// PRESETS (sistema unificado sincronizado no servidor)
// ============================================

function getPresets(type) {
  return Array.isArray(sharedState.presets[type]) ? sharedState.presets[type] : [];
}

function savePresetsArr(type, arr) {
  sharedState.presets[type] = arr;
  loadPresetDropdown(type);
  socket.emit('state-update', { presets: { [type]: arr } });
}

function loadPresetDropdown(type) {
  const select = document.getElementById('preset-' + type);
  if (!select) return;
  const currentVal = select.value;
  const presets = getPresets(type);
  select.innerHTML = '<option value="">-- Preset --</option>';
  presets.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.label;
    select.appendChild(opt);
  });
  if (currentVal !== '' && presets[parseInt(currentVal)]) {
    select.value = currentVal;
  }
}

// Injeta bolinhas AO VIVO ao lado de cada toggle
function injectLiveDots() {
  const toggles = {
    'lt-left-toggle': 'lt-left',
    'lt-right-toggle': 'lt-right',
    'team-lt-toggle': 'team-lt',
    'sports-lt-toggle': 'sports-lt',
    'sponsors-lt-toggle': 'sponsors-lt',
    'problem-lt-toggle': 'problem-lt',
    'medaltable-toggle': 'medal-table',
    'problemstats-toggle': 'problem-stats',
    'yt-chat-toggle': 'yt-chat',
    'comment-display-toggle': 'comment-display'
  };
  Object.entries(toggles).forEach(([checkboxId, liveId]) => {
    const cb = document.getElementById(checkboxId);
    if (!cb) return;
    const existing = document.getElementById('live-' + liveId);
    if (existing) existing.remove();
    const dot = document.createElement('span');
    dot.id = 'live-' + liveId;
    dot.className = 'live-dot' + (activeLiveToggles[liveId] ? ' active' : '');
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
  } else if (type === 'globalcolors') {
    data.colors = {
      topBg: document.getElementById('global-top-bg').value,
      bottomBg: document.getElementById('global-bottom-bg').value,
      logoBg: document.getElementById('global-logo-bg').value,
      nameColor: document.getElementById('global-name-color').value,
      roleColor: document.getElementById('global-role-color').value,
      geo1: document.getElementById('global-geo1').value,
      geo2: document.getElementById('global-geo2').value,
      logoUrl: document.getElementById('global-logo-url').value.trim()
    };
  } else if (type === 'problemstats') {
    data.rows = JSON.parse(JSON.stringify(getProblemStats()));
  } else if (type === 'medaltable') {
    data.rows = JSON.parse(JSON.stringify(getMedalRows()));
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

  const presets = [...getPresets(type)];
  presets.push(data);
  savePresetsArr(type, presets);
  toast(`💾 "${label}" salvo para todos!`, 'success');
}

// --- Carregar ---

function loadPreset(type, silent = false) {
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
    const fallbackMembers = (!p.m1 && !p.m2 && !p.m3 && p.teamMembers)
      ? p.teamMembers.split(',').map(s => s.trim())
      : [];
    setVal('team-lt-m1', p.m1 || fallbackMembers[0] || '');
    setVal('team-lt-m2', p.m2 || fallbackMembers[1] || '');
    setVal('team-lt-m3', p.m3 || fallbackMembers[2] || '');
    if (p.colors) loadColors(p.colors, { top:'team-lt-top-bg', bottom:'team-lt-bottom-bg', logo:'team-lt-logo-bg',
      name:'team-lt-name-color', role:'team-lt-members-color', logoUrl:'team-lt-logo' });
  } else if (type === 'globalcolors') {
    if (p.colors) {
      const c = p.colors;
      if (c.topBg) setVal('global-top-bg', c.topBg);
      if (c.bottomBg) setVal('global-bottom-bg', c.bottomBg);
      if (c.logoBg) setVal('global-logo-bg', c.logoBg);
      if (c.nameColor) setVal('global-name-color', c.nameColor);
      if (c.roleColor) setVal('global-role-color', c.roleColor);
      if (c.geo1) setVal('global-geo1', c.geo1);
      if (c.geo2) setVal('global-geo2', c.geo2);
      if (c.logoUrl !== undefined) setVal('global-logo-url', c.logoUrl);
    }
  } else if (type === 'problemstats') {
    if (p.rows) {
      saveProblemStats(JSON.parse(JSON.stringify(p.rows)));
    }
  } else if (type === 'medaltable') {
    if (p.rows) {
      saveMedalRows(JSON.parse(JSON.stringify(p.rows)));
    }
  } else if (type === 'barra') {
    setVal('sports-title', p.titleText || ''); setVal('sports-subtitle', p.subtitleText || '');
    if (p.colors) loadColors(p.colors, { top:'sports-top-bg', bottom:'sports-bottom-bg', logo:'sports-logo-bg',
      name:'sports-top-text', role:'sports-bottom-text', geo1:'sports-geo1', geo2:'sports-geo2', logoUrl:'sports-logo-url' });
  }

  syncInputsSnapshot();
  if (!silent) toast(`📋 "${p.label}" carregado!`, 'success');
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
  const presets = [...getPresets(type)];
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
  setVal('medal-team', '');
  socket.emit('input-change', { id: 'medal-team', value: '' });
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
  setVal('balloon-team', '');
  socket.emit('input-change', { id: 'balloon-team', value: '' });
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
  setVal('alert-message', '');
  socket.emit('input-change', { id: 'alert-message', value: '' });
}

// ============================================
// LOWER THIRDS (Pessoas)
// ============================================

function getLowerThirdOptions() {
  const customLogo = document.getElementById('lt-logo-url').value.trim();
  const globalLogo = document.getElementById('global-logo-url').value.trim();
  const resolvedLogo = (customLogo && customLogo !== '/src/sbc_assets/logo-maratona.png')
    ? customLogo
    : ((globalLogo && globalLogo !== '/src/sbc_assets/logo-maratona.png') ? globalLogo : '/src/sbc_assets/sabia-voando.png');

  return {
    topBgColor: document.getElementById('lt-top-bg').value,
    bottomBgColor: document.getElementById('lt-bottom-bg').value,
    logoBgColor: document.getElementById('lt-logo-bg').value,
    nameColor: document.getElementById('lt-name-color').value,
    roleColor: document.getElementById('lt-role-color').value,
    geoColor1: document.getElementById('lt-geo1').value,
    geoColor2: document.getElementById('lt-geo2').value,
    logoUrl: resolvedLogo
  };
}

function triggerLowerThird(side) {
  const name = document.getElementById(`lt-${side}-name`).value.trim();
  const role = document.getElementById(`lt-${side}-role`).value.trim();
  if (!name) {
    document.getElementById(`lt-${side}-toggle`).checked = false;
    toast('Digite o nome!', 'error');
    return false;
  }
  if (!role) {
    document.getElementById(`lt-${side}-toggle`).checked = false;
    toast('Digite a função!', 'error');
    return false;
  }
  socket.emit('show-lowerthird', { side, name, role, options: getLowerThirdOptions() });
  toast(`📺 ${name}`, 'success');
  return true;
}

function toggleLowerThird(side, active) {
  if (active) {
    if (triggerLowerThird(side)) setLiveIndicator('lt-' + side, true);
  } else {
    hideLowerThird(side);
    setLiveIndicator('lt-' + side, false);
  }
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
    setLiveIndicator('lt-left', true);
  }
  if (rightName || rightRole) {
    socket.emit('show-lowerthird', { side: 'right', name: rightName || '', role: rightRole || '', options });
    document.getElementById('lt-right-toggle').checked = true;
    setLiveIndicator('lt-right', true);
  }
  toast('📺 LTs atualizados!', 'success');
}

// ============================================
// LT DE COMPETIDORES (Time)
// ============================================

function applyTeamLT() {
  const teamName = document.getElementById('team-lt-name').value.trim();
  if (!teamName) {
    document.getElementById('team-lt-toggle').checked = false;
    toast('Digite o nome do time!', 'error');
    return false;
  }
  const customLogo = document.getElementById('team-lt-logo').value.trim();
  const globalLogo = document.getElementById('global-logo-url').value.trim();
  const resolvedLogo = (customLogo && customLogo !== '/src/sbc_assets/logo-maratona.png')
    ? customLogo
    : ((globalLogo && globalLogo !== '/src/sbc_assets/logo-maratona.png') ? globalLogo : '/src/sbc_assets/sabia-voando.png');

  const options = {
    logoBgColor: document.getElementById('team-lt-logo-bg').value,
    topBgColor: document.getElementById('team-lt-top-bg').value,
    bottomBgColor: document.getElementById('team-lt-bottom-bg').value,
    nameColor: document.getElementById('team-lt-name-color').value,
    membersColor: document.getElementById('team-lt-members-color').value,
    geoColor1: '#FF1493', geoColor2: '#FFD700',
    logoUrl: resolvedLogo
  };
  const m1 = document.getElementById('team-lt-m1').value.trim();
  const m2 = document.getElementById('team-lt-m2').value.trim();
  const m3 = document.getElementById('team-lt-m3').value.trim();
  socket.emit('trigger-team-lt', { teamName, m1, m2, m3, options });
  document.getElementById('team-lt-toggle').checked = true;
  setLiveIndicator('team-lt', true);
  toast('👥 ' + teamName, 'success');
  return true;
}

function toggleTeamLT(active) {
  if (active) {
    applyTeamLT();
  } else {
    socket.emit('trigger-team-lt-hide');
    setLiveIndicator('team-lt', false);
    toast('Time removido', 'success');
  }
}

// ============================================
// SPONSORS BAR
// ============================================

function triggerSponsorsLT() {
  const leftColor = document.getElementById('sponsors-left-bg').value;
  const rightColor = document.getElementById('sponsors-right-bg').value;
  const options = {
    leftBg: `linear-gradient(135deg, ${leftColor}, ${lightenColor(leftColor, 20)}, ${lightenColor(leftColor, 40)})`,
    rightBg: `linear-gradient(225deg, ${rightColor}, ${lightenColor(rightColor, 20)}, ${lightenColor(rightColor, 40)})`,
    leftGeo1: document.getElementById('sponsors-geo-l1').value,
    leftGeo2: document.getElementById('sponsors-geo-l2').value,
    rightGeo1: document.getElementById('sponsors-geo-r1').value,
    rightGeo2: document.getElementById('sponsors-geo-r2').value,
    contentBg: document.getElementById('sponsors-content-bg').value
  };
  socket.emit('trigger-sponsors-lt', options);
  document.getElementById('sponsors-lt-toggle').checked = true;
  setLiveIndicator('sponsors-lt', true);
  toast('🤝 Sponsors!', 'success');
}

function lightenColor(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000FF) + Math.round(2.55 * percent));
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function toggleSponsorsLT(active) {
  if (active) { triggerSponsorsLT(); }
  else { socket.emit('trigger-sponsors-lt-hide'); setLiveIndicator('sponsors-lt', false); toast('Sponsors removido', 'success'); }
}

// ============================================
// BARRA ESPORTIVA
// ============================================

function getSportsLTOptions() {
  const customLogo = document.getElementById('sports-logo-url').value.trim();
  const globalLogo = document.getElementById('global-logo-url').value.trim();
  const resolvedLogo = (customLogo && customLogo !== '/src/sbc_assets/logo-maratona.png')
    ? customLogo
    : ((globalLogo && globalLogo !== '/src/sbc_assets/logo-maratona.png') ? globalLogo : '/src/sbc_assets/sabia-voando.png');

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
    logoUrl: resolvedLogo
  };
}

function applySportsLT() {
  const titleText = document.getElementById('sports-title').value.trim();
  const subtitleText = document.getElementById('sports-subtitle').value.trim();
  if (!titleText && !subtitleText) {
    document.getElementById('sports-lt-toggle').checked = false;
    toast('Preencha ao menos um campo!', 'error');
    return false;
  }
  socket.emit('trigger-sports-lt', { options: getSportsLTOptions() });
  document.getElementById('sports-lt-toggle').checked = true;
  setLiveIndicator('sports-lt', true);
  toast('🏟️ Barra atualizada!', 'success');
  return true;
}

function toggleSportsLT(active) {
  if (active) { applySportsLT(); }
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
  setVal('rankup-team', '');
  setVal('rankup-position', '');
  socket.emit('state-update', { inputs: { 'rankup-team': '', 'rankup-position': '' } });
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

  if (!letter) {
    document.getElementById('problem-lt-toggle').checked = false;
    toast('Selecione o problema!', 'error');
    return false;
  }

  const opt = select.options[select.selectedIndex];
  const name = opt.dataset.name || '';

  socket.emit('trigger-problem-lt', { letter, name, acs: acs || '0' });
  document.getElementById('problem-lt-toggle').checked = true;
  setLiveIndicator('problem-lt', true);
  toast('📋 Problema ' + letter, 'success');
  return true;
}

function toggleProblemLT(active) {
  if (active) { applyProblemLT(); }
  else { socket.emit('trigger-problem-lt-hide'); setLiveIndicator('problem-lt', false); toast('LT Problema removido', 'success'); }
}

// ============================================
// REGISTRO CENTRAL DE PROBLEMAS
// ============================================

function getProblems() {
  if (Array.isArray(sharedState.problems) && sharedState.problems.length > 0) {
    return sharedState.problems;
  }
  const letters = 'ABCDEFGHIJKL';
  return letters.split('').map((l, i) => ({
    letter: l,
    name: '',
    color: DEFAULT_PROBLEM_COLORS[i]
  }));
}

function saveProblems(problems) {
  sharedState.problems = problems;
  refreshProblemDropdowns();
  renderProblemRegistry();
  renderProblemStatsEditor();
  socket.emit('state-update', { problems });
}

function refreshProblemDropdowns() {
  const problems = getProblems();
  // Dropdown do First AC
  const firstacSelect = document.getElementById('firstac-problem-select');
  if (firstacSelect) {
    const currentVal = firstacSelect.value || sharedState.inputs['firstac-problem-select'] || '';
    firstacSelect.innerHTML = '<option value="">-- Selecione --</option>';
    problems.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.letter;
      opt.textContent = p.name ? `Problema ${p.letter} - ${p.name}` : `Problema ${p.letter}`;
      opt.dataset.color = p.color;
      opt.dataset.name = p.name || '';
      firstacSelect.appendChild(opt);
    });
    if (currentVal) firstacSelect.value = currentVal;
  }
  // Dropdown do LT Problema
  const probSelect = document.getElementById('prob-problem-select');
  if (probSelect) {
    const currentVal = probSelect.value || sharedState.inputs['prob-problem-select'] || '';
    probSelect.innerHTML = '<option value="">-- Selecione --</option>';
    problems.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.letter;
      opt.textContent = p.name ? `Problema ${p.letter} - ${p.name}` : `Problema ${p.letter}`;
      opt.dataset.name = p.name || '';
      probSelect.appendChild(opt);
    });
    if (currentVal) probSelect.value = currentVal;
  }
}

function renderProblemRegistry() {
  const container = document.getElementById('problem-registry');
  if (!container) return;
  const problems = getProblems();

  container.innerHTML = problems.map((p, i) => `
    <div class="problem-row edit-row">
      <div class="problem-letter-badge" style="background:${escapeHtml(p.color)}">${escapeHtml(p.letter)}</div>
      <input type="text" value="${escapeHtml(p.name)}" placeholder="Nome do problema ${escapeHtml(p.letter)}"
             onchange="updateProblem(${i}, 'name', this.value)" maxlength="35">
      <input type="color" value="${escapeHtml(p.color)}"
             onchange="updateProblem(${i}, 'color', this.value)">
      <button class="btn-mini btn-mini-del" onclick="deleteProblem(${i})" title="Remover">✕</button>
    </div>
  `).join('');
}

function updateProblem(idx, field, value) {
  const problems = [...getProblems()];
  if (!problems[idx]) return;
  problems[idx] = { ...problems[idx], [field]: value };
  sharedState.problems = problems;
  refreshProblemDropdowns();
  renderProblemStatsEditor();
  if (field === 'color') renderProblemRegistry();
  socket.emit('state-update', { problems });
}

function addProblemRow() {
  const problems = [...getProblems()];
  const usedLetters = problems.map(p => p.letter);
  const nextLetter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(l => !usedLetters.includes(l)) || '?';
  problems.push({ letter: nextLetter, name: '', color: '#FFD700' });
  saveProblems(problems);
}

function deleteProblem(idx) {
  const problems = [...getProblems()];
  if (!problems[idx]) return;
  if (!confirm(`Remover Problema ${problems[idx].letter}?`)) return;
  problems.splice(idx, 1);
  saveProblems(problems);
}

function clearAllProblems() {
  if (!confirm('Resetar TODOS os problemas para A-L padrão?')) return;
  const defaultProbs = 'ABCDEFGHIJKL'.split('').map((l, i) => ({
    letter: l,
    name: '',
    color: DEFAULT_PROBLEM_COLORS[i]
  }));
  saveProblems(defaultProbs);
  toast('🧹 Todos os problemas resetados!', 'success');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str == null ? '' : String(str);
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

function getFirstACEntries() {
  return Array.isArray(sharedState.firstAcEntries) ? sharedState.firstAcEntries : [];
}

function saveFirstACEntry(team, university, problem, color) {
  const entries = [...getFirstACEntries()];
  entries.push({ team, university, problem, color, time: new Date().toLocaleTimeString() });
  sharedState.firstAcEntries = entries;
  renderScoreboardManager();
  socket.emit('state-update', { firstAcEntries: entries });
  if (scoreboardVisible) refreshScoreboard();
}

function deleteFirstACEntry(idx) {
  const entries = [...getFirstACEntries()];
  if (!entries[idx]) return;
  if (!confirm(`Remover "${entries[idx].team}" do placar?`)) return;
  entries.splice(idx, 1);
  sharedState.firstAcEntries = entries;
  renderScoreboardManager();
  socket.emit('state-update', { firstAcEntries: entries });
  toast('Entrada removida!', 'success');
  if (scoreboardVisible) refreshScoreboard();
}

function addManualFirstACEntry() {
  const team = prompt('Nome do time:');
  if (!team) return;
  const university = prompt('Universidade:') || '';
  const problem = prompt('Problema (ex: Problema C - DNA):');
  if (!problem) return;
  const color = '#FFD700';
  const entries = [...getFirstACEntries()];
  entries.push({ team, university, problem, color, time: new Date().toLocaleTimeString() });
  sharedState.firstAcEntries = entries;
  renderScoreboardManager();
  socket.emit('state-update', { firstAcEntries: entries });
  toast('✅ Entrada adicionada!', 'success');
  if (scoreboardVisible) refreshScoreboard();
}

function refreshScoreboard() {
  const entries = getFirstACEntries();
  socket.emit('trigger-scoreboard', { entries });
}

function deleteLastFirstAC() {
  const entries = [...getFirstACEntries()];
  if (entries.length === 0) { toast('Nenhuma entrada!', 'error'); return; }
  const last = entries[entries.length - 1];
  if (!confirm(`Remover última entrada: "${last.team}"?`)) return;
  entries.pop();
  sharedState.firstAcEntries = entries;
  renderScoreboardManager();
  socket.emit('state-update', { firstAcEntries: entries });
  toast('🗑 Última entrada removida!', 'success');
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
      <span style="flex:1;"><strong>${escapeHtml(e.team)}</strong> ${e.university ? '<small style="color:var(--text-dim)">('+escapeHtml(e.university)+')</small>' : ''}</span>
      <span style="color:var(--text-dim);font-size:12px;">${escapeHtml(e.problem)}</span>
      <button class="btn-mini btn-mini-del" onclick="deleteFirstACEntry(${i})" style="width:28px;height:28px;font-size:12px;" title="Remover">✕</button>
    </div>
  `).join('');
}

function clearFirstACEntries() {
  if (!confirm('Apagar TODAS as entradas do placar?')) return;
  sharedState.firstAcEntries = [];
  renderScoreboardManager();
  socket.emit('state-update', { firstAcEntries: [] });
  toast('🧹 Placar limpo!', 'success');
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
  const fullProblemName = problemName ? `Problema ${letter} - ${problemName}` : `Problema ${letter}`;

  saveFirstACEntry(teamName, university, fullProblemName, color);
  socket.emit('trigger-firstac', { teamName, problemName: fullProblemName, color });
  toast(`⭐ First AC: ${teamName} - ${fullProblemName}`, 'success');
  setVal('firstac-team', '');
  setVal('firstac-university', '');
  socket.emit('state-update', { inputs: { 'firstac-team': '', 'firstac-university': '' } });
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

function getMedalRows() {
  return Array.isArray(sharedState.medalTable) ? sharedState.medalTable : [];
}

function saveMedalRows(rows) {
  sharedState.medalTable = rows;
  renderMedalEditor();
  socket.emit('state-update', { medalTable: rows });
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
  const rows = [...getMedalRows()];
  if (!rows[idx]) return;
  rows[idx] = { ...rows[idx], [field]: value };
  sharedState.medalTable = rows;
  socket.emit('state-update', { medalTable: rows });
}

function addMedalRow() {
  const rows = [...getMedalRows()];
  rows.push({ name: '', gold: 0, silver: 0, bronze: 0 });
  saveMedalRows(rows);
}

function deleteMedalRow(idx) {
  const rows = [...getMedalRows()];
  rows.splice(idx, 1);
  saveMedalRows(rows);
}

function clearMedalTable() {
  if (!confirm('Limpar todas as universidades?')) return;
  saveMedalRows([]);
  toast('🧹 Placar limpo!', 'success');
}

function applyMedalTable() {
  const rows = getMedalRows();
  const filled = rows.filter(r => r.name && r.name.trim());
  if (filled.length === 0) {
    document.getElementById('medaltable-toggle').checked = false;
    toast('Adicione ao menos uma universidade!', 'error');
    return false;
  }
  socket.emit('trigger-medal-table', { rows: filled });
  document.getElementById('medaltable-toggle').checked = true;
  setLiveIndicator('medal-table', true);
  toast('🏅 Placar atualizado!', 'success');
  return true;
}

function toggleMedalTable(active) {
  if (active) { applyMedalTable(); }
  else { socket.emit('trigger-medal-table-hide'); setLiveIndicator('medal-table', false); toast('Placar escondido', 'success'); }
}

// ============================================
// ESTATÍSTICAS DE PROBLEMAS (ACs + badges)
// ============================================

function getProblemStats() {
  return Array.isArray(sharedState.problemStats) ? sharedState.problemStats : [];
}

function getAvailableProblems() {
  const globalProbs = getProblems().filter(p => p.name && p.name.trim());
  const statsProbs = getProblemStats();
  const usedLetters = statsProbs.map(s => s.letter);
  return globalProbs.filter(p => !usedLetters.includes(p.letter));
}

function saveProblemStats(rows) {
  sharedState.problemStats = rows;
  renderProblemStatsEditor();
  socket.emit('state-update', { problemStats: rows });
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
        <div class="problemstats-letter edit-badge" style="background:${escapeHtml(r.color || '#FFD700')}">${escapeHtml(r.letter)}</div>
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
          ${available.map(p => `<option value="${escapeHtml(p.letter)}">Problema ${escapeHtml(p.letter)} - ${escapeHtml(p.name)}</option>`).join('')}
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

  const rows = [...getProblemStats()];
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
  const rows = [...getProblemStats()];
  if (!rows[idx]) return;
  rows[idx] = { ...rows[idx], [field]: value };
  sharedState.problemStats = rows;
  socket.emit('state-update', { problemStats: rows });
}

function deleteProblemStat(idx) {
  const rows = [...getProblemStats()];
  rows.splice(idx, 1);
  saveProblemStats(rows);
}

function resetProblemStats() {
  if (!confirm('Remover TODOS os problemas da tabela?')) return;
  saveProblemStats([]);
  toast('🧹 Tabela limpa!', 'success');
}

function applyProblemStats() {
  const rows = getProblemStats();
  if (rows.length === 0) {
    document.getElementById('problemstats-toggle').checked = false;
    toast('Nenhum problema!', 'error');
    return false;
  }
  socket.emit('trigger-problem-stats', { rows });
  document.getElementById('problemstats-toggle').checked = true;
  setLiveIndicator('problem-stats', true);
  toast('📊 Estatísticas atualizadas!', 'success');
  return true;
}

function toggleProblemStats(active) {
  if (active) { applyProblemStats(); }
  else { socket.emit('trigger-problem-stats-hide'); setLiveIndicator('problem-stats', false); toast('Tabela escondida', 'success'); }
}

// ============================================
// YOUTUBE CHAT
// ============================================

let activeCommentId = null;

function getYTConfig() {
  return sharedState.ytConfig || { apiKey: '', liveChatId: '' };
}

function saveYTConfig(config) {
  sharedState.ytConfig = { ...sharedState.ytConfig, ...config };
  socket.emit('state-update', { ytConfig: sharedState.ytConfig });
}

function getYTFavorites() {
  return Array.isArray(sharedState.ytFavorites) ? sharedState.ytFavorites : [];
}

function saveYTFavorite(author, message) {
  const favs = [...getYTFavorites()];
  if (favs.find(f => f.message === message && f.author === author)) {
    toast('Já está nos favoritos!', 'error');
    return;
  }
  favs.unshift({ author, message, time: new Date().toLocaleTimeString() });
  const trimmed = favs.slice(0, 30);
  sharedState.ytFavorites = trimmed;
  renderYTFavorites();
  socket.emit('state-update', { ytFavorites: trimmed });
  toast('⭐ Favorito salvo!', 'success');
}

function clearYTFavorites() {
  if (!confirm('Limpar todos os favoritos?')) return;
  sharedState.ytFavorites = [];
  renderYTFavorites();
  socket.emit('state-update', { ytFavorites: [] });
  toast('Favoritos limpos!', 'success');
}

function clickFavorite(author, message, el) {
  document.querySelectorAll('.yt-msg').forEach(m => m.classList.remove('active'));
  if (el) el.classList.add('active');
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

  container.innerHTML = favs.map((f) => `
    <div class="yt-msg fav-msg" style="border-color:rgba(255,215,0,0.15);" data-author="${escapeHtml(f.author).replace(/"/g,'&quot;')}" data-message="${escapeHtml(f.message).replace(/"/g,'&quot;')}">
      <div class="yt-msg-header">
        <strong style="color:#FFD700;">⭐ ${escapeHtml(f.author)}</strong>
        <small>${escapeHtml(f.time)}</small>
      </div>
      <div class="yt-msg-text">${escapeHtml(f.message)}</div>
    </div>
  `).join('');

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
    document.getElementById('yt-chat-toggle').checked = false;
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

  // Remove texto de placeholder se existir
  const placeholder = container.querySelector('p');
  if (placeholder) placeholder.remove();

  messages.forEach(msg => {
    if (document.getElementById('msg-' + msg.id)) return;
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
  setLiveIndicator('yt-chat', !!data.active);
});

// Carrega config salva
function loadYTConfig() {
  const config = getYTConfig();
  const apiKeyEl = document.getElementById('yt-apikey');
  const chatIdEl = document.getElementById('yt-chatid');
  if (apiKeyEl && document.activeElement !== apiKeyEl && config.apiKey !== undefined) {
    apiKeyEl.value = config.apiKey;
  }
  if (chatIdEl && document.activeElement !== chatIdEl && config.liveChatId !== undefined) {
    chatIdEl.value = config.liveChatId;
  }
}

// ============================================
// EFEITOS E ATALHOS
// ============================================

function triggerConfetti() { socket.emit('trigger-confetti'); toast('🎊 Confete!', 'success'); }
function triggerClear() { socket.emit('trigger-clear'); toast('🧹 Limpo!', 'success'); }

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

window.addEventListener('DOMContentLoaded', () => {
  bindSyncedInputs();
  injectLiveDots();
});
