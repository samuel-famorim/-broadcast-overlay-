const fs = require('fs');
const path = require('path');

const displayJsPath = path.join(__dirname, 'public/js/display.js');
let displayJs = fs.readFileSync(displayJsPath, 'utf8');

// Inject setting CSS variables for colors so the neon text trick works
displayJs = displayJs.replace(
  /sportsLt\.querySelector\('\.lt-sports-name'\)\.style\.color = nameColor;/,
  `sportsLt.querySelector('.lt-sports-name').style.setProperty('--name-color', nameColor);
    sportsLt.querySelector('.lt-sports-name').style.color = nameColor;`
);

displayJs = displayJs.replace(
  /sportsLt\.querySelector\('\.lt-sports-role'\)\.style\.color = roleColor;/,
  `sportsLt.querySelector('.lt-sports-role').style.setProperty('--role-color', roleColor);
    sportsLt.querySelector('.lt-sports-role').style.color = roleColor;`
);

displayJs = displayJs.replace(
  /teamLt\.querySelector\('\.team-lt-name'\)\.style\.color = nameColor;/,
  `teamLt.querySelector('.team-lt-name').style.setProperty('--name-color', nameColor);
  teamLt.querySelector('.team-lt-name').style.color = nameColor;`
);

displayJs = displayJs.replace(
  /teamLt\.querySelector\('\.team-lt-members'\)\.style\.color = membersColor;/,
  `teamLt.querySelector('.team-lt-members').style.setProperty('--role-color', membersColor);
  teamLt.querySelector('.team-lt-members').style.color = membersColor;`
);

fs.writeFileSync(displayJsPath, displayJs);
