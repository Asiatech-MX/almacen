import React from 'react'
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { LayoutPrincipal } from './components/layout/LayoutPrincipal'
import { MateriaPrimaFormulario } from './modules/materiaPrima/Formulario'
import { GestionMateriaPrima } from './modules/materiaPrima/GestionMateriaPrima'
import { GestionMateriaPrimaSimple } from './modules/materiaPrima/GestionMateriaPrimaSimple'
import { ConsultasAvanzadas } from './modules/materiaPrima/ConsultasAvanzadas'

// Componente placeholder para las demás rutas
const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '20px', textAlign: 'center' }}>
    <h2>{title}</h2>
    <p>Esta sección está en desarrollo...</p>
  </div>
)

// Componente de prueba simple
const TestPage: React.FC<{ title: string }> = ({ title }) => (
  <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f0f0f0', border: '2px solid #007acc' }}>
    <h2 style={{ color: '#007acc' }}>✅ Componente de prueba funcionando</h2>
    <p>Esta es la página: <strong>{title}</strong></p>
    <p>Timestamp: {new Date().toLocaleString()}</p>
    <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#e8e8e8', borderRadius: '5px' }}>
      <p>Si puedes ver esta página, el routing funciona correctamente.</p>
    </div>
  </div>
)

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LayoutPrincipal />}>
          {/* Rutas principales - Lista General (redirige a gestión) */}
          <Route index element={<Navigate to="/materia-prima/gestion" replace />} />
          <Route path="materia-prima" element={<Navigate to="/materia-prima/gestion" replace />} />

          {/* Módulo de Altas - Crear y Editar */}
          <Route path="materia-prima/nueva" element={<MateriaPrimaFormulario />} />
          <Route path="materia-prima/editar/:id" element={<MateriaPrimaFormulario />} />

          {/* Módulo de Bajas - Gestión y Eliminación */}
          <Route path="materia-prima/gestion" element={<GestionMateriaPrima />} />

          {/* Módulo de Consultas - Búsqueda Avanzada */}
          <Route path="materia-prima/consultas" element={<ConsultasAvanzadas />} />

          {/* Rutas placeholder para otros módulos */}
          <Route path="proveedores" element={<PlaceholderPage title="Proveedores" />} />
          <Route path="movimientos" element={<PlaceholderPage title="Movimientos" />} />
          <Route path="solicitudes" element={<PlaceholderPage title="Solicitudes" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App