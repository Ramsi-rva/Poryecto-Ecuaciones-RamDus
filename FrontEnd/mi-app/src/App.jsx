import { useState, useEffect } from 'react'
import './App.css'
import DistribucionNormal from './components/DistribucionNormal'
import DistribucionTStudent from './components/DistribucionTStudent'
import ColeccionProblemas from './components/ColeccionProblemas'
import VarianzaPanel from './components/VarianzaPanel'
import ValorEsperadoPanel from './components/ValorEsperadoPanel'
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
      <div className="dn-container">
        <div className="dn-topbar">
          <button className="dn-btn-volver" onClick={() => setVista('menu')}>← Volver al menú</button>
        </div>
        <div className="dn-header">
          <div className="dn-title-bar" style={{ background: '#9d4edd' }}></div>
          <h1 className="dn-title">Calculadora de Varianza</h1>
        </div>
        <div className="dn-body">
          <VarianzaPanel />
        </div>
      </div>
    )
  }

  if (vista === 'valor-esperado') {
    return (
      <div className="dn-container">
        <div className="dn-topbar">
          <button className="dn-btn-volver" onClick={() => setVista('menu')}>← Volver al menú</button>
        </div>
        <div className="dn-header">
          <div className="dn-title-bar" style={{ background: '#60a5fa' }}></div>
          <h1 className="dn-title">Valor esperado E(X)</h1>
        </div>
        <div className="dn-body">
          <ValorEsperadoPanel />
        </div>
      </div>
    )
  }

  return (
    <div className="App">
      <h1 className="sr-only">Calculadora de probabilidad y estadística</h1>
      <div className="header-with-background">
  <img src={heroImg} alt="Calculadora de probabilidad y estadística — Facultad de Ingeniería y Tecnología, Universidad de Montemorelos" className="background-image" />
  <div className="overlay"></div>
  <div className="hero-section">
    
  </div>
</div>

      <div className="decorative-line"></div>

      <main className="content-section">
        <div className="calculator-grid">

          <div className="calculator-card" {...abrir('varianza')}>
            <div className="card-icon purple">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <line x1="8" y1="12" x2="16" y2="12" />
                <line x1="8" y1="16" x2="16" y2="16" />
                <line x1="8" y1="8" x2="16" y2="8" />
              </svg>
            </div>
            <h3>Varianza</h3>
            <p>Calcula la varianza de un conjunto de datos.</p>
          </div>

          <div className="calculator-card" {...abrir('valor-esperado')}>
            <div className="card-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
              </svg>
            </div>
            <h3>Valor esperado</h3>
            <p>Obtenga un valor esperado de una variable aleatoria.</p>
          </div>

          <div className="calculator-card" {...abrir('distribucion-normal')}>
            <div className="card-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h3>Distribución normal</h3>
            <p>Desarrolle la forma gráfica de la distribución normal estándar.</p>
          </div>

          <div className="calculator-card" {...abrir('distribucion-t')}>
            <div className="card-icon cyan">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 19 C6 19, 8 5, 12 5 C16 5, 18 19, 22 19" />
                <line x1="2" y1="19" x2="22" y2="19" />
              </svg>
            </div>
            <h3>Distribución t de Student</h3>
            <p>Probabilidades, t crítico, dos colas y valor α según los grados de libertad.</p>
          </div>

          <div className="calculator-card" {...abrir('coleccion-problemas')}>
            <div className="card-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>Colección de problemas</h3>
            <p>Acceda a una biblioteca de problemas resueltos y ejercicios prácticos.</p>
          </div>

        </div>
      </main>

      <div className="decorative-line"></div>
    </div>
  )
}

export default App