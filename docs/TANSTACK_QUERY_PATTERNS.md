# Patrones TanStack Query - Sistema de Almacén

Documentación técnica de los nuevos patrones implementados con TanStack Query para la gestión de datos de referencia y estado del servidor.

---

## Overview

Esta documentación describe los patrones y hooks implementados para migrar el sistema de gestión de datos a TanStack Query, resolviendo problemas de race conditions y persistencia de datos.

---

## Hooks Principales

### 1. useReferenceDataQuery

Hook principal que centraliza todas las queries de datos de referencia (categorías y presentaciones).

```typescript
// src/hooks/useReferenceDataQuery.ts

export interface UseReferenceDataQueryResult {
  // Datos de referencia
  categorias: Categoria[];
  categoriasArbol: CategoriaArbol[];
  presentaciones: Presentacion[];

  // Estados de carga
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;

  // Funciones de control
  refetch: () => void;
}

export function useReferenceDataQuery(idInstitucion: number): UseReferenceDataQueryResult {
  const queryClient = useQueryClient();

  // Query para categorías planas
  const {
    data: categorias = [],
    isLoading: isLoadingCategorias,
    isFetching: isFetchingCategorias,
    error: categoriasError,
  } = useQuery({
    queryKey: referenceDataKeys.categoriasList(idInstitucion),
    queryFn: () => fetchCategorias(idInstitucion),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000,   // 10 minutos
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    structuralSharing: true,
  });

  // Query para categorías en árbol
  const {
    data: categoriasArbol = [],
    isLoading: isLoadingCategoriasArbol,
    isFetching: isFetchingCategoriasArbol,
    error: categoriasArbolError,
  } = useQuery({
    queryKey: referenceDataKeys.categoriasArbol(idInstitucion),
    queryFn: () => fetchCategoriasArbol(idInstitucion),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    structuralSharing: true,
  });

  // Query para presentaciones
  const {
    data: presentaciones = [],
    isLoading: isLoadingPresentaciones,
    isFetching: isFetchingPresentaciones,
    error: presentacionesError,
  } = useQuery({
    queryKey: referenceDataKeys.presentacionesList(idInstitucion),
    queryFn: () => fetchPresentaciones(idInstitucion),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    structuralSharing: true,
  });

  // Función de refetch combinada
  const refetch = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: referenceDataKeys.all
    });
  }, [queryClient]);

  // Combinar estados
  const isLoading = isLoadingCategorias || isLoadingCategoriasArbol || isLoadingPresentaciones;
  const isFetching = isFetchingCategorias || isFetchingCategoriasArbol || isFetchingPresentaciones;
  const error = categoriasError || categoriasArbolError || presentacionesError;

  return {
    categorias,
    categoriasArbol,
    presentaciones,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}
```

#### Query Keys Structure

```typescript
export const referenceDataKeys = {
  all: ['referenceData'] as const,
  categoriasList: (idInstitucion: number, includeInactive = false) =>
    [...referenceDataKeys.all, 'categorias', idInstitucion, { includeInactive }] as const,
  categoriasArbol: (idInstitucion: number, includeInactive = false) =>
    [...referenceDataKeys.all, 'categorias', 'arbol', idInstitucion, { includeInactive }] as const,
  presentacionesList: (idInstitucion: number, includeInactive = false) =>
    [...referenceDataKeys.all, 'presentaciones', idInstitucion, { includeInactive }] as const,
};
```

### 2. useSelectValueResolution

Hook especializado para resolver y persistir valores en selects durante actualizaciones de datos.

```typescript
// src/hooks/useSelectValueResolution.ts

export interface SelectOption {
  value: string | number;
  label: string;
  isNew?: boolean;
  isPending?: boolean;
}

export interface UseSelectValueResolutionOptions {
  currentValue: string | number | null | undefined;
  type: 'categoria' | 'presentacion';
  idInstitucion: number;
}

export interface UseSelectValueResolutionResult {
  resolvedValue: SelectOption | null;
  isFetching: boolean;
  isPending: boolean;
  error: Error | null;
}

export function useSelectValueResolution({
  currentValue,
  type,
  idInstitucion,
}: UseSelectValueResolutionOptions): UseSelectValueResolutionResult {
  const queryClient = useQueryClient();

  // Obtener datos de referencia
  const { categorias, presentaciones, isLoading, isFetching, error } = useReferenceDataQuery(idInstitucion);

  // Query para resolución individual
  const {
    data: resolvedValue,
    isFetching: isFetchingValue,
    error: resolutionError,
  } = useQuery({
    queryKey: ['valueResolution', type, currentValue, idInstitucion],
    queryFn: () => resolveSelectValue(currentValue, type, { categorias, presentaciones }),
    enabled: currentValue != null,
    staleTime: 1000, // Cache corto para resolución
    gcTime: 30 * 1000,
    structuralSharing: false, // No sharing para evitar referencias stale
  });

  // Crear valor temporal si está pendiente
  const createTemporaryValue = useCallback((
    value: string | number,
    type: 'categoria' | 'presentacion'
  ): SelectOption => ({
    value,
    label: `Cargando ${type}...`,
    isNew: false,
    isPending: true,
  }), []);

  return {
    resolvedValue: currentValue != null
      ? resolvedValue || createTemporaryValue(currentValue, type)
      : null,
    isFetching: isFetching || isFetchingValue,
    isPending: isLoading && currentValue != null,
    error: error || resolutionError,
  };
}
```

