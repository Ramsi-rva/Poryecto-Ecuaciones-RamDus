// ─────────────────────────────────────────────────────────────
// DistribucionChiF.jsx — Chi-cuadrada (χ²) y F de Fisher
//   P(X ≤ x), P(X ≥ x), P(a ≤ X ≤ b) y la INVERSA (valor crítico)
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './Calculadora.css'
import Screen from './Screen'
import DistChart from './DistChart'
import { Field, Tiles, Step, Stage } from './ui'
import {
  chi2Pdf, chi2Cdf, chi2Inv, fPdf, fCdf, fInv, parseProb,
} from '../utils/distributions'

const fmt = (v, d = 4) => (v === Infinity ? '+∞' : Number(v).toFixed(d))
const pct = (v) => `${fmt(v * 100)}%`

const DISTS = [
  { value: 'chi', sym: 'χ²(k)', title: 'Chi-cuadrada', desc: 'Varianzas y bondad de ajuste' },
  { value: 'f', sym: 'F(d₁, d₂)', title: 'F de Fisher', desc: 'Razón de varianzas, ANOVA' },
]

const MODES = [
  { value: 'leq', sym: 'P(X ≤ x)', title: 'Cola izquierda', desc: 'Hasta un valor' },
  { value: 'geq', sym: 'P(X ≥ x)', title: 'Cola derecha', desc: 'Valor p de la prueba' },
  { value: 'between', sym: 'P(a ≤ X ≤ b)', title: 'Entre dos valores', desc: 'Un intervalo' },
  { value: 'inv', sym: 'x ← P', title: 'Inversa', desc: 'Valor crítico desde α o una probabilidad', wide: true },
]

const INV_KINDS = {
  right: 'Área a la derecha α (valor crítico)',
  left: 'Área a la izquierda P(X ≤ x) = p',
  two: 'α en dos colas (para intervalos de confianza)',
}

// La densidad puede ser infinita en 0 (k < 2): se acota para poder dibujarla
function makePdf(dist, ok, k, d1, d2, hi) {
  if (!ok) return () => 0
  const raw = (x) => (dist === 'chi' ? chi2Pdf(x, k) : fPdf(x, d1, d2))
  let peak = 0
  for (let i = 1; i <= 80; i++) peak = Math.max(peak, raw((i / 80) * hi * 0.98))
  const cap = peak * 1.25
  return (x) => Math.min(raw(x), cap)
}

