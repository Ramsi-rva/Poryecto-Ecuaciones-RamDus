import { useState } from 'react'
import { expectedValueApi } from '../utils/api'
import './ValorEsperadoPanel.css'

export default function ValorEsperadoPanel() {

  const [rows, setRows] = useState([
    { x: '' }
  ])

  const [fxExpression, setFxExpression] = useState('x/3')
  const [result, setResult] = useState(null)

  const calculate = async () => {
    try {
      const xValues = rows
        .map(r => parseFloat(r.x))
        .filter(v => !isNaN(v))

      const data = await expectedValueApi.fx(
        xValues,
        fxExpression
      )

      setResult(data)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="panel-content">

      <h2 className="panel-title">
        Valor Esperado E(X)
      </h2>

      <div className="form-group">
        <label className="form-label">
          Función f(x)
        </label>

        <input
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

      <br /><br />

      <button
        className="btn btn-primary"
        onClick={calculate}
      >
        Calcular
      </button>

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