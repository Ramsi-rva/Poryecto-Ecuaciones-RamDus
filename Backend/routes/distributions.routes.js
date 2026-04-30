const express = require('express');
const router = express.Router();

const {
  normalCurve,
  normalArea
} = require('../controllers/distributions.controller');

router.get('/normal/curve', normalCurve);
router.post('/normal/area', normalArea);

module.exports = router;