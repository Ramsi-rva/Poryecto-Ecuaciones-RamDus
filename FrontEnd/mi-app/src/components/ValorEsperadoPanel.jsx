import { useState } from 'react'
import { expectedValueApi } from '../utils/api'
import './ValorEsperadoPanel.css'

export default function ValorEsperadoPanel() {

  const [rows, setRows] = useState([
    { x: '' }
  ])

  const [fxExpression, setFxExpression] = useState('x/3')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const calculate = async () => {
    try {
      const xValues = rows
        .map(r => parseFloat(r.x))
        .filter(v => !isNaN(v))

      if (xValues.length === 0) {
        setResult(null)
        setError('Ingresa al menos un valor numérico de X.')
        return
      }
      if (!fxExpression.trim()) {
        setResult(null)
        setError('Escribe la función f(x), por ejemplo x/3.')
        return
      }
      setError(null)

      const data = await expectedValueApi.fx(
        xValues,
        fxExpression
      )

      setResult(data)
    } catch (err) {
      console.error(err)
      setResult(null)
      setError(err.message || 'No se pudo calcular. Revisa la función f(x) y que el servidor esté activo.')
    }
  }

  return (
    <div className="panel-content">

      <h2 className="panel-title">
        Valor Esperado E(X)
      </h2>

      <div className="form-group">
        <label className="form-label" htmlFor="ve-fx">
          Función f(x)
        </label>

        <input
          id="ve-fx"
          className="form-input"
          value={fxExpression}
          onChange={(e) => setFxExpression(e.target.value)}
          placeholder="Ejemplo: x/3"
        />
      </div>

      {rows.map((row, i) => (
        <div key={i} className="form-row">

          <input
            className="form-input"
            aria-label={`Valor de X número ${i + 1}`}
            placeholder="Valor de X"
            value={row.x}
            onChange={(e) => {
              const copy = [...rows]
              copy[i].x = e.target.value
              setRows(copy)
            }}
          />

        </div>
      ))}

      <button
        className="btn btn-ghost"
        onClick={() =>
          setRows([...rows, { x: '' }])
        }
      >
        + Agregar X
      </button>

      <div style={{ height: '1.5rem' }} />

      <button
        className="btn btn-primary"
        onClick={calculate}
      >
        Calcular
      </button>

      {error && <div className="alert alert-error" role="alert">{error}</div>}

      {result && (
        <div className="steps-box">
          <p>
            E(X): {result.expectedValue.toFixed(4)}
          </p>
        </div>
      )}

    </div>
  )
}