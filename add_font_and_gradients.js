const fs = require('fs');
const path = require('path');

// 1. UPDATE DISPLAY HTML
const displayHtmlPath = path.join(__dirname, 'public/display.html');
let displayHtml = fs.readFileSync(displayHtmlPath, 'utf8');

if (!displayHtml.includes('family=Anta')) {
  displayHtml = displayHtml.replace(
    'family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">',
    'family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">\n  <link href="https://fonts.googleapis.com/css2?family=Anta&display=swap" rel="stylesheet">'
  );
  fs.writeFileSync(displayHtmlPath, displayHtml);
}

// 2. UPDATE CONTROL HTML
const controlHtmlPath = path.join(__dirname, 'public/control.html');
let controlHtml = fs.readFileSync(controlHtmlPath, 'utf8');

if (!controlHtml.includes('family=Anta')) {
  controlHtml = controlHtml.replace(
    'family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">',
    'family=Montserrat:wght@400;600;700;800;900&display=swap" rel="stylesheet">\n  <link href="https://fonts.googleapis.com/css2?family=Anta&display=swap" rel="stylesheet">'
  );
  fs.writeFileSync(controlHtmlPath, controlHtml);
}

// 3. UPDATE DISPLAY CSS
const displayCssPath = path.join(__dirname, 'public/css/display.css');
let displayCss = fs.readFileSync(displayCssPath, 'utf8');

if (!displayCss.includes('--font-anta')) {
  displayCss = displayCss.replace(
    /:root \{/,
    `:root {
  --font-anta: 'Anta', sans-serif;
  --maratona-gradient: linear-gradient(135deg, var(--neon-cyan) 0%, var(--neon-blue) 33%, var(--neon-purple) 66%, var(--neon-orange) 100%);
  --maratona-gradient-horizontal: linear-gradient(90deg, var(--neon-cyan) 0%, var(--neon-blue) 33%, var(--neon-purple) 66%, var(--neon-orange) 100%);`
  );
  
  // Apply fonts
  displayCss = displayCss.replace(/\.medal-team-name \{([\s\S]*?)\}/, '.medal-team-name {$1  font-family: var(--font-anta);\n}');
  displayCss = displayCss.replace(/\.lt-sports-name \{([\s\S]*?)\}/, '.lt-sports-name {$1  font-family: var(--font-anta);\n}');
  displayCss = displayCss.replace(/\.team-lt-name \{([\s\S]*?)\}/, '.team-lt-name {$1  font-family: var(--font-anta);\n}');
  displayCss = displayCss.replace(/\.event-title \{([\s\S]*?)\}/, '.event-title {$1  font-family: var(--font-anta);\n}');
  displayCss = displayCss.replace(/\.ticker-text \{([\s\S]*?)\}/, '.ticker-text {$1  font-family: var(--font-anta);\n}');
  displayCss = displayCss.replace(/\.scoreboard-header h2 \{([\s\S]*?)\}/, '.scoreboard-header h2 {$1  font-family: var(--font-anta);\n}');
  displayCss = displayCss.replace(/\.medaltable-header h2 \{([\s\S]*?)\}/, '.medaltable-header h2 {$1  font-family: var(--font-anta);\n}');

  // Enhance sponsors sidebars
  displayCss = displayCss.replace(/background: linear-gradient\(135deg, var\(--neon-purple\), var\(--neon-blue\), var\(--neon-cyan\)\);/g, 'background: var(--maratona-gradient);');
  displayCss = displayCss.replace(/background: linear-gradient\(225deg, var\(--neon-cyan\), var\(--neon-orange\), var\(--neon-purple\)\);/g, 'background: linear-gradient(225deg, var(--neon-cyan) 0%, var(--neon-blue) 33%, var(--neon-purple) 66%, var(--neon-orange) 100%);');

  fs.writeFileSync(displayCssPath, displayCss);
}

// 4. UPDATE CONTROL CSS
const controlCssPath = path.join(__dirname, 'public/css/control.css');
let controlCss = fs.readFileSync(controlCssPath, 'utf8');

if (!controlCss.includes('--font-anta')) {
  controlCss = controlCss.replace(
    /:root \{/,
    `:root {
  --font-anta: 'Anta', sans-serif;
  --maratona-gradient: linear-gradient(135deg, var(--neon-cyan) 0%, var(--neon-blue) 33%, var(--neon-purple) 66%, var(--neon-orange) 100%);`
  );
  
  controlCss = controlCss.replace(/\.header-left h1 \{([\s\S]*?)\}/, '.header-left h1 {$1  font-family: var(--font-anta);\n}');
  controlCss = controlCss.replace(/\.panel h2 \{([\s\S]*?)\}/, '.panel h2 {$1  font-family: var(--font-anta);\n}');
  
  // Make the header gradient richer
  controlCss = controlCss.replace(
    /background: linear-gradient\(135deg, var\(--neon-cyan\), var\(--neon-blue\), var\(--neon-purple\)\);/g, 
    'background: var(--maratona-gradient);'
  );

  fs.writeFileSync(controlCssPath, controlCss);
}
