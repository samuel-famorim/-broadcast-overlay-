const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');
const basicAuth = require('express-basic-auth');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Credenciais - altere aqui ou via variáveis de ambiente
const AUTH_USER = process.env.CONTROL_USER || 'admin';
const AUTH_PASS = process.env.CONTROL_PASS || 'maratona';

const authMiddleware = basicAuth({
  users: { [AUTH_USER]: AUTH_PASS },
  challenge: true,
  realm: 'Painel de Controle - Maratona SBC'
});

// Protege rotas administrativas antes do express.static
app.get('/', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/index.html', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/control', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.get('/control.html', authMiddleware, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

app.use(express.static(path.join(__dirname, 'public')));
app.use('/src', express.static(path.join(__dirname, 'src')));

// ============================================
// PERSISTÊNCIA DE ESTADO (JSON + REAL-TIME SYNC)
// ============================================

const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

const DEFAULT_PROBLEM_COLORS = [
  '#FF3366', '#00BFFF', '#FFD700', '#00FF88', '#FF6B35', '#7B68EE',
  '#FF69B4', '#E0E0E0', '#4169E1', '#CD853F', '#00CED1', '#ADFF2F'
];

function getDefaultProblems() {
  return 'ABCDEFGHIJKL'.split('').map((l, i) => ({
    letter: l,
    name: '',
    color: DEFAULT_PROBLEM_COLORS[i]
  }));
}

function getDefaultPresets(type) {
  const padraoColors = {
    topBg: '#2962ff',
    bottomBg: '#00e5ff',
    logoBg: '#10152b',
    nameColor: '#ffffff',
    roleColor: '#0b0e27',
    membersColor: '#0b0e27',
    topText: '#ffffff',
    bottomText: '#0b0e27',
    geo1: '#ff6a00',
    geo2: '#9d00ff',
    logoUrl: '/src/sbc_assets/sabia-voando.png'
  };

  const finalColors = {
    topBg: '#10152b',
    bottomBg: '#0b0e27',
    logoBg: '#10152b',
    nameColor: '#00e5ff',
    roleColor: '#94a3b8',
    membersColor: '#94a3b8',
    topText: '#00e5ff',
    bottomText: '#94a3b8',
    geo1: '#ff6a00',
    geo2: '#9d00ff',
    logoUrl: '/src/sbc_assets/sabia-voando.png'
  };

  const ufuColors = {
    topBg: '#152069',
    bottomBg: '#0c0b4d',
    logoBg: '#10113c',
    nameColor: '#ffffff',
    roleColor: '#00e5ff',
    membersColor: '#00e5ff',
    topText: '#ffffff',
    bottomText: '#ff6a00',
    geo1: '#ff6a00',
    geo2: '#9d00ff',
    logoUrl: '/src/sbc_assets/sabia-voando.png'
  };

  if (type === 'globalcolors') {
    return [
      { label: 'Maratona Padrão', colors: { ...padraoColors } },
      { label: 'Maratona Final 2026', colors: { ...finalColors } },
      { label: 'Maratona Final 2026 - FACOM UFU', colors: { ...ufuColors } }
    ];
  }
  if (type === 'pessoas') {
    return [
      {
        label: 'Maratona Padrão',
        leftName: 'NOME DO CONVIDADO',
        leftRole: 'ESPECIALISTA',
        rightName: 'NOME DO HOST',
        rightRole: 'APRESENTADOR',
        colors: { ...padraoColors }
      },
      {
        label: 'Maratona Final 2026',
        leftName: 'NOME DA PESSOA',
        leftRole: 'CARGO / FUNÇÃO',
        rightName: 'NOME DA PESSOA',
        rightRole: 'CARGO / FUNÇÃO',
        colors: { ...finalColors }
      },
      {
        label: 'Maratona Final 2026 - FACOM UFU',
        leftName: 'NOME DA PESSOA',
        leftRole: 'FACOM / UFU',
        rightName: 'NOME DA PESSOA',
        rightRole: 'CARGO / FUNÇÃO',
        colors: { ...ufuColors }
      }
    ];
  }
  if (type === 'time') {
    return [
      {
        label: 'Maratona Padrão',
        teamName: 'NOME DO TIME',
        m1: 'Membro 1',
        m2: 'Membro 2',
        m3: 'Membro 3',
        colors: { ...padraoColors }
      },
      {
        label: 'Maratona Final 2026',
        teamName: 'NOME DO TIME FINALISTA',
        m1: 'COMPETIDOR 1',
        m2: 'COMPETIDOR 2',
        m3: 'COMPETIDOR 3',
        colors: { ...finalColors }
      },
      {
        label: 'Maratona Final 2026 - FACOM UFU',
        teamName: 'NOME DO TIME FINALISTA',
        m1: 'COMPETIDOR 1',
        m2: 'COMPETIDOR 2',
        m3: 'COMPETIDOR 3',
        colors: { ...ufuColors }
      }
    ];
  }
  if (type === 'barra') {
    return [
      {
        label: 'Maratona Padrão',
        titleText: 'AO VIVO • MARATONA SBC',
        subtitleText: 'PROGRAMAÇÃO',
        colors: { ...padraoColors }
      },
      {
        label: 'Maratona Final 2026',
        titleText: 'FINAL BRASILEIRA 2026',
        subtitleText: 'UBERLÂNDIA/MG',
        colors: { ...finalColors }
      },
      {
        label: 'Maratona Final 2026 - FACOM UFU',
        titleText: '31ª MARATONA SBC DE PROGRAMAÇÃO',
        subtitleText: 'FACOM • UFU • UBERLÂNDIA/MG',
        colors: { ...ufuColors }
      }
    ];
  }
  return [];
}

function createDefaultState() {
  return {
    settings: {
      marathonName: 'Maratona SBC de Programação',
      activeTheme: 'final2026'
    },
    presets: {
      pessoas: getDefaultPresets('pessoas'),
      time: getDefaultPresets('time'),
      barra: getDefaultPresets('barra'),
      medaltable: [],
      problemstats: [],
      globalcolors: getDefaultPresets('globalcolors')
    },
    problems: getDefaultProblems(),
    firstAcEntries: [],
    medalTable: [],
    problemStats: [],
    ytConfig: { apiKey: '', liveChatId: '' },
    ytFavorites: [],
    inputs: {
      'global-marathon-name': 'Maratona SBC de Programação',
      'global-top-bg': '#10152b',
      'global-bottom-bg': '#0b0e27',
      'global-logo-bg': '#10152b',
      'global-name-color': '#00e5ff',
      'global-role-color': '#94a3b8',
      'global-geo1': '#ff6a00',
      'global-geo2': '#9d00ff',
      'global-logo-url': '/src/sbc_assets/sabia-voando.png',
      'lt-left-name': 'NOME DA PESSOA',
      'lt-left-role': 'CARGO / FUNÇÃO',
      'lt-right-name': 'NOME DA PESSOA',
      'lt-right-role': 'CARGO / FUNÇÃO',
      'lt-top-bg': '#10152b',
      'lt-bottom-bg': '#0b0e27',
      'lt-logo-bg': '#10152b',
      'lt-name-color': '#00e5ff',
      'lt-role-color': '#94a3b8',
      'lt-geo1': '#ff6a00',
      'lt-geo2': '#9d00ff',
      'lt-logo-url': '/src/sbc_assets/sabia-voando.png',
      'team-lt-name': 'NOME DO TIME FINALISTA',
      'team-lt-m1': 'COMPETIDOR 1',
      'team-lt-m2': 'COMPETIDOR 2',
      'team-lt-m3': 'COMPETIDOR 3',
      'team-lt-top-bg': '#10152b',
      'team-lt-bottom-bg': '#0b0e27',
      'team-lt-logo-bg': '#10152b',
      'team-lt-name-color': '#00e5ff',
      'team-lt-members-color': '#94a3b8',
      'team-lt-logo': '/src/sbc_assets/sabia-voando.png',
      'sports-title': 'FINAL BRASILEIRA 2026',
      'sports-subtitle': 'UBERLÂNDIA/MG',
      'sports-top-bg': '#10152b',
      'sports-bottom-bg': '#0b0e27',
      'sports-logo-bg': '#10152b',
      'sports-top-text': '#00e5ff',
      'sports-bottom-text': '#94a3b8',
      'sports-geo1': '#ff6a00',
      'sports-geo2': '#9d00ff',
      'sports-logo-url': '/src/sbc_assets/sabia-voando.png',
      'sponsors-left-bg': '#FF1493',
      'sponsors-right-bg': '#00BFFF',
      'sponsors-geo-l1': '#FF1493',
      'sponsors-geo-l2': '#FFD700',
      'sponsors-geo-r1': '#00BFFF',
      'sponsors-geo-r2': '#00FF88',
      'sponsors-content-bg': '#FFFFFF',
      'sponsors-title': 'NOSSOS PATROCINADORES',
      'sponsors-speed': '35',
      'sponsors-color-top': '#152261',
      'sponsors-color-bot': '#050824',
      'sponsors-color-title': '#a5b9f4',
      'ticker-text': '',
      'ticker-color': '#FFD700',
      'ticker-bg': '#000000',
      'ticker-speed': '20',
      'prob-problem-select': '',
      'prob-acs-input': '',
      'firstac-problem-select': '',
      'firstac-team': '',
      'firstac-university': '',
      'medal-team': '',
      'medal-type': 'gold',
      'medal-position': 'center',
      'balloon-team': '',
      'rankup-team': '',
      'rankup-position': '',
      'alert-message': '',
      'countdown-from': '5'
    },
    activeOverlays: {
      ltLeft: null,
      ltRight: null,
      teamLt: null,
      sportsLt: null,
      sponsorsLt: null,
      problemLt: null,
      scoreboard: null,
      medalTable: null,
      problemStats: null,
      ticker: null,
      comment: null
    }
  };
}

function loadStateFromDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STATE_FILE)) {
      const raw = fs.readFileSync(STATE_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      const def = createDefaultState();
      const presets = { ...def.presets, ...(parsed.presets || {}) };
      // Garante que presets padrão estejam presentes se ainda não existirem no estado salvo
      ['pessoas', 'time', 'barra', 'globalcolors'].forEach(type => {
        const defArr = def.presets[type] || [];
        const existing = Array.isArray(presets[type]) ? [...presets[type]] : [];
        defArr.forEach(dp => {
          if (!existing.some(ep => ep.label === dp.label)) {
            existing.push(dp);
          }
        });
        presets[type] = existing;
      });
      return {
        ...def,
        ...parsed,
        settings: { ...def.settings, ...(parsed.settings || {}) },
        presets,
        inputs: { ...def.inputs, ...(parsed.inputs || {}) },
        activeOverlays: { ...def.activeOverlays, ...(parsed.activeOverlays || {}) }
      };
    }
  } catch (err) {
    console.error('[state] Erro ao carregar state.json:', err.message);
  }
  const initial = createDefaultState();
  saveStateToDisk(initial);
  return initial;
}

