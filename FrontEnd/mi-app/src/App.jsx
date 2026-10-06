import { useState, useEffect } from 'react'
import './App.css'
import DistribucionNormal from './components/DistribucionNormal'
import DistribucionTStudent from './components/DistribucionTStudent'
import ColeccionProblemas from './components/ColeccionProblemas'
import VarianzaPanel from './components/VarianzaPanel'
import ValorEsperadoPanel from './components/ValorEsperadoPanel'
import Screen from './components/Screen'
import heroImg from './media/fondo.png' 

const VISTAS = ['varianza', 'valor-esperado', 'distribucion-normal', 'distribucion-t', 'coleccion-problemas']

// La vista vive en el hash de la URL (#varianza, #distribucion-t, …) para que
// el botón "atrás" del navegador regrese al menú en lugar de salir de la app.
const leerVista = () => {
  const h = window.location.hash.replace('#', '')
  return VISTAS.includes(h) ? h : 'menu'
}

function App() {
  const [vista, setVistaState] = useState(leerVista)

  useEffect(() => {
    const alCambiar = () => {
      setVistaState(leerVista())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  const setVista = (v) => {
    if (v === 'menu') {
      history.pushState(null, '', window.location.pathname + window.location.search)
      setVistaState('menu')
    } else {
      window.location.assign('#' + v)
    }
  }

  // Foco de luz que sigue al cursor sobre la tarjeta
  const luz = (e) => {
    const card = e.target.closest?.('.calculator-card')
    if (!card) return
    const r = card.getBoundingClientRect()
    card.style.setProperty('--mx', `${e.clientX - r.left}px`)
    card.style.setProperty('--my', `${e.clientY - r.top}px`)
  }

  // Props para que una tarjeta se comporte como botón (ratón y teclado)
  const abrir = (v) => ({
    role: 'button',
    tabIndex: 0,
    onClick: () => setVista(v),
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setVista(v)
      }
    },
  })

  if (vista === 'distribucion-normal') {
    return <DistribucionNormal onBack={() => setVista('menu')} />
  }

  if (vista === 'distribucion-t') {
    return <DistribucionTStudent onBack={() => setVista('menu')} />
  }

  if (vista === 'coleccion-problemas') {
    return <ColeccionProblemas onBack={() => setVista('menu')} />
  }

  if (vista === 'varianza') {
    return (
      <Screen title="Calculadora de varianza" onBack={() => setVista('menu')}>
        <VarianzaPanel />
      </Screen>
    )
  }

  if (vista === 'valor-esperado') {
    return (
      <Screen title="Valor esperado E(X)" onBack={() => setVista('menu')}>
        <ValorEsperadoPanel />
      </Screen>
    )
  }

  return (
    <main className="menu">
      <h1 className="sr-only">Calculadora de probabilidad y estadística</h1>

      <figure className="poster">
        <img
          src={heroImg}
          alt="Calculadora de probabilidad y estadística — Facultad de Ingeniería y Tecnología, Universidad de Montemorelos"
        />
      </figure>

      <div className="menu-head">
        <h2 className="menu-title">Calculadoras</h2>
        <span className="menu-count">5 herramientas</span>
      </div>

      <div className="calculator-grid" onMouseMove={luz}>
        <div className="calculator-card stagger" style={{ '--i': 0 }} {...abrir('varianza')}>
          <div className="card-top">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="2" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="16" x2="13" y2="16" />
              </svg>
            </div>
            <span className="card-tag">Estadística descriptiva</span>
          </div>
          <h3>Varianza</h3>
          <p>Calcula la varianza de un conjunto de datos y revisa el procedimiento paso a paso.</p>
          <span className="card-go" aria-hidden="true">Abrir →</span>
        </div>
        <div className="calculator-card stagger" style={{ '--i': 1 }} {...abrir('valor-esperado')}>
          <div className="card-top">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <line x1="6" y1="20" x2="6" y2="15" /><line x1="12" y1="20" x2="12" y2="9" /><line x1="18" y1="20" x2="18" y2="4" />
              </svg>
            </div>
            <span className="card-tag">Variables aleatorias</span>
          </div>
          <h3>Valor esperado</h3>
          <p>Obtén E(X) de una variable aleatoria a partir de su función f(x).</p>
          <span className="card-go" aria-hidden="true">Abrir →</span>
        </div>
        <div className="calculator-card stagger" style={{ '--i': 2 }} {...abrir('distribucion-normal')}>
          <div className="card-top">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 19 C7 19 8 5 12 5 C16 5 17 19 22 19" /><line x1="2" y1="19" x2="22" y2="19" />
              </svg>
            </div>
            <span className="card-tag">Distribuciones</span>
          </div>
          <h3>Distribución normal</h3>
          <p>Probabilidades, valores z, dos colas y su inversa sobre la curva normal.</p>
          <span className="card-go" aria-hidden="true">Abrir →</span>
        </div>
        <div className="calculator-card stagger" style={{ '--i': 3 }} {...abrir('distribucion-t')}>
          <div className="card-top">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 19 C6 19 8 9 12 9 C16 9 18 19 22 19" /><path d="M2 14 C6 17 9 6 12 6 C15 6 18 17 22 14" opacity=".5" /><line x1="2" y1="19" x2="22" y2="19" />
              </svg>
            </div>
            <span className="card-tag">Distribuciones</span>
          </div>
          <h3>Distribución t de Student</h3>
          <p>t crítico, valor p, dos colas y α según los grados de libertad.</p>
          <span className="card-go" aria-hidden="true">Abrir →</span>
        </div>
        <div className="calculator-card stagger" style={{ '--i': 4 }} {...abrir('coleccion-problemas')}>
          <div className="card-top">
            <div className="card-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
              </svg>
            </div>
            <span className="card-tag">Práctica</span>
          </div>
          <h3>Colección de problemas</h3>
          <p>Diez problemas resueltos con su solución y su gráfica.</p>
          <span className="card-go" aria-hidden="true">Abrir →</span>
        </div>
      </div>
    </main>
  )
}

export default App
