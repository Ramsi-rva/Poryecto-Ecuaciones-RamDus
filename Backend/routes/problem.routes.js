const express = require('express')
const router = express.Router()

// Problemas de ejemplo
const problems = [
  {
    id: 1,
    title: 'Valor Esperado Básico',
    description: 'Calcular E(X) usando una distribución discreta.',
  },
  {
    id: 2,
    title: 'Distribución Normal',
    description: 'Calcular probabilidades bajo la curva normal.',
  },
  {
    id: 3,
    title: 'Varianza',
    description: 'Calcular varianza poblacional y muestral.',
  },
]

// Obtener todos los problemas
router.get('/', (req, res) => {
  res.json(problems)
})

// Obtener problema por ID
router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id)

  const problem = problems.find((p) => p.id === id)

  if (!problem) {
    return res.status(404).json({
      error: 'Problema no encontrado.',
    })
  }

  res.json(problem)
})

module.exports = router