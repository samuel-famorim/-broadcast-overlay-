const fs = require('fs');
const path = require('path');

const displayCssPath = path.join(__dirname, 'public/css/display.css');
let displayCss = fs.readFileSync(displayCssPath, 'utf8');

// Add subtle gradient overlays to the bars to make them look less flat
if (!displayCss.includes('.lt-sports-bar-top::after')) {
  displayCss += `

/* --- Maratona Aesthetics Overlays --- */

.lt-sports-bar-top, .team-lt-bar-top {
  position: relative;
  overflow: hidden;
}

.lt-sports-bar-top::after, .team-lt-bar-top::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(90deg, rgba(255,255,255,0.1), transparent 50%, rgba(0,0,0,0.1));
  pointer-events: none;
}

.lt-sports-logo-block, .team-lt-logo-block {
  position: relative;
  overflow: hidden;
}

/* Glassmorphism subtle glow on logo blocks */
.lt-sports-logo-block::after, .team-lt-logo-block::after {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
  pointer-events: none;
}

/* Enhance accents */
.ticker-accent, .scoreboard-accent {
  background: var(--maratona-gradient-horizontal) !important;
}

/* Alert overlay glow */
.alert-card {
  box-shadow: 0 10px 40px rgba(0, 229, 255, 0.2), 0 0 20px rgba(157, 0, 255, 0.2);
  border: 1px solid rgba(0, 229, 255, 0.4);
}

.alert-message {
  font-family: var(--font-anta);
}
`;
  fs.writeFileSync(displayCssPath, displayCss);
}

