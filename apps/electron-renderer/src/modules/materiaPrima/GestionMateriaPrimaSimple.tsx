import React from 'react'

export const GestionMateriaPrimaSimple: React.FC = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#e8f5e8', border: '2px solid #4caf50', borderRadius: '8px' }}>
      <h2 style={{ color: '#2e7d32', marginBottom: '20px' }}>🎉 GestionMateriaPrima Simple Funcionando</h2>
      <p>Este es un componente temporal de prueba para verificar que el routing funciona.</p>
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f1f8e9', borderRadius: '5px' }}>
        <strong>✅ Routing confirmado:</strong>
        <ul>
          <li>LayoutPrincipal se renderiza correctamente</li>
          <li>Outlet funciona correctamente</li>
          <li>React Router anidado funciona correctamente</li>
          <li>El componente se monta en la ruta correcta</li>
        </ul>
      </div>
      <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
        Timestamp: {new Date().toLocaleString()}
      </p>
    </div>
  )
}