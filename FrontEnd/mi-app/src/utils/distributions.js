// ─────────────────────────────────────────────────────────────
// distributions.js — Matemática de probabilidad y estadística
// Normal, t-Student, Chi-cuadrada, F, Binomial, Poisson,
// intervalos de confianza y pruebas de hipótesis para la media
// ─────────────────────────────────────────────────────────────

// ══ NORMAL ═══════════════════════════════════════════════════

export function normalPdf(x, mu = 0, sigma = 1) {
  const z = (x - mu) / sigma
  return Math.exp(-0.5 * z * z) / (sigma * Math.sqrt(2 * Math.PI))
}

// CDF normal estándar (algoritmo de West/Hart, precisión ~1e-15)
export function normalCdf(z) {
  if (z === Infinity) return 1
  if (z === -Infinity) return 0
  const x = Math.abs(z)
  let c
  if (x > 37) {
    c = 0
  } else {
    const e = Math.exp(-x * x / 2)
    if (x < 7.07106781186547) {
      let b = 3.52624965998911e-2 * x + 0.700383064443688
      b = b * x + 6.37396220353165
      b = b * x + 33.912866078383
      b = b * x + 112.079291497871
      b = b * x + 221.213596169931
      b = b * x + 220.206867912376
      c = e * b
      b = 8.83883476483184e-2 * x + 1.75566716318264
      b = b * x + 16.064177579207
      b = b * x + 86.7807322029461
      b = b * x + 296.564248779674
      b = b * x + 637.333633378831
      b = b * x + 793.826512519948
      b = b * x + 440.413735824752
      c = c / b
    } else {
      let b = x + 0.65
      b = x + 4 / b
      b = x + 3 / b
      b = x + 2 / b
      b = x + 1 / b
      c = e / b / 2.506628274631
    }
  }
  return z > 0 ? 1 - c : c
}

// Inversa de la CDF normal estándar (Acklam + 1 paso de Halley)
export function normalInv(p) {
  if (!(p > 0 && p < 1)) {
    if (p === 0) return -Infinity
    if (p === 1) return Infinity
    return NaN
  }
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
    1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00]
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
    6.680131188771972e+01, -1.328068155288572e+01]
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
    -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00]
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00,
    3.754408661907416e+00]
  const pl = 0.02425
  let x
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p))
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  } else if (p <= 1 - pl) {
    const q = p - 0.5
    const r = q * q
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
      (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p))
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
  }
  // Refinamiento (Halley)
  const e = normalCdf(x) - p
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2)
  return x - u / (1 + x * u / 2)
}

// ══ t-STUDENT ════════════════════════════════════════════════

// log Γ(x) — Lanczos
export function lgamma(x) {
  const g = 7
  const c = [0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7]
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lgamma(1 - x)
  x -= 1
  let a = c[0]
  const t = x + g + 0.5
  for (let i = 1; i < g + 2; i++) a += c[i] / (x + i)
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a)
}

// Beta incompleta regularizada I_x(a, b) — fracción continua (Lentz)
function betaCf(x, a, b) {
  const MAXIT = 500, EPS = 1e-15, FPMIN = 1e-300
  const qab = a + b, qap = a + 1, qam = a - 1
  let c = 1
  let d = 1 - qab * x / qap
  if (Math.abs(d) < FPMIN) d = FPMIN
  d = 1 / d
  let h = d
  for (let m = 1; m <= MAXIT; m++) {
    const m2 = 2 * m
    let aa = m * (b - m) * x / ((qam + m2) * (a + m2))
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    h *= d * c
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2))
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < EPS) break
  }
  return h
}

export function betaInc(x, a, b) {
  if (x <= 0) return 0
  if (x >= 1) return 1
  const bt = Math.exp(lgamma(a + b) - lgamma(a) - lgamma(b) + a * Math.log(x) + b * Math.log(1 - x))
  return x < (a + 1) / (a + b + 2)
    ? bt * betaCf(x, a, b) / a
    : 1 - bt * betaCf(1 - x, b, a) / b
}

export function tPdf(t, df) {
  return Math.exp(lgamma((df + 1) / 2) - lgamma(df / 2)) /
    Math.sqrt(df * Math.PI) * Math.pow(1 + t * t / df, -(df + 1) / 2)
}

