/* ============================================
   DISPLAY OVERLAY - Motor de animações v2.0
   Maratona Mineira de Programação
   ============================================ */

const socket = io();

// ============================================
// SISTEMA DE PARTÍCULAS (Canvas)
// ============================================

const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');
canvas.width = 1920;
canvas.height = 1080;

let particles = [];
let particleActive = false;

class Particle {
  constructor(x, y, color, type) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.type = type;
    this.size = Math.random() * 8 + 3;
    this.vx = (Math.random() - 0.5) * 12;
    this.vy = (Math.random() - 0.5) * 12 - 4;
    this.gravity = 0.25;
    this.life = 1;
    this.decay = 0.006 + Math.random() * 0.012;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;
    this.shape = Math.random() > 0.5 ? 'rect' : 'circle';
  }

  update() {
    this.x += this.vx;
    this.vy += this.gravity;
    this.y += this.vy;
    this.life -= this.decay;
    this.rotation += this.rotationSpeed;
    this.vx *= 0.99;
    return this.life > 0;
  }

  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.life;
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    if (this.shape === 'rect') {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size * 1.8);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
    ctx.restore();
  }
}

function spawnParticles(x, y, count, colors, type) {
  for (let i = 0; i < count; i++) {
    const color = colors[Math.floor(Math.random() * colors.length)];
    particles.push(new Particle(x, y, color, type));
  }
}

function spawnMedalConfetti(medalType) {
  let colors;
  if (medalType === 'gold') {
    colors = ['#FFD700', '#FFE55C', '#FFC125', '#FFEC8B', '#FFF8DC', '#DAA520', '#B8860B', '#FFF'];
  } else if (medalType === 'silver') {
    colors = ['#C0C0C0', '#E8E8E8', '#F5F5F5', '#A0A0A0', '#FFF', '#D0D0D0', '#808080'];
  } else {
    colors = ['#CD7F32', '#E8A050', '#D4904A', '#8B4513', '#FFF', '#C07030', '#A0622E'];
  }
  spawnParticles(960, 500, 180, colors, 'confetti');
  spawnParticles(960, 500, 60, ['#FFF', '#FFE55C', '#FFF8DC'], 'spark');
  particleActive = true;
}

function spawnBalloonConfetti(color) {
  const colors = [color, '#FFF', color, '#FFF8DC', '#FFD700', '#FFE55C', '#FFF', color];
  spawnParticles(960, 400, 100, colors, 'confetti');
  particleActive = true;
}

function spawnAlertParticles(type) {
  let colors;
  if (type === 'accepted') colors = ['#00FF88', '#00CC66', '#FFF', '#90FFC0'];
  else if (type === 'wrong') colors = ['#FF3366', '#FF0044', '#FFF', '#FF6688'];
  else colors = ['#FFD700', '#FFA500', '#FFF', '#FFE55C'];
  spawnParticles(1700, 200, 80, colors, 'spark');
  particleActive = true;
}

function animateParticles() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const aliveParticles = [];
  for (const p of particles) {
    if (p.update()) { aliveParticles.push(p); p.draw(ctx); }
  }
  particles = aliveParticles;
  if (particles.length === 0 && particleActive) particleActive = false;
  requestAnimationFrame(animateParticles);
}
animateParticles();

// ============================================
// GERENCIADOR DE OVERLAYS
// ============================================

const medalOverlay = document.getElementById('medal-overlay');
const balloonOverlay = document.getElementById('balloon-overlay');
const alertOverlay = document.getElementById('alert-overlay');
const ltLeft = document.getElementById('lowerthird-left');
const ltRight = document.getElementById('lowerthird-right');
const tickerBar = document.getElementById('ticker-bar');
const contestStart = document.getElementById('contest-start');
const contestEnd = document.getElementById('contest-end');
const frozenOverlay = document.getElementById('frozen-overlay');
const blindOverlay = document.getElementById('blind-overlay');
const rankupOverlay = document.getElementById('rankup-overlay');
const countdownOverlay = document.getElementById('countdown-overlay');
const problemLt = document.getElementById('problem-lt');
const firstacOverlay = document.getElementById('firstac-overlay');
const sportsLt = document.getElementById('sports-lt');
const teamLt = document.getElementById('team-lt');
const scoreboard = document.getElementById('firstac-scoreboard');
const medalTable = document.getElementById('medal-table-overlay');
const problemStatsOverlay = document.getElementById('problemstats-overlay');
const commentOverlay = document.getElementById('comment-overlay');

