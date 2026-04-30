exports.getSaludo = (req, res) => {
  res.json({ mensaje: 'Hola desde controller' });
};
// routes
const { getSaludo } = require('../controllers/saludo.controller');

router.get('/', getSaludo);