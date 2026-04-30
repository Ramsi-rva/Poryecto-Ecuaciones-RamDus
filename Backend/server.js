const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const saludoRoutes = require('./routes/saludo.routes');

app.use('/api/saludo', saludoRoutes);

app.listen(3000, () => {
  console.log('Servidor corriendo');
});