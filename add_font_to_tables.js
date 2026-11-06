const fs = require('fs');
const path = require('path');

const displayCssPath = path.join(__dirname, 'public/css/display.css');
let displayCss = fs.readFileSync(displayCssPath, 'utf8');

if (!displayCss.includes('.medaltable-thead span { font-family: var(--font-anta); }')) {
  displayCss += `
.medaltable-thead span, .scoreboard-thead span { 
  font-family: var(--font-anta); 
  letter-spacing: 1px;
}
.firstac-problem, .firstac-team {
  font-family: var(--font-anta);
}
.prob-acs-label {
  font-family: var(--font-anta);
  letter-spacing: 2px;
}
`;
  fs.writeFileSync(displayCssPath, displayCss);
}

