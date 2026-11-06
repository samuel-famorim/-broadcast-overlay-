const fs = require('fs');
const path = require('path');

// Simulate the localStorage injection by directly creating a script that runs on page load
const controlJsPath = path.join(__dirname, 'public/js/control.js');
let controlJs = fs.readFileSync(controlJsPath, 'utf8');

const injection = `
// Inject default SBC Identity preset on load
window.addEventListener('DOMContentLoaded', () => {
  const type = 'globalcolors';
  const presets = getPresets(type);
  const sbcPresetExists = presets.find(p => p.label === 'Identidade Maratona SBC');
  
  if (!sbcPresetExists) {
    presets.push({
      label: 'Identidade Maratona SBC',
      colors: {
        topBg: '#2962ff',
        bottomBg: '#00e5ff',
        logoBg: '#10152b',
        nameColor: '#ffffff',
        roleColor: '#0b0e27',
        geo1: '#ff6a00',
        geo2: '#9d00ff',
        logoUrl: '/src/sbc_assets/logo-maratona.png'
      }
    });
    savePresetsArr(type, presets);
  }
});
`;

if (!controlJs.includes('Identidade Maratona SBC')) {
  controlJs += injection;
  fs.writeFileSync(controlJsPath, controlJs);
}

