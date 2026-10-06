// ─────────────────────────────────────────────────────────────
// DistribucionTStudent.jsx — t-Student con 5 modos:
//   P(T ≤ t), P(T ≥ t), P(a ≤ T ≤ b), dos colas (valor p / α)
//   y la INVERSA (t crítico a partir de P o de α)
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './DistribucionNormal.css'
import DistChart from './DistChart'
import { tCdf, tInv, tPdf, normalPdf, normalInv, parseProb } from '../utils/distributions'

const COLOR = '#22d3ee'

const fmt = (v, d = 4) =>
  v === Infinity ? '+∞' : v === -Infinity ? '−∞' : Number(v).toFixed(d)

const MODES = {
  leq: 'P(T ≤ t)',
  geq: 'P(T ≥ t)',
  between: 'P(a ≤ T ≤ b)',
  two: 'Dos colas',
  inv: 'Inversa (t desde P / α)',
}

const INV_KINDS = {
  left: 'Área a la izquierda  P(T ≤ t) = p',
  right: 'Área a la derecha  P(T ≥ t) = p',
  two: 'α en dos colas  (α/2 en cada cola)',
  center: 'Área central / nivel de confianza (1 − α)',
}

export default function DistribucionTStudent({ onBack }) {
  const [gl, setGl] = useState('10')
  const [mode, setMode] = useState('leq')

  const [xA, setXA] = useState('')
  const [xB, setXB] = useState('')
  const [aIsNegInf, setAIsNegInf] = useState(false)
  const [bIsPosInf, setBIsPosInf] = useState(false)

  const [invKind, setInvKind] = useState('two')
  const [probIn, setProbIn] = useState('')
  const [verNormal, setVerNormal] = useState(false)

  const [tocado, setTocado] = useState(false)

  const df = parseFloat(gl)
  const dfOk = !isNaN(df) && df > 0
  const numA = aIsNegInf ? -Infinity : parseFloat(xA)
  const numB = bIsPosInf ? Infinity : parseFloat(xB)

  function solveInverse() {
    const p = parseProb(probIn)
    if (isNaN(p)) return { error: 'Ingresa una probabilidad entre 0 y 1 (o un porcentaje entre 0 y 100).' }
    if (invKind === 'left') return { kind: 'left', p, t: tInv(p, df), z: normalInv(p) }
    if (invKind === 'right') return { kind: 'right', p, t: tInv(1 - p, df), z: normalInv(1 - p) }
    const alpha = invKind === 'two' ? p : 1 - p
    return {
      kind: invKind, p, alpha,
      tc: tInv(1 - alpha / 2, df),
      zc: normalInv(1 - alpha / 2),
    }
  }

  const geometry = useMemo(() => {
    if (!dfOk) return null
    const none = { regions: [], cuts: [] }
    if (mode === 'leq') return isNaN(numA) ? none : { regions: [[-Infinity, numA]], cuts: [numA] }
    if (mode === 'geq') return isNaN(numA) ? none : { regions: [[numA, Infinity]], cuts: [numA] }
    if (mode === 'between') {
      const lo = aIsNegInf ? -Infinity : numA
      const hi = bIsPosInf ? Infinity : numB
      if (isNaN(lo) || isNaN(hi) || lo >= hi) return none
      return { regions: [[lo, hi]], cuts: [lo, hi] }
    }
    if (mode === 'two') {
      if (isNaN(numA)) return none
      const d = Math.abs(numA)
      return { regions: [[-Infinity, -d], [d, Infinity]], cuts: [-d, d] }
    }
    const r = solveInverse()
    if (r.error) return none
    if (r.kind === 'left') return { regions: [[-Infinity, r.t]], cuts: [r.t] }
    if (r.kind === 'right') return { regions: [[r.t, Infinity]], cuts: [r.t] }
    if (r.kind === 'two') return { regions: [[-Infinity, -r.tc], [r.tc, Infinity]], cuts: [-r.tc, r.tc] }
    return { regions: [[-r.tc, r.tc]], cuts: [-r.tc, r.tc] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dfOk, df, mode, numA, numB, aIsNegInf, bIsPosInf, invKind, probIn])

  const pdfFn = useMemo(() => (x) => tPdf(x, df), [df])
  const overlay = useMemo(() => (verNormal ? (x) => normalPdf(x) : null), [verNormal])
  const domain = useMemo(() => [-4.5, 4.5], [])

  function computeResult(setResultado) {
    if (!dfOk) { setResultado({ error: 'Ingresa grados de libertad válidos (gl > 0).' }); return }

    if (mode === 'inv') {
      const r = solveInverse()
      if (r.error) { setResultado({ error: r.error }); return }
      if (r.kind === 'left' || r.kind === 'right') {
        const sym = r.kind === 'left' ? '≤' : '≥'
        setResultado({
          label: `P(T ${sym} t) = ${r.p}  ·  gl = ${df}`,
          cards: [
            { label: 'Valor t', value: fmt(r.t), accent: true },
            { label: 'Valor z equivalente (normal)', value: fmt(r.z) },
            { label: 'Probabilidad / α de esa cola', value: fmt(r.p, 6) },
          ],
        })
      } else {
        setResultado({
          label: `α = ${fmt(r.alpha, 6)}  ·  confianza = ${fmt((1 - r.alpha) * 100, 2)} %  ·  gl = ${df}`,
          cards: [
            { label: 't crítico  (±t α/2, gl)', value: `±${fmt(r.tc)}`, accent: true },
            { label: 'z crítico equivalente', value: `±${fmt(r.zc)}` },
            { label: 'α total (dos colas)', value: fmt(r.alpha, 6) },
            { label: 'α/2 (cada cola)', value: fmt(r.alpha / 2, 6) },
            { label: 'Nivel de confianza (1 − α)', value: `${fmt((1 - r.alpha) * 100, 2)} %` },
          ],
        })
      }
      return
    }

    if (mode === 'leq' || mode === 'geq' || mode === 'two') {
      if (isNaN(numA)) { setResultado({ error: 'Ingresa el valor de t.' }); return }
      if (mode === 'leq') {
        const p = tCdf(numA, df)
        setResultado({
          label: `P(T ≤ ${numA})  ·  gl = ${df}`,
          cards: [
            { label: 'Probabilidad', value: `${fmt(p * 100)}%`, accent: true },
            { label: 'Cola contraria  P(T > t)', value: `${fmt((1 - p) * 100)}%` },
            { label: 'Densidad f(t)', value: fmt(tPdf(numA, df), 6) },
          ],
        })
      } else if (mode === 'geq') {
        const p = tCdf(-numA, df)
        setResultado({
          label: `P(T ≥ ${numA})  ·  gl = ${df}`,
          cards: [
            { label: 'Probabilidad (valor p, una cola)', value: `${fmt(p * 100)}%`, accent: true },
            { label: 'Cola contraria  P(T < t)', value: `${fmt((1 - p) * 100)}%` },
            { label: 'Densidad f(t)', value: fmt(tPdf(numA, df), 6) },
          ],
        })
      } else {
        const at = Math.abs(numA)
        const tail = tCdf(-at, df)
        setResultado({
          label: `P(|T| ≥ ${fmt(at, 4)}) — dos colas  ·  gl = ${df}`,
          cards: [
            { label: 'α (dos colas) = valor p', value: fmt(2 * tail, 6), accent: true },
            { label: 'α/2 (cada cola)', value: fmt(tail, 6) },
            { label: '|t|', value: fmt(at) },
            { label: 'Área central (1 − α)', value: `${fmt((1 - 2 * tail) * 100)}%` },
          ],
        })
      }
      return
    }

    if (!aIsNegInf && isNaN(numA)) { setResultado({ error: 'Ingresa el valor inferior a.' }); return }
    if (!bIsPosInf && isNaN(numB)) { setResultado({ error: 'Ingresa el valor superior b.' }); return }
    if (!aIsNegInf && !bIsPosInf && numA >= numB) { setResultado({ error: 'a debe ser menor que b.' }); return }
    const p = tCdf(numB, df) - tCdf(numA, df)
    setResultado({
      label: `P(${aIsNegInf ? '−∞' : numA} ≤ T ≤ ${bIsPosInf ? '+∞' : numB})  ·  gl = ${df}`,
      cards: [
        { label: 'Probabilidad', value: `${fmt(p * 100)}%`, accent: true },
        { label: 'Fuera del intervalo (1 − P)', value: `${fmt((1 - p) * 100)}%` },
      ],
    })
  }

  function limpiar() {
    setGl('10')
    setXA(''); setXB(''); setProbIn('')
    setAIsNegInf(false); setBIsPosInf(false)
    setTocado(false)
  }

  // Resultado en vivo: se calcula con cada cambio; los errores solo se
  // muestran después de pulsar el botón (para no avisar mientras se escribe).
  let resultado = null
  computeResult(r => { resultado = r })
  if (resultado?.error && !tocado) resultado = null

  const probPreview = parseProb(probIn)

  return (
    <div className="dn-container dn-theme-t">
      {onBack && (
        <div className="dn-topbar">
          <button className="dn-btn-volver" onClick={onBack}>← Volver al menú</button>
        </div>
      )}

      <div className="dn-header">
        <div className="dn-title-bar" />
        <h1 className="dn-title">Distribución t-Student</h1>
      </div>

      <div className="dn-body">
        <div className="dn-inputs-row">
          <div className="dn-field">
            <label className="dn-label" htmlFor="dn-f1">Grados de libertad (gl = n − 1)</label>
            <input id="dn-f1" className="dn-input" type="number" min="1" placeholder="10"
              value={gl} onChange={e => setGl(e.target.value)} />
          </div>
          <div className="dn-field" style={{ justifyContent: 'flex-end' }}>
            <label className="dn-inf-check" style={{ padding: '0.8rem 0' }}>
              <input type="checkbox" checked={verNormal}
                onChange={e => setVerNormal(e.target.checked)} />
              <span>Comparar con la normal estándar (línea gris)</span>
            </label>
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
          {mode !== 'inv' && (
            <div className="dn-limit-group">
              <label className="dn-label" htmlFor="dn-f2">
                {mode === 'between' ? 'Límite inferior a' : 'Valor t'}
              </label>
              <div className="dn-limit-row">
                <input id="dn-f2" className="dn-input" type="number" step="any"
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

          {mode === 'between' && (
            <div className="dn-limit-group">
              <label className="dn-label" htmlFor="dn-f3">Límite superior b</label>
              <div className="dn-limit-row">
                <input id="dn-f3" className="dn-input" type="number" step="any"
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
                <label className="dn-label" htmlFor="dn-f4">¿Qué probabilidad conoces?</label>
                <select id="dn-f4" className="dn-select" value={invKind}
                  onChange={e => { setInvKind(e.target.value); setTocado(false) }}>
                  {Object.entries(INV_KINDS).map(([k, l]) => (
                    <option key={k} value={k}>{l}</option>
                  ))}
                </select>
              </div>
              <div className="dn-limit-group">
                <label className="dn-label" htmlFor="dn-f5">
                  {invKind === 'two' ? 'α (ej. 0.05 ó 5)'
                    : invKind === 'center' ? 'Confianza (ej. 0.95 ó 95)'
                    : 'Probabilidad p (ej. 0.975 ó 97.5)'}
                </label>
                <input id="dn-f5" className="dn-input" type="number" step="any"
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
            {mode === 'inv' ? 'Encontrar t' : 'Calcular probabilidad'}
          </button>
          <button className="dn-btn-limpiar" onClick={limpiar}>Limpiar</button>
        </div>

        <div className="dn-divider" />

        {dfOk && geometry && (
          <DistChart pdfFn={pdfFn} domain={domain}
            regions={geometry.regions} cuts={geometry.cuts}
            center={0} centerLabel="0" color={COLOR} overlay={overlay}
            label={`Curva t de Student con ${df} grados de libertad. ${resultado && !resultado.error ? resultado.label : ''}`} />
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
