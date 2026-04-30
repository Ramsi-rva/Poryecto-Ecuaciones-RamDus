// ─────────────────────────────────────────────────────────────
// DistribucionNormal.jsx  —  Con gráfica SVG, 3 modos y soporte ±∞
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './DistribucionNormal.css'

// ── Utilidades matemáticas ────────────────────────────────────
function erf(x) {
const a1 =  0.254829592, a2 = -0.284496736, a3 =  1.421413741
const a4 = -1.453152027, a5 =  1.061405429, p  =  0.3275911
const sign = x < 0 ? -1 : 1
x = Math.abs(x)
const t = 1.0 / (1.0 + p * x)
const y = 1.0 - (((((a5*t+a4)*t)+a3)*t+a2)*t+a1)*t*Math.exp(-x*x)
return sign * y
}

function phi(z) {
return 0.5 * (1 + erf(z / Math.sqrt(2)))
}

function pdf(x, mu, sigma) {
const z = (x - mu) / sigma
return (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z)
}

// ── Componente de gráfica SVG ─────────────────────────────────
function NormalCurveChart({ mu, sigma, mode, a, b }) {
  const W = 520
  const H = 220

  const PAD = {
    top: 20,
    right: 25,
    bottom: 38,
    left: 25
  }

  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom

  const chartData = useMemo(() => {
    let xMin = mu - 4 * sigma
    let xMax = mu + 4 * sigma

    const validA = isFinite(a)
    const validB = isFinite(b)

    if (validA) {
      xMin = Math.min(xMin, a - sigma * 1.5)
      xMax = Math.max(xMax, a + sigma * 1.5)
    }

    if (validB) {
      xMin = Math.min(xMin, b - sigma * 1.5)
      xMax = Math.max(xMax, b + sigma * 1.5)
    }

    const range = xMax - xMin

    const pts = []
    const STEPS = 500

    for (let i = 0; i <= STEPS; i++) {
      const x = xMin + (i / STEPS) * range
      pts.push({
        x,
        y: pdf(x, mu, sigma)
      })
    }

    return { pts, xMin, xMax }
  }, [mu, sigma, a, b])

  const { pts, xMin, xMax } = chartData

  const yMax = Math.max(...pts.map(p => p.y)) * 1.15

  const toSvgX = (x) =>
    PAD.left + ((x - xMin) / (xMax - xMin)) * plotW

  const toSvgY = (y) =>
    PAD.top + plotH - (y / yMax) * plotH

  const linePath = pts
    .map((p, i) =>
      `${i === 0 ? 'M' : 'L'}${toSvgX(p.x)},${toSvgY(p.y)}`
    )
    .join(' ')

  const baseY = toSvgY(0)

  // SOMBREADO INTELIGENTE
  const shadePath = useMemo(() => {
    let shadeStart = xMin
    let shadeEnd = xMax

    if (mode === 'leq') {
      shadeEnd = isFinite(b) ? b : xMax
    }

    if (mode === 'geq') {
      shadeStart = isFinite(a) ? a : xMin
    }

    if (mode === 'between') {
      shadeStart = isFinite(a) ? a : xMin
      shadeEnd = isFinite(b) ? b : xMax
    }

    if (shadeStart >= shadeEnd) return ''

    const shadePts = pts.filter(
      p => p.x >= shadeStart && p.x <= shadeEnd
    )

    if (shadePts.length < 2) return ''

    const start = shadePts[0]
    const end = shadePts[shadePts.length - 1]

    const path = shadePts
      .map((p, i) =>
        `${i === 0 ? 'M' : 'L'}${toSvgX(p.x)},${toSvgY(p.y)}`
      )
      .join(' ')

    return `
      ${path}
      L ${toSvgX(end.x)} ${baseY}
      L ${toSvgX(start.x)} ${baseY}
      Z
    `
  }, [pts, mode, a, b, xMin, xMax])

  // ESCALA DINÁMICA
  const ticks = useMemo(() => {
    const range = xMax - xMin

    let step

    if (range <= 1) step = 0.1
    else if (range <= 10) step = 1
    else if (range <= 100) step = 10
    else if (range <= 1000) step = 100
    else step = Math.pow(10, Math.floor(Math.log10(range)) - 1)

    const first = Math.ceil(xMin / step) * step

    const arr = []

    for (let x = first; x <= xMax; x += step) {
      arr.push(Number(x.toFixed(4)))
    }

    return arr
  }, [xMin, xMax])

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="dn-chart"
    >
      <defs>
        <linearGradient id="shadeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--dn-accent)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--dn-accent)" stopOpacity="0.12" />
        </linearGradient>
      </defs>

      <line
        x1={PAD.left}
        y1={baseY}
        x2={PAD.left + plotW}
        y2={baseY}
        stroke="var(--dn-line)"
      />

      <line
        x1={toSvgX(mu)}
        y1={PAD.top}
        x2={toSvgX(mu)}
        y2={baseY}
        stroke="var(--dn-accent)"
        strokeDasharray="4 3"
        opacity="0.5"
      />

      {shadePath && (
        <path d={shadePath} fill="url(#shadeGrad)" />
      )}

      <path
        d={linePath}
        fill="none"
        stroke="var(--dn-curve)"
        strokeWidth="2.4"
      />

      {ticks.map((x, i) => (
        <g key={i}>
          <line
            x1={toSvgX(x)}
            y1={baseY}
            x2={toSvgX(x)}
            y2={baseY + 5}
            stroke="var(--dn-line)"
          />

          <text
            x={toSvgX(x)}
            y={baseY + 18}
            textAnchor="middle"
            fontSize="9"
            fill="var(--dn-muted)"
            fontFamily="'DM Mono', monospace"
          >
            {Math.abs(x) < 1
              ? x.toFixed(1)
              : Number.isInteger(x)
              ? x
              : x.toFixed(2)}
          </text>
        </g>
      ))}

      <text
        x={toSvgX(mu)}
        y={PAD.top - 5}
        textAnchor="middle"
        fill="var(--dn-accent)"
        fontSize="10"
      >
        μ
      </text>
    </svg>
  )
}

