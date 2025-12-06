import { useMemo, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Categoria, Presentacion, CategoriaArbol } from '../../../../packages/shared-types/src/referenceData';
import { useReferenceDataQuery } from './useReferenceDataQuery';

// Tipos para las opciones del select
export interface SelectOption {
  value: string | number;
  label: string;
  data?: Categoria | Presentacion | null;
  isDisabled?: boolean;
  isLoading?: boolean;
  isUpdating?: boolean;
}

export interface UseSelectValueResolutionProps {
  currentValue: string | number | null | undefined;
  type: 'categoria' | 'presentacion';
  idInstitucion: number;
  includeInactive?: boolean;
}

export interface UseSelectValueResolutionReturn {
  resolvedValue: SelectOption | null;
  options: SelectOption[];
  isLoading: boolean;
  isFetching: boolean;
  isPending: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getValueForForm: () => string | number | null;
}

/**
 * Hook personalizado para manejar la persistencia de selección en DynamicSelect
 * durante actualizaciones de datos con TanStack Query.
 *
 * Características principales:
 * - Mantiene la selección visible durante refetches
 * - Distingue entre loading inicial (isPending) y actualizaciones (isFetching)
 * - Maneja optimizadamente la resolución de valores temporales
 * - Proporciona feedback visual del estado de actualización
 * - Previene race conditions en actualizaciones concurrentes
 */
export const useSelectValueResolution = ({
  currentValue,
  type,
  idInstitucion,
  includeInactive = true
}: UseSelectValueResolutionProps): UseSelectValueResolutionReturn => {
  const queryClient = useQueryClient();
  const previousValueRef = useRef(currentValue);
  const pendingValueRef = useRef(currentValue);

  // Obtener datos de referencia usando TanStack Query
  const {
    categorias,
    categoriasArbol,
    presentaciones,
    isLoading: isPending,
    isFetching,
    error,
    refetch
  } = useReferenceDataQuery(idInstitucion);

  // Función para obtener el label de visualización
  const getDisplayLabel = useCallback((item: Categoria | Presentacion, itemType: 'categoria' | 'presentacion'): string => {
    if (itemType === 'categoria') {
      const categoria = item as Categoria;
      return categoria.nombre || `Categoría ${categoria.id}`;
    } else {
      const presentacion = item as Presentacion;
      let label = presentacion.nombre || `Presentación ${presentacion.id}`;
      if (presentacion.abreviatura) {
        label += ` (${presentacion.abreviatura})`;
      }
      return label;
    }
  }, []);

  // Seleccionar los datos apropiados según el tipo
  const referenceData = useMemo(() => {
    if (type === 'categoria') {
      return {
        items: categorias || [],
        arbol: categoriasArbol || [],
        loading: isPending,
        error
      };
    } else {
      return {
        items: presentaciones || [],
        arbol: null,
        loading: isPending,
        error
      };
    }
  }, [categorias, categoriasArbol, presentaciones, isPending, error, type]);

  // Construir opciones para el select con optimización
  const options = useMemo((): SelectOption[] => {
    if (!referenceData.items || referenceData.items.length === 0) {
      return [];
    }

    return referenceData.items.map(item => ({
      value: item.id.toString(),
      label: getDisplayLabel(item, type),
      data: item,
      isDisabled: !item.activo,
      isLoading: false,
      isUpdating: false
    }));
  }, [referenceData.items.length, type, getDisplayLabel]);

  // Función para crear una opción temporal durante actualizaciones
  const createTemporaryOption = useCallback((value: string | number): SelectOption => {
    const valueStr = value.toString();

    // Buscar en caché si tenemos información previa
    const cachedData = queryClient.getQueryData([
      'referenceData',
      idInstitucion,
      includeInactive ? 'active' : 'all',
      type === 'categoria' ? 'categoriasList' : 'presentacionesList'
    ]) as Categoria[] | Presentacion[] | undefined;

    const cachedItem = cachedData?.find(item => item.id.toString() === valueStr);

    if (cachedItem) {
      return {
        value: valueStr,
        label: getDisplayLabel(cachedItem, type),
        data: cachedItem,
        isDisabled: !cachedItem.activo,
        isLoading: false,
        isUpdating: isFetching
      };
    }

    // Si no hay datos en caché, crear opción básica con indicador de carga
    return {
      value: valueStr,
      label: `${valueStr} (actualizando...)`,
      data: null,
      isLoading: false,
      isUpdating: true
    };
  }, [queryClient, idInstitucion, includeInactive, type, isFetching]);

  // Resolver el valor actual manteniendo persistencia
  const resolvedValue = useMemo((): SelectOption | null => {
    if (!currentValue || currentValue === 0 || currentValue === '0') {
      return null;
    }

    const valueStr = currentValue.toString();

    // Si estamos cargando datos inicialmente, crear opción temporal
    if (isPending && referenceData.items.length === 0) {
      return createTemporaryOption(currentValue);
    }

    // Buscar en opciones actuales
    const currentOption = options.find(option =>
      option.value === valueStr || option.value.toString() === valueStr
    );

    if (currentOption) {
      // Actualizar indicador de actualización si estamos haciendo fetch
      return {
        ...currentOption,
        isUpdating: isFetching && currentOption.value === valueStr
      };
    }

    // Si no se encuentra en opciones actuales pero hay datos, buscar en caché
    if (referenceData.items.length > 0) {
      return createTemporaryOption(currentValue);
    }

    // Último recurso: mantener el valor anterior si está disponible
    if (previousValueRef.current === currentValue) {
      return createTemporaryOption(currentValue);
    }

    return null;
  }, [currentValue, options, isPending, isFetching, referenceData.items.length, createTemporaryOption]);

  // Actualizar referencia de valor anterior
  useMemo(() => {
    if (currentValue) {
      previousValueRef.current = currentValue;
    }
  }, [currentValue]);

  // Función para obtener el valor para el formulario
  const getValueForForm = useCallback((): string | number | null => {
    if (!currentValue || currentValue === 0 || currentValue === '0') {
      return null;
    }

    // Si tenemos datos resueltos, devolver el valor numérico
    if (resolvedValue?.data) {
      return type === 'categoria'
        ? (resolvedValue.data as Categoria).id
        : (resolvedValue.data as Presentacion).id;
    }

    // Si no hay datos resueltos pero hay un valor, devolverlo como está
    return currentValue;
  }, [currentValue, resolvedValue, type]);

  // Función de refetch con manejo optimizado
  const optimizedRefetch = useCallback(async (): Promise<void> => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error refetching reference data:', error);
    }
  }, [refetch]);

  return {
    resolvedValue,
    options,
    isLoading: isPending,
    isFetching,
    isPending,
    error: error || referenceData.error,
    refetch: optimizedRefetch,
    getValueForForm
  };
};

/**
 * Hook utilitario para manejar múltiples selects con diferentes tipos
 */
export const useMultipleSelectValueResolution = (
  configs: Array<{
    currentValue: string | number | null | undefined;
    type: 'categoria' | 'presentacion';
    idInstitucion: number;
    includeInactive?: boolean;
  }>
) => {
  const results = configs.map(config =>
    useSelectValueResolution(config)
  );

  return {
    results,
    isAnyLoading: results.some(r => r.isPending),
    isAnyFetching: results.some(r => r.isFetching),
    refetchAll: () => Promise.all(results.map(r => r.refetch())),
    getValuesForForm: () => results.map(r => r.getValueForForm())
  };
};

export default useSelectValueResolution;