function resetOverlay(el) {
  if (!el) return;
  el.classList.remove('active');
  el.classList.add('hidden');
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = '';
}

let activeTimers = {};

function clearOverlayTimer(key) {
  if (activeTimers[key]) { clearTimeout(activeTimers[key]); delete activeTimers[key]; }
}

// ============================================
// MEDALHA (v2 - tipo e posição)
// ============================================

const medalEmojis = { gold: '🥇', silver: '🥈', bronze: '🥉' };
const medalTextClass = { gold: '', silver: 'silver-text', bronze: 'bronze-text' };

function showMedal(teamName, medalType, position) {
  clearOverlayTimer('medal');
  resetOverlay(medalOverlay);

  medalType = medalType || 'gold';
  position = position || 'center';

  // Reset classes
  medalOverlay.classList.remove('position-right');
  const circle = medalOverlay.querySelector('.medal-circle');
  circle.className = 'medal-circle ' + medalType;
  const glow = medalOverlay.querySelector('.medal-glow');
  glow.className = 'medal-glow ' + (medalType !== 'gold' ? medalType : '');

  medalOverlay.querySelector('.medal-subtitle').textContent = marathonName;
  medalOverlay.querySelector('.medal-emoji').textContent = medalEmojis[medalType];
  const nameEl = medalOverlay.querySelector('.medal-team-name');
  nameEl.textContent = teamName;
  nameEl.className = 'medal-team-name ' + (medalTextClass[medalType] || '');

  if (position === 'right') {
    medalOverlay.classList.add('position-right');
  }

  setTimeout(() => {
    medalOverlay.classList.remove('hidden');
    medalOverlay.classList.add('active');
    spawnMedalConfetti(medalType);
  }, 50);

  activeTimers['medal'] = setTimeout(() => resetOverlay(medalOverlay), 7500);
}

// ============================================
// BALÃO (v2 - física de hélio)
// ============================================

function showBalloon(teamName, color) {
  resetOverlay(balloonOverlay);

  const balloonBody = balloonOverlay.querySelector('.balloon-body');
  balloonBody.style.background = `
    radial-gradient(circle at 30% 25%, ${lighten(color, 40)} 0%, ${color} 40%, ${darken(color, 20)} 100%)
  `;
  balloonOverlay.querySelector('.balloon-team-name').textContent = teamName;

  // Posiciona aleatoriamente no eixo X para variedade
  const randomX = 300 + Math.random() * 1200;
  balloonOverlay.style.left = randomX + 'px';

  setTimeout(() => {
    balloonOverlay.classList.remove('hidden');
    balloonOverlay.classList.add('active');
    spawnBalloonConfetti(color);
  }, 50);

  setTimeout(() => resetOverlay(balloonOverlay), 8500);
}

// ============================================
// ALERTA
// ============================================

const alertIcons = { accepted: '✅', wrong: '❌', pending: '⏳', unknown: '❓' };

function showAlert(type, message) {
  resetOverlay(alertOverlay);
  const card = alertOverlay.querySelector('.alert-card');
  card.className = 'alert-card ' + type.toLowerCase();
  alertOverlay.querySelector('.alert-icon').textContent = alertIcons[type.toLowerCase()] || '📢';
  alertOverlay.querySelector('.alert-message').textContent = message;

  setTimeout(() => {
    alertOverlay.classList.remove('hidden');
    alertOverlay.classList.add('active');
    spawnAlertParticles(type.toLowerCase());
  }, 50);

  setTimeout(() => resetOverlay(alertOverlay), 5500);
}

// ============================================
// LOWER THIRDS (v2 - logo, cor, opacidade)
// ============================================

