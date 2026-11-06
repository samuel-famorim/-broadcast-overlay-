const fs = require('fs');
const path = require('path');

const controlJsPath = path.join(__dirname, 'public/js/control.js');
let controlJs = fs.readFileSync(controlJsPath, 'utf8');

const injection = `
window.addEventListener('DOMContentLoaded', () => {
  const typeBarra = 'barra';
  const presetsBarra = getPresets(typeBarra);
  const sbcBarraExists = presetsBarra.find(p => p.label === 'Identidade Maratona SBC');
  
  if (!sbcBarraExists) {
    presetsBarra.push({
      label: 'Identidade Maratona SBC',
      titleText: 'AO VIVO • MARATONA SBC',
      subtitleText: 'PROGRAMAÇÃO',
      colors: {
        topBg: '#2962ff',
        bottomBg: '#00e5ff',
        logoBg: '#10152b',
        nameColor: '#ffffff',
        roleColor: '#0b0e27',
        geo1: '#ff6a00',
        geo2: '#9d00ff',
        logoUrl: '/src/sbc_assets/sabia-voando.png'
      }
    });
    savePresetsArr(typeBarra, presetsBarra);
  }
});
`;

if (!controlJs.includes('sabia-voando.png')) {
  controlJs += injection;
  fs.writeFileSync(controlJsPath, controlJs);
}

