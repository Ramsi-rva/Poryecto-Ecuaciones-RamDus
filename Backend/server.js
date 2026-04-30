const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const statsRoutes = require('./routes/stats.routes');
const distRoutes = require('./routes/distributions.routes');

app.use('/api/stats', statsRoutes);
app.use('/api/distributions', distRoutes);

app.listen(3001, () => {
  console.log('Backend en http://localhost:3001');
});