function showLowerThird(side, name, role, options) {
  const el = side === 'left' ? ltLeft : ltRight;
  clearOverlayTimer('lt-' + side);
  el.classList.remove('hiding');
  resetOverlay(el);

  options = options || {};
  const logoBgColor = options.logoBgColor || '#1a1a1a';
  const topBgColor = options.topBgColor || '#0066FF';
  const bottomBgColor = options.bottomBgColor || '#FFD700';
  const nameColor = options.nameColor || '#FFFFFF';
  const roleColor = options.roleColor || '#1a1a1a';
  const geoColor1 = options.geoColor1 || '#FF1493';
  const geoColor2 = options.geoColor2 || '#FFD700';
  const logoUrl = options.logoUrl || '';

  // Bloco logo
  el.querySelector('.lt-sports-logo-block').style.background = logoBgColor;
  el.querySelector('.lt-sports-geo-top').style.background = geoColor1;
  el.querySelector('.lt-sports-geo-bottom').style.background = geoColor2;

  // Barras de texto
  el.querySelector('.lt-sports-bar-top').style.background = topBgColor;
  el.querySelector('.lt-sports-bar-bottom').style.background = bottomBgColor;
  el.querySelector('.lt-sports-name').style.color = nameColor;
  el.querySelector('.lt-sports-role').style.color = roleColor;

  // Textos
  el.querySelector('.lt-sports-name').textContent = name;
  el.querySelector('.lt-sports-role').textContent = role;

  // Logo
  const logoImg = el.querySelector('.lt-sports-logo-img');
  if (logoUrl) {
    logoImg.src = logoUrl;
    logoImg.style.display = 'block';
  } else {
    logoImg.style.display = 'none';
  }

  el.classList.remove('hidden', 'hiding');
  el.classList.add('active');
}

function hideLowerThird(side) {
  clearOverlayTimer('lt-' + side);
  const el = side === 'left' ? ltLeft : ltRight;
  el.classList.remove('active');
  el.classList.add('hiding');
  setTimeout(() => {
    resetOverlay(el);
    el.classList.remove('hiding');
  }, 400);
}

// ============================================
// TICKER / LETREIRO ROTATIVO (independente)
// ============================================

function showTicker(text) {
  tickerBar.classList.remove('hidden');
  tickerBar.querySelector('.ticker-text').textContent =
    text + '  •  ' + text + '  •  ' + text + '  •  ' + text + '  •  ';
}

function hideTicker() {
  tickerBar.classList.add('hidden');
}

// ============================================
// INÍCIO DA PROVA (relógio)
// ============================================

function showContestStart() {
  resetOverlay(contestStart);
  clearOverlayTimer('event');
  contestStart.querySelector('.event-subtitle').textContent = marathonName;
  setTimeout(() => {
    contestStart.classList.remove('hidden');
    contestStart.classList.add('active');
    spawnParticles(960, 540, 120, ['#FFD700', '#FFF', '#FFE55C', '#FFA500', '#FFF8DC'], 'confetti');
    particleActive = true;
  }, 50);
  activeTimers['event'] = setTimeout(() => resetOverlay(contestStart), 6500);
}

// ============================================
// FIM DA PROVA
// ============================================

function showContestEnd() {
  resetOverlay(contestEnd);
  clearOverlayTimer('event');
  setTimeout(() => {
    contestEnd.classList.remove('hidden');
    contestEnd.classList.add('active');
    spawnParticles(960, 540, 120, ['#FF3366', '#FFF', '#FF6688', '#FFD700', '#FFA500'], 'confetti');
    particleActive = true;
  }, 50);
  activeTimers['event'] = setTimeout(() => resetOverlay(contestEnd), 6500);
}

// ============================================
// PLACAR CONGELADO (gelo)
// ============================================

let frostAnimationId = null;

function showFrozen() {
  resetOverlay(frozenOverlay);
  clearOverlayTimer('event');
  startFrostEffect();
  setTimeout(() => {
    frozenOverlay.classList.remove('hidden');
    frozenOverlay.classList.add('active');
    spawnParticles(960, 540, 80, ['#B0E0E6', '#ADD8E6', '#87CEFA', '#FFF', '#E0FFFF'], 'spark');
    particleActive = true;
  }, 50);
  activeTimers['event'] = setTimeout(() => {
    resetOverlay(frozenOverlay);
    stopFrostEffect();
  }, 8500);
}

function startFrostEffect() {
  const frostCanvas = document.getElementById('frost-canvas');
  if (!frostCanvas) return;
  frostCanvas.width = 1920;
  frostCanvas.height = 1080;
  const fctx = frostCanvas.getContext('2d');

  const flakes = [];
  for (let i = 0; i < 60; i++) {
    flakes.push({
      x: Math.random() * 1920,
      y: Math.random() * 1080,
      r: Math.random() * 4 + 1,
      speed: Math.random() * 0.5 + 0.1,
      wind: Math.random() * 0.3 - 0.15
    });
  }

  function drawFrost() {
    fctx.clearRect(0, 0, 1920, 1080);
    fctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (const f of flakes) {
      fctx.beginPath();
      fctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      fctx.fill();
      f.y += f.speed;
      f.x += f.wind;
      if (f.y > 1090) { f.y = -10; f.x = Math.random() * 1920; }
      if (f.x < -10) f.x = 1930;
      if (f.x > 1930) f.x = -10;
    }
    frostAnimationId = requestAnimationFrame(drawFrost);
  }
  drawFrost();
}

