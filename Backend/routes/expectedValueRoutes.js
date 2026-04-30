const express = require('express')
const router = express.Router()

// ─────────────────────────────────────────────
// Evaluador simple f(x)
// ─────────────────────────────────────────────
function evaluateExpression(expression, x) {
  try {
    const safeExpression = expression.replace(/x/g, `(${x})`)
    return eval(safeExpression)
  } catch {
    return NaN
  }
}

// ─────────────────────────────────────────────
// POST /api/expected-value/fx
// ─────────────────────────────────────────────
router.post('/fx', (req, res) => {
  try {
    const { xValues, fxExpression } = req.body

    if (!Array.isArray(xValues) || !fxExpression) {
      return res.status(400).json({
        error: 'xValues y fxExpression son requeridos.',
      })
    }

    const probabilities = xValues.map((x) =>
      evaluateExpression(fxExpression, x)
    )

    const sumProbability = probabilities.reduce((a, b) => a + b, 0)

    if (sumProbability === 0) {
      return res.status(400).json({
        error: 'La suma de probabilidades es 0.',
      })
    }

    const normalized = probabilities.map((p) => p / sumProbability)

    let expectedValue = 0

    for (let i = 0; i < xValues.length; i++) {
      expectedValue += xValues[i] * normalized[i]
    }

    res.json({
      expectedValue,
      probabilities: normalized,
      sumProbability,
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: 'Error calculando valor esperado.',
    })
  }
})

module.exports = router