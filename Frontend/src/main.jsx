import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';

// Estilos de PrimeReact
import "primereact/resources/themes/lara-dark-indigo/theme.css";     
import "primereact/resources/primereact.min.css";                     
import "primeicons/primeicons.css";                                   
import "primeflex/primeflex.css";                                    

// Estilos Globales Propios (Glassmorphism & Animaciones)
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);
