const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/control', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'control.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

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
    io.emit('show-lowerthird', data);
  });

  socket.on('hide-lowerthird', (data) => {
    console.log(`[hide-lowerthird] ${data.side}`);
    io.emit('hide-lowerthird', data);
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
    io.emit('show-ticker', data);
  });

  socket.on('trigger-countdown', (data) => {
    console.log(`[countdown] from ${data.from}`);
    io.emit('show-countdown', data);
  });

  socket.on('trigger-problem-lt', (data) => {
    console.log(`[problem-lt] ${data.letter} - ${data.name} (${data.acs} ACs)`);
    io.emit('show-problem-lt', data);
  });

  socket.on('trigger-problem-lt-hide', () => {
    console.log('[problem-lt] hide');
    io.emit('hide-problem-lt');
  });

  socket.on('trigger-firstac', (data) => {
    console.log(`[firstac] ${data.teamName} - ${data.problemName}`);
    io.emit('show-firstac', data);
  });

  socket.on('trigger-scoreboard', (data) => {
    console.log('[scoreboard] show');
    io.emit('show-scoreboard', data);
  });

  socket.on('trigger-scoreboard-hide', () => {
    console.log('[scoreboard] hide');
    io.emit('hide-scoreboard');
  });

  socket.on('trigger-medal-table', (data) => {
    console.log('[medal-table] show');
    io.emit('show-medal-table', data);
  });

  socket.on('trigger-medal-table-hide', () => {
    console.log('[medal-table] hide');
    io.emit('hide-medal-table');
  });

  socket.on('trigger-problem-stats', (data) => {
    console.log('[problem-stats] show');
    io.emit('show-problem-stats', data);
  });

  socket.on('trigger-problem-stats-hide', () => {
    console.log('[problem-stats] hide');
    io.emit('hide-problem-stats');
  });

  socket.on('trigger-sports-lt', (data) => {
    console.log(`[sports-lt] ${data.options.titleText || '...'}`);
    io.emit('show-sports-lt', data);
  });

  socket.on('trigger-sports-lt-hide', () => {
    console.log('[sports-lt] hide');
    io.emit('hide-sports-lt');
  });

  socket.on('trigger-team-lt', (data) => {
    console.log(`[team-lt] ${data.teamName}`);
    io.emit('show-team-lt', data);
  });

  socket.on('trigger-team-lt-hide', () => {
    console.log('[team-lt] hide');
    io.emit('hide-team-lt');
  });

  socket.on('trigger-ticker-stop', () => {
    console.log('[ticker] stop');
    io.emit('hide-ticker');
  });

  socket.on('update-settings', (data) => {
    console.log('[settings] update', data);
    io.emit('settings-updated', data);
  });

  socket.on('trigger-clear', () => {
    console.log('[clear]');
    io.emit('clear-all');
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel: http://localhost:${PORT}/control`);
  console.log(`Display: http://localhost:${PORT}/display`);
});
