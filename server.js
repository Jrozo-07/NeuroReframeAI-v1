const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const validator = require('./middleware/validator');
const reframeController = require('./controllers/reframeController');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta POST para reencuadre cognitivo
app.post('/api/reframe', validator, reframeController.reframeThought);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` NeuroReframeAI Server running at:`);
  console.log(` http://localhost:${PORT}`);
  console.log(`=================================================`);
});
