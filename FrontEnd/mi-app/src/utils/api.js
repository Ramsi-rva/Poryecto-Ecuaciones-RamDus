const BASE = '/api'

async function get(path) {
  const res = await fetch(BASE + path)
  if (!res.ok) throw new Error('Error')
  return res.json()
}

async function post(path, body) {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error('Error')
  return res.json()
}

export const statsApi = {
  variance: (data, type) =>
    post('/stats/variance', { data, type }),

  expectedValue: (distribution) =>
    post('/stats/expected-value', { distribution })
}

export const distApi = {
  normalCurve: (params) =>
    get(`/distributions/normal/curve?zMin=${params.zMin}&zMax=${params.zMax}&steps=${params.steps}`),

  normalArea: (a, b) =>
    post('/distributions/normal/area', { a, b })
}