function stopFrostEffect() {
  if (frostAnimationId) {
    cancelAnimationFrame(frostAnimationId);
    frostAnimationId = null;
  }
  const frostCanvas = document.getElementById('frost-canvas');
  if (frostCanvas) {
    const fctx = frostCanvas.getContext('2d');
    fctx.clearRect(0, 0, 1920, 1080);
  }
}

// ============================================
// BLIND MODE (suspense)
// ============================================

function showBlind() {
  resetOverlay(blindOverlay);
  clearOverlayTimer('event');
  setTimeout(() => {
    blindOverlay.classList.remove('hidden');
    blindOverlay.classList.add('active');
    spawnParticles(960, 540, 50, ['#FFF', '#E0E0E0', '#FFD700', '#C0C0C0'], 'spark');
    particleActive = true;
  }, 50);
  activeTimers['event'] = setTimeout(() => resetOverlay(blindOverlay), 6500);
}

// ============================================
// SUBIDA NO RANKING (foguete + posição)
// ============================================

function showRankUp(teamName, position) {
  resetOverlay(rankupOverlay);
  clearOverlayTimer('event');
  rankupOverlay.querySelector('.rankup-team-name').textContent = teamName || '';
  rankupOverlay.querySelector('.rankup-position').textContent = '#' + position;

  setTimeout(() => {
    rankupOverlay.classList.remove('hidden');
    rankupOverlay.classList.add('active');
    // Partículas verdes estilo foguete
    spawnParticles(1720, 400, 60, ['#00FF88', '#00CC66', '#FFF', '#90FFC0'], 'confetti');
    // Faíscas laranja do fogo do foguete
    spawnParticles(1640, 280, 40, ['#FF4500', '#FFA500', '#FFD700', '#FF6347'], 'spark');
    particleActive = true;
  }, 50);

  activeTimers['event'] = setTimeout(() => resetOverlay(rankupOverlay), 6500);
}

// ============================================
// CONTAGEM REGRESSIVA
// ============================================

let countdownInterval = null;

