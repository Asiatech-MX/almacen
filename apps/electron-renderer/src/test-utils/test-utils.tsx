import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// Configuración optimizada del QueryClient para tests
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Deshabilitar retries para tests más rápidos
        gcTime: 0, // Limpiar cache inmediatamente después de cada test
        staleTime: 0, // Datos siempre stale para fresh fetches
      },
      mutations: {
        retry: false,
        gcTime: 0,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Silenciar errores en tests a menos que se necesiten
    },
  })
}

// Wrapper component para proveer contexto de QueryClient
interface AllTheProvidersProps {
  children: React.ReactNode
  client?: QueryClient
}

export const AllTheProviders = ({ children, client }: AllTheProvidersProps) => {
  const queryClient = client || createTestQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'test' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  )
}

// Custom render function que incluye los providers
export const renderWithQueryClient = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'> & { client?: QueryClient }
) => {
  const { client, ...renderOptions } = options || {}

  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders client={client}>{children}</AllTheProviders>
    ),
    ...renderOptions,
  })
}

// Utilidad para esperar que los queries se estabilicen
export const waitForQueriesToStabilize = async (client: QueryClient) => {
  await new Promise(resolve => {
    const unsubscribe = client.getQueryCache().subscribe(() => {
      const hasActiveQueries = client.getQueryCache().findAll({
        fetchStatus: 'fetching',
      }).length > 0

      if (!hasActiveQueries) {
        unsubscribe()
        resolve(void 0)
      }
    })

    // Si no hay queries activos inicialmente, resolver inmediatamente
    const hasActiveQueriesInitially = client.getQueryCache().findAll({
      fetchStatus: 'fetching',
    }).length > 0

    if (!hasActiveQueriesInitially) {
      unsubscribe()
      resolve(void 0)
    }
  })
}

// Wrapper para tests con un QueryClient específico
export const withQueryClient = (client: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders client={client}>{children}</AllTheProviders>
  )
}

// Utilidad para crear mocks de respuestas IPC
export const createMockIPCResponse = <T,>(data: T): Promise<T> => {
  return Promise.resolve(data)
}

// Utilidad para crear mocks de errores IPC
export const createMockIPCError = (message: string): Promise<never> => {
  return Promise.reject(new Error(message))
}

// Tipos para testing
export interface MockElectronAPI {
  categoria: {
    listar: jest.MockedFunction<any>
    crear: jest.MockedFunction<any>
    editar: jest.MockedFunction<any>
    eliminar: jest.MockedFunction<any>
    // Agregar otros métodos según sea necesario
  }
  presentacion: {
    listar: jest.MockedFunction<any>
    crear: jest.MockedFunction<any>
    editar: jest.MockedFunction<any>
    eliminar: jest.MockedFunction<any>
    // Agregar otros métodos según sea necesario
  }
}

// Mock base para window.electronAPI
export const mockElectronAPI: MockElectronAPI = {
  categoria: {
    listar: jest.fn(),
    crear: jest.fn(),
    editar: jest.fn(),
    eliminar: jest.fn(),
  },
  presentacion: {
    listar: jest.fn(),
    crear: jest.fn(),
    editar: jest.fn(),
    eliminar: jest.fn(),
  },
}

// Setup y cleanup para mocks de ElectronAPI
export const setupElectronAPIMocks = () => {
  Object.defineProperty(window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true,
  })

  return () => {
    delete (window as any).electronAPI
  }
}

// Mock data para testing
export const mockCategoriaData = {
  id: '1',
  nombre: 'Electricidad',
  nivel: 1,
  activo: true,
  id_institucion: 1,
  fecha_creacion: '2024-01-01T00:00:00.000Z',
  fecha_actualizacion: '2024-01-01T00:00:00.000Z',
}

export const mockPresentacionData = {
  id: '1',
  nombre: 'Unidad',
  abreviatura: 'Und',
  activo: true,
  es_predeterminado: true,
  id_institucion: 1,
  fecha_creacion: '2024-01-01T00:00:00.000Z',
  fecha_actualizacion: '2024-01-01T00:00:00.000Z',
}

export const mockCategoriasData = [
  mockCategoriaData,
  {
    ...mockCategoriaData,
    id: '2',
    nombre: 'Plomería',
  },
]

export const mockPresentacionesData = [
  mockPresentacionData,
  {
    ...mockPresentacionData,
    id: '2',
    nombre: 'Caja',
    abreviatura: 'Cja',
    es_predeterminado: false,
  },
]