let saveTimeout = null;
function saveStateToDisk(stateObj = appState) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(stateObj, null, 2), 'utf8');
  } catch (err) {
    console.error('[state] Erro ao salvar state.json:', err.message);
  }
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => saveStateToDisk(appState), 150);
}

let appState = loadStateFromDisk();

// ============================================
// SOCKET.IO - EVENTOS E SINCRONIZAÇÃO
// ============================================

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Envia estado completo e configurações atuais ao conectar
  socket.emit('state-init', appState);
  socket.emit('settings-updated', appState.settings);

  // Sincronização de fatias do estado (presets, problemas, medalTable, etc.)
  socket.on('state-update', (patch) => {
    if (!patch || typeof patch !== 'object') return;

    if (patch.settings) {
      Object.assign(appState.settings, patch.settings);
      io.emit('settings-updated', appState.settings);
    }
    if (patch.presets) {
      Object.assign(appState.presets, patch.presets);
    }
    if (Array.isArray(patch.problems)) {
      appState.problems = patch.problems;
    }
    if (Array.isArray(patch.firstAcEntries)) {
      appState.firstAcEntries = patch.firstAcEntries;
    }
    if (Array.isArray(patch.medalTable)) {
      appState.medalTable = patch.medalTable;
    }
    if (Array.isArray(patch.problemStats)) {
      appState.problemStats = patch.problemStats;
    }
    if (patch.ytConfig) {
      Object.assign(appState.ytConfig, patch.ytConfig);
    }
    if (Array.isArray(patch.ytFavorites)) {
      appState.ytFavorites = patch.ytFavorites;
    }
    if (patch.inputs) {
      Object.assign(appState.inputs, patch.inputs);
    }

    scheduleSave();
    socket.broadcast.emit('state-patched', patch);
  });

  // Atualização rápida de inputs do formulário em tempo real
  socket.on('input-change', (data) => {
    if (!data || !data.id) return;
    appState.inputs[data.id] = data.value;
    scheduleSave();
    socket.broadcast.emit('input-updated', data);
  });

  // Resetar presets para os padrões da SBC
  socket.on('reset-presets', () => {
    appState.presets = {
      pessoas: getDefaultPresets('pessoas'),
      time: getDefaultPresets('time'),
      barra: getDefaultPresets('barra'),
      medaltable: [],
      problemstats: [],
      globalcolors: getDefaultPresets('globalcolors')
    };
    scheduleSave();
    io.emit('state-patched', { presets: appState.presets });
  });

  socket.on('trigger-medal', (data) => {
    console.log(`[medal] ${data.teamName} - ${data.medalType || 'gold'} - ${data.position || 'center'}`);
    io.emit('show-medal', data);
  });

  socket.on('trigger-balloon', (data) => {
    console.log(`[balloon] ${data.teamName} - ${data.color}`);
    io.emit('show-balloon', data);
  });

  socket.on('trigger-alert', (data) => {
    console.log(`[alert] ${data.type} - ${data.message}`);
    io.emit('show-alert', data);
  });

  socket.on('trigger-confetti', () => {
    console.log('[confetti] burst!');
    io.emit('show-confetti');
  });

  socket.on('show-lowerthird', (data) => {
    console.log(`[lowerthird] ${data.side} - ${data.name} (${data.role})`);
    if (data.side === 'left') appState.activeOverlays.ltLeft = data;
    if (data.side === 'right') appState.activeOverlays.ltRight = data;
    scheduleSave();
    io.emit('show-lowerthird', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('hide-lowerthird', (data) => {
    console.log(`[hide-lowerthird] ${data.side}`);
    if (data.side === 'left') appState.activeOverlays.ltLeft = null;
    if (data.side === 'right') appState.activeOverlays.ltRight = null;
    scheduleSave();
    io.emit('hide-lowerthird', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  // Eventos da Prova
  socket.on('trigger-start', () => {
    console.log('[event] inicio da prova');
    io.emit('show-contest-start');
  });

  socket.on('trigger-end', () => {
    console.log('[event] fim da prova');
    io.emit('show-contest-end');
  });

  socket.on('trigger-frozen', () => {
    console.log('[event] placar congelado');
    io.emit('show-frozen');
  });

  socket.on('trigger-blind', () => {
    console.log('[event] modo cego');
    io.emit('show-blind');
  });

  socket.on('trigger-rankup', (data) => {
    console.log(`[event] subiu para #${data.position}`);
    io.emit('show-rankup', data);
  });

  socket.on('trigger-ticker', (data) => {
    console.log(`[ticker] ${data.text}`);
    appState.activeOverlays.ticker = data;
    scheduleSave();
    io.emit('show-ticker', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-ticker-stop', () => {
    console.log('[ticker] stop');
    appState.activeOverlays.ticker = null;
    scheduleSave();
    io.emit('hide-ticker');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-countdown', (data) => {
    console.log(`[countdown] from ${data.from}`);
    io.emit('show-countdown', data);
  });

  socket.on('trigger-problem-lt', (data) => {
    console.log(`[problem-lt] ${data.letter} - ${data.name} (${data.acs} ACs)`);
    appState.activeOverlays.problemLt = data;
    scheduleSave();
    io.emit('show-problem-lt', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-problem-lt-hide', () => {
    console.log('[problem-lt] hide');
    appState.activeOverlays.problemLt = null;
    scheduleSave();
    io.emit('hide-problem-lt');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-firstac', (data) => {
    console.log(`[firstac] ${data.teamName} - ${data.problemName}`);
    io.emit('show-firstac', data);
  });

  socket.on('trigger-scoreboard', (data) => {
    console.log('[scoreboard] show');
    appState.activeOverlays.scoreboard = data;
    scheduleSave();
    io.emit('show-scoreboard', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-scoreboard-hide', () => {
    console.log('[scoreboard] hide');
    appState.activeOverlays.scoreboard = null;
    scheduleSave();
    io.emit('hide-scoreboard');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-medal-table', (data) => {
    console.log('[medal-table] show');
    appState.activeOverlays.medalTable = data;
    scheduleSave();
    io.emit('show-medal-table', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-medal-table-hide', () => {
    console.log('[medal-table] hide');
    appState.activeOverlays.medalTable = null;
    scheduleSave();
    io.emit('hide-medal-table');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-problem-stats', (data) => {
    console.log('[problem-stats] show');
    appState.activeOverlays.problemStats = data;
    scheduleSave();
    io.emit('show-problem-stats', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-problem-stats-hide', () => {
    console.log('[problem-stats] hide');
    appState.activeOverlays.problemStats = null;
    scheduleSave();
    io.emit('hide-problem-stats');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-sports-lt', (data) => {
    console.log(`[sports-lt] ${data?.options?.titleText || '...'}`);
    appState.activeOverlays.sportsLt = data;
    scheduleSave();
    io.emit('show-sports-lt', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-sports-lt-hide', () => {
    console.log('[sports-lt] hide');
    appState.activeOverlays.sportsLt = null;
    scheduleSave();
    io.emit('hide-sports-lt');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-team-lt', (data) => {
    console.log(`[team-lt] ${data.teamName}`);
    appState.activeOverlays.teamLt = data;
    scheduleSave();
    io.emit('show-team-lt', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-team-lt-hide', () => {
    console.log('[team-lt] hide');
    appState.activeOverlays.teamLt = null;
    scheduleSave();
    io.emit('hide-team-lt');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-sponsors-lt', (data) => {
    console.log('[sponsors-lt] show');
    appState.activeOverlays.sponsorsLt = data || {};
    scheduleSave();
    io.emit('show-sponsors-lt', data || {});
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-sponsors-lt-hide', () => {
    console.log('[sponsors-lt] hide');
    appState.activeOverlays.sponsorsLt = null;
    scheduleSave();
    io.emit('hide-sponsors-lt');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('update-settings', (data) => {
    console.log('[settings] update', data);
    Object.assign(appState.settings, data);
    if (data.marathonName) {
      appState.inputs['global-marathon-name'] = data.marathonName;
    }
    scheduleSave();
    io.emit('settings-updated', appState.settings);
  });

  // Envia histórico de chat ao conectar
  if (lastYtMessages.length > 0) {
    socket.emit('yt-chat-messages', lastYtMessages);
  }
  socket.emit('yt-status', { active: ytIsConnected, paused: ytIsPaused });

  // YouTube Chat
  socket.on('yt-start', (config) => {
    if (config && config.apiKey && config.liveChatId) {
      appState.ytConfig = { apiKey: config.apiKey, liveChatId: config.liveChatId };
      scheduleSave();
      socket.broadcast.emit('state-patched', { ytConfig: appState.ytConfig });
    }
    startYTPolling(config.apiKey, config.liveChatId);
    io.emit('yt-status', { active: true, paused: false });
  });

  socket.on('yt-stop', () => {
    stopYTPolling();
    lastYtMessages = [];
    io.emit('yt-status', { active: false, paused: false });
  });

  socket.on('yt-pause', () => {
    pauseYTPolling();
    io.emit('yt-status', { active: true, paused: true });
  });

  socket.on('yt-resume', () => {
    resumeYTPolling();
    io.emit('yt-status', { active: true, paused: false });
  });

  socket.on('yt-sync', () => {
    forceYTSync();
  });

  socket.on('yt-status-request', () => {
    socket.emit('yt-status', { active: ytIsConnected, paused: ytIsPaused });
  });

  socket.on('trigger-show-comment', (data) => {
    console.log(`[comment] ${data.author}: ${data.message}`);
    appState.activeOverlays.comment = data;
    scheduleSave();
    io.emit('show-comment', data);
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-hide-comment', () => {
    appState.activeOverlays.comment = null;
    scheduleSave();
    io.emit('hide-comment');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('comment-hidden', () => {
    appState.activeOverlays.comment = null;
    scheduleSave();
    io.emit('comment-hidden');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('trigger-clear', () => {
    console.log('[clear]');
    Object.keys(appState.activeOverlays).forEach(k => {
      appState.activeOverlays[k] = null;
    });
    scheduleSave();
    io.emit('clear-all');
    io.emit('overlays-updated', appState.activeOverlays);
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
  });
});

// ============================================
// YOUTUBE LIVE CHAT INTEGRATION
// ============================================

let ytPolling = null;
let ytConfig = { apiKey: '', liveChatId: '' };
let ytNextPageToken = null;
let ytIsPaused = false;
let ytIsConnected = false;
let lastYtMessages = []; // últimas 50 mensagens

function stopYTPolling() {
  if (ytPolling) { clearTimeout(ytPolling); ytPolling = null; }
  ytIsConnected = false;
  console.log('[yt-chat] Polling parado');
}

function pauseYTPolling() {
  ytIsPaused = true;
  if (ytPolling) { clearTimeout(ytPolling); ytPolling = null; }
  console.log('[yt-chat] Polling pausado');
}

function resumeYTPolling() {
  if (!ytIsConnected) return;
  ytIsPaused = false;
  console.log('[yt-chat] Polling retomado');
  pollYTApi();
}

async function forceYTSync() {
  if (!ytIsConnected) return;
  console.log('[yt-chat] Sincronização manual...');
  if (ytPolling) { clearTimeout(ytPolling); ytPolling = null; }
  const { interval } = await fetchYTMessages();
  if (!ytIsPaused) {
    ytPolling = setTimeout(pollYTApi, interval);
  }
}

async function fetchYTMessages() {
  try {
    let url = `https://www.googleapis.com/youtube/v3/liveChat/messages?liveChatId=${ytConfig.liveChatId}&part=snippet,authorDetails&maxResults=50&key=${ytConfig.apiKey}`;
    if (ytNextPageToken) url += `&pageToken=${ytNextPageToken}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
      console.log('[yt-chat] Erro API:', data.error.message);
      return { interval: 20000 };
    }

    ytNextPageToken = data.nextPageToken;
    let interval = data.pollingIntervalMillis || 20000;
    // OTIMIZAÇÃO DE CUSTO DA API: Força no mínimo 20 segundos de intervalo
    interval = Math.max(interval, 20000); 

    if (data.items && data.items.length > 0) {
      const newMessages = data.items.map(item => ({
        id: item.id,
        author: item.authorDetails.displayName,
        message: item.snippet.displayMessage,
        timestamp: new Date(item.snippet.publishedAt).toLocaleTimeString(),
        profileImageUrl: item.authorDetails.profileImageUrl,
        isOwner: item.authorDetails.isChatOwner
      }));

      lastYtMessages = [...newMessages, ...lastYtMessages].slice(0, 50);
      io.emit('yt-chat-messages', newMessages);
    }
    return { interval };
  } catch (err) {
    console.log('[yt-chat] Erro request:', err.message);
    return { interval: 20000 };
  }
}

async function pollYTApi() {
  if (ytIsPaused || !ytIsConnected) return;
  
  const { interval } = await fetchYTMessages();
  
  if (!ytIsPaused && ytIsConnected) {
    ytPolling = setTimeout(pollYTApi, interval);
  }
}

// Inicia a primeira vez
function startYTPolling(apiKey, liveChatId) {
  stopYTPolling();
  if (!apiKey || !liveChatId) {
    console.log('[yt-chat] Config inválida - precisa de apiKey e liveChatId');
    return;
  }
  ytConfig = { apiKey, liveChatId };
  ytNextPageToken = null;
  ytIsPaused = false;
  ytIsConnected = true;
  console.log(`[yt-chat] Iniciando polling com intervalo forçado mínimo de 20s...`);
  pollYTApi();
}

// ============================================
// START SERVER
// ============================================

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel: http://localhost:${PORT}/control`);
  console.log(`Display: http://localhost:${PORT}/display`);
});
