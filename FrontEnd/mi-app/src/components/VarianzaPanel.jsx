// ─────────────────────────────────────────────────────────────
// VarianzaPanel.jsx  —  Panel 1: Calculadora de Varianza
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { statsApi } from '../utils/api'
import { useApi } from '../hooks/useApi'
import './VarianzaPanel.css'

export default function VarianzaPanel() {
  const [rawInput, setRawInput] = useState('4, 8, 15, 16, 23, 42')
  const [type, setType] = useState('population')
  const { data, loading, error, execute } = useApi(statsApi.variance)

  const handleCalculate = () => {
    const parsed = rawInput
      .split(',')
      .map((s) => parseFloat(s.trim()))
      .filter((v) => !isNaN(v))

    if (parsed.length < 2) {
      alert('Ingresa al menos 2 valores numéricos separados por coma.')
      return
    }
    execute(parsed, type)
  }

  return (
    <div className="panel-content">
      <h2 className="panel-title">Calculadora de Varianza</h2>

      <div className="form-group">
        <label className="form-label">Datos (separados por coma)</label>
        <input
          className="form-input"
          type="text"
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="ej: 4, 8, 15, 16, 23, 42"
        />
      </div>

      <div className="form-group">
        <label className="form-label">Tipo de varianza</label>
        <select
          className="form-select"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="population">Poblacional (σ²) — dividir entre N</option>
          <option value="sample">Muestral (s²) — dividir entre N−1</option>
        </select>
      </div>

      <div className="action-row">
        <button
          className="btn btn-primary"
          onClick={handleCalculate}
          disabled={loading}
        >
          {loading ? 'Calculando…' : 'Calcular'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          <div className="metrics-grid">
            <MetricCard label="Media (x̄)" value={data.mean} />
            <MetricCard
              label={data.type === 'population' ? 'Varianza (σ²)' : 'Varianza (s²)'}
              value={data.variance}
            />
            <MetricCard label="Desv. estándar" value={data.standardDeviation} />
            <MetricCard label="N (datos)" value={data.n} decimals={0} />
          </div>

          <div className="steps-box">
            <p className="steps-title">Procedimiento</p>

            <div className="step-card">
              <span className="step-number">1</span>
              <span className="step-inline">
                <span className="step-label">Total de datos</span>
                <span className="step-expr">n = <span className="highlight">{data.n}</span></span>
              </span>
            </div>

            <div className="step-card">
              <span className="step-number">2</span>
              <span className="step-inline">
                <span className="step-label">Media aritmética</span>
                <span className="step-expr">x̄ = <span className="highlight">{data.mean}</span></span>
              </span>
            </div>

            <div className="step-card">
              <span className="step-number">3</span>
              <span className="step-inline">
                <span className="step-label">Desviaciones cuadradas — Σ(xᵢ − x̄)²</span>
                <span className="step-expr">{data.deviations.join(', ')}</span>
              </span>
            </div>

            <div className="step-card">
              <span className="step-number">4</span>
              <span className="step-inline">
                <span className="step-label">Suma de desviaciones cuadradas</span>
                <span className="step-expr">
                  Σ = <span className="highlight">
                    {data.deviations.reduce((a, b) => +(a + b).toFixed(6), 0)}
                  </span>
                </span>
              </span>
            </div>

            <div className="step-card">
              <span className="step-number">5</span>
              <span className="step-inline">
                <span className="step-label">Varianza</span>
                <span className="step-expr">
                  {data.type === 'population' ? 'σ²' : 's²'} = Σ ÷{' '}
                  {data.type === 'population' ? data.n : data.n - 1} ={' '}
                  <span className="highlight">{data.variance}</span>
                </span>
              </span>
            </div>

            <div className="step-card">
              <span className="step-number">6</span>
              <span className="step-inline">
                <span className="step-label">Desviación estándar</span>
                <span className="step-expr">
                  √varianza = <span className="highlight">{data.standardDeviation}</span>
                </span>
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MetricCard({ label, value, decimals = 4 }) {
  const display = typeof value === 'number' ? value.toFixed(decimals) : value
  return (
    <div className="metric-card">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{display}</span>
    </div>
  )
}