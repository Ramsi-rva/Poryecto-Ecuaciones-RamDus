// ─────────────────────────────────────────────────────────────
// Inferencia.jsx — Intervalo de confianza y prueba de hipótesis
// para la media (z con σ conocida, t con s muestral)
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './Calculadora.css'
import Screen from './Screen'
import DistChart from './DistChart'
import { Field, Switch, Tiles, Step, Stage } from './ui'
import {
  confidenceInterval, meanTest, meanDist, normalPdf, tPdf, parseProb,
} from '../utils/distributions'

const fmt = (v, d = 4) => Number(v).toFixed(d)

const TASKS = [
  { value: 'ic', sym: '( L , U )', title: 'Intervalo de confianza', desc: 'Estimar la media' },
  { value: 'ht', sym: 'H₀ vs H₁', title: 'Prueba de hipótesis', desc: 'Decidir sobre μ₀' },
]

const TAILS = [
  { value: 'two', sym: 'H₁: μ ≠ μ₀', title: 'Dos colas', desc: 'Distinta' },
  { value: 'right', sym: 'H₁: μ > μ₀', title: 'Cola derecha', desc: 'Mayor que' },
  { value: 'left', sym: 'H₁: μ < μ₀', title: 'Cola izquierda', desc: 'Menor que', wide: true },
]

const H1 = { two: '≠', right: '>', left: '<' }

