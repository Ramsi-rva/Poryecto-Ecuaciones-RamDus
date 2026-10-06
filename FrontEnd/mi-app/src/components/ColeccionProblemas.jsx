import { useState, useMemo } from 'react'
import './ColeccionProblemas.css'
import Screen from './Screen'
import DistChart from './DistChart'
import { normalPdf } from '../utils/distributions'

const problemas = [
  {
    id: 1,
    titulo: 'Temperatura corporal',
    enunciado: 'La temperatura del cuerpo humano sigue una distribución normal con media 37°C y desviación típica 0.5°C. Calcular la probabilidad de que la temperatura sea menor que 36.5°C.',
    solucion: [
      'Tipificamos: Z = (36.5 - 37) / 0.5 = -1.00',
      'P(X < 36.5) = P(Z < -1.00) = 1 - P(Z < 1.00)',
      'P(Z < 1.00) = 0.8413',
      'P(X < 36.5) = 1 - 0.8413 = 0.1587',
    ],
    resultado: 'P(X < 36.5°C) = 0.1587 → 15.87%',
    grafica: { mu: 37, sigma: 0.5, tipo: 'menor', a: null, b: 36.5 },
  },
  {
    id: 2,
    titulo: 'Notas de examen EBAU',
    enunciado: 'Las notas de 500 alumnos siguen una distribución normal con media 6.5 y varianza 4. Calcular la probabilidad de obtener más de 8 puntos.',
    solucion: [
      'Desviación típica: σ = √4 = 2',
      'Tipificamos: Z = (8 - 6.5) / 2 = 0.75',
      'P(X > 8) = P(Z > 0.75) = 1 - P(Z < 0.75)',
      'P(Z < 0.75) = 0.7734',
      'P(X > 8) = 1 - 0.7734 = 0.2266',
    ],
    resultado: 'P(X > 8) = 0.2266 → 22.66%',
    grafica: { mu: 6.5, sigma: 2, tipo: 'mayor', a: 8, b: null },
  },
  {
    id: 3,
    titulo: 'Estatura en un instituto',
    enunciado: 'Altura media 1.78 m, desviación típica 0.20 m. Probabilidad de medir entre 1.60 m y 1.90 m.',
    solucion: [
      'Z₁ = (1.60 - 1.78) / 0.20 = -0.90',
      'Z₂ = (1.90 - 1.78) / 0.20 = 0.60',
      'P(1.60 < X < 1.90) = P(-0.90 < Z < 0.60)',
      'P(Z < 0.60) = 0.7257',
      'P(Z < -0.90) = 0.1841',
      'P = 0.7257 - 0.1841 = 0.5416',
    ],
    resultado: 'P(1.60 < X < 1.90) = 0.5416 → 54.16%',
    grafica: { mu: 1.78, sigma: 0.20, tipo: 'entre', a: 1.60, b: 1.90 },
  },
  {
    id: 4,
    titulo: 'Talla de recién nacidos',
    enunciado: 'Talla de recién nacidos: media 50 cm, desviación estándar 2 cm. Probabilidad de medir menos de 45 cm.',
    solucion: [
      'Tipificamos: Z = (45 - 50) / 2 = -2.50',
      'P(X < 45) = P(Z < -2.50) = 1 - P(Z < 2.50)',
      'P(Z < 2.50) = 0.9938',
      'P(X < 45) = 1 - 0.9938 = 0.0062',
    ],
    resultado: 'P(X < 45 cm) = 0.0062 → 0.62%',
    grafica: { mu: 50, sigma: 2, tipo: 'menor', a: null, b: 45 },
  },
  {
    id: 5,
    titulo: 'Colesterol en hombres',
    enunciado: 'Colesterol: media 210 mg/dl, desviación estándar 15 mg/dl. ¿Qué porcentaje tiene lecturas mayores a 250 mg/dl?',
    solucion: [
      'Tipificamos: Z = (250 - 210) / 15 = 2.67',
      'P(X > 250) = P(Z > 2.67) = 1 - P(Z < 2.67)',
      'P(Z < 2.67) = 0.9962',
      'P(X > 250) = 1 - 0.9962 = 0.0038',
    ],
    resultado: 'P(X > 250) = 0.0038 → 0.38%',
    grafica: { mu: 210, sigma: 15, tipo: 'mayor', a: 250, b: null },
  },
  {
    id: 6,
    titulo: 'Duración de un test médico',
    enunciado: 'Test médico: media 20 min, desviación típica 4 min. Porcentaje de tests entre 16 y 26 minutos.',
    solucion: [
      'Z₁ = (16 - 20) / 4 = -1.00',
      'Z₂ = (26 - 20) / 4 = 1.50',
      'P(16 < X < 26) = P(-1.00 < Z < 1.50)',
      'P(Z < 1.50) = 0.9332',
      'P(Z < -1.00) = 0.1587',
      'P = 0.9332 - 0.1587 = 0.7745',
    ],
    resultado: 'P(16 < X < 26 min) = 0.7745 → 77.45%',
    grafica: { mu: 20, sigma: 4, tipo: 'entre', a: 16, b: 26 },
  },
  {
    id: 7,
    titulo: 'Vida útil de una pila',
    enunciado: 'Pila: media 100 horas, desviación típica 10 horas. Porcentaje con duración inferior a 120 horas.',
    solucion: [
      'Tipificamos: Z = (120 - 100) / 10 = 2.00',
      'P(X < 120) = P(Z < 2.00)',
      'P(Z < 2.00) = 0.9772',
    ],
    resultado: 'P(X < 120 h) = 0.9772 → 97.72%',
    grafica: { mu: 100, sigma: 10, tipo: 'menor', a: null, b: 120 },
  },
  {
    id: 8,
    titulo: 'Peso de recién nacidos',
    enunciado: 'Peso: media 3.5 kg, desviación típica 0.5 kg. Probabilidad de pesar entre 3 y 4 kg.',
    solucion: [
      'Z₁ = (3 - 3.5) / 0.5 = -1.00',
      'Z₂ = (4 - 3.5) / 0.5 = 1.00',
      'P(3 < X < 4) = P(-1.00 < Z < 1.00)',
      'P(Z < 1.00) = 0.8413',
      'P(Z < -1.00) = 0.1587',
      'P = 0.8413 - 0.1587 = 0.6826',
    ],
    resultado: 'P(3 < X < 4 kg) = 0.6826 → 68.26%',
    grafica: { mu: 3.5, sigma: 0.5, tipo: 'entre', a: 3, b: 4 },
  },
  {
    id: 9,
    titulo: 'Salarios de recién graduados',
    enunciado: 'Salarios: media 1300€, desviación típica 600€. Probabilidad de cobrar menos de 600€.',
    solucion: [
      'Tipificamos: Z = (600 - 1300) / 600 = -1.17',
      'P(X < 600) = P(Z < -1.17) = 1 - P(Z < 1.17)',
      'P(Z < 1.17) = 0.8790',
      'P(X < 600) = 1 - 0.8790 = 0.1210',
    ],
    resultado: 'P(X < 600€) = 0.1210 → 12.10%',
    grafica: { mu: 1300, sigma: 600, tipo: 'menor', a: null, b: 600 },
  },
  {
    id: 10,
    titulo: 'Probabilidad estándar directa',
    enunciado: 'Z ~ N(0,1). Calcular: a) P(Z < 1.35)  b) P(Z > 2.10)  c) P(-1.52 ≤ Z ≤ 0.90)',
    solucion: [
      'a) P(Z < 1.35) = 0.9115',
      'b) P(Z > 2.10) = 1 - 0.9821 = 0.0179',
      'c) P(Z < 0.90) - P(Z < -1.52) = 0.8159 - 0.0643 = 0.7516',
    ],
    resultado: 'a) 0.9115   b) 0.0179   c) 0.7516',
    grafica: { mu: 0, sigma: 1, tipo: 'entre', a: -1.52, b: 0.90 },
  },
]

