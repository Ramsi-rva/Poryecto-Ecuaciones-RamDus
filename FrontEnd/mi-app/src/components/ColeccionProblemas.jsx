import { useState } from 'react'
import './ColeccionProblemas.css'

const problemas = [
  {
    id: 1,
    titulo: 'Temperatura corporal',
    enunciado: 'La temperatura del cuerpo humano sigue una distribución normal con media 37°C y desviación típica 0.5°C. Calcular la probabilidad de que la temperatura de una persona sea menor que 36.5°C.',
    solucion: [
      'Tipificamos: Z = (36.5 - 37) / 0.5 = -1.00',
      'P(X < 36.5) = P(Z < -1.00) = 1 - P(Z < 1.00)',
      'P(Z < 1.00) = 0.8413',
      'P(X < 36.5) = 1 - 0.8413 = 0.1587',
    ],
    resultado: 'P(X < 36.5°C) = 0.1587 → 15.87%',
  },
  {
    id: 2,
    titulo: 'Notas de examen EBAU',
    enunciado: 'Las notas de 500 alumnos en un examen siguen una distribución normal con media 6.5 y varianza 4. Calcular la probabilidad de que un alumno haya obtenido más de 8 puntos.',
    solucion: [
      'Desviación típica: σ = √4 = 2',
      'Tipificamos: Z = (8 - 6.5) / 2 = 0.75',
      'P(X > 8) = P(Z > 0.75) = 1 - P(Z < 0.75)',
      'P(Z < 0.75) = 0.7734',
      'P(X > 8) = 1 - 0.7734 = 0.2266',
    ],
    resultado: 'P(X > 8) = 0.2266 → 22.66% de los alumnos',
  },
  {
    id: 3,
    titulo: 'Estatura en un instituto',
    enunciado: 'En un instituto la altura media es 1.78 m con desviación típica 0.20 m. Si elegimos un alumno al azar, ¿cuál es la probabilidad de que mida entre 1.60 m y 1.90 m?',
    solucion: [
      'Z₁ = (1.60 - 1.78) / 0.20 = -0.90',
      'Z₂ = (1.90 - 1.78) / 0.20 = 0.60',
      'P(1.60 < X < 1.90) = P(-0.90 < Z < 0.60)',
      'P(Z < 0.60) = 0.7257',
      'P(Z < -0.90) = 1 - 0.8159 = 0.1841',
      'P = 0.7257 - 0.1841 = 0.5416',
    ],
    resultado: 'P(1.60 < X < 1.90) = 0.5416 → 54.16%',
  },
  {
    id: 4,
    titulo: 'Talla de recién nacidos',
    enunciado: 'La talla de los recién nacidos sigue una distribución normal con media 50 cm y desviación estándar 2 cm. ¿Cuál es la probabilidad de que un niño mida menos de 45 cm al nacer?',
    solucion: [
      'Tipificamos: Z = (45 - 50) / 2 = -2.50',
      'P(X < 45) = P(Z < -2.50) = 1 - P(Z < 2.50)',
      'P(Z < 2.50) = 0.9938',
      'P(X < 45) = 1 - 0.9938 = 0.0062',
    ],
    resultado: 'P(X < 45 cm) = 0.0062 → 0.62%',
  },
  {
    id: 5,
    titulo: 'Colesterol en hombres mayores de 50 años',
    enunciado: 'El colesterol en hombres mayores de 50 años sigue una distribución normal con media 210 mg/dl y desviación estándar 15 mg/dl. ¿Qué porcentaje tiene lecturas mayores a 250 mg/dl?',
    solucion: [
      'Tipificamos: Z = (250 - 210) / 15 = 2.67',
      'P(X > 250) = P(Z > 2.67) = 1 - P(Z < 2.67)',
      'P(Z < 2.67) = 0.9962',
      'P(X > 250) = 1 - 0.9962 = 0.0038',
    ],
    resultado: 'P(X > 250) = 0.0038 → 0.38% de la población',
  },
  {
    id: 6,
    titulo: 'Duración de un test médico',
    enunciado: 'El tiempo para obtener la respuesta de un test médico sigue una distribución normal con media 20 min y desviación típica 4 min. ¿En qué porcentaje de tests se obtiene el resultado entre 16 y 26 minutos?',
    solucion: [
      'Z₁ = (16 - 20) / 4 = -1.00',
      'Z₂ = (26 - 20) / 4 = 1.50',
      'P(16 < X < 26) = P(-1.00 < Z < 1.50)',
      'P(Z < 1.50) = 0.9332',
      'P(Z < -1.00) = 0.1587',
      'P = 0.9332 - 0.1587 = 0.7745',
    ],
    resultado: 'P(16 < X < 26 min) = 0.7745 → 77.45%',
  },
  {
    id: 7,
    titulo: 'Vida útil de una pila',
    enunciado: 'La vida útil de un modelo de pila sigue una distribución normal con media 100 horas y desviación típica 10 horas. ¿Qué porcentaje de pilas tendrá una duración inferior a 120 horas?',
    solucion: [
      'Tipificamos: Z = (120 - 100) / 10 = 2.00',
      'P(X < 120) = P(Z < 2.00)',
      'P(Z < 2.00) = 0.9772',
    ],
    resultado: 'P(X < 120 h) = 0.9772 → 97.72% de las pilas',
  },
  {
    id: 8,
    titulo: 'Peso de recién nacidos',
    enunciado: 'El peso de los recién nacidos sigue una distribución normal con media 3.5 kg y desviación típica 0.5 kg. Calcula la probabilidad de que un recién nacido pese entre 3 y 4 kg.',
    solucion: [
      'Z₁ = (3 - 3.5) / 0.5 = -1.00',
      'Z₂ = (4 - 3.5) / 0.5 = 1.00',
      'P(3 < X < 4) = P(-1.00 < Z < 1.00)',
      'P(Z < 1.00) = 0.8413',
      'P(Z < -1.00) = 0.1587',
      'P = 0.8413 - 0.1587 = 0.6826',
    ],
    resultado: 'P(3 < X < 4 kg) = 0.6826 → 68.26%',
  },
  {
    id: 9,
    titulo: 'Salarios de recién graduados',
    enunciado: 'Los salarios mensuales de recién graduados siguen una distribución normal con media 1300€ y desviación típica 600€. Calcular la probabilidad de que un graduado cobre menos de 600€.',
    solucion: [
      'Tipificamos: Z = (600 - 1300) / 600 = -1.17',
      'P(X < 600) = P(Z < -1.17) = 1 - P(Z < 1.17)',
      'P(Z < 1.17) = 0.8790',
      'P(X < 600) = 1 - 0.8790 = 0.1210',
    ],
    resultado: 'P(X < 600€) = 0.1210 → 12.10% de los graduados',
  },
  {
    id: 10,
    titulo: 'Probabilidad estándar directa',
    enunciado: 'Dada una variable Z con distribución normal estándar N(0,1), calcular: a) P(Z < 1.35)   b) P(Z > 2.10)   c) P(-1.52 ≤ Z ≤ 0.90)',
    solucion: [
      'a) P(Z < 1.35) = 0.9115',
      'b) P(Z > 2.10) = 1 - P(Z < 2.10) = 1 - 0.9821 = 0.0179',
      'c) P(-1.52 ≤ Z ≤ 0.90) = P(Z < 0.90) - P(Z < -1.52)',
      '   P(Z < 0.90) = 0.8159',
      '   P(Z < -1.52) = 1 - 0.9357 = 0.0643',
      '   P = 0.8159 - 0.0643 = 0.7516',
    ],
    resultado: 'a) 0.9115   b) 0.0179   c) 0.7516',
  },
]

