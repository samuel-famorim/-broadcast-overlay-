const fs = require('fs');
const path = require('path');

// 1. Injetar a leitura do tema no JS do controle
const controlJsPath = path.join(__dirname, 'public/js/control.js');
let controlJs = fs.readFileSync(controlJsPath, 'utf8');

if (!controlJs.includes('const urlParams = new URLSearchParams(window.location.search);')) {
  const paramLogic = `
  const urlParams = new URLSearchParams(window.location.search);
  const theme = urlParams.get('theme');
  if (theme === 'final2026') {
    // Forçar carregamento do preset Final 2026 nos menus
    setTimeout(() => {
      document.querySelectorAll('select[id^="preset-"]').forEach(select => {
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].text === 'Maratona Final 2026') {
            select.value = select.options[i].value;
            select.dispatchEvent(new Event('change'));
          }
        }
      });
      // Informar o display sobre o tema forçado via socket
      socket.emit('update-settings', { activeTheme: 'final2026' });
    }, 1000);
  } else if (theme === 'padrao') {
    setTimeout(() => {
      document.querySelectorAll('select[id^="preset-"]').forEach(select => {
        for (let i = 0; i < select.options.length; i++) {
          if (select.options[i].text === 'Maratona Padrão') {
            select.value = select.options[i].value;
            select.dispatchEvent(new Event('change'));
          }
        }
      });
      socket.emit('update-settings', { activeTheme: 'padrao' });
    }, 1000);
  }
`;
  controlJs = controlJs.replace(/function applyGlobalSettings\(\) \{/, paramLogic + '\nfunction applyGlobalSettings() {');
  fs.writeFileSync(controlJsPath, controlJs);
}

// 2. Injetar leitura de tema no CSS do Display
const displayCssPath = path.join(__dirname, 'public/css/display.css');
let displayCss = fs.readFileSync(displayCssPath, 'utf8');

if (!displayCss.includes('body.theme-final2026')) {
  displayCss += `
/* ============================================
   THEME OVERRIDES: FINAL 2026 (DARK/GLASS)
   ============================================ */

body.theme-final2026 .lt-sports-bar-top {
  background: rgba(16, 21, 43, 0.85) !important;
  backdrop-filter: blur(8px);
  border-top: 1px solid var(--neon-purple);
}

body.theme-final2026 .lt-sports-bar-bottom {
  background: rgba(11, 14, 39, 0.9) !important;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--neon-cyan);
}

body.theme-final2026 .lt-sports-logo-block {
  background: rgba(16, 21, 43, 0.95) !important;
  border-left: 1px solid var(--neon-cyan);
}

body.theme-final2026 .team-lt-bar-top {
  background: rgba(16, 21, 43, 0.85) !important;
  border-top: 1px solid var(--neon-orange);
}

body.theme-final2026 .team-lt-bar-bottom {
  background: rgba(11, 14, 39, 0.9) !important;
  border-bottom: 1px solid var(--neon-cyan);
}

body.theme-final2026 .team-lt-logo-block {
  background: rgba(16, 21, 43, 0.95) !important;
  border-left: 1px solid var(--neon-orange);
}

body.theme-final2026 .lt-sports-geo-top {
  background: var(--maratona-gradient);
}
body.theme-final2026 .lt-sports-geo-bottom {
  background: var(--neon-cyan);
}

body.theme-final2026 .lt-sports-name,
body.theme-final2026 .team-lt-name {
  color: var(--neon-cyan) !important;
}

body.theme-final2026 .lt-sports-role,
body.theme-final2026 .team-lt-members {
  color: #94a3b8 !important;
}
`;
  fs.writeFileSync(displayCssPath, displayCss);
}

// 3. Injetar a escuta de troca de tema no js do display
const displayJsPath = path.join(__dirname, 'public/js/display.js');
let displayJs = fs.readFileSync(displayJsPath, 'utf8');

if (!displayJs.includes('if (data.activeTheme) {')) {
  displayJs = displayJs.replace(
    /socket\.on\('settings-updated', \(data\) => \{/,
    `socket.on('settings-updated', (data) => {\n  if (data.activeTheme) {\n    document.body.className = '';\n    if (data.activeTheme === 'final2026') document.body.classList.add('theme-final2026');\n  }`
  );
  
  // also read from query params on display load
  const loadLogic = `
const urlParamsDisplay = new URLSearchParams(window.location.search);
const themeDisplay = urlParamsDisplay.get('theme');
if (themeDisplay === 'final2026') {
  document.body.classList.add('theme-final2026');
}
`;
  displayJs = loadLogic + '\n' + displayJs;
  
  fs.writeFileSync(displayJsPath, displayJs);
}