function showCountdown(from) {
  resetOverlay(countdownOverlay);
  clearOverlayTimer('event');
  stopCountdown();

  from = from || 5;
  let current = from;

  const numberEl = countdownOverlay.querySelector('.countdown-number');
  const progressEl = countdownOverlay.querySelector('.countdown-progress');
  const circumference = 565.48;

  numberEl.textContent = current;
  numberEl.style.color = '#FFD700';
  numberEl.style.fontSize = '120px';
  progressEl.style.strokeDashoffset = '0';
  progressEl.style.stroke = '#FFD700';

  countdownOverlay.classList.remove('hidden');
  countdownOverlay.classList.add('active');
  countdownOverlay.querySelector('.countdown-title').textContent = 'PREPARE-SE';

  countdownInterval = setInterval(() => {
    current--;
    if (current <= 0) {
      stopCountdown();
      numberEl.textContent = 'GO!';
      numberEl.style.fontSize = '90px';
      numberEl.style.color = '#00FF88';
      countdownOverlay.querySelector('.countdown-title').textContent = '';
      spawnParticles(960, 540, 150, ['#00FF88', '#FFD700', '#FFF', '#FFA500', '#00BFFF'], 'confetti');
      particleActive = true;
      setTimeout(() => resetOverlay(countdownOverlay), 1200);
      return;
    }

    numberEl.textContent = current;
    numberEl.style.color = current <= 3 ? '#FF3366' : '#FFD700';
    if (current <= 3) progressEl.style.stroke = '#FF3366';

    const offset = circumference - (current / from) * circumference;
    progressEl.style.strokeDashoffset = offset;

    numberEl.style.animation = 'none';
    numberEl.offsetHeight;
    numberEl.style.animation = 'countdownPulse 0.5s ease-out';

    if (current === 1) {
      countdownOverlay.querySelector('.countdown-title').textContent = 'VAI!';
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }
}

// ============================================
// LOWER THIRD DE PROBLEMA
// ============================================

function showProblemLT(letter, name, acs) {
  resetOverlay(problemLt);
  clearOverlayTimer('problem');
  problemLt.classList.remove('hiding');

  document.getElementById('prob-letter').textContent = 'Problema ' + (letter || '?');
  document.getElementById('prob-name').textContent = name || '';
  document.getElementById('prob-acs').textContent = acs || '0';

  problemLt.classList.remove('hidden');
  problemLt.classList.add('active');
}

function hideProblemLT() {
  problemLt.classList.remove('active');
  problemLt.classList.add('hiding');
  setTimeout(() => {
    resetOverlay(problemLt);
    problemLt.classList.remove('hiding');
  }, 400);
}

// ============================================
// FIRST AC
// ============================================

function showFirstAC(teamName, problemName, color) {
  resetOverlay(firstacOverlay);
  clearOverlayTimer('event');

  color = color || '#FFD700';

  firstacOverlay.querySelector('.firstac-team').textContent = teamName || '';
  firstacOverlay.querySelector('.firstac-problem').textContent = problemName || '';

  // Balão colorido
  const balloonEl = firstacOverlay.querySelector('.firstac-balloon');
  balloonEl.textContent = '🎈';
  balloonEl.style.display = 'block';

  // Cor do card
  const content = firstacOverlay.querySelector('.firstac-content');
  content.style.borderColor = color;
  content.style.boxShadow = `0 20px 60px rgba(0,0,0,0.6), 0 0 80px ${color}40, 0 0 120px ${color}20`;
  firstacOverlay.querySelector('.firstac-label').style.color = color;

  setTimeout(() => {
    firstacOverlay.classList.remove('hidden');
    firstacOverlay.classList.add('active');
    spawnParticles(960, 500, 250, [color, lighten(color, 30), '#FFF', color, '#FFD700', lighten(color, 50)], 'confetti');
    spawnParticles(960, 500, 80, ['#FFF', color, '#FFD700'], 'spark');
    particleActive = true;
  }, 50);

  activeTimers['event'] = setTimeout(() => resetOverlay(firstacOverlay), 7500);
}

// ============================================
// PLACAR FIRST AC
// ============================================

function showScoreboard(data) {
  resetOverlay(scoreboard);
  scoreboard.classList.remove('hiding');

  const rows = scoreboard.querySelector('#scoreboard-rows');
  rows.innerHTML = '';

  if (!data || !data.entries || data.entries.length === 0) {
    rows.innerHTML = '<div class="scoreboard-row"><span>Nenhum First AC registrado</span><span></span><span></span></div>';
  } else {
    data.entries.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'scoreboard-row';
      row.innerHTML = `
        <span>
          <strong>${entry.team}</strong>
          ${entry.university ? '<small style="color:rgba(255,255,255,0.4);font-size:14px;">' + entry.university + '</small>' : ''}
        </span>
        <span class="scoreboard-problem">
          <span class="scoreboard-balloon">🎈</span>
          ${entry.problem}
        </span>
        <span class="scoreboard-time">${entry.time || ''}</span>
      `;
      rows.appendChild(row);
    });
  }

  scoreboard.classList.remove('hidden');
  scoreboard.classList.add('active');
}

function hideScoreboard() {
  scoreboard.classList.remove('active');
  scoreboard.classList.add('hiding');
  setTimeout(() => {
    resetOverlay(scoreboard);
    scoreboard.classList.remove('hiding');
  }, 400);
}

// ============================================
// PLACAR DE MEDALHAS
// ============================================

function showMedalTable(data) {
  resetOverlay(medalTable);
  medalTable.classList.remove('hiding');

  const rows = medalTable.querySelector('#medaltable-rows');
  rows.innerHTML = '';

  if (!data || !data.rows || data.rows.length === 0) {
    rows.innerHTML = '<div class="medaltable-row"><span>Nenhuma universidade adicionada</span><span>-</span><span>-</span><span>-</span><span>-</span></div>';
  } else {
    // Ordena por total (ouro > prata > bronze)
    const sorted = [...data.rows].sort((a, b) => {
      const totalA = (a.gold||0) + (a.silver||0) + (a.bronze||0);
      const totalB = (b.gold||0) + (b.silver||0) + (b.bronze||0);
      if (totalB !== totalA) return totalB - totalA;
      if ((b.gold||0) !== (a.gold||0)) return (b.gold||0) - (a.gold||0);
      if ((b.silver||0) !== (a.silver||0)) return (b.silver||0) - (a.silver||0);
      return (b.bronze||0) - (a.bronze||0);
    });

    sorted.forEach((row, i) => {
      const total = (row.gold||0) + (row.silver||0) + (row.bronze||0);
      const div = document.createElement('div');
      div.className = 'medaltable-row';
      div.innerHTML = `
        <span>${i+1}. ${row.name}</span>
        <span class="medaltable-gold">${row.gold||0}</span>
        <span class="medaltable-silver">${row.silver||0}</span>
        <span class="medaltable-bronze">${row.bronze||0}</span>
        <span class="medaltable-total">${total}</span>
      `;
      rows.appendChild(div);
    });
  }

  medalTable.classList.remove('hidden');
  medalTable.classList.add('active');
}