#### Función de Resolución

```typescript
async function resolveSelectValue(
  value: string | number,
  type: 'categoria' | 'presentacion',
  referenceData: { categorias: Categoria[]; presentaciones: Presentacion[] }
): Promise<SelectOption | null> {
  const { categorias, presentaciones } = referenceData;

  const sourceData = type === 'categoria' ? categorias : presentaciones;

  const item = sourceData.find(item => item.id.toString() === value.toString());

  if (!item) {
    // Si no se encuentra el item, podría ser uno nuevo o eliminado
    return {
      value,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)} no encontrado`,
      isNew: false,
      isPending: false,
    };
  }

  return {
    value,
    label: item.nombre,
    isNew: false,
    isPending: false,
  };
}
```

---

## Mutations

### 1. Categorías

```typescript
// src/hooks/useReferenceDataQuery.ts (continuación)

export function useEditarCategoriaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cambios }: { id: number; cambios: Partial<Categoria> }) => {
      return await window.electronAPI.materiaPrima.actualizarCategoria(id, cambios);
    },
    onMutate: async ({ id, cambios }) => {
      // Cancelar queries salientes
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.categoriasList()
      });

      // Snapshot del estado anterior
      const previousCategorias = queryClient.getQueryData(
        referenceDataKeys.categoriasList()
      );

      // Actualización optimista
      queryClient.setQueryData(
        referenceDataKeys.categoriasList(),
        (old: Categoria[] = []) =>
          old.map(cat => cat.id === id ? { ...cat, ...cambios } : cat)
      );

      // Retornar contexto para rollback
      return { previousCategorias };
    },
    onError: (error, variables, context) => {
      // Rollback en caso de error
      if (context?.previousCategorias) {
        queryClient.setQueryData(
          referenceDataKeys.categoriasList(),
          context.previousCategorias
        );
      }
      toast.error('Error al actualizar categoría');
    },
    onSuccess: () => {
      toast.success('Categoría actualizada correctamente');
    },
    onSettled: () => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasList()
      });
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasArbol()
      });
    },
  });
}

export function useCrearCategoriaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nombre }: { nombre: string }) => {
      return await window.electronAPI.materiaPrima.crearCategoria({ nombre });
    },
    onMutate: async ({ nombre }) => {
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.categoriasList()
      });

      const previousCategorias = queryClient.getQueryData(
        referenceDataKeys.categoriasList()
      );

      // Actualización optimista con ID temporal
      const tempId = Date.now();
      queryClient.setQueryData(
        referenceDataKeys.categoriasList(),
        (old: Categoria[] = []) => [...old, { id: tempId, nombre }]
      );

      return { previousCategorias, tempId };
    },
    onError: (error, variables, context) => {
      if (context?.previousCategorias) {
        queryClient.setQueryData(
          referenceDataKeys.categoriasList(),
          context.previousCategorias
        );
      }
      toast.error('Error al crear categoría');
    },
    onSuccess: (data, variables, context) => {
      toast.success('Categoría creada correctamente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasList()
      });
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasArbol()
      });
    },
  });
}

export function useEliminarCategoriaMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: number }) => {
      return await window.electronAPI.materiaPrima.eliminarCategoria(id);
    },
    onMutate: async ({ id }) => {
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.categoriasList()
      });

      const previousCategorias = queryClient.getQueryData(
        referenceDataKeys.categoriasList()
      );

      // Remoción optimista
      queryClient.setQueryData(
        referenceDataKeys.categoriasList(),
        (old: Categoria[] = []) => old.filter(cat => cat.id !== id)
      );

      return { previousCategorias };
    },
    onError: (error, variables, context) => {
      if (context?.previousCategorias) {
        queryClient.setQueryData(
          referenceDataKeys.categoriasList(),
          context.previousCategorias
        );
      }
      toast.error('Error al eliminar categoría');
    },
    onSuccess: () => {
      toast.success('Categoría eliminada correctamente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasList()
      });
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.categoriasArbol()
      });
    },
  });
}
```

### 2. Presentaciones

```typescript
// Mutaciones para presentaciones (similar estructura)

