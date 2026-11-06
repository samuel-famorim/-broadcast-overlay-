const fs = require('fs');
const path = require('path');

const serverJsPath = path.join(__dirname, 'server.js');
let serverJs = fs.readFileSync(serverJsPath, 'utf8');

if (!serverJs.includes('app.get(\'/\'')) {
  serverJs = serverJs.replace(
    /app\.use\('\/src', express\.static\(path\.join\(__dirname, 'src'\)\)\);/,
    `app.use('/src', express.static(path.join(__dirname, 'src')));\n\napp.get('/', authMiddleware, (req, res) => {\n  res.sendFile(path.join(__dirname, 'public', 'index.html'));\n});`
  );
  fs.writeFileSync(serverJsPath, serverJs);
}