function hideMedalTable() {
  medalTable.classList.remove('active');
  medalTable.classList.add('hiding');
  setTimeout(() => {
    resetOverlay(medalTable);
    medalTable.classList.remove('hiding');
  }, 400);
}

// ============================================
// TABELA DE ESTATÍSTICAS (ACs por problema)
// ============================================

function showProblemStats(data) {
  resetOverlay(problemStatsOverlay);
  problemStatsOverlay.classList.remove('hiding');

  const rows = problemStatsOverlay.querySelector('#problemstats-rows');
  rows.innerHTML = '';

  if (!data || !data.rows || data.rows.length === 0) {
    rows.innerHTML = '<div class="medaltable-row"><span>-</span><span>Nenhum dado</span><span>-</span><span>-</span></div>';
  } else {
    data.rows.forEach(row => {
      const badgeClass = row.badge || 'normal';
      const badgeText = row.badge === 'balloon-plus' ? 'BALÃO ++' : row.badge === 'hard' ? 'HARD' : '—';
      const div = document.createElement('div');
      div.className = 'medaltable-row';
      div.style.gridTemplateColumns = '100px 1fr 100px 140px';
      div.innerHTML = `
        <span style="font-weight:900;color:${row.color || '#FFD700'};">${row.letter}</span>
        <span>${row.name || ''}</span>
        <span class="problemstats-acs">${row.acs || 0}</span>
        <span><span class="problemstats-badge ${badgeClass}">${badgeText}</span></span>
      `;
      rows.appendChild(div);
    });
  }

  problemStatsOverlay.classList.remove('hidden');
  problemStatsOverlay.classList.add('active');
}

function hideProblemStats() {
  problemStatsOverlay.classList.remove('active');
  problemStatsOverlay.classList.add('hiding');
  setTimeout(() => {
    resetOverlay(problemStatsOverlay);
    problemStatsOverlay.classList.remove('hiding');
  }, 400);
}

// ============================================
// COMENTÁRIO DO CHAT
// ============================================

function showComment(author, message) {
  resetOverlay(commentOverlay);
  commentOverlay.classList.remove('hiding');

  document.getElementById('comment-message').textContent = message || '';
  document.getElementById('comment-author').textContent = author || 'Anônimo';

  commentOverlay.classList.remove('hidden');
  commentOverlay.classList.add('active');
}

// Esconde e avisa o painel
function hideComment() {
  commentOverlay.classList.remove('active');
  commentOverlay.classList.add('hiding');
  setTimeout(() => {
    resetOverlay(commentOverlay);
    commentOverlay.classList.remove('hiding');
  }, 400);
  // Avisa o painel que o comentário foi removido
  socket.emit('comment-hidden');
}

// ============================================
// TICKER CUSTOMIZAVEL (v2)
// ============================================

function showTicker(text, options) {
  options = options || {};
  const color = options.color || '#FFD700';
  const bgColor = options.bgColor || 'rgba(0,0,0,0.85)';
  const speed = options.speed || 30;

  tickerBar.classList.remove('hidden');

  // Barra de destaque esportiva
  const accent = tickerBar.querySelector('.ticker-accent');
  accent.style.background = color;
  accent.style.boxShadow = '0 0 12px ' + color + '80';

  // Fundo da faixa
  const track = tickerBar.querySelector('.ticker-track');
  track.style.background = bgColor;

  // Repete o texto MUITAS vezes para preencher a tela mesmo com palavras curtas
  const segment = text + '  •  ';
  const reps = Math.max(30, Math.ceil(200 / text.length)); // pelo menos 30 repetições
  const fullText = segment.repeat(reps);

  const tickerText = tickerBar.querySelector('.ticker-text');
  tickerText.textContent = fullText;
  tickerText.style.color = color;
  tickerText.style.textShadow = '0 0 10px ' + color + '80';
  tickerText.style.setProperty('--ticker-speed', speed + 's');
}

