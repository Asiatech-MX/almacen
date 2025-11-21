import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { QueryProvider } from './providers/QueryProvider'
import { Toaster } from './components/ui/toaster'
import { Toaster as SonnerToaster } from './components/ui/sonner'
import './types/electron' // Importar para que los tipos estén disponibles
import './styles/globals.css' // Import Tailwind CSS and shadcn/ui styles

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)

root.render(
  <React.StrictMode>
    <QueryProvider>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        expand={false}
        duration={4000}
      />
      <SonnerToaster richColors closeButton />
    </QueryProvider>
  </React.StrictMode>
)