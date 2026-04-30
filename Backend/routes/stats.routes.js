const express = require('express');
const router = express.Router();

const {
  variance,
  expectedValue
} = require('../controllers/stats.controller');

router.post('/variance', variance);
router.post('/expected-value', expectedValue);

module.exports = router;