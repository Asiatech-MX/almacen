import '@testing-library/jest-dom';
import 'jest-extended';

// Mock de window.electronAPI para pruebas
const mockElectronAPI = {
  // Mocks para categorías
  categoria: {
    listar: jest.fn(),
    listarArbol: jest.fn(),
    crear: jest.fn(),
    editar: jest.fn(),
    eliminar: jest.fn(),
    mover: jest.fn()
  },

  // Mocks para presentaciones
  presentacion: {
    listar: jest.fn(),
    crear: jest.fn(),
    editar: jest.fn(),
    eliminar: jest.fn(),
    obtenerPredeterminadas: jest.fn()
  },

  // Mocks para materia prima
  materiaPrima: {
    listar: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    obtener: jest.fn(),
    eliminar: jest.fn(),
    stockBajo: jest.fn()
  },

  // Mocks para sistema de archivos
  fs: {
    leer: jest.fn(),
    guardar: jest.fn()
  }
};

// Asignar el mock a window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true
});

// Mock para IntersectionObserver (usado en componentes lazy loading)
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock para ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock para matchMedia
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
    dispatchEvent: jest.fn()
  }))
});

// Mock para getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    zIndex: '0'
  })
});

// Helper para limpiar mocks entre tests
beforeEach(() => {
  jest.clearAllMocks();
});