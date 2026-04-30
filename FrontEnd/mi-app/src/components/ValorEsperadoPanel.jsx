import { useState } from 'react'
import { expectedValueApi } from '../utils/api'
import { useApi } from '../hooks/useApi'
import './ValorEsperadoPanel.css'

const INITIAL_ROWS = [
  { value: '0' },
  { value: '1' },
  { value: '2' },
]

export default function ValorEsperadoPanel() {
  const [rows, setRows] = useState(INITIAL_ROWS)
  const [fxExpression, setFxExpression] = useState('x/3')

  const { data, loading, error, execute } = useApi(expectedValueApi.fx)

  const updateRow = (index, value) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i === index ? { ...row, value } : row
      )
    )
  }

  const addRow = () => {
    setRows((prev) => [...prev, { value: '0' }])
  }

  const removeRow = (index) => {
    if (rows.length <= 2) return

    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCalculate = () => {
    const xValues = rows
      .map((r) => parseFloat(r.value))
      .filter((v) => !isNaN(v))

    execute(xValues, fxExpression)
  }

  return (
    <div className="panel-content">
      <h2 className="panel-title">Valor Esperado E(X)</h2>

      <p className="panel-subtitle">
        Ingresa valores X y la función f(x).
      </p>

      <div className="form-group formula-box">
        <label className="form-label">Función f(x)</label>

        <input
          className="form-input"
          value={fxExpression}
          onChange={(e) => setFxExpression(e.target.value)}
        />

        <div className="formula-preview">
          f(x) = {fxExpression}
        </div>
      </div>

      <div className="dist-table">
        <div
          className="dist-table-header"
          style={{ gridTemplateColumns: '1fr 40px' }}
        >
          <span>Valor X</span>
          <span></span>
        </div>

        {rows.map((row, i) => (
          <div
            key={i}
            className="dist-table-row"
            style={{ gridTemplateColumns: '1fr 40px' }}
          >
            <input
              className="form-input"
              type="number"
              value={row.value}
              onChange={(e) => updateRow(i, e.target.value)}
            />

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => removeRow(i)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="form-row">
        <button className="btn btn-ghost" onClick={addRow}>
          + Agregar fila
        </button>

        <button
          className="btn btn-primary"
          onClick={handleCalculate}
          disabled={loading}
        >
          {loading ? 'Calculando...' : 'Calcular E(X)'}
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="metrics-grid">
            <div className="metric-card accent">
              <span className="metric-label">
                Valor Esperado
              </span>

              <span className="metric-value">
                {data.expectedValue.toFixed(4)}
              </span>
            </div>
          </div>

          <div className="steps-box">
            <p className="steps-title">Resultado</p>

            <p className="step">
              E(X) =
              <span className="highlight">
                {' '}
                {data.expectedValue.toFixed(4)}
              </span>
            </p>

            <p className="step">
              Σ f(x) =
              <span className="highlight">
                {' '}
                {data.sumProbability.toFixed(4)}
              </span>
            </p>
          </div>
        </>
      )}
    </div>
  )
}