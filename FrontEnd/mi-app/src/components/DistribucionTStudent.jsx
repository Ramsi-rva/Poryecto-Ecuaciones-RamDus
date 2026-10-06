// ─────────────────────────────────────────────────────────────
// DistribucionTStudent.jsx — t-Student con 5 modos:
//   P(T ≤ t), P(T ≥ t), P(a ≤ T ≤ b), dos colas (valor p / α)
//   y la INVERSA (t crítico a partir de P o de α)
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './Calculadora.css'
import Screen from './Screen'
import DistChart from './DistChart'
import { Field, InfToggle, Switch, Tiles, Step, Stage } from './ui'
import { tCdf, tInv, tPdf, normalPdf, normalInv, parseProb } from '../utils/distributions'

const fmt = (v, d = 4) =>
  v === Infinity ? '+∞' : v === -Infinity ? '−∞' : Number(v).toFixed(d)

const MODES = [
  { value: 'leq', sym: 'P(T ≤ t)', title: 'Cola izquierda', desc: 'Hasta un valor' },
  { value: 'geq', sym: 'P(T ≥ t)', title: 'Cola derecha', desc: 'Desde un valor' },
  { value: 'between', sym: 'P(a ≤ T ≤ b)', title: 'Entre dos valores', desc: 'Un intervalo' },
  { value: 'two', sym: 'P(|T| ≥ k)', title: 'Dos colas', desc: 'Valor p y α' },
  { value: 'inv', sym: 't ← P', title: 'Inversa', desc: 'Encontrar el t crítico desde una probabilidad o α', wide: true },
]