export default function DistribucionChiF({ onBack }) {
  const [dist, setDist] = useState('chi')
  const [mode, setMode] = useState('geq')
  const [k, setK] = useState('5')
  const [d1, setD1] = useState('5')
  const [d2, setD2] = useState('10')
  const [xA, setXA] = useState('')
  const [xB, setXB] = useState('')
  const [invKind, setInvKind] = useState('right')
  const [probIn, setProbIn] = useState('')
  const [tocado, setTocado] = useState(false)

  const kv = parseFloat(k)
  const d1v = parseFloat(d1)
  const d2v = parseFloat(d2)
  const a = parseFloat(xA)
  const b = parseFloat(xB)
  const probPreview = parseProb(probIn)

  const paramOk = dist === 'chi' ? kv > 0 : d1v > 0 && d2v > 0
  const cdf = (x) => (dist === 'chi' ? chi2Cdf(x, kv) : fCdf(x, d1v, d2v))
  const inv = (p) => (dist === 'chi' ? chi2Inv(p, kv) : fInv(p, d1v, d2v))

  const domainHi = useMemo(() => {
    if (!paramOk) return 10
    if (dist === 'chi') return kv + 4.5 * Math.sqrt(2 * kv) + 3
    return Math.min(12, Math.max(4, fInv(0.985, d1v, d2v)))
  }, [dist, kv, d1v, d2v, paramOk])

  const pdfFn = useMemo(
    () => makePdf(dist, paramOk, kv, d1v, d2v, domainHi),
    [dist, paramOk, kv, d1v, d2v, domainHi],
  )

  const domain = useMemo(() => [0, domainHi], [domainHi])

  function solveInverse() {
    const p = parseProb(probIn)
    if (isNaN(p)) return { error: 'Ingresa una probabilidad entre 0 y 1 (o un porcentaje entre 0 y 100).' }
    if (invKind === 'right') return { kind: 'right', p, x: inv(1 - p) }
    if (invKind === 'left') return { kind: 'left', p, x: inv(p) }
    return { kind: 'two', p, lo: inv(p / 2), hi: inv(1 - p / 2) }
  }

  const geometry = useMemo(() => {
    const none = { regions: [], cuts: [] }
    if (!paramOk) return none
    if (mode === 'leq') return isNaN(a) ? none : { regions: [[0, a]], cuts: [a] }
    if (mode === 'geq') return isNaN(a) ? none : { regions: [[a, Infinity]], cuts: [a] }
    if (mode === 'between') {
      if (isNaN(a) || isNaN(b) || a >= b) return none
      return { regions: [[a, b]], cuts: [a, b] }
    }
    const r = solveInverse()
    if (r.error) return none
    if (r.kind === 'right') return { regions: [[r.x, Infinity]], cuts: [r.x] }
    if (r.kind === 'left') return { regions: [[0, r.x]], cuts: [r.x] }
    return { regions: [[0, r.lo], [r.hi, Infinity]], cuts: [r.lo, r.hi] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramOk, dist, kv, d1v, d2v, mode, a, b, invKind, probIn])

  const name = dist === 'chi' ? `χ²(${kv})` : `F(${d1v}, ${d2v})`

  function compute() {
    if (!paramOk) return { error: dist === 'chi' ? 'Los grados de libertad deben ser mayores que 0.' : 'Ambos grados de libertad deben ser mayores que 0.' }
    const mean = dist === 'chi' ? kv : (d2v > 2 ? d2v / (d2v - 2) : null)
    const info = mean === null ? [] : [{ label: 'Media de la distribución', value: fmt(mean) }]

    if (mode === 'inv') {
      const r = solveInverse()
      if (r.error) return r
      if (r.kind === 'two') {
        return {
          label: `α = ${fmt(r.p, 4)} en dos colas  ·  ${name}`,
          cards: [
            { label: 'Valor crítico superior (α/2 a la derecha)', value: fmt(r.hi) },
            { label: 'Valor crítico inferior (α/2 a la izquierda)', value: fmt(r.lo) },
            { label: 'Confianza (1 − α)', value: `${fmt((1 - r.p) * 100, 2)} %` },
          ],
        }
      }
      return {
        label: `${r.kind === 'right' ? 'Área derecha α' : 'P(X ≤ x)'} = ${r.p}  ·  ${name}`,
        cards: [
          { label: r.kind === 'right' ? 'Valor crítico' : 'Valor x', value: fmt(r.x) },
          { label: 'Probabilidad a la izquierda', value: pct(cdf(r.x)) },
          { label: 'Probabilidad a la derecha', value: pct(1 - cdf(r.x)) },
        ],
      }
    }

    if (mode === 'between') {
      if (isNaN(a)) return { error: 'Ingresa el valor inferior a.' }
      if (isNaN(b)) return { error: 'Ingresa el valor superior b.' }
      if (a < 0) return { error: 'Los valores deben ser mayores o iguales a 0.' }
      if (a >= b) return { error: 'a debe ser menor que b.' }
      const v = cdf(b) - cdf(a)
      return {
        label: `P(${a} ≤ X ≤ ${b})  ·  ${name}`,
        cards: [{ label: 'Probabilidad', value: pct(v) }, { label: 'Fuera del intervalo', value: pct(1 - v) }, ...info],
      }
    }

    if (isNaN(a)) return { error: 'Ingresa el valor de x.' }
    if (a < 0) return { error: 'x debe ser mayor o igual a 0.' }
    if (mode === 'leq') {
      const v = cdf(a)
      return {
        label: `P(X ≤ ${a})  ·  ${name}`,
        cards: [{ label: 'Probabilidad', value: pct(v) }, { label: 'Cola contraria P(X > x)', value: pct(1 - v) }, ...info],
      }
    }
    const v = 1 - cdf(a)
    return {
      label: `P(X ≥ ${a})  ·  ${name}`,
      cards: [{ label: 'Probabilidad (valor p)', value: fmt(v, 6) }, { label: 'En porcentaje', value: pct(v) }, { label: 'Cola contraria P(X < x)', value: pct(1 - v) }, ...info],
    }
  }

  let resultado = compute()
  if (resultado.error && !tocado) resultado = null

  function limpiar() {
    setK('5'); setD1('5'); setD2('10'); setXA(''); setXB(''); setProbIn(''); setTocado(false)
  }

  return (
    <Screen title="Chi-cuadrada y F" onBack={onBack} wide>
      <div className="calc-grid">
        <form className="panel" onSubmit={(e) => { e.preventDefault(); setTocado(true) }} noValidate>
          <Step n="1" title="Distribución">
            <Tiles label="Distribución" value={dist} onChange={(v) => { setDist(v); setTocado(false) }} options={DISTS} />
            {dist === 'chi' ? (
              <Field label="Grados de libertad (k)" adorn="gl">
                <input className="field-input" type="number" min="1" step="any" inputMode="decimal"
                  value={k} onChange={(e) => setK(e.target.value)} placeholder="5" />
              </Field>
            ) : (
              <div className="field-row">
                <Field label="Numerador d₁" adorn="d₁">
                  <input className="field-input" type="number" min="1" step="any" inputMode="decimal"
                    value={d1} onChange={(e) => setD1(e.target.value)} placeholder="5" />
                </Field>
                <Field label="Denominador d₂" adorn="d₂">
                  <input className="field-input" type="number" min="1" step="any" inputMode="decimal"
                    value={d2} onChange={(e) => setD2(e.target.value)} placeholder="10" />
                </Field>
              </div>
            )}
          </Step>

          <Step n="2" title="¿Qué quieres calcular?">
            <Tiles label="Tipo de cálculo" value={mode} onChange={(m) => { setMode(m); setTocado(false) }} options={MODES} />
          </Step>

          <Step n="3" title="Valores">
            {(mode === 'leq' || mode === 'geq') && (
              <Field label="Valor de x" adorn="x">
                <input className="field-input" type="number" min="0" step="any" inputMode="decimal"
                  value={xA} onChange={(e) => setXA(e.target.value)} placeholder={dist === 'chi' ? 'Ej. 11.07' : 'Ej. 3.33'} />
              </Field>
            )}
            {mode === 'between' && (
              <div className="field-row">
                <Field label="Límite inferior a" adorn="a">
                  <input className="field-input" type="number" min="0" step="any" inputMode="decimal"
                    value={xA} onChange={(e) => setXA(e.target.value)} placeholder="Ej. 2" />
                </Field>
                <Field label="Límite superior b" adorn="b">
                  <input className="field-input" type="number" min="0" step="any" inputMode="decimal"
                    value={xB} onChange={(e) => setXB(e.target.value)} placeholder="Ej. 8" />
                </Field>
              </div>
            )}
            {mode === 'inv' && (
              <>
                <Field label="¿Qué probabilidad conoces?">
                  <select className="field-input field-select" value={invKind}
                    onChange={(e) => { setInvKind(e.target.value); setTocado(false) }}>
                    {Object.entries(INV_KINDS).map(([kk, l]) => <option key={kk} value={kk}>{l}</option>)}
                  </select>
                </Field>
                <Field
                  label={invKind === 'left' ? 'Probabilidad p' : 'Valor de α'}
                  adorn={invKind === 'left' ? 'p' : 'α'}
                  hint={!isNaN(probPreview) ? `Se interpreta como ${(probPreview * 100).toFixed(2)} %` : 'Acepta 0.05 o 5 (porcentaje)'}>
                  <input className="field-input" type="number" step="any" inputMode="decimal"
                    value={probIn} onChange={(e) => setProbIn(e.target.value)}
                    placeholder={invKind === 'left' ? '0.95' : '0.05'} />
                </Field>
              </>
            )}
          </Step>

          <div className="actions">
            <button type="submit" className="btn btn-primary">Calcular</button>
            <button type="button" className="btn btn-glass" onClick={limpiar}>Limpiar</button>
          </div>
        </form>

        <div className="stage">
          <Stage resultado={resultado}>
            <DistChart
              pdfFn={pdfFn}
              domain={domain}
              regions={geometry.regions}
              cuts={geometry.cuts}
              center={null}
              lowerBound={0}
              label={`Curva ${dist === 'chi' ? 'chi-cuadrada' : 'F de Fisher'}. ${resultado && !resultado.error ? resultado.label : ''}`}
            />
          </Stage>
        </div>
      </div>
    </Screen>
  )
}
