import { useEffect, useState } from 'react';
import { getSaludo } from './utils/api';
import './App.css'

function App() {
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    getSaludo().then(data => setMensaje(data.mensaje));
  }, []);

  return (
    <div>
      <h1>{mensaje}</h1>
    </div>
  );
}

export default App;