// ─────────────────────────────────────────────────────────────
// DistribucionDiscreta.jsx — Binomial y Poisson
//   P(X = k), P(X ≤ k), P(X ≥ k), P(a ≤ X ≤ b) + media y varianza
// ─────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react'
import './Calculadora.css'
import Screen from './Screen'
import DiscreteChart from './DiscreteChart'
import { Field, Tiles, Step, Stage } from './ui'
import { binomPmf, binomCdf, poissonPmf, poissonCdf } from '../utils/distributions'

const fmt = (v, d = 4) => Number(v).toFixed(d)
const pct = (v) => `${fmt(v * 100)}%`

const DISTS = [
  { value: 'binom', sym: 'B(n, p)', title: 'Binomial', desc: 'Éxitos en n ensayos' },
  { value: 'poisson', sym: 'Poisson(λ)', title: 'Poisson', desc: 'Eventos por intervalo' },
]

const MODES = [
  { value: 'eq', sym: 'P(X = k)', title: 'Exactamente', desc: 'Un valor' },
  { value: 'leq', sym: 'P(X ≤ k)', title: 'A lo más', desc: 'Hasta k' },
  { value: 'geq', sym: 'P(X ≥ k)', title: 'Al menos', desc: 'Desde k' },
  { value: 'between', sym: 'P(a ≤ X ≤ b)', title: 'Entre dos valores', desc: 'Un intervalo' },
]

const isInt = (v) => Number.isInteger(v) && v >= 0

