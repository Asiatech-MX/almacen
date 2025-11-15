import { useState, useEffect } from 'react'

/**
 * Hook para debounce de valores
 * @param value Valor a hacer debounce
 * @param delay Tiempo de espera en milisegundos
 * @returns Valor con debounce aplicado
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Hook para debounce con función de callback
 * @param callback Función a ejecutar
 * @param delay Tiempo de espera en milisegundos
 * @param deps Dependencias del efecto
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const [debouncedCallback, setDebouncedCallback] = useState<T>(callback)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedCallback(() => callback)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [callback, delay, ...deps])

  return debouncedCallback
}

/**
 * Hook para búsqueda con debounce optimizado
 * @param searchFunction Función de búsqueda
 * @param delay Tiempo de espera en milisegundos
 */
export function useDebouncedSearch<T>(
  searchFunction: (query: string) => Promise<T>,
  delay: number = 300
) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debouncedQuery = useDebounce(query, delay)

  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setResults(null)
      setError(null)
      setLoading(false)
      return
    }

    const executeSearch = async () => {
      try {
        setLoading(true)
        setError(null)
        const searchResults = await searchFunction(debouncedQuery)
        setResults(searchResults)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error en la búsqueda'
        setError(errorMsg)
        setResults(null)
      } finally {
        setLoading(false)
      }
    }

    executeSearch()
  }, [debouncedQuery, searchFunction])

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch: () => {
      setQuery('')
      setResults(null)
      setError(null)
    }
  }
}

export default useDebounce