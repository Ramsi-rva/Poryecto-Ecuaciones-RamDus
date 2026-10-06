// ─────────────────────────────────────────────────────────────
// DistribucionNormal.jsx — Normal con 5 modos:
//   P(X ≤ x), P(X ≥ x), P(a ≤ X ≤ b), dos colas e INVERSA
//   (encontrar z / x a partir de una probabilidad o de α)
// El resultado se calcula en vivo; los errores solo se muestran
// después de pulsar "Calcular".
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './Calculadora.css'
import Screen from './Screen'
import DistChart from './DistChart'
import { Field, InfToggle, Tiles, Step, Stage } from './ui'
import { normalCdf, normalInv, normalPdf, parseProb } from '../utils/distributions'

const fmt = (v, d = 4) =>
  v === Infinity ? '+∞' : v === -Infinity ? '−∞' : Number(v).toFixed(d)

const MODES = [
  { value: 'leq', sym: 'P(X ≤ x)', title: 'Cola izquierda', desc: 'Hasta un valor' },
  { value: 'geq', sym: 'P(X ≥ x)', title: 'Cola derecha', desc: 'Desde un valor' },
  { value: 'between', sym: 'P(a ≤ X ≤ b)', title: 'Entre dos valores', desc: 'Un intervalo' },
  { value: 'two', sym: 'P(|X−μ| ≥ k)', title: 'Dos colas', desc: 'Valor p y α' },
  { value: 'inv', sym: 'z ← P', title: 'Inversa', desc: 'Encontrar z o x desde una probabilidad o α', wide: true },
]