const TIPOS = { menor: 'Cola izquierda', mayor: 'Cola derecha', entre: 'Intervalo' }

function GraficaNormal({ grafica }) {
  const { mu, sigma, tipo, a, b } = grafica
  const pdfFn = useMemo(() => (x) => normalPdf(x, mu, sigma), [mu, sigma])
  const domain = useMemo(() => [mu - 4 * sigma, mu + 4 * sigma], [mu, sigma])
  const regions = tipo === 'menor' ? [[-Infinity, b]] : tipo === 'mayor' ? [[a, Infinity]] : [[a, b]]
  const cuts = tipo === 'menor' ? [b] : tipo === 'mayor' ? [a] : [a, b]

  return (
    <div className="cp-grafica-wrap">
      <span className="cp-grafica-label">Gráfica de distribución</span>
      <DistChart
        pdfFn={pdfFn}
        domain={domain}
        regions={regions}
        cuts={cuts}
        center={mu}
        label={`Curva normal con media ${mu} y desviación ${sigma}`}
      />
    </div>
  )
}

function ColeccionProblemas({ onBack }) {
  const [seleccionado, setSeleccionado] = useState(null)
  const p = problemas.find((x) => x.id === seleccionado)

  return (
    <Screen title="Colección de problemas" onBack={onBack} wide>
      {!p ? (
        <>
          <p className="cp-subtitulo">Distribución normal estándar — 10 problemas resueltos</p>
          <div className="cp-lista">
            {problemas.map((q, i) => (
              <button key={q.id} className="cp-item" style={{ '--i': i }} onClick={() => setSeleccionado(q.id)}>
                <span className="cp-item-numero">{q.id}</span>
                <span className="cp-item-info">
                  <span className="cp-item-titulo">{q.titulo}</span>
                  <span className="cp-item-enunciado">{q.enunciado}</span>
                </span>
                <span className="cp-item-tag">{TIPOS[q.grafica.tipo]}</span>
                <span className="cp-item-arrow" aria-hidden="true">›</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="cp-detalle">
          <button className="cp-btn-atras" onClick={() => setSeleccionado(null)}>
            ← Volver a la lista
          </button>

          <div className="cp-detalle-card">
            <div className="cp-detalle-numero">{p.id}</div>
            <h2 className="cp-detalle-titulo">{p.titulo}</h2>

            <div className="cp-detalle-body">
              <div className="cp-detalle-izq">
                <div className="cp-seccion">
                  <span className="cp-seccion-label">Enunciado</span>
                  <p className="cp-detalle-enunciado">{p.enunciado}</p>
                </div>

                <div className="cp-divider"></div>

                <div className="cp-seccion">
                  <span className="cp-seccion-label">Solución paso a paso</span>
                  <div className="cp-pasos">
                    {p.solucion.map((paso, i) => (
                      <div key={i} className="cp-paso" style={{ '--i': i }}>
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

              <GraficaNormal grafica={p.grafica} />
            </div>
          </div>
        </div>
      )}
    </Screen>
  )
}

export default ColeccionProblemas
