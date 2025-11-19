const express = require('express');
const swaggerUi = require('swagger-ui-express');
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

const swaggerDocument = yaml.load(
    fs.readFileSync(path.join(__dirname, 'swagger.yml'), 'utf8')
);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Blogify API Documentation"
}));

app.get('/', (req, res) => {
    res.redirect('/api-docs');
});

app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 Swagger UI démarré avec succès !                  ║
║                                                       ║
║   📖 Documentation API disponible sur :                ║
║   👉 http://localhost:${PORT}/api-docs                ║
║                                                       ║
║   Press Ctrl+C pour arrêter le serveur                ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});

