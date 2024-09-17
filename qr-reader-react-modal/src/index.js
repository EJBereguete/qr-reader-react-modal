import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Selecciona el contenedor root
const container = document.getElementById('root');

// Crea la raíz de React con createRoot
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
