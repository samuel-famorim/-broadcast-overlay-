const fs = require('fs');
const path = require('path');

const displayCssPath = path.join(__dirname, 'public/css/display.css');
let displayCss = fs.readFileSync(displayCssPath, 'utf8');

// 1. Fix the font for the role to match the name
if (!displayCss.includes('.lt-sports-role {\\n  font-size: 20px;\\n  font-weight: 800;\\n  color: #1a1a1a;\\n  text-transform: uppercase;\\n  letter-spacing: 2px;\\n  white-space: nowrap;\\n  font-family: var(--font-anta);')) {
  displayCss = displayCss.replace(
    /(\.lt-sports-role \{[^}]*)(\})/,
    '$1  font-family: var(--font-anta);\n$2'
  );
}

// 2. Adjust padding and sizing for logo img to prevent it from touching the edges and make it look cleaner
displayCss = displayCss.replace(
  /\.lt-sports-logo-img \{([\s\S]*?)padding: 6px;/,
  '.lt-sports-logo-img {$1padding: 12px;'
);

// 3. Round the corners a bit more to make it match the rounded aesthetic of the maratona site
displayCss = displayCss.replace(
  /border-radius: 8px 0 0 8px;/g,
  'border-radius: 12px 0 0 12px;'
);
displayCss = displayCss.replace(
  /border-radius: 0 8px 8px 0;/g,
  'border-radius: 0 12px 12px 0;'
);
displayCss = displayCss.replace(
  /border-radius: 0 8px 0 0;/g,
  'border-radius: 0 12px 0 0;'
);
displayCss = displayCss.replace(
  /border-radius: 0 0 8px 0;/g,
  'border-radius: 0 0 12px 0;'
);
displayCss = displayCss.replace(
  /border-radius: 8px 0 0 0;/g,
  'border-radius: 12px 0 0 0;'
);
displayCss = displayCss.replace(
  /border-radius: 0 0 0 8px;/g,
  'border-radius: 0 0 0 12px;'
);

// 4. Update the geometric boxes on the logo background to pop out properly with the gradients
displayCss = displayCss.replace(
  /\.lt-sports-geo-top \{([\s\S]*?)background: var\(--neon-cyan\);/,
  '.lt-sports-geo-top {$1background: var(--maratona-gradient);'
);
displayCss = displayCss.replace(
  /\.lt-sports-geo-bottom \{([\s\S]*?)background: var\(--neon-orange\);/,
  '.lt-sports-geo-bottom {$1background: var(--maratona-gradient-horizontal);'
);

fs.writeFileSync(displayCssPath, displayCss);

