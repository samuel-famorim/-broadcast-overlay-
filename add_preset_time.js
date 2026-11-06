const fs = require('fs');
const path = require('path');

const controlJsPath = path.join(__dirname, 'public/js/control.js');
let controlJs = fs.readFileSync(controlJsPath, 'utf8');

const injection = `
window.addEventListener('DOMContentLoaded', () => {
  const type = 'time';
  const presets = getPresets(type);
  const exists = presets.find(p => p.label === 'Identidade Maratona SBC');
  
  if (!exists) {
    presets.push({
      label: 'Identidade Maratona SBC',
      teamName: 'NOME DO TIME',
      teamMembers: 'Membro 1, Membro 2, Membro 3',
      colors: {
        topBg: '#2962ff',
        bottomBg: '#00e5ff',
        logoBg: '#10152b',
        nameColor: '#ffffff',
        roleColor: '#0b0e27',
        geo1: '#ff6a00',
        geo2: '#9d00ff',
        logoUrl: '/src/sbc_assets/sabia.png'
      }
    });
    savePresetsArr(type, presets);
  }
});
`;

if (!controlJs.includes('type = \'time\'') || !controlJs.includes('teamMembers: \'Membro 1,')) {
  controlJs += injection;
  fs.writeFileSync(controlJsPath, controlJs);
}