function ColeccionProblemas({ onBack }) {
  const [seleccionado, setSeleccionado] = useState(null)

  return (
    <div className="cp-container">
      <div className="cp-header">
        <div className="cp-title-bar"></div>
        <h1 className="cp-title">Colección de Problemas</h1>
      </div>

      <div className="cp-body">
        {seleccionado === null ? (
          <>
            <p className="cp-subtitulo">Distribución Normal Estándar — 10 problemas resueltos</p>
            <div className="cp-lista">
              {problemas.map((p) => (
                <div
                  key={p.id}
                  className="cp-item"
                  onClick={() => setSeleccionado(p.id)}
                >
                  <div className="cp-item-numero">{p.id}</div>
                  <div className="cp-item-info">
                    <span className="cp-item-titulo">{p.titulo}</span>
                    <span className="cp-item-enunciado">{p.enunciado}</span>
                  </div>
                  <div className="cp-item-arrow">›</div>
                </div>
              ))}
            </div>
          </>
        ) : (
          (() => {
            const p = problemas.find((x) => x.id === seleccionado)
            return (
              <div className="cp-detalle">
                <button className="cp-btn-atras" onClick={() => setSeleccionado(null)}>
                  ← Volver a la lista
                </button>

                <div className="cp-detalle-card">
                  <div className="cp-detalle-numero">{p.id}</div>
                  <h2 className="cp-detalle-titulo">{p.titulo}</h2>

                  <div className="cp-seccion">
                    <span className="cp-seccion-label">Enunciado</span>
                    <p className="cp-detalle-enunciado">{p.enunciado}</p>
                  </div>

                  <div className="cp-divider"></div>

                  <div className="cp-seccion">
                    <span className="cp-seccion-label">Solución paso a paso</span>
                    <div className="cp-pasos">
                      {p.solucion.map((paso, i) => (
                        <div key={i} className="cp-paso">
                          <span className="cp-paso-num">{i + 1}</span>
                          <span className="cp-paso-texto">{paso}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="cp-resultado-box">
                    <span className="cp-resultado-label">Resultado</span>
                    <span className="cp-resultado-valor">{p.resultado}</span>
                  </div>
                </div>
              </div>
            )
          })()
        )}

        <button className="cp-btn-volver" onClick={onBack}>
          ← Volver al menú
        </button>
      </div>
    </div>
  )
}

export default ColeccionProblemas