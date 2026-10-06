// ─────────────────────────────────────────────────────────────
// DistribucionNormal.jsx — Normal con 5 modos:
//   P(X ≤ x), P(X ≥ x), P(a ≤ X ≤ b), dos colas y la INVERSA
//   (encontrar z / x a partir de una probabilidad o de α)
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './DistribucionNormal.css'
import DistChart from './DistChart'
import { normalCdf, normalInv, normalPdf, parseProb } from '../utils/distributions'

const fmt = (v, d = 4) =>
  v === Infinity ? '+∞' : v === -Infinity ? '−∞' : Number(v).toFixed(d)

const MODES = {
  leq: 'P(X ≤ x)',
  geq: 'P(X ≥ x)',
  between: 'P(a ≤ X ≤ b)',
  two: 'Dos colas',
  inv: 'Inversa (z desde P / α)',
}

const INV_KINDS = {
  left: 'Área a la izquierda  P(X ≤ x) = p',
  right: 'Área a la derecha  P(X ≥ x) = p',
  two: 'α en dos colas  (α/2 en cada cola)',
  center: 'Área central / nivel de confianza (1 − α)',
}

export default function DistribucionNormal({ onBack }) {
  const [media, setMedia] = useState('0')
  const [desviacion, setDesviacion] = useState('1')
  const [mode, setMode] = useState('leq')

  const [xA, setXA] = useState('')
  const [xB, setXB] = useState('')
  const [aIsNegInf, setAIsNegInf] = useState(false)
  const [bIsPosInf, setBIsPosInf] = useState(false)

  const [invKind, setInvKind] = useState('two')
  const [probIn, setProbIn] = useState('')

  const [tocado, setTocado] = useState(false)

  const mu = parseFloat(media)
  const sigma = parseFloat(desviacion)
  const numA = aIsNegInf ? -Infinity : parseFloat(xA)
  const numB = bIsPosInf ? Infinity : parseFloat(xB)
  const paramsOk = !isNaN(mu) && !isNaN(sigma) && sigma > 0

  // ── Inversa: z, x, α a partir de p ──────────────────────────
  function solveInverse() {
    const p = parseProb(probIn)
    if (isNaN(p)) return { error: 'Ingresa una probabilidad entre 0 y 1 (o un porcentaje entre 0 y 100).' }
    if (invKind === 'left') {
      const z = normalInv(p)
      return { kind: 'left', p, z, x: mu + z * sigma, alpha: p }
    }
    if (invKind === 'right') {
      const z = normalInv(1 - p)
      return { kind: 'right', p, z, x: mu + z * sigma, alpha: p }
    }
    const alpha = invKind === 'two' ? p : 1 - p
    const zc = normalInv(1 - alpha / 2)
    return { kind: invKind, p, alpha, zc, xLo: mu - zc * sigma, xHi: mu + zc * sigma }
  }

  // ── Geometría de la gráfica (en vivo) ───────────────────────
  const geometry = useMemo(() => {
    if (!paramsOk) return null
    const none = { regions: [], cuts: [] }
    if (mode === 'leq') {
      return isNaN(numA) ? none : { regions: [[-Infinity, numA]], cuts: [numA] }
    }
    if (mode === 'geq') {
      return isNaN(numA) ? none : { regions: [[numA, Infinity]], cuts: [numA] }
    }
    if (mode === 'between') {
      const lo = aIsNegInf ? -Infinity : numA
      const hi = bIsPosInf ? Infinity : numB
      if (isNaN(lo) || isNaN(hi) || lo >= hi) return none
      return { regions: [[lo, hi]], cuts: [lo, hi] }
    }
    if (mode === 'two') {
      if (isNaN(numA)) return none
      const d = Math.abs(numA - mu)
      return { regions: [[-Infinity, mu - d], [mu + d, Infinity]], cuts: [mu - d, mu + d] }
    }
    // inv
    const r = solveInverse()
    if (r.error) return none
    if (r.kind === 'left') return { regions: [[-Infinity, r.x]], cuts: [r.x] }
    if (r.kind === 'right') return { regions: [[r.x, Infinity]], cuts: [r.x] }
    if (r.kind === 'two') return { regions: [[-Infinity, r.xLo], [r.xHi, Infinity]], cuts: [r.xLo, r.xHi] }
    return { regions: [[r.xLo, r.xHi]], cuts: [r.xLo, r.xHi] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsOk, mode, mu, sigma, numA, numB, aIsNegInf, bIsPosInf, invKind, probIn])

  const pdfFn = useMemo(() => (x) => normalPdf(x, mu, sigma), [mu, sigma])
  const domain = useMemo(() => [mu - 4 * sigma, mu + 4 * sigma], [mu, sigma])

  // ── Calcular ────────────────────────────────────────────────
  function computeResult(setResultado) {
    if (!paramsOk) {
      setResultado({ error: 'Ingresa valores válidos de μ y σ (σ > 0).' })
      return
    }

    if (mode === 'inv') {
      const r = solveInverse()
      if (r.error) { setResultado({ error: r.error }); return }
      if (r.kind === 'left' || r.kind === 'right') {
        const sym = r.kind === 'left' ? '≤' : '≥'
        setResultado({
          label: `P(X ${sym} x) = ${r.p}`,
          cards: [
            { label: 'Valor Z', value: fmt(r.z), accent: true },
            { label: 'Valor x = μ + z·σ', value: fmt(r.x) },
            { label: 'Probabilidad (α de esa cola)', value: fmt(r.alpha, 6) },
          ],
        })
      } else {
        setResultado({
          label: `α = ${fmt(r.alpha, 6)}  ·  confianza = ${fmt((1 - r.alpha) * 100, 2)} %`,
          cards: [
            { label: 'Z crítico  (±z α/2)', value: `±${fmt(r.zc)}`, accent: true },
            { label: 'Límite inferior x', value: fmt(r.xLo) },
            { label: 'Límite superior x', value: fmt(r.xHi) },
            { label: 'α total (dos colas)', value: fmt(r.alpha, 6) },
            { label: 'α/2 (cada cola)', value: fmt(r.alpha / 2, 6) },
            { label: 'Nivel de confianza (1 − α)', value: `${fmt((1 - r.alpha) * 100, 2)} %` },
          ],
        })
      }
      return
    }

    if (mode === 'leq' || mode === 'geq' || mode === 'two') {
      if (isNaN(numA)) { setResultado({ error: 'Ingresa el valor de x.' }); return }
      const z = (numA - mu) / sigma
      if (mode === 'leq') {
        const p = normalCdf(z)
        setResultado({
          label: `P(X ≤ ${numA})`,
          cards: [
            { label: 'Probabilidad', value: `${fmt(p * 100)}%`, accent: true },
            { label: 'Valor Z', value: fmt(z) },
            { label: 'Cola contraria  P(X > x)', value: `${fmt((1 - p) * 100)}%` },
            { label: 'Densidad f(μ)', value: fmt(normalPdf(mu, mu, sigma), 6) },
          ],
        })
      } else if (mode === 'geq') {
        const p = 1 - normalCdf(z)
        setResultado({
          label: `P(X ≥ ${numA})`,
          cards: [
            { label: 'Probabilidad', value: `${fmt(p * 100)}%`, accent: true },
            { label: 'Valor Z', value: fmt(z) },
            { label: 'Cola contraria  P(X < x)', value: `${fmt((1 - p) * 100)}%` },
            { label: 'Densidad f(μ)', value: fmt(normalPdf(mu, mu, sigma), 6) },
          ],
        })
      } else {
        const az = Math.abs(z)
        const alpha = 2 * normalCdf(-az)
        setResultado({
          label: `P(|X − μ| ≥ ${fmt(Math.abs(numA - mu), 4)}) — dos colas`,
          cards: [
            { label: 'α (dos colas) = valor p', value: fmt(alpha, 6), accent: true },
            { label: '|Z|', value: fmt(az) },
            { label: 'α/2 (cada cola)', value: fmt(alpha / 2, 6) },
            { label: 'Límites simétricos', value: `${fmt(mu - az * sigma, 3)}  ·  ${fmt(mu + az * sigma, 3)}` },
            { label: 'Área central (1 − α)', value: `${fmt((1 - alpha) * 100)}%` },
          ],
        })
      }
      return
    }

    // between
    if (!aIsNegInf && isNaN(numA)) { setResultado({ error: 'Ingresa el valor inferior a.' }); return }
    if (!bIsPosInf && isNaN(numB)) { setResultado({ error: 'Ingresa el valor superior b.' }); return }
    if (!aIsNegInf && !bIsPosInf && numA >= numB) { setResultado({ error: 'a debe ser menor que b.' }); return }
    const z1 = aIsNegInf ? -Infinity : (numA - mu) / sigma
    const z2 = bIsPosInf ? Infinity : (numB - mu) / sigma
    const p = normalCdf(z2) - normalCdf(z1)
    setResultado({
      label: `P(${aIsNegInf ? '−∞' : numA} ≤ X ≤ ${bIsPosInf ? '+∞' : numB})`,
      cards: [
        { label: 'Probabilidad', value: `${fmt(p * 100)}%`, accent: true },
        { label: 'Z₁ (a)', value: fmt(z1) },
        { label: 'Z₂ (b)', value: fmt(z2) },
        { label: 'Densidad f(μ)', value: fmt(normalPdf(mu, mu, sigma), 6) },
      ],
    })
  }

  function limpiar() {
    setMedia('0'); setDesviacion('1')
    setXA(''); setXB(''); setProbIn('')
    setAIsNegInf(false); setBIsPosInf(false)
    setTocado(false)
  }

  const showA = mode !== 'inv'
  const showB = mode === 'between'

  // Resultado en vivo: se calcula con cada cambio; los errores solo se
  // muestran después de pulsar el botón (para no avisar mientras se escribe).
  let resultado = null
  computeResult(r => { resultado = r })
  if (resultado?.error && !tocado) resultado = null

  const probPreview = parseProb(probIn)

  return (
    <div className="dn-container">
      {onBack && (
        <div className="dn-topbar">
          <button className="dn-btn-volver" onClick={onBack}>← Volver al menú</button>
        </div>
      )}

      <div className="dn-header">
        <div className="dn-title-bar" />
        <h1 className="dn-title">Distribución Normal</h1>
      </div>

      <div className="dn-body">
        <div className="dn-inputs-row">
          <div className="dn-field">
            <label className="dn-label" htmlFor="dn-f1">Media (μ)</label>
            <input id="dn-f1" className="dn-input" type="number" step="any" placeholder="0"
              value={media} onChange={e => setMedia(e.target.value)} />
          </div>
          <div className="dn-field">
            <label className="dn-label" htmlFor="dn-f2">Desv. estándar (σ)</label>
            <input id="dn-f2" className="dn-input" type="number" step="any" placeholder="1"
              value={desviacion} onChange={e => setDesviacion(e.target.value)} />
          </div>
        </div>

        <div className="dn-mode-tabs" role="group" aria-label="Modo de cálculo">
          {Object.entries(MODES).map(([key, lbl]) => (
            <button key={key}
              className={`dn-mode-tab${mode === key ? ' active' : ''}`}
              aria-pressed={mode === key}
              onClick={() => { setMode(key); setTocado(false) }}>
              {lbl}
            </button>
          ))}
        </div>

        <div className="dn-limits">
          {showA && (
            <div className="dn-limit-group">
              <label className="dn-label" htmlFor="dn-f3">
                {mode === 'between' ? 'Límite inferior a' : 'Valor x'}
              </label>
              <div className="dn-limit-row">
                <input id="dn-f3" className="dn-input" type="number" step="any"
                  placeholder={aIsNegInf ? '−∞' : '0'}
                  value={xA} disabled={aIsNegInf}
                  onChange={e => setXA(e.target.value)} />
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

          {showB && (
            <div className="dn-limit-group">
              <label className="dn-label" htmlFor="dn-f4">Límite superior b</label>
              <div className="dn-limit-row">
                <input id="dn-f4" className="dn-input" type="number" step="any"
                  placeholder={bIsPosInf ? '+∞' : '0'}
                  value={xB} disabled={bIsPosInf}
                  onChange={e => setXB(e.target.value)} />
                <label className="dn-inf-check">
                  <input type="checkbox" checked={bIsPosInf}
                    onChange={e => setBIsPosInf(e.target.checked)} />
                  <span>+∞</span>
                </label>
              </div>
            </div>
          )}

          {mode === 'inv' && (
            <>
              <div className="dn-limit-group">
                <label className="dn-label" htmlFor="dn-f5">¿Qué probabilidad conoces?</label>
                <select id="dn-f5" className="dn-select" value={invKind}
                  onChange={e => { setInvKind(e.target.value); setTocado(false) }}>
                  {Object.entries(INV_KINDS).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="dn-limit-group">
                <label className="dn-label" htmlFor="dn-f6">
                  {invKind === 'two' ? 'α (ej. 0.05 ó 5)'
                    : invKind === 'center' ? 'Confianza (ej. 0.95 ó 95)'
                    : 'Probabilidad p (ej. 0.975 ó 97.5)'}
                </label>
                <input id="dn-f6" className="dn-input" type="number" step="any"
                  placeholder={invKind === 'two' ? '0.05' : invKind === 'center' ? '0.95' : '0.975'}
                  value={probIn} onChange={e => setProbIn(e.target.value)} />
                {!isNaN(probPreview) && (
                  <span className="dn-hint">Se interpreta como {(probPreview * 100).toFixed(2)} %</span>
                )}
              </div>
            </>
          )}
        </div>

        <div className="dn-buttons">
          <button className="dn-btn-calcular" onClick={() => setTocado(true)}>
            {mode === 'inv' ? 'Encontrar Z' : 'Calcular probabilidad'}
          </button>
          <button className="dn-btn-limpiar" onClick={limpiar}>Limpiar</button>
        </div>

        <div className="dn-divider" />

        {paramsOk && geometry && (
          <DistChart pdfFn={pdfFn} domain={domain}
            regions={geometry.regions} cuts={geometry.cuts}
            center={mu} centerLabel="μ" color="#22c55e"
            label={`Curva normal con media ${mu} y desviación ${sigma}. ${resultado && !resultado.error ? resultado.label : ''}`} />
        )}

        <div className="dn-resultados" aria-live="polite">
          <h2 className="dn-resultados-title">Resultados</h2>
          {!resultado && (
            <p className="dn-resultados-placeholder">
              Los resultados aparecerán aquí después del cálculo…
            </p>
          )}
          {resultado?.error && <p className="dn-resultados-error">{resultado.error}</p>}
          {resultado && !resultado.error && (
            <>
              <p className="dn-result-label">{resultado.label}</p>
              <div className="dn-resultados-grid">
                {resultado.cards.map((c, i) => (
                  <div key={i} className={`dn-resultado-card${c.accent ? ' accent' : ''}`}>
                    <span className="dn-resultado-label">{c.label}</span>
                    <span className="dn-resultado-valor">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  )
}
