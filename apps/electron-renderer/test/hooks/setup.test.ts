import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactElement } from 'react';

// Mock de window.electronAPI para pruebas
const mockElectronAPI = {
  categoria: {
    listar: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    obtener: jest.fn(),
  },
  presentacion: {
    listar: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    obtener: jest.fn(),
  },
  materiaPrima: {
    listar: jest.fn(),
    crear: jest.fn(),
    actualizar: jest.fn(),
    eliminar: jest.fn(),
    obtener: jest.fn(),
    stockBajo: jest.fn(),
  },
  fs: {
    leer: jest.fn(),
    guardar: jest.fn(),
  },
};

Object.defineProperty(window, 'electronAPI', {
  value: mockElectronAPI,
  writable: true,
});

// Configuración para testing de TanStack Query
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

// Wrapper de prueba para React Query
export const createTestWrapper = (queryClient?: QueryClient) => {
  const testQueryClient = queryClient || createTestQueryClient();

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={testQueryClient}>
      {children}
    </QueryClientProvider>
  );
};

// Mock de datos de prueba
export const mockCategoria = {
  id: '1',
  nombre: 'Construcción',
  descripcion: 'Materiales de construcción',
  categoria_padre_id: null,
  nivel: 1,
  ruta_completa: 'Construcción',
  icono: '🔨',
  color: '#FF5722',
  orden: 1,
  activo: true,
  es_predeterminado: false,
  id_institucion: 1,
  creado_en: '2024-01-01T00:00:00Z',
  actualizado_en: '2024-01-01T00:00:00Z'
};

export const mockPresentacion = {
  id: '1',
  nombre: 'Kilogramo',
  descripcion: 'Unidad de peso',
  abreviatura: 'kg',
  unidad_base: 'gramo',
  factor_conversion: 1000,
  activo: true,
  es_predeterminado: false,
  id_institucion: 1,
  creado_en: '2024-01-01T00:00:00Z',
  actualizado_en: '2024-01-01T00:00:00Z'
};

export const mockCategorias = [
  mockCategoria,
  {
    ...mockCategoria,
    id: '2',
    nombre: 'Electricidad',
    descripcion: 'Materiales eléctricos',
    icono: '⚡',
    color: '#FFC107',
    orden: 2,
  },
  {
    ...mockCategoria,
    id: '3',
    nombre: 'Fontanería',
    descripcion: 'Materiales de fontanería',
    icono: '🚰',
    color: '#2196F3',
    orden: 3,
    activo: false, // Inactiva para pruebas
  }
];

export const mockPresentaciones = [
  mockPresentacion,
  {
    ...mockPresentacion,
    id: '2',
    nombre: 'Litro',
    descripcion: 'Unidad de volumen',
    abreviatura: 'L',
    unidad_base: 'mililitro',
    factor_conversion: 1000,
  },
  {
    ...mockPresentacion,
    id: '3',
    nombre: 'Unidad',
    descripcion: 'Unidad individual',
    abreviatura: 'ud',
    unidad_base: null,
    factor_conversion: null,
    activo: false, // Inactiva para pruebas
  }
];

// Limpiar todos los mocks antes de cada prueba
beforeEach(() => {
  jest.clearAllMocks();
  // Resetear el estado de los mocks
  Object.keys(mockElectronAPI.categoria).forEach(key => {
    mockElectronAPI.categoria[key].mockReset();
  });
  Object.keys(mockElectronAPI.presentacion).forEach(key => {
    mockElectronAPI.presentacion[key].mockReset();
  });
  Object.keys(mockElectronAPI.materiaPrima).forEach(key => {
    mockElectronAPI.materiaPrima[key].mockReset();
  });
  Object.keys(mockElectronAPI.fs).forEach(key => {
    mockElectronAPI.fs[key].mockReset();
  });
});

// Exportar mockElectronAPI para uso en pruebas
export { mockElectronAPI };