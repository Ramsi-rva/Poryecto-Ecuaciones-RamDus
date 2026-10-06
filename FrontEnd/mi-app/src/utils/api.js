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