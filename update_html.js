const fs = require('fs');
const path = require('path');

const displayHtmlPath = path.join(__dirname, 'public/display.html');
let displayHtml = fs.readFileSync(displayHtmlPath, 'utf8');

displayHtml = displayHtml.replace(/Maratona Mineira/g, 'Maratona SBC');

// Replace sponsors
displayHtml = displayHtml.replace(
  /<div class="sponsors-content">[\s\S]*?<\/div>/,
  `<div class="sponsors-content">
          <img class="sponsors-logo" src="/src/sbc_assets/sponsors/algar-logo.png" alt="Algar">
          <img class="sponsors-logo" src="/src/sbc_assets/sponsors/stone.png" alt="Stone">
          <img class="sponsors-logo" src="/src/sbc_assets/sponsors/vtex.png" alt="VTEX">
          <img class="sponsors-logo" src="/src/sbc_assets/sponsors/huawei-edit.png" alt="Huawei">
          <img class="sponsors-logo" src="/src/sbc_assets/sponsors/google.png" alt="Google">
        </div>`
);

fs.writeFileSync(displayHtmlPath, displayHtml);

const controlHtmlPath = path.join(__dirname, 'public/control.html');
let controlHtml = fs.readFileSync(controlHtmlPath, 'utf8');

controlHtml = controlHtml.replace(/Maratona Mineira/g, 'Maratona SBC');

fs.writeFileSync(controlHtmlPath, controlHtml);