// P(T ≤ t)
export function tCdf(t, df) {
  if (t === Infinity) return 1
  if (t === -Infinity) return 0
  const x = df / (df + t * t)
  const tail = 0.5 * betaInc(x, df / 2, 0.5) // P(T ≥ |t|)
  return t > 0 ? 1 - tail : tail
}

// P(T ≥ t) calculada sin perder precisión en la cola
export function tSf(t, df) {
  return tCdf(-t, df)
}

// Inversa: t tal que P(T ≤ t) = p
export function tInv(p, df) {
  if (!(p > 0 && p < 1)) {
    if (p === 0) return -Infinity
    if (p === 1) return Infinity
    return NaN
  }
  if (p === 0.5) return 0
  if (p < 0.5) return -tInv(1 - p, df)
  // p > 0.5: buscar t > 0 con P(T ≥ t) = 1 - p
  const q = 1 - p
  let lo = 0, hi = 1
  while (tSf(hi, df) > q && hi < 1e15) hi *= 2
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    if (tSf(mid, df) > q) lo = mid; else hi = mid
    if (hi - lo < 1e-14 * Math.max(1, hi)) break
  }
  return (lo + hi) / 2
}

// ══ VALORES CRÍTICOS Y ALFA (ambas distribuciones) ═══════════
// dist = { type: 'z' } | { type: 't', df }

export function cdf(x, dist) {
  return dist.type === 't' ? tCdf(x, dist.df) : normalCdf(x)
}
export function inv(p, dist) {
  return dist.type === 't' ? tInv(p, dist.df) : normalInv(p)
}

// Valor crítico a partir de alfa.  tail: 'two' | 'right' | 'left'
//   two   → ±c con α/2 en cada cola
//   right → c con área α a la derecha
//   left  → -c con área α a la izquierda
export function criticalValue(alpha, tail, dist) {
  if (tail === 'two') return inv(1 - alpha / 2, dist)
  if (tail === 'right') return inv(1 - alpha, dist)
  return inv(alpha, dist)
}

// Alfa / valor p a partir de un estadístico (z o t).
export function pValue(x, tail, dist) {
  if (tail === 'two') return 2 * cdf(-Math.abs(x), dist)
  if (tail === 'right') return cdf(-x, dist)
  return cdf(x, dist)
}

// Nivel de confianza ↔ alfa
export const confidenceFromAlpha = (alpha) => 1 - alpha
export const alphaFromConfidence = (conf) => 1 - conf

// Acepta 0.05 ó 5 (se interpreta como 5 %). Devuelve NaN si no está en (0,1).
export function parseProb(str) {
  const v = parseFloat(str)
  if (isNaN(v)) return NaN
  const p = v > 1 ? v / 100 : v
  return p > 0 && p < 1 ? p : NaN
}


// ══ CHI-CUADRADA ═════════════════════════════════════════════

// Gamma incompleta regularizada inferior P(a, x)
export function gammaInc(a, x) {
  if (x <= 0) return 0
  if (x === Infinity) return 1
  const gln = lgamma(a)
  if (x < a + 1) {
    // serie
    let ap = a, sum = 1 / a, del = sum
    for (let n = 0; n < 1000; n++) {
      ap += 1
      del *= x / ap
      sum += del
      if (Math.abs(del) < Math.abs(sum) * 1e-16) break
    }
    return sum * Math.exp(-x + a * Math.log(x) - gln)
  }
  // fracción continua (Lentz) para Q(a, x)
  const FPMIN = 1e-300
  let b = x + 1 - a, c = 1 / FPMIN, d = 1 / b, h = d
  for (let i = 1; i < 1000; i++) {
    const an = -i * (i - a)
    b += 2
    d = an * d + b; if (Math.abs(d) < FPMIN) d = FPMIN
    c = b + an / c; if (Math.abs(c) < FPMIN) c = FPMIN
    d = 1 / d
    const del = d * c
    h *= del
    if (Math.abs(del - 1) < 1e-16) break
  }
  return 1 - Math.exp(-x + a * Math.log(x) - gln) * h
}

