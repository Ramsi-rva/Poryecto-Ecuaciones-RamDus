// ─────────────────────────────────────────────────────────────
// api.js  —  Todas las llamadas HTTP al backend Express
// Gracias al proxy de vite.config.js solo usamos /api/...
// ─────────────────────────────────────────────────────────────

const BASE = '/api'

// ── Helpers ───────────────────────────────────────────────────
async function get(path) {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error en el servidor')
  }
  return res.json()
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.error || 'Error en el servidor')
  }
  return res.json()
}

// ── Stats ─────────────────────────────────────────────────────
export const statsApi = {
  /**
   * Calcula varianza de un conjunto de datos.
   * @param {number[]} data
   * @param {'population'|'sample'} type
   */
  variance: (data, type = 'population') =>
    post('/stats/variance', { data, type }),

  /**
   * Calcula el valor esperado de una distribución discreta.
   * @param {{ value: number, prob: number }[]} distribution
   */
  expectedValue: (distribution) =>
    post('/stats/expected-value', { distribution }),
}

// ── Distribuciones ────────────────────────────────────────────
export const distApi = {
  /**
   * Obtiene puntos de la curva normal (PDF o CDF).
   * @param {{ zMin, zMax, steps, type }} params
   */
  normalCurve: ({ zMin = -5, zMax = 5, steps = 500, type = 'pdf' } = {}) =>
    get(`/distributions/normal/curve?zMin=${zMin}&zMax=${zMax}&steps=${steps}&type=${type}`),

  /**
   * Calcula el área bajo la curva normal entre a y b.
   * @param {number|null} a  null = -∞
   * @param {number|null} b  null = +∞
   */
  normalArea: (a, b) =>
    post('/distributions/normal/area', { a, b }),

  /**
   * Convierte X a z-score y calcula P(Z ≤ z).
   * @param {{ x, mu, sigma }} params
   */
  zScore: ({ x, mu, sigma }) =>
    post('/distributions/normal/zscore', { x, mu, sigma }),

  /**
   * Calcula el z crítico para una probabilidad p.
   * @param {number} p  Probabilidad (0, 1)
   */
  normalInverse: (p) =>
    post('/distributions/normal/inverse', { p }),

  /**
   * Obtiene puntos de la curva t-Student.
   * @param {{ df, tMin, tMax, steps }} params
   */
  tStudentCurve: ({ df = 5, tMin = -5, tMax = 5, steps = 500 } = {}) =>
    get(`/distributions/tstudent/curve?df=${df}&tMin=${tMin}&tMax=${tMax}&steps=${steps}`),

  /**
   * Obtiene múltiples curvas t-Student para comparar.
   * @param {{ dfList, tMin, tMax, steps }} params
   */
  tStudentCompare: ({ dfList = [1, 3, 10, 30], tMin = -5, tMax = 5, steps = 400 } = {}) =>
    get(`/distributions/tstudent/compare?dfList=${dfList.join(',')}&tMin=${tMin}&tMax=${tMax}&steps=${steps}`),
}

// ── Valor Esperado ────────────────────────────────────────────
// ── Valor Esperado ────────────────────────────────────────────
export const expectedValueApi = {
  fx: (xValues, fxExpression) =>
    post('/expected-value/fx', {
      xValues,
      fxExpression,
    }),
}

// ── Problemas ─────────────────────────────────────────────────
export const problemsApi = {
  /** Obtiene todos los 10 problemas resueltos. */
  getAll: () => get('/problems'),

  /** Obtiene un problema específico por ID (1–10). */
  getById: (id) => get(`/problems/${id}`),
}