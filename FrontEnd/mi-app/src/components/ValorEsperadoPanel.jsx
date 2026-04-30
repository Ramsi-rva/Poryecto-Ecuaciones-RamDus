// ─────────────────────────────────────────────────────────────
// ValorEsperadoPanel.jsx  —  Panel 2: Valor Esperado E(X)
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import { statsApi } from '../utils/api'
import { useApi } from '../hooks/useApi'

const INITIAL_ROWS = [
  { value: '1', prob: '0.10' },
  { value: '2', prob: '0.20' },
  { value: '3', prob: '0.30' },
  { value: '4', prob: '0.25' },
  { value: '5', prob: '0.10' },
  { value: '6', prob: '0.05' },
]

export default function ValorEsperadoPanel() {
  const [rows, setRows] = useState(INITIAL_ROWS)
  const { data, loading, error, execute } = useApi(statsApi.expectedValue)

  const updateRow = (index, field, value) => {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, [field]: value } : r)))
  }

  const addRow = () => setRows((prev) => [...prev, { value: '0', prob: '0' }])

  const removeRow = (index) => {
    if (rows.length <= 2) return
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCalculate = () => {
    const distribution = rows
      .map((r) => ({
        value: parseFloat(r.value),
        prob: parseFloat(r.prob),
      }))
      .filter((r) => !isNaN(r.value) && !isNaN(r.prob))

    if (distribution.length < 2) {
      alert('Ingresa al menos 2 pares (valor, probabilidad).')
      return
    }
    execute(distribution)
  }

  const sumProbs = rows.reduce((acc, r) => acc + (parseFloat(r.prob) || 0), 0)
  const isValidSum = Math.abs(sumProbs - 1) < 0.001

  return (
    <div className="panel-content">
      <h2 className="panel-title">Valor Esperado E(X)</h2>
      <p className="panel-subtitle">
        Ingresa los pares (valor, probabilidad) de tu variable aleatoria discreta.
        Las probabilidades deben sumar 1.
      </p>

      {/* Tabla de distribución */}
      <div className="dist-table">
        <div className="dist-table-header">
          <span>Valor (xᵢ)</span>
          <span>Probabilidad P(xᵢ)</span>
          <span></span>
        </div>

        {rows.map((row, i) => (
          <div key={i} className="dist-table-row">
            <input
              className="form-input"
              type="number"
              value={row.value}
              onChange={(e) => updateRow(i, 'value', e.target.value)}
              placeholder="0"
            />
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={row.prob}
              onChange={(e) => updateRow(i, 'prob', e.target.value)}
              placeholder="0.00"
            />
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => removeRow(i)}
              disabled={rows.length <= 2}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="prob-sum-indicator">
        <span>Σ P(X) = </span>
        <span className={isValidSum ? 'valid' : 'invalid'}>
          {sumProbs.toFixed(4)}
          {isValidSum ? ' ✓' : ' ⚠ debe ser 1.000'}
        </span>
      </div>

      <div className="form-row">
        <button className="btn btn-ghost" onClick={addRow}>
          + Agregar fila
        </button>
        <button className="btn btn-primary" onClick={handleCalculate} disabled={loading}>
          {loading ? 'Calculando…' : 'Calcular E(X)'}
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {data && (
        <>
          <div className="metrics-grid">
            <div className="metric-card accent">
              <span className="metric-label">E(X) — Valor Esperado</span>
              <span className="metric-value">{data.expectedValue.toFixed(4)}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">E(X²)</span>
              <span className="metric-value">{data.expectedValueSquared.toFixed(4)}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Var(X)</span>
              <span className="metric-value">{data.variance.toFixed(4)}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Desv. estándar σ</span>
              <span className="metric-value">{data.standardDeviation.toFixed(4)}</span>
            </div>
          </div>

          <div className="steps-box">
            <p className="steps-title">Fórmulas aplicadas</p>
            <p className="step">E(X) = Σ xᵢ · P(xᵢ) = <span className="highlight">{data.expectedValue.toFixed(4)}</span></p>
            <p className="step">E(X²) = Σ xᵢ² · P(xᵢ) = <span className="highlight">{data.expectedValueSquared.toFixed(4)}</span></p>
            <p className="step">Var(X) = E(X²) − [E(X)]² = {data.expectedValueSquared.toFixed(4)} − {(data.expectedValue ** 2).toFixed(4)} = <span className="highlight">{data.variance.toFixed(4)}</span></p>
            <p className="step">σ = √Var(X) = <span className="highlight">{data.standardDeviation.toFixed(4)}</span></p>
            {!data.isValid && (
              <p className="step warning">⚠ Σ P(X) = {data.sumOfProbs.toFixed(6)} — los resultados pueden no ser correctos.</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}