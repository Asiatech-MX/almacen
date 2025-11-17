import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useToast } from '@/hooks/use-toast'

// Crear cliente de Query con configuración optimizada
const createQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Tiempo en milisegundos que los datos se consideran frescos
        staleTime: 5 * 60 * 1000, // 5 minutos

        // Tiempo en milisegundos que los datos permanecen en cache (garbage collection time)
        gcTime: 10 * 60 * 1000, // 10 minutos (renombrado de cacheTime en v5)

        // Número de reintentos automáticos en caso de error
        retry: (failureCount, error: any) => {
          // No reintentar para errores 4xx (cliente)
          if (error?.status >= 400 && error?.status < 500) {
            return false
          }

          // Reintentar hasta 3 veces para errores de red o 5xx
          return failureCount < 3
        },

        // Delay exponencial entre reintentos
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

        // Refrescar datos cuando la ventana gana foco
        refetchOnWindowFocus: false, // Desactivado para evitar llamadas innecesarias

        // Refrescar datos cuando se reconecta
        refetchOnReconnect: true,

        // No refrescar automáticamente al montar el componente
        refetchOnMount: false,
      },
      mutations: {
        // Reintentar mutations 1 vez por defecto
        retry: 1,

        // No hacer retry para errores de validación (400)
        retryDelay: 1000,
      },
    },
  })
}

let queryClient: QueryClient | null = null

export const getQueryClient = () => {
  if (!queryClient) {
    queryClient = createQueryClient()
  }
  return queryClient
}

interface QueryProviderProps {
  children: React.ReactNode
  client?: QueryClient
}

export const QueryProvider: React.FC<QueryProviderProps> = ({
  children,
  client: providedClient
}) => {
  const client = providedClient || getQueryClient()

  return (
    <QueryClientProvider client={client}>
      {children}

      {/* React Query DevTools - solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonProps={{
            style: {
              zIndex: 9999,
            },
          }}
        />
      )}
    </QueryClientProvider>
  )
}

// Hook para limpiar el cliente de query (útil para testing o logout)
export const useQueryClientReset = () => {
  const { toast } = useToast()

  const resetQueries = () => {
    const client = getQueryClient()
    client.clear()
    client.resetQueries({}) // Nueva firma de objeto en v5
    toast({
      title: "Cache limpiado",
      description: "Se ha limpiado el cache de React Query exitosamente."
    })
  }

  return { resetQueries }
}

// Componente de error boundary para React Query
export const QueryErrorBoundary: React.FC<{
  children: React.ReactNode
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>
}> = ({ children, fallback: FallbackComponent }) => {
  return (
    <React.Suspense fallback={<div>Cargando...</div>}>
      {children}
    </React.Suspense>
  )
}

export default QueryProvider