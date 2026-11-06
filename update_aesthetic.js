const fs = require('fs');
const path = require('path');

const displayCssPath = path.join(__dirname, 'public/css/display.css');
let displayCss = fs.readFileSync(displayCssPath, 'utf8');

displayCss = displayCss.replace(
  /:root \{[\s\S]*?\}/,
  `:root {
  --gold: #FFD700;
  --gold-dark: #B8860B;
  --silver: #C0C0C0;
  --silver-dark: #808080;
  --bronze: #CD7F32;
  --bronze-dark: #8B4513;

  --bg-dark: #0b0e27; 
  --neon-cyan: #00e5ff;
  --neon-blue: #2962ff;
  --neon-orange: #ff6a00;
  --neon-purple: #9d00ff;
  --card-solid: #10152b; 
  --card-base-color: #10113c; 
  --text-main: #ffffff;
  --text-muted: #94a3b8;
  --accent: #00e5ff;
}`
);

displayCss = displayCss.replace(/Maratona Mineira/g, 'Maratona SBC');
displayCss = displayCss.replace(/background: #0066FF;/g, 'background: var(--neon-blue);');
displayCss = displayCss.replace(/background: #FFD700;/g, 'background: var(--neon-cyan);\n  color: var(--bg-dark);');
displayCss = displayCss.replace(/linear-gradient\(135deg, #FF1493, #FF6B6B, #FFD700\)/g, 'linear-gradient(135deg, var(--neon-purple), var(--neon-blue), var(--neon-cyan))');
displayCss = displayCss.replace(/linear-gradient\(225deg, #00BFFF, #4ECDC4, #00FF88\)/g, 'linear-gradient(225deg, var(--neon-cyan), var(--neon-orange), var(--neon-purple))');

// geo
displayCss = displayCss.replace(/background: #FF1493;/g, 'background: var(--neon-purple);');
displayCss = displayCss.replace(/background: #FFD700;/g, 'background: var(--neon-cyan);'); // some false positives with gold, but it's ok for accent elements
displayCss = displayCss.replace(/background: #00BFFF;/g, 'background: var(--neon-cyan);');
displayCss = displayCss.replace(/background: #00FF88;/g, 'background: var(--neon-orange);');

fs.writeFileSync(displayCssPath, displayCss);


const controlCssPath = path.join(__dirname, 'public/css/control.css');
let controlCss = fs.readFileSync(controlCssPath, 'utf8');

controlCss = controlCss.replace(
  /:root \{[\s\S]*?\}/,
  `:root {
  --bg: #0b0e27;
  --bg-card: #10152b;
  --border: rgba(255, 255, 255, 0.1);
  --text: #ffffff;
  --text-dim: #94a3b8;
  --gold: #FFD700;
  --accent: #00e5ff;
  --danger: #ff6a00;
  --success: #00e5ff;
  --warning: #ff6a00;
  
  --neon-cyan: #00e5ff;
  --neon-blue: #2962ff;
  --neon-orange: #ff6a00;
  --neon-purple: #9d00ff;
}`
);

controlCss = controlCss.replace(/background-image:[\s\S]*?;/g, `background-image: radial-gradient(circle at 50% 0%, #152069 0%, #0c0b4d 50%, #032833 100%);
  background-attachment: fixed;`);
controlCss = controlCss.replace(/Maratona Mineira/g, 'Maratona SBC');
controlCss = controlCss.replace(/linear-gradient\(135deg, #FFD700, #FF6B6B, #6C5CE7\)/g, 'linear-gradient(135deg, var(--neon-cyan), var(--neon-blue), var(--neon-purple))');

fs.writeFileSync(controlCssPath, controlCss);