export function useEditarPresentacionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, cambios }: { id: number; cambios: Partial<Presentacion> }) => {
      return await window.electronAPI.materiaPrima.actualizarPresentacion(id, cambios);
    },
    onMutate: async ({ id, cambios }) => {
      await queryClient.cancelQueries({
        queryKey: referenceDataKeys.presentacionesList()
      });

      const previousPresentaciones = queryClient.getQueryData(
        referenceDataKeys.presentacionesList()
      );

      queryClient.setQueryData(
        referenceDataKeys.presentacionesList(),
        (old: Presentacion[] = []) =>
          old.map(pres => pres.id === id ? { ...pres, ...cambios } : pres)
      );

      return { previousPresentaciones };
    },
    onError: (error, variables, context) => {
      if (context?.previousPresentaciones) {
        queryClient.setQueryData(
          referenceDataKeys.presentacionesList(),
          context.previousPresentaciones
        );
      }
      toast.error('Error al actualizar presentación');
    },
    onSuccess: () => {
      toast.success('Presentación actualizada correctamente');
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: referenceDataKeys.presentacionesList()
      });
    },
  });
}
```

---

## Componentes

### 1. DynamicSelect

Componente principal que utiliza los nuevos hooks para gestionar selects con persistencia de selección.

```typescript
// src/components/ui/DynamicSelect.tsx

export interface DynamicSelectProps {
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  type: 'categoria' | 'presentacion';
  idInstitucion: number;
  placeholder?: string;
  disabled?: boolean;
  onCreateNew?: (nombre: string) => Promise<void>;
  onEditInline?: (id: number, cambios: any) => Promise<void>;
  allowCreate?: boolean;
  allowEdit?: boolean;
}