export default function Inferencia({ onBack }) {
  const [task, setTask] = useState('ic')
  const [known, setKnown] = useState(false)
  const [mean, setMean] = useState('')
  const [sd, setSd] = useState('')
  const [n, setN] = useState('')
  const [conf, setConf] = useState('0.95')
  const [mu0, setMu0] = useState('')
  const [alpha, setAlpha] = useState('0.05')
  const [tail, setTail] = useState('two')
  const [tocado, setTocado] = useState(false)

  const m = parseFloat(mean)
  const s = parseFloat(sd)
  const nv = parseFloat(n)
  const m0 = parseFloat(mu0)
  const confP = parseProb(conf)
  const alphaP = parseProb(alpha)

  const common = () => {
    if (isNaN(m)) return 'Ingresa la media muestral x̄.'
    if (!(s > 0)) return known ? 'Ingresa la desviación estándar σ (mayor que 0).' : 'Ingresa la desviación estándar muestral s (mayor que 0).'
    if (!Number.isInteger(nv) || nv < (known ? 1 : 2)) return known ? 'n debe ser un entero mayor o igual a 1.' : 'n debe ser un entero mayor o igual a 2.'
    return null
  }

  const dist = useMemo(() => meanDist(known, Number.isInteger(nv) && nv > 1 ? nv : 2), [known, nv])
  const pdfFn = useMemo(
    () => (dist.type === 't' ? (x) => tPdf(x, dist.df) : (x) => normalPdf(x)),
    [dist],
  )
  const domain = useMemo(() => [-4.5, 4.5], [])
  const sym = known ? 'z' : 't'

  // Cálculo (devuelve texto y geometría para la gráfica)
  const calc = useMemo(() => {
    const err = common()
    if (err) return { error: err }
    const symb = known ? 'z' : 't'
    const dfTxt = known ? '' : `  ·  gl = ${nv - 1}`

    if (task === 'ic') {
      if (isNaN(confP)) return { error: 'Ingresa un nivel de confianza válido (0.95 o 95).' }
      const r = confidenceInterval({ mean: m, sd: s, n: nv, conf: confP, known })
      return {
        geo: { regions: [[-r.crit, r.crit]], cuts: [-r.crit, r.crit], marker: null },
        result: {
          label: `IC al ${fmt(confP * 100, 2)} % para μ  ·  ${known ? 'z (σ conocida)' : 't (s muestral)'}${dfTxt}`,
          cards: [
            { label: 'Intervalo de confianza', value: `(${fmt(r.lower)}, ${fmt(r.upper)})` },
            { label: 'Margen de error', value: `±${fmt(r.margin)}` },
            { label: 'Error estándar', value: fmt(r.se) },
            { label: `${symb} crítico`, value: `±${fmt(r.crit)}` },
            { label: 'Media muestral x̄', value: fmt(m) },
          ],
        },
      }
    }

    if (isNaN(m0)) return { error: 'Ingresa el valor de la hipótesis nula μ₀.' }
    if (isNaN(alphaP)) return { error: 'Ingresa un nivel de significancia α válido (0.05 o 5).' }
    const r = meanTest({ mean: m, mu0: m0, sd: s, n: nv, alpha: alphaP, tail, known })
    const cuts = tail === 'two' ? [-Math.abs(r.crit), Math.abs(r.crit)] : [r.crit]
    const regions = tail === 'two'
      ? [[-Infinity, -Math.abs(r.crit)], [Math.abs(r.crit), Infinity]]
      : tail === 'right' ? [[r.crit, Infinity]] : [[-Infinity, r.crit]]
    return {
      geo: { regions, cuts, marker: { x: r.stat, label: `${symb} = ${fmt(r.stat, 2)}` } },
      result: {
        label: `H₀: μ = ${m0}  vs  H₁: μ ${H1[tail]} ${m0}  ·  α = ${fmt(alphaP, 4)}${dfTxt}`,
        cards: [
          { label: 'Valor p', value: fmt(r.p, 4) },
          { label: 'Decisión', value: r.reject ? 'Rechazar H₀' : 'No rechazar H₀' },
          { label: `Estadístico ${symb}`, value: fmt(r.stat) },
          { label: `${symb} crítico`, value: tail === 'two' ? `±${fmt(Math.abs(r.crit))}` : fmt(r.crit) },
          { label: 'Error estándar', value: fmt(r.se) },
        ],
      },
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task, known, m, s, nv, confP, m0, alphaP, tail])

  let resultado = calc.error ? { error: calc.error } : calc.result
  if (resultado.error && !tocado) resultado = null

  function limpiar() {
    setMean(''); setSd(''); setN(''); setConf('0.95'); setMu0(''); setAlpha('0.05'); setTocado(false)
  }

  const geo = calc.geo || { regions: [], cuts: [], marker: null }
  const confHint = !isNaN(confP) ? `Se interpreta como ${(confP * 100).toFixed(2)} %` : 'Acepta 0.95 o 95 (porcentaje)'
  const alphaHint = !isNaN(alphaP) ? `Se interpreta como ${(alphaP * 100).toFixed(2)} %` : 'Acepta 0.05 o 5 (porcentaje)'

  return (
    <Screen title="Inferencia sobre la media" onBack={onBack} wide>
      <div className="calc-grid">
        <form className="panel" onSubmit={(e) => { e.preventDefault(); setTocado(true) }} noValidate>
          <Step n="1" title="¿Qué necesitas?">
            <Tiles label="Tipo de análisis" value={task} onChange={(v) => { setTask(v); setTocado(false) }} options={TASKS} />
          </Step>

          <Step n="2" title="Datos de la muestra">
            <div className="field-row">
              <Field label="Media muestral x̄" adorn="x̄">
                <input className="field-input" type="number" step="any" inputMode="decimal"
                  value={mean} onChange={(e) => setMean(e.target.value)} placeholder="Ej. 52" />
              </Field>
              <Field label="Tamaño de muestra n" adorn="n">
                <input className="field-input" type="number" min="1" step="1" inputMode="numeric"
                  value={n} onChange={(e) => setN(e.target.value)} placeholder="Ej. 25" />
              </Field>
            </div>
            <Field label={known ? 'Desviación estándar poblacional σ' : 'Desviación estándar muestral s'}
              adorn={known ? 'σ' : 's'}>
              <input className="field-input" type="number" min="0" step="any" inputMode="decimal"
                value={sd} onChange={(e) => setSd(e.target.value)} placeholder="Ej. 10" />
            </Field>
            <Switch checked={known} onChange={setKnown} label="Conozco σ (usar z en lugar de t)" />
          </Step>

          <Step n="3" title={task === 'ic' ? 'Confianza' : 'Hipótesis'}>
            {task === 'ic' ? (
              <Field label="Nivel de confianza" adorn="1 − α" hint={confHint}>
                <input className="field-input" type="number" step="any" inputMode="decimal"
                  value={conf} onChange={(e) => setConf(e.target.value)} placeholder="0.95" />
              </Field>
            ) : (
              <>
                <div className="field-row">
                  <Field label="Media supuesta μ₀" adorn="μ₀">
                    <input className="field-input" type="number" step="any" inputMode="decimal"
                      value={mu0} onChange={(e) => setMu0(e.target.value)} placeholder="Ej. 50" />
                  </Field>
                  <Field label="Significancia α" adorn="α" hint={alphaHint}>
                    <input className="field-input" type="number" step="any" inputMode="decimal"
                      value={alpha} onChange={(e) => setAlpha(e.target.value)} placeholder="0.05" />
                  </Field>
                </div>
                <Tiles label="Hipótesis alternativa" value={tail} onChange={setTail} options={TAILS} />
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
              regions={geo.regions}
              cuts={geo.cuts}
              marker={geo.marker}
              center={0}
              centerLabel="0"
              label={`Curva ${sym === 'z' ? 'normal estándar' : `t de Student con ${dist.df} grados de libertad`}. ${resultado && !resultado.error ? resultado.label : ''}`}
            />
          </Stage>
        </div>
      </div>
    </Screen>
  )
}
