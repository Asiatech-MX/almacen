import '@testing-library/jest-dom'
import { act } from 'react-dom/test-utils'
import { notifyManager } from '@tanstack/react-query'

// Configurar React Query para usar act() de testing-library
notifyManager.setNotifyFunction(act)

// Mock de window.matchMedia para componentes que usan media queries
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock de ResizeObserver para componentes que lo usan
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock de IntersectionObserver para componentes que lo usan
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))

// Mock de window.electronAPI base
const mockElectronAPI = {
  categoria: {
    listar: jest.fn(),
    crear: jest.fn(),
    editar: jest.fn(),
    eliminar: jest.fn(),
    obtener: jest.fn(),
    listarArbol: jest.fn(),
    mover: jest.fn(),
    reordenar: jest.fn(),
    toggleActivo: jest.fn(),
    verificarDependencias: jest.fn(),
    obtenerPorNivel: jest.fn(),
    buscar: jest.fn(),
    obtenerRuta: jest.fn(),
  },
  presentacion: {
    listar: jest.fn(),
    crear: jest.fn(),
    editar: jest.fn(),
    eliminar: jest.fn(),
    obtener: jest.fn(),
    obtenerPredeterminadas: jest.fn(),
    establecerPredeterminada: jest.fn(),
    toggleActivo: jest.fn(),
    verificarDependencias: jest.fn(),
    buscar: jest.fn(),
    obtenerPorNombre: jest.fn(),
    listarTodas: jest.fn(),
    restaurar: jest.fn(),
  },
  // Agregar otros métodos de electronAPI según sea necesario
  materiaPrima: {
    listar: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    obtener: jest.fn(),
    eliminar: jest.fn(),
    stockBajo: jest.fn(),
  },
  fs: {
    leer: jest.fn(),
    guardar: jest.fn(),
  }
}

// Configurar el mock en el objeto window
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
})

// Mock de console methods para tests más limpios (opcional)
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  // Silenciar advertencias específicas de React Testing Library
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is deprecated')
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Limpiar mocks después de cada test
afterEach(() => {
  jest.clearAllMocks()
})

// Configuración para mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock de CSS custom properties para componentes con Tailwind
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
})

// Mock de funciones de animación para evitar warnings en tests
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 0))
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id))

// Mock de fetch si es necesario para API calls
global.fetch = jest.fn()

// Exportar el mock para uso en tests
export { mockElectronAPI }