import { useState } from 'react'
import { expectedValueApi } from '../utils/api'
import './ValorEsperadoPanel.css'

export default function ValorEsperadoPanel() {
  const [rows, setRows] = useState([{ x: '' }, { x: '' }])
  const [fxExpression, setFxExpression] = useState('x/3')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const addRow = () => setRows([...rows, { x: '' }])

  const removeRow = (index) => {
    if (rows.length <= 1) return
    setRows(rows.filter((_, i) => i !== index))
  }

  const updateRow = (index, value) => {
    const copy = [...rows]
    copy[index] = { x: value }
    setRows(copy)
  }

  const calculate = async () => {
    setError(null)
    setResult(null)
    try {
      const xValues = rows
        .map(r => parseFloat(r.x))
        .filter(v => !isNaN(v))

      if (xValues.length < 1) {
        setError('Ingresa al menos un valor de X válido.')
        return
      }

      const data = await expectedValueApi.fx(xValues, fxExpression)
      setResult(data)
    } catch (err) {
      setError('Error al calcular. Verifica la expresión f(x).')
      console.error(err)
    }
  }

  return (
    <div className="panel-content">
      <h2 className="panel-title">Valor Esperado E(X)</h2>

      {/* f(x) */}
      <div className="form-group">
        <label className="form-label">Función f(x)</label>
        <input
          className="form-input"
          value={fxExpression}
          onChange={(e) => setFxExpression(e.target.value)}
          placeholder="Ejemplo: x/3"
        />
      </div>

      {/* Valores de X */}
      <div className="form-group">
        <label className="form-label">Valores de X</label>
        <div className="x-rows">
          {rows.map((row, i) => (
            <div key={i} className="x-row">
              <span className="x-index">x{i + 1}</span>
              <input
                className="form-input"
                placeholder="Valor numérico"
                value={row.x}
                onChange={(e) => updateRow(i, e.target.value)}
              />
              <button
                className="btn-remove"
                onClick={() => removeRow(i)}
                disabled={rows.length <= 1}
                title="Eliminar"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Botones de acción */}
      <div className="action-row">
        <button className="btn btn-ghost btn-sm" onClick={addRow}>
          + Agregar X
        </button>
        <button className="btn btn-primary" onClick={calculate}>
          Calcular E(X)
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {/* Resultado */}
      {result && (
        <div className="steps-box">
          <p className="steps-title">Procedimiento</p>

          <div className="step-card">
            <span className="step-number">1</span>
            <div className="step-body">
              <span className="step-label">Valores de X ingresados</span>
              <span className="step-expr">
                X = {'{'}{result.xValues.join(', ')}{'}'}
              </span>
            </div>
          </div>

          <div className="step-card">
            <span className="step-number">2</span>
            <div className="step-body">
              <span className="step-label">Función de probabilidad aplicada</span>
              <span className="step-expr">f(x) = {fxExpression}</span>
            </div>
          </div>

          <div className="step-card">
            <span className="step-number">3</span>
            <div className="step-body">
              <span className="step-label">Evaluación f(xᵢ) por cada valor</span>
              <span className="step-expr">
                {result.fxValues.map((fx, i) => (
                  <span key={i} className="fx-item">
                    f({result.xValues[i]}) = <span className="highlight">{fx}</span>
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className="step-card">
            <span className="step-number">4</span>
            <div className="step-body">
              <span className="step-label">Sumatoria Σ xᵢ · f(xᵢ)</span>
              <span className="step-expr">
                {result.xValues.map((x, i) => (
                  <span key={i}>
                    ({x} × {result.fxValues[i]}){i < result.xValues.length - 1 ? ' + ' : ''}
                  </span>
                ))}
              </span>
            </div>
          </div>

          <div className="step-card accent">
            <span className="step-number">✓</span>
            <div className="step-body">
              <span className="step-label">Valor Esperado</span>
              <span className="step-expr">
                E(X) = <span className="highlight">{result.expectedValue.toFixed(4)}</span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}