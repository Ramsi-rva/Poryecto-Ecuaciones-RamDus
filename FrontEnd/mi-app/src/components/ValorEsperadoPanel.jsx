// ─────────────────────────────────────────────────────────────
// ValorEsperadoPanel.jsx — E(X) para valores de X con f(x) dada
// ─────────────────────────────────────────────────────────────

import { useState } from 'react'
import './Calculadora.css'
import { expectedValueApi } from '../utils/api'
import { AnimatedNumber, Field, Step } from './ui'

const EJEMPLOS = ['x/3', 'x', 'x^2', '1']

export default function ValorEsperadoPanel() {
  const [rows, setRows] = useState([{ x: '' }])
  const [fxExpression, setFxExpression] = useState('x/3')
  const [result, setResult] = useState(null)
  const [used, setUsed] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const setRow = (i, x) => setRows(rows.map((r, k) => (k === i ? { x } : r)))
  const addRow = () => setRows([...rows, { x: '' }])
  const removeRow = (i) => setRows(rows.length > 1 ? rows.filter((_, k) => k !== i) : [{ x: '' }])

  const calculate = async (e) => {
    e.preventDefault()
    const xValues = rows.map((r) => parseFloat(r.x)).filter((v) => !isNaN(v))
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
    setLoading(true)
    try {
      const data = await expectedValueApi.fx(xValues, fxExpression)
      setUsed(xValues)
      setResult(data)
    } catch (err) {
      console.error(err)
      setResult(null)
      setError(err.message || 'No se pudo calcular. Revisa la función f(x) y que el servidor esté activo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="calc-grid single">
      <form className="panel" onSubmit={calculate} noValidate>
        <Step n="1" title="Función f(x)">
          <Field label="Peso de cada valor (se normaliza)" adorn="f(x)">
            <input className="field-input" type="text" value={fxExpression}
              onChange={(e) => setFxExpression(e.target.value)} placeholder="x/3" />
          </Field>
          <div className="chips" role="group" aria-label="Ejemplos de f(x)">
            {EJEMPLOS.map((ej) => (
              <button key={ej} type="button" className="chip chip-btn"
                aria-pressed={fxExpression === ej} onClick={() => setFxExpression(ej)}>
                {ej}
              </button>
            ))}
          </div>
        </Step>

        <Step n="2" title="Valores de X">
          <div className="rows">
            {rows.map((row, i) => (
              <div key={i} className="row-item">
                <Field label={`Valor ${i + 1}`} adorn="x">
                  <input className="field-input" type="number" step="any" inputMode="decimal"
                    value={row.x} onChange={(e) => setRow(i, e.target.value)} placeholder="Ej. 3" />
                </Field>
                <button type="button" className="icon-btn" aria-label={`Quitar el valor ${i + 1}`}
                  onClick={() => removeRow(i)}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="btn btn-glass btn-block" onClick={addRow}>+ Agregar valor</button>
        </Step>

        {error && <div className="alert alert-error" role="alert">{error}</div>}

        <div className="actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Calculando…' : 'Calcular'}
          </button>
        </div>
      </form>

      <div className="stage">
        <div className="stage-inner" key={result ? result.expectedValue : 'vacio'}>
          <header className="hero-result">
            <p className="hero-eyebrow">Valor esperado</p>
            {result ? (
              <>
                <p className="hero-value"><AnimatedNumber text={Number(result.expectedValue).toFixed(4)} /></p>
                <p className="hero-caption">E(X) = Σ x · P(x)</p>
              </>
            ) : (
              <>
                <p className="hero-value hero-empty">—</p>
                <p className="hero-caption">Define f(x), agrega los valores de X y pulsa «Calcular».</p>
              </>
            )}
          </header>

          {result?.probabilities && (
            <div className="table-wrap stagger" style={{ '--i': 1 }}>
              <table className="table">
                <thead>
                  <tr><th>x</th><th>P(x)</th><th>x · P(x)</th></tr>
                </thead>
                <tbody>
                  {used.map((x, i) => (
                    <tr key={i}>
                      <td>{x}</td>
                      <td>{Number(result.probabilities[i]).toFixed(4)}</td>
                      <td>{(x * result.probabilities[i]).toFixed(4)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
