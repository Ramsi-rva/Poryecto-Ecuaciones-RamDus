import { useState } from 'react'
import './DistribucionNormal.css'

function DistribucionNormal({ onBack }) {
  const [media, setMedia] = useState('')
  const [desviacion, setDesviacion] = useState('')
  const [valor, setValor] = useState('')
  const [resultado, setResultado] = useState(null)

  function erf(x) {
    const a1 =  0.254829592
    const a2 = -0.284496736
    const a3 =  1.421413741
    const a4 = -1.453152027
    const a5 =  1.061405429
    const p  =  0.3275911
    const sign = x < 0 ? -1 : 1
    x = Math.abs(x)
    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
    return sign * y
  }

  function calcularProbabilidad() {
    const mu = parseFloat(media)
    const sigma = parseFloat(desviacion)
    const x = parseFloat(valor)

    if (isNaN(mu) || isNaN(sigma) || isNaN(x)) {
      setResultado({ error: 'Por favor ingresa valores numéricos válidos.' })
      return
    }
    if (sigma <= 0) {
      setResultado({ error: 'La desviación estándar debe ser mayor que 0.' })
      return
    }

    const z = (x - mu) / sigma
    const probAcumulada = 0.5 * (1 + erf(z / Math.sqrt(2)))
    const densidad = (1 / (sigma * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z * z)

    setResultado({
      z: z.toFixed(4),
      probMenor: (probAcumulada * 100).toFixed(4),
      probMayor: ((1 - probAcumulada) * 100).toFixed(4),
      densidad: densidad.toFixed(6),
    })
  }

  function limpiar() {
    setMedia('')
    setDesviacion('')
    setValor('')
    setResultado(null)
  }

  return (
    <div className="dn-container">
      <div className="dn-header">
        <div className="dn-title-bar"></div>
        <h1 className="dn-title">Calculadora de Distribución Normal</h1>
      </div>

      <div className="dn-body">
        <div className="dn-inputs-row">
          <div className="dn-field">
            <label className="dn-label">Media (μ)</label>
            <input
              className="dn-input"
              type="number"
              placeholder="0"
              value={media}
              onChange={e => setMedia(e.target.value)}
            />
          </div>
          <div className="dn-field">
            <label className="dn-label">Desviación Estándar (σ)</label>
            <input
              className="dn-input"
              type="number"
              placeholder="1"
              value={desviacion}
              onChange={e => setDesviacion(e.target.value)}
            />
          </div>
          <div className="dn-field">
            <label className="dn-label">Valor (x)</label>
            <input
              className="dn-input"
              type="number"
              placeholder="0"
              value={valor}
              onChange={e => setValor(e.target.value)}
            />
          </div>
        </div>

        <div className="dn-buttons">
          <button className="dn-btn-calcular" onClick={calcularProbabilidad}>
            Calcular Probabilidad
          </button>
          <button className="dn-btn-limpiar" onClick={limpiar}>
            Limpiar
          </button>
        </div>

        <div className="dn-divider"></div>

        <div className="dn-resultados">
          <h2 className="dn-resultados-title">Resultados</h2>
          {!resultado && (
            <p className="dn-resultados-placeholder">
              Los resultados aparecerán aquí después del cálculo...
            </p>
          )}
          {resultado?.error && (
            <p className="dn-resultados-error">{resultado.error}</p>
          )}
          {resultado && !resultado.error && (
            <div className="dn-resultados-grid">
              <div className="dn-resultado-card">
                <span className="dn-resultado-label">Valor Z</span>
                <span className="dn-resultado-valor">{resultado.z}</span>
              </div>
              <div className="dn-resultado-card">
                <span className="dn-resultado-label">P(X ≤ x)</span>
                <span className="dn-resultado-valor">{resultado.probMenor}%</span>
              </div>
              <div className="dn-resultado-card">
                <span className="dn-resultado-label">P(X ≥ x)</span>
                <span className="dn-resultado-valor">{resultado.probMayor}%</span>
              </div>
              <div className="dn-resultado-card">
                <span className="dn-resultado-label">Densidad f(x)</span>
                <span className="dn-resultado-valor">{resultado.densidad}</span>
              </div>
            </div>
          )}
        </div>

        <button className="dn-btn-volver" onClick={onBack}>
          ← Volver al menú
        </button>
      </div>
    </div>
  )
}

export default DistribucionNormal