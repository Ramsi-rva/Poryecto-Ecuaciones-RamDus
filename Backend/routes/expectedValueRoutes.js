const express = require('express')
const router = express.Router()

function parseProbability(value) {
  if (typeof value === 'number') return value

  if (typeof value === 'string') {
    if (value.includes('/')) {
      const [num, den] = value.split('/').map(Number)

      if (!isNaN(num) && !isNaN(den) && den !== 0) {
        return num / den
      }
    }

    return parseFloat(value)
  }

  return NaN
}
const { evaluateExpression } = require('./safeEval')

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

// ─────────────────────────────────────────────
// POST /api/expected-value/distribution
// ─────────────────────────────────────────────
router.post('/distribution', (req, res) => {
  try {
    const { distribution } = req.body

    if (!Array.isArray(distribution)) {
      return res.status(400).json({
        error: 'distribution requerido.',
      })
    }

    let expectedValue = 0
    let sumProbability = 0

    const parsed = distribution.map((item) => {
      const x = Number(item.x)
      const p = parseProbability(item.p)

      sumProbability += p
      expectedValue += x * p

      return { x, p }
    })

    res.json({
      distribution: parsed,
      expectedValue,
      sumProbability,
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: 'Error calculando distribución.',
    })
  }
})
// ─────────────────────────────────────────────
// POST /api/expected-value/fxy
// ─────────────────────────────────────────────
router.post('/fxy', (req, res) => {
  try {
    const { xValues, yValues, fxyExpression } = req.body

    if (
      !Array.isArray(xValues) ||
      !Array.isArray(yValues) ||
      !fxyExpression
    ) {
      return res.status(400).json({
        error: 'xValues, yValues y fxyExpression requeridos.',
      })
    }

    const table = []

    let total = 0

    for (const x of xValues) {
      for (const y of yValues) {
        const prob = evaluateExpression(fxyExpression, x, y)

        if (!isNaN(prob)) {
          table.push({
            x,
            y,
            prob,
          })

          total += prob
        }
      }
    }

    if (total === 0) {
      return res.status(400).json({
        error: 'La suma de probabilidades es 0.',
      })
    }

    table.forEach((item) => {
      item.prob = item.prob / total
    })

    let EX = 0
    let EY = 0
    let EXY = 0

    table.forEach((item) => {
      EX += item.x * item.prob
      EY += item.y * item.prob
      EXY += item.x * item.y * item.prob
    })

    const covariance = EXY - EX * EY

    res.json({
      table,
      expectedX: EX,
      expectedY: EY,
      expectedXY: EXY,
      covariance,
    })
  } catch (err) {
    console.error(err)

    res.status(500).json({
      error: 'Error calculando F(X,Y).',
    })
  }
})

module.exports = router