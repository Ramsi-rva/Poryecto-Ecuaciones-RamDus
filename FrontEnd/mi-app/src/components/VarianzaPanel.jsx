// ─────────────────────────────────────────────────────────────
// VarianzaPanel.jsx — Calculadora de varianza con procedimiento
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import './Calculadora.css'
import { statsApi } from '../utils/api'
import { useApi } from '../hooks/useApi'
import { AnimatedNumber, Field, Step, Tiles } from './ui'

const TIPOS = [
  { value: 'population', sym: 'σ²', title: 'Poblacional', desc: 'Divide entre N' },
  { value: 'sample', sym: 's²', title: 'Muestral', desc: 'Divide entre N − 1' },
]

const parseDatos = (raw) =>
  raw.split(/[,\s;]+/).map((s) => parseFloat(s)).filter((v) => !isNaN(v))

export default function VarianzaPanel() {
  const [rawInput, setRawInput] = useState('4, 8, 15, 16, 23, 42')
  const [type, setType] = useState('population')
  const { data, loading, error, execute } = useApi(statsApi.variance)
  const [formError, setFormError] = useState(null)

  const parsed = parseDatos(rawInput)

  const handleCalculate = (e) => {
    e.preventDefault()
    if (parsed.length < 2) {
      setFormError('Ingresa al menos 2 valores numéricos separados por coma.')
      return
    }
    setFormError(null)
    execute(parsed, type)
  }

  const err = formError || error
  const isPop = data?.type === 'population'

  return (
    <div className="calc-grid single">
      <form className="panel" onSubmit={handleCalculate} noValidate>
        <Step n="1" title="Tus datos">
          <Field label="Valores separados por coma" adorn="x₁, x₂, …"
            hint={parsed.length > 0 ? `${parsed.length} valores detectados` : 'Escribe al menos 2 números'}>
            <input className="field-input" type="text" inputMode="decimal"
              value={rawInput} onChange={(e) => setRawInput(e.target.value)}
              placeholder="4, 8, 15, 16, 23, 42" />
          </Field>
          {parsed.length > 0 && (
            <ul className="chips" aria-label="Valores detectados">
              {parsed.slice(0, 14).map((v, i) => (
                <li key={`${i}-${v}`} className="chip" style={{ '--i': i }}>{v}</li>
              ))}
              {parsed.length > 14 && <li className="chip chip-more">+{parsed.length - 14}</li>}
            </ul>
          )}
        </Step>

        <Step n="2" title="Tipo de varianza">
          <Tiles label="Tipo de varianza" value={type} onChange={setType} options={TIPOS} />
        </Step>

        {err && <div className="alert alert-error" role="alert">{err}</div>}

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Calculando…' : 'Calcular'}
          </button>
        </div>
      </form>

      <div className="stage">
        {data ? (
          <div className="stage-inner" key={`${data.variance}-${data.type}`}>
            <header className="hero-result">
              <p className="hero-eyebrow">{isPop ? 'Varianza poblacional σ²' : 'Varianza muestral s²'}</p>
              <p className="hero-value"><AnimatedNumber text={Number(data.variance).toFixed(4)} /></p>
              <p className="hero-caption">Desviación estándar {Number(data.standardDeviation).toFixed(4)}</p>
            </header>

            <div className="stat-grid">
              {[
                ['Media x̄', Number(data.mean).toFixed(4)],
                ['Desviación estándar', Number(data.standardDeviation).toFixed(4)],
                ['Datos (n)', String(data.n)],
              ].map(([l, v], i) => (
                <div key={l} className="stat stagger" style={{ '--i': i }}>
                  <span className="stat-label">{l}</span>
                  <span className="stat-value"><AnimatedNumber text={v} /></span>
                </div>
              ))}
            </div>

            <h2 className="section-title">Procedimiento</h2>
            <ol className="timeline">
              {[
                ['Total de datos', <>n = <b className="highlight">{data.n}</b></>],
                ['Media aritmética', <>x̄ = <b className="highlight">{data.mean}</b></>],
                ['Desviaciones cuadradas Σ(xᵢ − x̄)²', data.deviations.join(', ')],
                ['Suma de desviaciones cuadradas', <>Σ = <b className="highlight">{data.deviations.reduce((a, b) => +(a + b).toFixed(6), 0)}</b></>],
                ['Varianza', <>{isPop ? 'σ²' : 's²'} = Σ ÷ {isPop ? data.n : data.n - 1} = <b className="highlight">{data.variance}</b></>],
                ['Desviación estándar', <>√varianza = <b className="highlight">{data.standardDeviation}</b></>],
              ].map(([label, expr], i) => (
                <li key={label} className="timeline-item stagger" style={{ '--i': i }}>
                  <span className="timeline-dot">{i + 1}</span>
                  <div>
                    <p className="timeline-label">{label}</p>
                    <p className="timeline-expr">{expr}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="stage-inner">
            <header className="hero-result">
              <p className="hero-eyebrow">Resultado</p>
              <p className="hero-value hero-empty">—</p>
              <p className="hero-caption">Pulsa «Calcular» para ver la varianza y el procedimiento paso a paso.</p>
            </header>
          </div>
        )}
      </div>
    </div>
  )
}
