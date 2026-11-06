const fs = require('fs');
const path = require('path');

const controlJsPath = path.join(__dirname, 'public/js/control.js');
let controlJs = fs.readFileSync(controlJsPath, 'utf8');

const injection = `
window.addEventListener('DOMContentLoaded', () => {
  ['globalcolors', 'pessoas', 'time', 'barra'].forEach(type => {
    const presets = getPresets(type);
    
    // Rename existing preset
    const oldPreset = presets.find(p => p.label === 'Identidade Maratona SBC');
    if (oldPreset) {
      oldPreset.label = 'Maratona Padrão';
    }

    // Add new preset
    const finalExists = presets.find(p => p.label === 'Maratona Final 2026');
    if (!finalExists) {
      const newPreset = {
        label: 'Maratona Final 2026',
        colors: {
          topBg: '#10152b', // Escuro profundo do site
          bottomBg: '#0b0e27', // Ainda mais escuro
          logoBg: '#10152b', 
          nameColor: '#00e5ff', // Texto nome em Ciano Neon
          roleColor: '#94a3b8', // Texto role em cinza claro (muted)
          geo1: '#ff6a00',
          geo2: '#9d00ff',
          logoUrl: '/src/sbc_assets/simbolo.png' // Ícone menor
        }
      };

      if (type === 'pessoas') {
        newPreset.leftName = 'NOME DA PESSOA';
        newPreset.leftRole = 'CARGO / FUNÇÃO';
        newPreset.rightName = 'NOME DA PESSOA';
        newPreset.rightRole = 'CARGO / FUNÇÃO';
      } else if (type === 'time') {
        newPreset.teamName = 'NOME DO TIME FINALISTA';
        newPreset.teamMembers = 'COMPETIDOR 1, COMPETIDOR 2, COMPETIDOR 3';
      } else if (type === 'barra') {
        newPreset.titleText = 'FINAL BRASILEIRA 2026';
        newPreset.subtitleText = 'UBERLÂNDIA/MG';
      }

      presets.push(newPreset);
    }
    
    savePresetsArr(type, presets);
  });
});
`;

if (!controlJs.includes('Maratona Final 2026')) {
  controlJs += injection;
  fs.writeFileSync(controlJsPath, controlJs);
}