// ── Componente principal ──────────────────────────────────────
export default function DistribucionNormal({ onBack }) {
const [media, setMedia]         = useState('0')
const [desviacion, setDesviacion] = useState('1')
const [mode, setMode]           = useState('leq')   // 'leq' | 'geq' | 'between'

// Límite inferior (modo between o leq/geq)
const [xA, setXA]               = useState('')
const [xB, setXB]               = useState('')

// Checkboxes ±∞
const [aIsNegInf, setAIsNegInf] = useState(false)
const [bIsPosInf, setBIsPosInf] = useState(false)

const [resultado, setResultado] = useState(null)

// Parseo seguro
const mu    = parseFloat(media)
const sigma = parseFloat(desviacion)
const numA  = aIsNegInf ? -Infinity : parseFloat(xA)
const numB  = bIsPosInf ?  Infinity : parseFloat(xB)

// Valor final de a/b para la gráfica (puede ser null si no aplica)
const chartA = mode === 'geq' ? numA : mode === 'between' ? numA : -Infinity
const chartB = mode === 'leq' ? numA : mode === 'between' ? numB :  Infinity

const paramsOk = !isNaN(mu) && !isNaN(sigma) && sigma > 0

function calcular() {
if (!paramsOk) {
setResultado({ error: 'Ingresa valores válidos de μ y σ (σ > 0).' })
return
}


let prob, z1, z2, label

if (mode === 'leq') {
  if (isNaN(numA) && !aIsNegInf) { setResultado({ error: 'Ingresa el valor de x.' }); return }
  z1    = aIsNegInf ? -Infinity : (numA - mu) / sigma
  prob  = aIsNegInf ? 0 : phi(z1)
  label = aIsNegInf ? 'P(X ≤ −∞) = 0' : `P(X ≤ ${numA})`

} else if (mode === 'geq') {
  if (isNaN(numA) && !aIsNegInf) { setResultado({ error: 'Ingresa el valor de x.' }); return }
  z1    = bIsPosInf ?  Infinity : (numA - mu) / sigma
  prob  = bIsPosInf ? 0 : 1 - phi(z1)
  label = bIsPosInf ? 'P(X ≥ +∞) = 0' : `P(X ≥ ${numA})`

} else {
  // between
  const aInf = aIsNegInf, bInf = bIsPosInf
  if (!aInf && isNaN(numA)) { setResultado({ error: 'Ingresa el valor inferior a.' }); return }
  if (!bInf && isNaN(numB)) { setResultado({ error: 'Ingresa el valor superior b.' }); return }
  if (!aInf && !bInf && numA >= numB) { setResultado({ error: 'a debe ser menor que b.' }); return }

  z1   = aInf ? -Infinity : (numA - mu) / sigma
  z2   = bInf ?  Infinity : (numB - mu) / sigma
  const phiA = aInf ? 0 : phi(z1)
  const phiB = bInf ? 1 : phi(z2)
  prob  = phiB - phiA
  const aStr = aInf ? '−∞' : numA
  const bStr = bInf ? '+∞' : numB
  label = `P(${aStr} ≤ X ≤ ${bStr})`
}

const densidadMu = pdf(mu, mu, sigma)

setResultado({
  label,
  prob: (prob * 100).toFixed(4),
  z1: isFinite(z1) ? z1.toFixed(4) : (z1 === -Infinity ? '−∞' : '+∞'),
  z2: z2 !== undefined ? (isFinite(z2) ? z2.toFixed(4) : (z2 === -Infinity ? '−∞' : '+∞')) : null,
  densidadMu: densidadMu.toFixed(6),
})


}

function limpiar() {
setMedia('0'); setDesviacion('1')
setXA(''); setXB('')
setAIsNegInf(false); setBIsPosInf(false)
setResultado(null)
}

const modeLabels = { leq: 'P(X ≤ x)', geq: 'P(X ≥ x)', between: 'P(a ≤ X ≤ b)' }

return (
<div className="dn-container">
<div className="dn-header">
<div className="dn-title-bar" />
<h1 className="dn-title">Distribución Normal</h1>
</div>


  <div className="dn-body">

    {/* ── Parámetros μ y σ ── */}
    <div className="dn-inputs-row">
      <div className="dn-field">
        <label className="dn-label">Media (μ)</label>
        <input className="dn-input" type="number" placeholder="0"
          value={media} onChange={e => setMedia(e.target.value)} />
      </div>
      <div className="dn-field">
        <label className="dn-label">Desv. Estándar (σ)</label>
        <input className="dn-input" type="number" placeholder="1"
          value={desviacion} onChange={e => setDesviacion(e.target.value)} />
      </div>
    </div>

    {/* ── Selector de modo ── */}
    <div className="dn-mode-tabs">
      {Object.entries(modeLabels).map(([key, lbl]) => (
        <button
          key={key}
          className={`dn-mode-tab${mode === key ? ' active' : ''}`}
          onClick={() => { setMode(key); setResultado(null) }}
        >
          {lbl}
        </button>
      ))}
    </div>

    {/* ── Inputs de límites ── */}
    <div className="dn-limits">
      {/* Límite A */}
      {(mode === 'leq' || mode === 'between') && (
        <div className="dn-limit-group">
          <label className="dn-label">
            {mode === 'leq' ? 'Valor x' : 'Límite inferior a'}
          </label>
          <div className="dn-limit-row">
            <input
              className="dn-input"
              type="number"
              placeholder={aIsNegInf ? '−∞' : '0'}
              value={xA}
              disabled={aIsNegInf}
              onChange={e => setXA(e.target.value)}
            />
            {mode === 'between' && (
              <label className="dn-inf-check">
                <input type="checkbox" checked={aIsNegInf}
                  onChange={e => setAIsNegInf(e.target.checked)} />
                <span>−∞</span>
              </label>
            )}
          </div>
        </div>
      )}

      {/* Límite B */}
      {(mode === 'geq' || mode === 'between') && (
        <div className="dn-limit-group">
          <label className="dn-label">
            {mode === 'geq' ? 'Valor x' : 'Límite superior b'}
          </label>
          <div className="dn-limit-row">
            <input
              className="dn-input"
              type="number"
              placeholder={bIsPosInf ? '+∞' : '0'}
              value={xB}
              disabled={bIsPosInf}
              onChange={e => setXB(e.target.value)}
            />
            {mode === 'between' && (
              <label className="dn-inf-check">
                <input type="checkbox" checked={bIsPosInf}
                  onChange={e => setBIsPosInf(e.target.checked)} />
                <span>+∞</span>
              </label>
            )}
          </div>
        </div>
      )}
    </div>

    {/* ── Botones ── */}
    <div className="dn-buttons">
      <button className="dn-btn-calcular" onClick={calcular}>
        Calcular Probabilidad
      </button>
      <button className="dn-btn-limpiar" onClick={limpiar}>
        Limpiar
      </button>
    </div>

    <div className="dn-divider" />

    {/* ── Gráfica ── */}
    {paramsOk && (
      <NormalCurveChart
        mu={mu}
        sigma={sigma}
        mode={mode}
        a={chartA}
        b={chartB}
      />
    )}

    {/* ── Resultados ── */}
    <div className="dn-resultados">
      <h2 className="dn-resultados-title">Resultados</h2>
      {!resultado && (
        <p className="dn-resultados-placeholder">
          Los resultados aparecerán aquí después del cálculo…
        </p>
      )}
      {resultado?.error && (
        <p className="dn-resultados-error">{resultado.error}</p>
      )}
      {resultado && !resultado.error && (
        <>
          <p className="dn-result-label">{resultado.label}</p>
          <div className="dn-resultados-grid">
            <div className="dn-resultado-card accent">
              <span className="dn-resultado-label">Probabilidad</span>
              <span className="dn-resultado-valor">{resultado.prob}%</span>
            </div>
            {resultado.z2 === null ? (
              <div className="dn-resultado-card">
                <span className="dn-resultado-label">Valor Z</span>
                <span className="dn-resultado-valor">{resultado.z1}</span>
              </div>
            ) : (
              <>
                <div className="dn-resultado-card">
                  <span className="dn-resultado-label">Z₁ (a)</span>
                  <span className="dn-resultado-valor">{resultado.z1}</span>
                </div>
                <div className="dn-resultado-card">
                  <span className="dn-resultado-label">Z₂ (b)</span>
                  <span className="dn-resultado-valor">{resultado.z2}</span>
                </div>
              </>
            )}
            <div className="dn-resultado-card">
              <span className="dn-resultado-label">Densidad f(μ)</span>
              <span className="dn-resultado-valor">{resultado.densidadMu}</span>
            </div>
          </div>
        </>
      )}
    </div>

    {onBack && (
      <button className="dn-btn-volver" onClick={onBack}>
        ← Volver al menú
      </button>
    )}
  </div>
</div>


)
}