function hideTicker() {
  tickerBar.classList.add('hidden');
}

// ============================================
// BARRA ESPORTIVA (Sports LT)
// ============================================

function showSportsLT(options) {
  options = options || {};
  resetOverlay(sportsLt);

  const logoBgColor = options.logoBgColor || '#1a1a1a';
  const topBgColor = options.topBgColor || '#0066FF';
  const bottomBgColor = options.bottomBgColor || '#FFD700';
  const topTextColor = options.topTextColor || '#FFFFFF';
  const bottomTextColor = options.bottomTextColor || '#1a1a1a';
  const geoColor1 = options.geoColor1 || '#FF1493';
  const geoColor2 = options.geoColor2 || '#FFD700';
  const titleText = options.titleText || '';
  const subtitleText = options.subtitleText || '';
  const logoUrl = options.logoUrl || '';

  sportsLt.querySelector('.sports-logo-block').style.background = logoBgColor;
  sportsLt.querySelector('.sports-bar-top').style.background = topBgColor;
  sportsLt.querySelector('.sports-bar-bottom').style.background = bottomBgColor;
  sportsLt.querySelector('.sports-title-text').style.color = topTextColor;
  sportsLt.querySelector('.sports-subtitle-text').style.color = bottomTextColor;
  sportsLt.querySelector('.sports-geo-top').style.background = geoColor1;
  sportsLt.querySelector('.sports-geo-bottom').style.background = geoColor2;

  sportsLt.querySelector('.sports-title-text').textContent = titleText;
  sportsLt.querySelector('.sports-subtitle-text').textContent = subtitleText;

  const logoImg = sportsLt.querySelector('.sports-logo-img');
  if (logoUrl) {
    logoImg.src = logoUrl;
    logoImg.style.display = 'block';
  } else {
    logoImg.style.display = 'none';
  }

  sportsLt.classList.remove('hidden', 'hiding');
  sportsLt.classList.add('active');
}

function hideSportsLT() {
  sportsLt.classList.remove('active');
  sportsLt.classList.add('hiding');
  setTimeout(() => {
    resetOverlay(sportsLt);
    sportsLt.classList.remove('hiding');
  }, 500);
}

// ============================================
// LT DE COMPETIDORES (centro)
// ============================================

function showTeamLT(teamName, member1, member2, member3, options) {
  resetOverlay(teamLt);
  teamLt.classList.remove('hiding');

  options = options || {};
  const logoBgColor = options.logoBgColor || '#1a1a1a';
  const topBgColor = options.topBgColor || '#0066FF';
  const bottomBgColor = options.bottomBgColor || '#FFD700';
  const nameColor = options.nameColor || '#FFFFFF';
  const membersColor = options.membersColor || '#1a1a1a';
  const geoColor1 = options.geoColor1 || '#FF1493';
  const geoColor2 = options.geoColor2 || '#FFD700';
  const logoUrl = options.logoUrl || '';

  // Cores
  teamLt.querySelector('.team-lt-logo-block').style.background = logoBgColor;
  teamLt.querySelector('.team-lt-bar-top').style.background = topBgColor;
  teamLt.querySelector('.team-lt-bar-bottom').style.background = bottomBgColor;
  teamLt.querySelector('.team-lt-name').style.color = nameColor;
  teamLt.querySelector('.team-lt-members').style.color = membersColor;

  const geoTop = teamLt.querySelector('.team-lt-logo-block .lt-sports-geo-top');
  const geoBottom = teamLt.querySelector('.team-lt-logo-block .lt-sports-geo-bottom');
  if (geoTop) geoTop.style.background = geoColor1;
  if (geoBottom) geoBottom.style.background = geoColor2;

  // Logo
  const logoImg = teamLt.querySelector('.lt-sports-logo-img');
  if (logoUrl) {
    logoImg.src = logoUrl;
    logoImg.style.display = 'block';
  } else {
    logoImg.style.display = 'none';
  }

  // Textos
  teamLt.querySelector('.team-lt-name').textContent = teamName || '';

  // Monta linha de integrantes (pula vazios)
  const members = [member1, member2, member3].filter(m => m && m.trim());
  teamLt.querySelector('.team-lt-members').textContent = members.join('  •  ');

  teamLt.classList.remove('hidden');
  teamLt.classList.add('active');
}