const INV_KINDS = {
  left: 'Área a la izquierda  P(X ≤ x) = p',
  right: 'Área a la derecha  P(X ≥ x) = p',
  two: 'α en dos colas  (α/2 en cada cola)',
  center: 'Área central / confianza (1 − α)',
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
  const probPreview = parseProb(probIn)

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
    const none = { regions: [], cuts: [] }
    if (!paramsOk) return none
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
      const d = Math.abs(numA - mu)
      return { regions: [[-Infinity, mu - d], [mu + d, Infinity]], cuts: [mu - d, mu + d] }
    }
    const r = solveInverse()
    if (r.error) return none
    if (r.kind === 'left') return { regions: [[-Infinity, r.x]], cuts: [r.x] }
    if (r.kind === 'right') return { regions: [[r.x, Infinity]], cuts: [r.x] }
    if (r.kind === 'two') return { regions: [[-Infinity, r.xLo], [r.xHi, Infinity]], cuts: [r.xLo, r.xHi] }
    return { regions: [[r.xLo, r.xHi]], cuts: [r.xLo, r.xHi] }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsOk, mode, mu, sigma, numA, numB, aIsNegInf, bIsPosInf, invKind, probIn])

  const pdfFn = useMemo(() => (x) => normalPdf(x, mu, sigma), [mu, sigma])
  const domain = useMemo(
    () => (paramsOk ? [mu - 4 * sigma, mu + 4 * sigma] : [-4, 4]),
    [paramsOk, mu, sigma],
  )

  // ── Cálculo ─────────────────────────────────────────────────
  function compute() {
    if (!paramsOk) return { error: 'Ingresa valores válidos de μ y σ (σ > 0).' }

    if (mode === 'inv') {
      const r = solveInverse()
      if (r.error) return r
      if (r.kind === 'left' || r.kind === 'right') {
        const sym = r.kind === 'left' ? '≤' : '≥'
        return {
          label: `P(X ${sym} x) = ${r.p}`,
          cards: [
            { label: 'Valor Z', value: fmt(r.z) },
            { label: 'Valor x = μ + z·σ', value: fmt(r.x) },
            { label: 'Probabilidad de esa cola', value: fmt(r.alpha, 6) },
          ],
        }
      }
      return {
        label: `α = ${fmt(r.alpha, 4)}  ·  confianza ${fmt((1 - r.alpha) * 100, 2)} %`,
        cards: [
          { label: 'Z crítico (±z α/2)', value: `±${fmt(r.zc)}` },
          { label: 'Límite inferior x', value: fmt(r.xLo) },
          { label: 'Límite superior x', value: fmt(r.xHi) },
          { label: 'α total (dos colas)', value: fmt(r.alpha, 6) },
          { label: 'α/2 (cada cola)', value: fmt(r.alpha / 2, 6) },
          { label: 'Nivel de confianza (1 − α)', value: `${fmt((1 - r.alpha) * 100, 2)} %` },
        ],
      }
    }

    if (mode === 'leq' || mode === 'geq' || mode === 'two') {
      if (isNaN(numA)) return { error: 'Ingresa el valor de x.' }
      const z = (numA - mu) / sigma
      if (mode === 'leq') {
        const p = normalCdf(z)
        return {
          label: `P(X ≤ ${numA})`,
          cards: [
            { label: 'Probabilidad', value: `${fmt(p * 100)}%` },
            { label: 'Valor Z', value: fmt(z) },
            { label: 'Cola contraria  P(X > x)', value: `${fmt((1 - p) * 100)}%` },
            { label: 'Densidad f(μ)', value: fmt(normalPdf(mu, mu, sigma), 6) },
          ],
        }
      }
      if (mode === 'geq') {
        const p = 1 - normalCdf(z)
        return {
          label: `P(X ≥ ${numA})`,
          cards: [
            { label: 'Probabilidad', value: `${fmt(p * 100)}%` },
            { label: 'Valor Z', value: fmt(z) },
            { label: 'Cola contraria  P(X < x)', value: `${fmt((1 - p) * 100)}%` },
            { label: 'Densidad f(μ)', value: fmt(normalPdf(mu, mu, sigma), 6) },
          ],
        }
      }
      const az = Math.abs(z)
      const alpha = 2 * normalCdf(-az)
      return {
        label: `P(|X − μ| ≥ ${fmt(Math.abs(numA - mu), 4)}) · dos colas`,
        cards: [
          { label: 'α (dos colas) = valor p', value: fmt(alpha, 6) },
          { label: '|Z|', value: fmt(az) },
          { label: 'α/2 (cada cola)', value: fmt(alpha / 2, 6) },
          { label: 'Límites simétricos', value: `${fmt(mu - az * sigma, 3)} · ${fmt(mu + az * sigma, 3)}` },
          { label: 'Área central (1 − α)', value: `${fmt((1 - alpha) * 100)}%` },
        ],
      }
    }

    // between
    if (!aIsNegInf && isNaN(numA)) return { error: 'Ingresa el valor inferior a.' }
    if (!bIsPosInf && isNaN(numB)) return { error: 'Ingresa el valor superior b.' }
    if (!aIsNegInf && !bIsPosInf && numA >= numB) return { error: 'a debe ser menor que b.' }
    const z1 = aIsNegInf ? -Infinity : (numA - mu) / sigma
    const z2 = bIsPosInf ? Infinity : (numB - mu) / sigma
    const p = normalCdf(z2) - normalCdf(z1)
    return {
      label: `P(${aIsNegInf ? '−∞' : numA} ≤ X ≤ ${bIsPosInf ? '+∞' : numB})`,
      cards: [
        { label: 'Probabilidad', value: `${fmt(p * 100)}%` },
        { label: 'Z₁ (a)', value: fmt(z1) },
        { label: 'Z₂ (b)', value: fmt(z2) },
        { label: 'Densidad f(μ)', value: fmt(normalPdf(mu, mu, sigma), 6) },
      ],
    }
  }

  let resultado = compute()
  if (resultado.error && !tocado) resultado = null

  function limpiar() {
    setMedia('0'); setDesviacion('1')
    setXA(''); setXB(''); setProbIn('')
    setAIsNegInf(false); setBIsPosInf(false)
    setTocado(false)
  }

  const cambiarModo = (m) => { setMode(m); setTocado(false) }

  return (
    <Screen title="Distribución normal" onBack={onBack} wide>
      <div className="calc-grid">
        {/* ── Formulario ── */}
        <form className="panel" onSubmit={(e) => { e.preventDefault(); setTocado(true) }} noValidate>
          <Step n="1" title="Distribución">
            <div className="field-row">
              <Field label="Media" adorn="μ">
                <input className="field-input" type="number" step="any" inputMode="decimal"
                  value={media} onChange={(e) => setMedia(e.target.value)} placeholder="0" />
              </Field>
              <Field label="Desviación estándar" adorn="σ">
                <input className="field-input" type="number" step="any" inputMode="decimal"
                  value={desviacion} onChange={(e) => setDesviacion(e.target.value)} placeholder="1" />
              </Field>
            </div>
          </Step>

          <Step n="2" title="¿Qué quieres calcular?">
            <Tiles label="Tipo de cálculo" value={mode} onChange={cambiarModo} options={MODES} />
          </Step>

          <Step n="3" title="Valores">
            {(mode === 'leq' || mode === 'geq' || mode === 'two') && (
              <Field label="Valor de x" adorn="x">
                <input className="field-input" type="number" step="any" inputMode="decimal"
                  value={xA} onChange={(e) => setXA(e.target.value)} placeholder="Ej. 1.96" />
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
              center={paramsOk ? mu : 0}
              centerLabel="μ"
              label={`Curva normal con media ${mu} y desviación ${sigma}. ${resultado && !resultado.error ? resultado.label : ''}`}
            />
          </Stage>
        </div>
      </div>
    </Screen>
  )
}