const DynamicSelect: React.FC<DynamicSelectProps> = ({
  value,
  onChange,
  type,
  idInstitucion,
  placeholder,
  disabled,
  onCreateNew,
  onEditInline,
  allowCreate = true,
  allowEdit = true,
}) => {
  // Hook de resolución persistente
  const {
    resolvedValue,
    isFetching,
    isPending,
    error
  } = useSelectValueResolution({
    currentValue: value,
    type,
    idInstitucion,
  });

  // Datos de referencia
  const { [type + 's']: opciones, isLoading } = useReferenceDataQuery(idInstitucion);

  // Mutaciones
  const crearMutation = type === 'categoria'
    ? useCrearCategoriaMutation()
    : useCrearPresentacionMutation();

  const editarMutation = type === 'categoria'
    ? useEditarCategoriaMutation()
    : useEditarPresentacionMutation();

  // Handlers
  const handleCreateNew = useCallback(async (nombre: string) => {
    try {
      await crearMutation.mutateAsync({ nombre });
      if (onCreateNew) {
        await onCreateNew(nombre);
      }
    } catch (error) {
      console.error('Error creating new:', error);
    }
  }, [crearMutation, onCreateNew]);

  const handleEditInline = useCallback(async (id: number, cambios: any) => {
    try {
      await editarMutation.mutateAsync({ id, cambios });
      if (onEditInline) {
        await onEditInline(id, cambios);
      }
    } catch (error) {
      console.error('Error editing inline:', error);
    }
  }, [editarMutation, onEditInline]);

  // Estado de carga
  if (isLoading) {
    return <SelectSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <SelectError
        message={`Error al cargar ${type}s`}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // Renderizado principal
  return (
    <div className="relative">
      {/* Indicador de actualización en background */}
      {isFetching && (
        <div className="absolute right-10 top-1/2 transform -translate-y-1/2 z-10">
          <LoadingSpinner size="sm" />
        </div>
      )}

      <Select
        value={resolvedValue}
        onChange={onChange}
        options={opciones}
        placeholder={placeholder}
        disabled={disabled}
        allowCreate={allowCreate}
        allowEdit={allowEdit}
        onCreateNew={handleCreateNew}
        onEditInline={handleEditInline}
        isLoading={isPending}
      />
    </div>
  );
};

// Componente memoizado para optimización
export const MemoizedDynamicSelect = React.memo(DynamicSelect, (prevProps, nextProps) => {
  // Comparación personalizada para evitar re-renders innecesarios
  return (
    prevProps.value === nextProps.value &&
    prevProps.type === nextProps.type &&
    prevProps.idInstitucion === nextProps.idInstitucion &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.allowCreate === nextProps.allowCreate &&
    prevProps.allowEdit === nextProps.allowEdit
  );
});
```

### 2. Loading States

```typescript
// Componentes de carga diferenciados

const SelectSkeleton = () => (
  <div className="animate-pulse">
    <div className="h-10 bg-gray-200 rounded-md w-full" />
  </div>
);

const LoadingSpinner = ({ size = 'sm' }: { size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-gray-300 border-t-blue-600`} />
  );
};

const SelectError = ({
  message,
  onRetry
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
    <p className="text-sm text-red-600">{message}</p>
    <button
      onClick={onRetry}
      className="mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200"
    >
      Reintentar
    </button>
  </div>
);
```

---

## Integración con Forms

### React Hook Form Integration

```typescript
// Ejemplo de integración completa

const MateriaPrimaForm = ({ initialData }: { initialData?: MateriaPrima }) => {
  const { control, watch, setValue } = useForm<MateriaPrimaFormData>({
    defaultValues: initialData,
  });

  const idInstitucion = 1; // Obtener del contexto o estado global

  // Watch para resolución persistente
  const categoriaId = watch('categoriaId');
  const presentacionId = watch('presentacionId');

  // Resolución con persistencia
  const {
    resolvedValue: categoriaResuelta,
    isFetching: isFetchingCategoria
  } = useSelectValueResolution({
    currentValue: categoriaId,
    type: 'categoria',
    idInstitucion,
  });

  const {
    resolvedValue: presentacionResuelta,
    isFetching: isFetchingPresentacion
  } = useSelectValueResolution({
    currentValue: presentacionId,
    type: 'presentacion',
    idInstitucion,
  });

  return (
    <form className="space-y-6">
      {/* Campo de categoría con persistencia */}
      <Controller
        name="categoriaId"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoría
            </label>
            <DynamicSelect
              {...field}
              type="categoria"
              idInstitucion={idInstitucion}
              placeholder="Seleccionar categoría"
              allowCreate={true}
              allowEdit={true}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error.message}</p>
            )}
          </div>
        )}
      />

      {/* Campo de presentación con persistencia */}
      <Controller
        name="presentacionId"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Presentación
            </label>
            <DynamicSelect
              {...field}
              type="presentacion"
              idInstitucion={idInstitucion}
              placeholder="Seleccionar presentación"
              allowCreate={true}
              allowEdit={true}
            />
            {error && (
              <p className="mt-1 text-sm text-red-600">{error.message}</p>
            )}
          </div>
        )}
      />

      {/* Indicadores de carga de resolución */}
      {(isFetchingCategoria || isFetchingPresentacion) && (
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <LoadingSpinner size="sm" />
          <span>Actualizando valores...</span>
        </div>
      )}
    </form>
  );
};
```

---

## Performance Optimizations

### 1. Structural Sharing

```typescript
// Configuración de structural sharing para datos complejos
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      structuralSharing: true, // Habilitado por defecto
      select: (data) => {
        // Función select para memoización
        return memoizedTransform(data);
      },
    },
  },
});
```

### 2. Memoización

```typescript
// Memoización de funciones de transformación
const transformCategorias = useCallback((categorias: Categoria[]) => {
  return categorias.map(cat => ({
    value: cat.id,
    label: cat.nombre,
  }));
}, []);

const memoizedTransform = useMemo(() => transformCategorias, [transformCategorias]);
```

### 3. Select Functions

```typescript
// Select functions personalizadas para optimizar re-renders
const { data: categorias } = useQuery({
  queryKey: ['categorias', idInstitucion],
  queryFn: fetchCategorias,
  select: useCallback((data: Categoria[]) =>
    data.filter(cat => cat.activo),
    []
  ),
});
```

---

## Testing Patterns

### 1. Unit Tests

```typescript
// useSelectValueResolution.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSelectValueResolution } from '../useSelectValueResolution';

const createWrapper = (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

describe('useSelectValueResolution', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  it('debe resolver valor existente correctamente', async () => {
    const { result } = renderHook(
      () => useSelectValueResolution({
        currentValue: '123',
        type: 'categoria',
        idInstitucion: 1,
      }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.resolvedValue?.value).toBe('123');
      expect(result.current.resolvedValue?.label).toBe('Test Category');
    });

    expect(result.current.error).toBeNull();
  });

  it('debe manejar valor no encontrado', async () => {
    const { result } = renderHook(
      () => useSelectValueResolution({
        currentValue: '999',
        type: 'categoria',
        idInstitucion: 1,
      }),
      { wrapper: createWrapper(queryClient) }
    );

    await waitFor(() => {
      expect(result.current.resolvedValue?.label).toContain('no encontrado');
    });
  });

  it('debe crear valor temporal durante carga', () => {
    const { result } = renderHook(
      () => useSelectValueResolution({
        currentValue: '123',
        type: 'categoria',
        idInstitucion: 1,
      }),
      { wrapper: createWrapper(queryClient) }
    );

    // Durante carga inicial
    expect(result.current.isPending).toBe(true);
    expect(result.current.resolvedValue?.isPending).toBe(true);
    expect(result.current.resolvedValue?.label).toContain('Cargando');
  });
});
```

### 2. Integration Tests

```typescript
// DynamicSelect.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicSelect } from '../DynamicSelect';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockOnChange = jest.fn();

describe('DynamicSelect Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockOnChange.mockClear();
  });

  it('debe persistir selección después de edición inline', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DynamicSelect
          value="123"
          onChange={mockOnChange}
          type="categoria"
          idInstitucion={1}
        />
      </QueryClientProvider>
    );

    // Esperar carga inicial
    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });

    // Simular edición inline
    fireEvent.click(screen.getByRole('button', { name: /editar/i }));

    const editInput = screen.getByRole('textbox');
    fireEvent.change(editInput, { target: { value: 'Updated Category' } });

    fireEvent.click(screen.getByRole('button', { name: /guardar/i }));

    // Validar que el valor se mantiene
    await waitFor(() => {
      expect(screen.getByText('Updated Category')).toBeInTheDocument();
    });

    // El valor del select no debería cambiar
    expect(mockOnChange).not.toHaveBeenCalled();
  });
});
```

---

## DevTools Integration

```typescript
// Configuración de DevTools para desarrollo
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Rutas de la aplicación */}
        </Routes>
      </Router>

      {/* TanStack Query DevTools - solo en desarrollo */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools
          initialIsOpen={false}
          position="bottom-right"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  );
};
```

---

## Error Handling Patterns

### 1. Global Error Boundary

```typescript
// Error boundary para errores de TanStack Query
class QueryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('TanStack Query Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error en la carga de datos
          </h2>
          <p className="text-red-600 mb-4">
            Ha ocurrido un error al cargar los datos de referencia.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Recargar página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. Retry Strategies

```typescript
// Configuración de retry con backoff exponencial
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // No reintentar para errores 404 o 401
        if (error instanceof Error) {
          if (error.message.includes('404') || error.message.includes('401')) {
            return false;
          }
        }

        // Máximo 3 reintentos
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => {
        // Backoff exponencial: 1s, 2s, 4s, máximo 30s
        return Math.min(1000 * 2 ** attemptIndex, 30000);
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Reintentar solo para errores de red
        if (error instanceof Error && error.message.includes('network')) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: 1000,
    },
  },
});
```

---

## Monitoring y Analytics

### 1. Query Health Monitoring

```typescript
// Monitor de salud de queries
const QueryHealthMonitor = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const interval = setInterval(() => {
      const cache = queryClient.getQueryCache();
      const queries = cache.getAll();

      // Métricas de performance
      const metrics = {
        totalQueries: queries.length,
        staleQueries: queries.filter(q => q.isStale()).length,
        fetchingQueries: queries.filter(q => q.state.fetchStatus === 'fetching').length,
        errorQueries: queries.filter(q => q.state.status === 'error').length,
      };

      // Log para debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('TanStack Query Metrics:', metrics);
      }

      // Enviar a analytics si es necesario
      if (metrics.errorQueries > 0) {
        analytics.track('query_errors', metrics);
      }
    }, 30000); // Cada 30 segundos

    return () => clearInterval(interval);
  }, [queryClient]);

  return null;
};
```

---

## Conclusión

Estos patrones y hooks proporcionan una base sólida para la gestión de datos de referencia con TanStack Query, resolviendo los problemas originales de race conditions y persistencia de selección mientras que también mejoran significativamente el performance y la experiencia de desarrollo.

Los patrones establecidos pueden ser extendidos a otros dominios de la aplicación para mantener consistencia y aprovechar las ventajas de TanStack Query en todo el sistema.

*Última actualización: 2025-12-03*