export default function DistribucionDiscreta({ onBack }) {
  const [dist, setDist] = useState('binom')
  const [mode, setMode] = useState('eq')
  const [n, setN] = useState('10')
  const [p, setP] = useState('0.5')
  const [lambda, setLambda] = useState('3')
  const [kA, setKA] = useState('')
  const [kB, setKB] = useState('')
  const [tocado, setTocado] = useState(false)

  const nv = parseFloat(n)
  const pv = parseFloat(p)
  const lv = parseFloat(lambda)
  const a = parseFloat(kA)
  const b = parseFloat(kB)

  const paramError = dist === 'binom'
    ? (!isInt(nv) || nv < 1 || nv > 1000 ? 'n debe ser un entero entre 1 y 1000.'
      : !(pv >= 0 && pv <= 1) ? 'p debe estar entre 0 y 1.' : null)
    : (!(lv > 0 && lv <= 500) ? 'λ debe ser mayor que 0 y no pasar de 500.' : null)

  const pmf = (k) => (dist === 'binom' ? binomPmf(k, nv, pv) : poissonPmf(k, lv))
  const cdf = (k) => (dist === 'binom' ? binomCdf(k, nv, pv) : poissonCdf(k, lv))

  const kMax = paramError ? 0
    : dist === 'binom' ? nv
      : Math.min(1000, Math.ceil(lv + 6 * Math.sqrt(lv) + 10))

  const data = useMemo(() => {
    if (paramError) return []
    return Array.from({ length: kMax + 1 }, (_, k) => ({
      k, p: dist === 'binom' ? binomPmf(k, nv, pv) : poissonPmf(k, lv),
    }))
  }, [dist, nv, pv, lv, kMax, paramError])

  const isOn = (k) => {
    if (mode === 'eq') return k === a
    if (mode === 'leq') return k <= a
    if (mode === 'geq') return k >= a
    return k >= a && k <= b
  }

  function compute() {
    if (paramError) return { error: paramError }
    const mean = dist === 'binom' ? nv * pv : lv
    const variance = dist === 'binom' ? nv * pv * (1 - pv) : lv
    const extra = [
      { label: 'Media μ', value: fmt(mean) },
      { label: 'Varianza σ²', value: fmt(variance) },
      { label: 'Desviación estándar σ', value: fmt(Math.sqrt(variance)) },
    ]
    const name = dist === 'binom' ? `B(${nv}, ${pv})` : `Poisson(${lv})`

    if (!isInt(a)) return { error: mode === 'between' ? 'Ingresa un entero a ≥ 0.' : 'Ingresa un entero k ≥ 0.' }
    if (mode === 'between') {
      if (!isInt(b)) return { error: 'Ingresa un entero b ≥ 0.' }
      if (a > b) return { error: 'a debe ser menor o igual que b.' }
      const v = cdf(b) - (a > 0 ? cdf(a - 1) : 0)
      return {
        label: `P(${a} ≤ X ≤ ${b})  ·  ${name}`,
        cards: [{ label: 'Probabilidad', value: pct(v) }, { label: 'Fuera del intervalo', value: pct(1 - v) }, ...extra],
      }
    }
    if (mode === 'eq') {
      const v = pmf(a)
      return {
        label: `P(X = ${a})  ·  ${name}`,
        cards: [{ label: 'Probabilidad', value: pct(v) }, { label: 'Valor decimal', value: fmt(v, 6) }, ...extra],
      }
    }
    if (mode === 'leq') {
      const v = cdf(a)
      return {
        label: `P(X ≤ ${a})  ·  ${name}`,
        cards: [{ label: 'Probabilidad acumulada', value: pct(v) }, { label: 'P(X > k)', value: pct(1 - v) }, ...extra],
      }
    }
    const v = 1 - (a > 0 ? cdf(a - 1) : 0)
    return {
      label: `P(X ≥ ${a})  ·  ${name}`,
      cards: [{ label: 'Probabilidad', value: pct(v) }, { label: 'P(X < k)', value: pct(1 - v) }, ...extra],
    }
  }

  let resultado = compute()
  if (resultado.error && !tocado) resultado = null

  function limpiar() {
    setN('10'); setP('0.5'); setLambda('3'); setKA(''); setKB(''); setTocado(false)
  }

  const kPlaceholder = dist === 'binom' ? 'Ej. 4' : 'Ej. 2'

  return (
    <Screen title="Binomial y Poisson" onBack={onBack} wide>
      <div className="calc-grid">
        <form className="panel" onSubmit={(e) => { e.preventDefault(); setTocado(true) }} noValidate>
          <Step n="1" title="Distribución">
            <Tiles label="Distribución" value={dist} onChange={(v) => { setDist(v); setTocado(false) }} options={DISTS} />
            {dist === 'binom' ? (
              <div className="field-row">
                <Field label="Ensayos n" adorn="n">
                  <input className="field-input" type="number" min="1" step="1" inputMode="numeric"
                    value={n} onChange={(e) => setN(e.target.value)} placeholder="10" />
                </Field>
                <Field label="Probabilidad de éxito p" adorn="p">
                  <input className="field-input" type="number" min="0" max="1" step="any" inputMode="decimal"
                    value={p} onChange={(e) => setP(e.target.value)} placeholder="0.5" />
                </Field>
              </div>
            ) : (
              <Field label="Tasa promedio λ" adorn="λ" hint="Número promedio de eventos por intervalo">
                <input className="field-input" type="number" min="0" step="any" inputMode="decimal"
                  value={lambda} onChange={(e) => setLambda(e.target.value)} placeholder="3" />
              </Field>
            )}
          </Step>

          <Step n="2" title="¿Qué quieres calcular?">
            <Tiles label="Tipo de cálculo" value={mode} onChange={(m) => { setMode(m); setTocado(false) }} options={MODES} />
          </Step>

          <Step n="3" title="Valores">
            {mode !== 'between' ? (
              <Field label="Valor de k" adorn="k">
                <input className="field-input" type="number" min="0" step="1" inputMode="numeric"
                  value={kA} onChange={(e) => setKA(e.target.value)} placeholder={kPlaceholder} />
              </Field>
            ) : (
              <div className="field-row">
                <Field label="Límite inferior a" adorn="a">
                  <input className="field-input" type="number" min="0" step="1" inputMode="numeric"
                    value={kA} onChange={(e) => setKA(e.target.value)} placeholder="Ej. 2" />
                </Field>
                <Field label="Límite superior b" adorn="b">
                  <input className="field-input" type="number" min="0" step="1" inputMode="numeric"
                    value={kB} onChange={(e) => setKB(e.target.value)} placeholder="Ej. 5" />
                </Field>
              </div>
            )}
          </Step>

          <div className="actions">
            <button type="submit" className="btn btn-primary">Calcular</button>
            <button type="button" className="btn btn-glass" onClick={limpiar}>Limpiar</button>
          </div>
        </form>

        <div className="stage">
          <Stage resultado={resultado}>
            {data.length > 0 && (
              <DiscreteChart
                data={data}
                isOn={(k) => (resultado && !resultado.error ? isOn(k) : false)}
                label={`Distribución ${dist === 'binom' ? 'binomial' : 'de Poisson'}. ${resultado && !resultado.error ? resultado.label : ''}`}
              />
            )}
          </Stage>
        </div>
      </div>
    </Screen>
  )
}
