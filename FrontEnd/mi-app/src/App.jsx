import { useEffect, useState } from 'react';
import './App.css'
import VarianzaPanel from './components/VarianzaPanel'
import ValorEsperadoPanel from './components/ValorEsperadoPanel'
import NormalPanel from './components/NormalPanel'

function App() {
  return (
    <div>
      <h1>App de Estadística</h1>

      <VarianzaPanel />
      <ValorEsperadoPanel />
      <NormalPanel />
    </div>
  )
  
}

export default App