function hideTeamLT() {
  teamLt.classList.remove('active');
  teamLt.classList.add('hiding');
  setTimeout(() => {
    resetOverlay(teamLt);
    teamLt.classList.remove('hiding');
  }, 350);
}

// ============================================
// SOCKET EVENTS
// ============================================

socket.on('show-medal', (data) => {
  showMedal(data.teamName, data.medalType, data.position);
});

socket.on('show-balloon', (data) => {
  showBalloon(data.teamName, data.color);
});

socket.on('show-alert', (data) => {
  showAlert(data.type, data.message);
});

socket.on('show-confetti', () => {
  spawnParticles(960, 500, 200,
    ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF69B4', '#00FF88', '#FFA500'],
    'confetti');
  particleActive = true;
});

socket.on('show-lowerthird', (data) => {
  showLowerThird(data.side, data.name, data.role, data.options);
});

socket.on('hide-lowerthird', (data) => {
  hideLowerThird(data.side);
});

socket.on('show-ticker', (data) => {
  showTicker(data.text, data.options);
});

socket.on('hide-ticker', () => {
  hideTicker();
});

socket.on('show-contest-start', () => showContestStart());
socket.on('show-contest-end', () => showContestEnd());
socket.on('show-frozen', () => showFrozen());
socket.on('show-blind', () => showBlind());
// Configurações globais
let marathonName = 'Maratona Mineira de Programação';

socket.on('settings-updated', (data) => {
  if (data.marathonName) {
    marathonName = data.marathonName;
    // Atualiza overlays que usam o nome
    document.querySelectorAll('.medal-subtitle').forEach(el => el.textContent = marathonName);
    const subtitle = document.querySelector('#contest-start .event-subtitle');
    if (subtitle) subtitle.textContent = marathonName;
  }
});

socket.on('show-rankup', (data) => showRankUp(data.teamName, data.position));
socket.on('show-countdown', (data) => showCountdown(data.from));
socket.on('show-problem-lt', (data) => showProblemLT(data.letter, data.name, data.acs));
socket.on('hide-problem-lt', () => hideProblemLT());
socket.on('show-firstac', (data) => showFirstAC(data.teamName, data.problemName, data.color));
socket.on('show-scoreboard', (data) => showScoreboard(data));
socket.on('hide-scoreboard', () => hideScoreboard());
socket.on('show-medal-table', (data) => showMedalTable(data));
socket.on('hide-medal-table', () => hideMedalTable());
socket.on('show-problem-stats', (data) => showProblemStats(data));
socket.on('hide-problem-stats', () => hideProblemStats());
socket.on('show-comment', (data) => showComment(data.author, data.message));
socket.on('hide-comment', () => hideComment());
socket.on('show-sports-lt', (data) => showSportsLT(data.options));
socket.on('hide-sports-lt', () => hideSportsLT());
socket.on('show-team-lt', (data) => showTeamLT(data.teamName, data.m1, data.m2, data.m3, data.options));
socket.on('hide-team-lt', () => hideTeamLT());

socket.on('clear-all', () => {
  [medalOverlay, balloonOverlay, alertOverlay, ltLeft, ltRight, tickerBar, problemLt,
   contestStart, contestEnd, frozenOverlay, blindOverlay, rankupOverlay, countdownOverlay, firstacOverlay, sportsLt, teamLt, scoreboard, medalTable, problemStatsOverlay, commentOverlay].forEach(resetOverlay);
  stopFrostEffect();
  stopCountdown();
  particles = [];
  particleActive = false;
  Object.keys(activeTimers).forEach(k => clearTimeout(activeTimers[k]));
  activeTimers = {};
});

// ============================================
// UTILITÁRIOS DE COR
// ============================================

function lighten(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, (num >> 16) + Math.round(2.55 * percent));
  const g = Math.min(255, ((num >> 8) & 0x00FF) + Math.round(2.55 * percent));
  const b = Math.min(255, (num & 0x0000FF) + Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}

function darken(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(2.55 * percent));
  const g = Math.max(0, ((num >> 8) & 0x00FF) - Math.round(2.55 * percent));
  const b = Math.max(0, (num & 0x0000FF) - Math.round(2.55 * percent));
  return `rgb(${r},${g},${b})`;
}
