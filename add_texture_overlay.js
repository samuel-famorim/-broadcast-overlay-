const fs = require('fs');
const path = require('path');

const displayCssPath = path.join(__dirname, 'public/css/display.css');
let displayCss = fs.readFileSync(displayCssPath, 'utf8');

if (!displayCss.includes('.texture-wave')) {
  displayCss += `

/* --- Texture & Wave Pattern overlay (Final 2026 aesthetics) --- */
.scoreboard-bg::after,
.medaltable-bg::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background-image: url('/src/sbc_assets/line-orange.png'), url('/src/sbc_assets/line-yellow.png');
  background-repeat: no-repeat;
  background-position: right bottom, left top;
  background-size: 40%, 40%;
  opacity: 0.15;
  pointer-events: none;
  z-index: -1;
}

.scoreboard-content, .medaltable-content {
  overflow: hidden;
}

.scoreboard-content::before, .medaltable-content::before {
  content: '';
  position: absolute;
  top: -50%; left: -50%;
  width: 200%; height: 200%;
  background: radial-gradient(circle at 80% 80%, rgba(255, 106, 0, 0.05), transparent 40%),
              radial-gradient(circle at 20% 20%, rgba(157, 0, 255, 0.05), transparent 40%);
  pointer-events: none;
  z-index: 0;
}
`;
  fs.writeFileSync(displayCssPath, displayCss);
}

