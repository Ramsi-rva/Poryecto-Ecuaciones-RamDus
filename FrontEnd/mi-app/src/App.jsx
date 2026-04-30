import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import DistribucionNormal from './components/DistribucionNormal'
import ColeccionProblemas from './components/ColeccionProblemas'
import './App.css'

function App() {
  const [vista, setVista] = useState('menu')

  if (vista === 'distribucion-normal') {
    return <DistribucionNormal onBack={() => setVista('menu')} />
  }

  if (vista === 'coleccion-problemas') {
  return <ColeccionProblemas onBack={() => setVista('menu')} />
  }
  return (
    <div className="App">
      <div className="header-with-background">
        <img src="src\media\fondo.png" alt="Fondo" className="background-image" />
        <div className="overlay"></div>
        <div className="hero-section">
          <h1 className="main-title-minimal">
            CALCULADORA DE<br />
            PROBABILIDAD Y ESTADÍSTICA
          </h1>
        </div>
      </div>

      <div className="decorative-line"></div>

      <main className="content-section">
        <div className="calculator-grid">

          <div className="calculator-card">
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

          <div className="calculator-card">
            <div className="card-icon blue">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="20" x2="12" y2="10" />
                <line x1="18" y1="20" x2="18" y2="4" />
                <line x1="6" y1="20" x2="6" y2="16" />
              </svg>
            </div>
            <h3>Valor Esperado</h3>
            <p>Obtenga un valor esperado de una variable aleatoria.</p>
          </div>

          <div
            className="calculator-card"
            onClick={() => setVista('distribucion-normal')}
          >
            <div className="card-icon green">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                <polyline points="17 6 23 6 23 12" />
              </svg>
            </div>
            <h3>Distribución Normal</h3>
            <p>Desarrolle la forma gráfica de la distribución normal estándar.</p>
          </div>

          <div className="calculator-card" onClick={() => setVista('coleccion-problemas')}>
            <div className="card-icon orange">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>Colección de Problemas</h3>
            <p>Acceda a una biblioteca de problemas resueltos y ejercicios prácticos.</p>
            
          </div>
          
        </div>
      </main>

      <div className="decorative-line"></div>
    </div>
  )
}

export default App