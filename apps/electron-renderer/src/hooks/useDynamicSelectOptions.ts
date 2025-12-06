import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Categoria, Presentacion } from '../../../../packages/shared-types/src/referenceData';
import { useReferenceDataQuery, referenceDataKeys } from './useReferenceDataQuery';

// Tipos para las opciones del select
export interface DynamicSelectOption {
  value: string;
  label: string;
  data?: Categoria | Presentacion | null;
  isDisabled?: boolean;
}

export interface UseDynamicSelectOptionsProps {
  type: 'categoria' | 'presentacion';
  idInstitucion: number;
  includeInactive?: boolean;
}

export interface UseDynamicSelectOptionsReturn {
  options: DynamicSelectOption[];
  isLoading: boolean;
  isFetching: boolean;
  isPending: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  getOptionByValue: (value: string | number) => DynamicSelectOption | null;
  getOptionsByQuery: (query: string) => DynamicSelectOption[];
}

/**
 * Hook optimizado para generar opciones para DynamicSelect.
 *
 * Características:
 * - Generación de opciones estable con useMemo
 * - Manejo de estados de carga con TanStack Query
 * - Búsqueda optimizada de opciones
 * - Tipos seguros con TypeScript
 * - Sin dependencias circulares
 */
export const useDynamicSelectOptions = ({
  type,
  idInstitucion,
  includeInactive = true
}: UseDynamicSelectOptionsProps): UseDynamicSelectOptionsReturn => {
  // Usar los hooks específicos del tipo de datos
  const categoriasQuery = useQuery({
    queryKey: referenceDataKeys.categoriasList(idInstitucion, includeInactive),
    queryFn: async () => {
      if (type !== 'categoria') return [];
      const result = await window.electronAPI.categoria.listar(idInstitucion, includeInactive);
      return Array.isArray(result) ? result : [];
    },
    enabled: type === 'categoria',
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    structuralSharing: true,
    select: (data: Categoria[]) => data.length > 0 ? [...data] : [],
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  const presentacionesQuery = useQuery({
    queryKey: referenceDataKeys.presentacionesList(idInstitucion, includeInactive),
    queryFn: async () => {
      if (type !== 'presentacion') return [];
      const result = await window.electronAPI.presentacion.listar(idInstitucion, includeInactive);
      return Array.isArray(result) ? result : [];
    },
    enabled: type === 'presentacion',
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos
    retry: (failureCount, error: any) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    structuralSharing: true,
    select: (data: Presentacion[]) => data.length > 0 ? [...data] : [],
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  });

  // Seleccionar el query activo y sus estados
  const activeQuery = type === 'categoria' ? categoriasQuery : presentacionesQuery;
  const { data, isLoading: isPending, isFetching, error, refetch } = activeQuery;

  // Función para obtener el label de visualización
  const getDisplayLabel = useCallback((item: Categoria | Presentacion): string => {
    if (type === 'categoria') {
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
  }, [type]);

  // Generar opciones con memoización estable
  const options = useMemo((): DynamicSelectOption[] => {
    if (!data || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      value: item.id.toString(),
      label: getDisplayLabel(item),
      data: item,
      isDisabled: !item.activo
    }));
  }, [data?.length, type, getDisplayLabel]); // Dependencias primitivas estables

  // Función optimizada para buscar opción por valor
  const getOptionByValue = useCallback((value: string | number): DynamicSelectOption | null => {
    const valueStr = value.toString();
    return options.find(option => option.value === valueStr) || null;
  }, [options]);

  // Función optimizada para buscar opciones por texto
  const getOptionsByQuery = useCallback((query: string): DynamicSelectOption[] => {
    if (!query.trim()) {
      return options;
    }

    const lowerQuery = query.toLowerCase();
    return options.filter(option =>
      option.label.toLowerCase().includes(lowerQuery) ||
      option.data?.id.toString().includes(lowerQuery)
    );
  }, [options]);

  // Función de refetch optimizada
  const optimizedRefetch = useCallback(async (): Promise<void> => {
    try {
      await refetch();
    } catch (error) {
      console.error(`Error refetching ${type} data:`, error);
    }
  }, [refetch, type]);

  return {
    options,
    isLoading: isPending,
    isFetching,
    isPending,
    error: error as Error | null,
    refetch: optimizedRefetch,
    getOptionByValue,
    getOptionsByQuery
  };
};

export default useDynamicSelectOptions;