// Inversa genérica por bisección para CDF crecientes en [0, ∞)
function invPositive(cdfFn, p) {
  if (!(p > 0 && p < 1)) {
    if (p === 0) return 0
    if (p === 1) return Infinity
    return NaN
  }
  let lo = 0, hi = 1
  while (cdfFn(hi) < p && hi < 1e15) hi *= 2
  for (let i = 0; i < 300; i++) {
    const mid = (lo + hi) / 2
    if (cdfFn(mid) < p) lo = mid; else hi = mid
    if (hi - lo < 1e-14 * Math.max(1, hi)) break
  }
  return (lo + hi) / 2
}

export function chi2Pdf(x, k) {
  if (x < 0) return 0
  if (x === 0) return k === 2 ? 0.5 : k < 2 ? Infinity : 0
  return Math.exp((k / 2 - 1) * Math.log(x) - x / 2 - (k / 2) * Math.LN2 - lgamma(k / 2))
}
export const chi2Cdf = (x, k) => (x <= 0 ? 0 : gammaInc(k / 2, x / 2))
export const chi2Inv = (p, k) => invPositive((x) => chi2Cdf(x, k), p)

// ══ F DE FISHER ══════════════════════════════════════════════

export function fPdf(x, d1, d2) {
  if (x < 0) return 0
  if (x === 0) return d1 === 2 ? 1 : d1 < 2 ? Infinity : 0
  const logPdf = 0.5 * (d1 * Math.log(d1 * x) + d2 * Math.log(d2) - (d1 + d2) * Math.log(d1 * x + d2)) -
    Math.log(x) - (lgamma(d1 / 2) + lgamma(d2 / 2) - lgamma((d1 + d2) / 2))
  return Math.exp(logPdf)
}
export const fCdf = (x, d1, d2) => (x <= 0 ? 0 : betaInc((d1 * x) / (d1 * x + d2), d1 / 2, d2 / 2))
export const fInv = (p, d1, d2) => invPositive((x) => fCdf(x, d1, d2), p)

// ══ DISCRETAS: BINOMIAL Y POISSON ════════════════════════════

const lfact = (n) => lgamma(n + 1)

export function binomPmf(k, n, p) {
  if (k < 0 || k > n || !Number.isInteger(k)) return 0
  if (p === 0) return k === 0 ? 1 : 0
  if (p === 1) return k === n ? 1 : 0
  return Math.exp(lfact(n) - lfact(k) - lfact(n - k) + k * Math.log(p) + (n - k) * Math.log(1 - p))
}
// P(X ≤ k)
export function binomCdf(k, n, p) {
  if (k < 0) return 0
  if (k >= n) return 1
  let s = 0
  for (let i = 0; i <= Math.floor(k); i++) s += binomPmf(i, n, p)
  return Math.min(1, s)
}

export function poissonPmf(k, lambda) {
  if (k < 0 || !Number.isInteger(k)) return 0
  if (lambda === 0) return k === 0 ? 1 : 0
  return Math.exp(-lambda + k * Math.log(lambda) - lfact(k))
}
export function poissonCdf(k, lambda) {
  if (k < 0) return 0
  let s = 0
  for (let i = 0; i <= Math.floor(k); i++) s += poissonPmf(i, lambda)
  return Math.min(1, s)
}

// ══ INFERENCIA PARA LA MEDIA ═════════════════════════════════
// known = true → σ conocida (z); false → s muestral (t con n−1 gl)

export function meanDist(known, n) {
  return known ? { type: 'z' } : { type: 't', df: n - 1 }
}

export function confidenceInterval({ mean, sd, n, conf, known }) {
  const dist = meanDist(known, n)
  const crit = inv(1 - (1 - conf) / 2, dist)
  const se = sd / Math.sqrt(n)
  const margin = crit * se
  return { crit, se, margin, lower: mean - margin, upper: mean + margin, dist }
}

// tail: 'two' | 'right' | 'left' — H1: μ ≠ μ0, μ > μ0, μ < μ0
export function meanTest({ mean, mu0, sd, n, alpha, tail, known }) {
  const dist = meanDist(known, n)
  const se = sd / Math.sqrt(n)
  const stat = (mean - mu0) / se
  const p = pValue(stat, tail, dist)
  const crit = criticalValue(alpha, tail, dist)
  return { stat, p, crit, se, dist, reject: p < alpha }
}