const INV_KINDS = {
  left: 'Área a la izquierda  P(T ≤ t) = p',
  right: 'Área a la derecha  P(T ≥ t) = p',
  two: 'α en dos colas  (α/2 en cada cola)',
  center: 'Área central / confianza (1 − α)',
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
  const probPreview = parseProb(probIn)

  function solveInverse() {
    const p = parseProb(probIn)
    if (isNaN(p)) return { error: 'Ingresa una probabilidad entre 0 y 1 (o un porcentaje entre 0 y 100).' }
    if (invKind === 'left') return { kind: 'left', p, t: tInv(p, df), z: normalInv(p) }
    if (invKind === 'right') return { kind: 'right', p, t: tInv(1 - p, df), z: normalInv(1 - p) }
    const alpha = invKind === 'two' ? p : 1 - p
    return { kind: invKind, p, alpha, tc: tInv(1 - alpha / 2, df), zc: normalInv(1 - alpha / 2) }
  }

  const geometry = useMemo(() => {
    const none = { regions: [], cuts: [] }
    if (!dfOk) return none
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

  function compute() {
    if (!dfOk) return { error: 'Ingresa grados de libertad válidos (gl > 0).' }

    if (mode === 'inv') {
      const r = solveInverse()
      if (r.error) return r
      if (r.kind === 'left' || r.kind === 'right') {
        const sym = r.kind === 'left' ? '≤' : '≥'
        return {
          label: `P(T ${sym} t) = ${r.p}  ·  gl = ${df}`,
          cards: [
            { label: 'Valor t', value: fmt(r.t) },
            { label: 'Valor z equivalente (normal)', value: fmt(r.z) },
            { label: 'Probabilidad de esa cola', value: fmt(r.p, 6) },
          ],
        }
      }
      return {
        label: `α = ${fmt(r.alpha, 4)}  ·  confianza ${fmt((1 - r.alpha) * 100, 2)} %  ·  gl = ${df}`,
        cards: [
          { label: 't crítico (±t α/2, gl)', value: `±${fmt(r.tc)}` },
          { label: 'z crítico equivalente', value: `±${fmt(r.zc)}` },
          { label: 'α total (dos colas)', value: fmt(r.alpha, 6) },
          { label: 'α/2 (cada cola)', value: fmt(r.alpha / 2, 6) },
          { label: 'Nivel de confianza (1 − α)', value: `${fmt((1 - r.alpha) * 100, 2)} %` },
        ],
      }
    }

    if (mode === 'leq' || mode === 'geq' || mode === 'two') {
      if (isNaN(numA)) return { error: 'Ingresa el valor de t.' }
      if (mode === 'leq') {
        const p = tCdf(numA, df)
        return {
          label: `P(T ≤ ${numA})  ·  gl = ${df}`,
          cards: [
            { label: 'Probabilidad', value: `${fmt(p * 100)}%` },
            { label: 'Cola contraria  P(T > t)', value: `${fmt((1 - p) * 100)}%` },
            { label: 'Densidad f(t)', value: fmt(tPdf(numA, df), 6) },
          ],
        }
      }
      if (mode === 'geq') {
        const p = tCdf(-numA, df)
        return {
          label: `P(T ≥ ${numA})  ·  gl = ${df}`,
          cards: [
            { label: 'Probabilidad (valor p, una cola)', value: `${fmt(p * 100)}%` },
            { label: 'Cola contraria  P(T < t)', value: `${fmt((1 - p) * 100)}%` },
            { label: 'Densidad f(t)', value: fmt(tPdf(numA, df), 6) },
          ],
        }
      }
      const at = Math.abs(numA)
      const tail = tCdf(-at, df)
      return {
        label: `P(|T| ≥ ${fmt(at, 4)}) · dos colas  ·  gl = ${df}`,
        cards: [
          { label: 'α (dos colas) = valor p', value: fmt(2 * tail, 6) },
          { label: 'α/2 (cada cola)', value: fmt(tail, 6) },
          { label: '|t|', value: fmt(at) },
          { label: 'Área central (1 − α)', value: `${fmt((1 - 2 * tail) * 100)}%` },
        ],
      }
    }

    if (!aIsNegInf && isNaN(numA)) return { error: 'Ingresa el valor inferior a.' }
    if (!bIsPosInf && isNaN(numB)) return { error: 'Ingresa el valor superior b.' }
    if (!aIsNegInf && !bIsPosInf && numA >= numB) return { error: 'a debe ser menor que b.' }
    const p = tCdf(numB, df) - tCdf(numA, df)
    return {
      label: `P(${aIsNegInf ? '−∞' : numA} ≤ T ≤ ${bIsPosInf ? '+∞' : numB})  ·  gl = ${df}`,
      cards: [
        { label: 'Probabilidad', value: `${fmt(p * 100)}%` },
        { label: 'Fuera del intervalo (1 − P)', value: `${fmt((1 - p) * 100)}%` },
      ],
    }
  }

  let resultado = compute()
  if (resultado.error && !tocado) resultado = null

  function limpiar() {
    setGl('10')
    setXA(''); setXB(''); setProbIn('')
    setAIsNegInf(false); setBIsPosInf(false)
    setTocado(false)
  }

  const cambiarModo = (m) => { setMode(m); setTocado(false) }

  return (
    <Screen title="Distribución t de Student" onBack={onBack} wide>
      <div className="calc-grid">
        {/* ── Formulario ── */}
        <form className="panel" onSubmit={(e) => { e.preventDefault(); setTocado(true) }} noValidate>
          <Step n="1" title="Distribución">
            <Field label="Grados de libertad (gl = n − 1)" adorn="gl">
              <input className="field-input" type="number" min="1" step="any" inputMode="decimal"
                value={gl} onChange={(e) => setGl(e.target.value)} placeholder="10" />
            </Field>
            <Switch checked={verNormal} onChange={setVerNormal} label="Comparar con la normal estándar" />
          </Step>

          <Step n="2" title="¿Qué quieres calcular?">
            <Tiles label="Tipo de cálculo" value={mode} onChange={cambiarModo} options={MODES} />
          </Step>

          <Step n="3" title="Valores">
            {(mode === 'leq' || mode === 'geq' || mode === 'two') && (
              <Field label="Valor de t" adorn="t">
                <input className="field-input" type="number" step="any" inputMode="decimal"
                  value={xA} onChange={(e) => setXA(e.target.value)} placeholder="Ej. 2.228" />
              </Field>
            )}

            {mode === 'between' && (
              <div className="field-row">
                <Field label="Límite inferior a" adorn={aIsNegInf ? null : 'a'}
                  extra={<InfToggle pressed={aIsNegInf} onChange={setAIsNegInf}>−∞</InfToggle>}>
                  <input className="field-input" type="number" step="any" inputMode="decimal"
                    disabled={aIsNegInf} value={aIsNegInf ? '' : xA}
                    onChange={(e) => setXA(e.target.value)} placeholder={aIsNegInf ? '−∞' : 'Ej. −1'} />
                </Field>
                <Field label="Límite superior b" adorn={bIsPosInf ? null : 'b'}
                  extra={<InfToggle pressed={bIsPosInf} onChange={setBIsPosInf}>+∞</InfToggle>}>
                  <input className="field-input" type="number" step="any" inputMode="decimal"
                    disabled={bIsPosInf} value={bIsPosInf ? '' : xB}
                    onChange={(e) => setXB(e.target.value)} placeholder={bIsPosInf ? '+∞' : 'Ej. 1'} />
                </Field>
              </div>
            )}

            {mode === 'inv' && (
              <>
                <Field label="¿Qué probabilidad conoces?">
                  <select className="field-input field-select" value={invKind}
                    onChange={(e) => { setInvKind(e.target.value); setTocado(false) }}>
                    {Object.entries(INV_KINDS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </Field>
                <Field
                  label={invKind === 'two' ? 'Valor de α' : invKind === 'center' ? 'Nivel de confianza' : 'Probabilidad p'}
                  adorn={invKind === 'two' ? 'α' : 'p'}
                  hint={!isNaN(probPreview)
                    ? `Se interpreta como ${(probPreview * 100).toFixed(2)} %`
                    : 'Acepta 0.05 o 5 (porcentaje)'}>
                  <input className="field-input" type="number" step="any" inputMode="decimal"
                    value={probIn} onChange={(e) => setProbIn(e.target.value)}
                    placeholder={invKind === 'two' ? '0.05' : invKind === 'center' ? '0.95' : '0.975'} />
                </Field>
              </>
            )}
          </Step>

          <div className="actions">
            <button type="submit" className="btn btn-primary">Calcular</button>
            <button type="button" className="btn btn-glass" onClick={limpiar}>Limpiar</button>
          </div>
        </form>

        {/* ── Escenario ── */}
        <div className="stage">
          <Stage resultado={resultado}>
            <DistChart
              pdfFn={pdfFn}
              domain={domain}
              regions={geometry.regions}
              cuts={geometry.cuts}
              center={0}
              centerLabel="0"
              overlay={overlay}
              label={`Curva t de Student con ${df} grados de libertad. ${resultado && !resultado.error ? resultado.label : ''}`}
            />
          </Stage>
        </div>
      </div>
    </Screen>
  )
}
