const fs = require('fs');
const path = require('path');

const displayCssPath = path.join(__dirname, 'public/css/display.css');
let displayCss = fs.readFileSync(displayCssPath, 'utf8');

if (!displayCss.includes('.lt-sports-name {\\n  font-size: 28px;\\n  font-weight: 900;\\n  color: inherit;')) {
  displayCss = displayCss.replace(
    /(\.lt-sports-name \{[^}]*?color:\s*)([^;]+)(;)/,
    '$1var(--name-color, #fff)$3'
  );
  displayCss = displayCss.replace(
    /(\.lt-sports-role \{[^}]*?color:\s*)([^;]+)(;)/,
    '$1var(--role-color, var(--bg-dark))$3'
  );
  displayCss = displayCss.replace(
    /(\.team-lt-name \{[^}]*?color:\s*)([^;]+)(;)/,
    '$1var(--name-color, #fff)$3'
  );
  displayCss = displayCss.replace(
    /(\.team-lt-members \{[^}]*?color:\s*)([^;]+)(;)/,
    '$1var(--role-color, var(--bg-dark))$3'
  );

  // Add neon border styling like the cards in the website
  displayCss += `

/* --- Final 2026 Dark Aesthetics (When using dark bottoms) --- */
.lt-sports-bar-top {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}
.lt-sports-bar-bottom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.lt-sports-logo-block {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}

/* Specific left/right borders based on position */
#lowerthird-right .lt-sports-bar-top {
  border-right: none;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}
#lowerthird-right .lt-sports-bar-bottom {
  border-right: none;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}
#lowerthird-right .lt-sports-logo-block {
  border-left: none;
  border-right: 1px solid rgba(255, 255, 255, 0.1);
}

.sports-lt-left, .sports-lt-right, .team-lt-inner {
  filter: drop-shadow(0 10px 30px rgba(0,0,0,0.8));
}
`;
  fs.writeFileSync(displayCssPath, displayCss);
}

