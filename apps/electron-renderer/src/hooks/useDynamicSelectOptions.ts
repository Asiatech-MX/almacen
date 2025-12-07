import { useMemo, useCallback } from 'react';
import { Categoria, Presentacion } from '../../../../packages/shared-types/src/referenceData';
import { useReferenceDataQuery } from './useReferenceDataQuery';

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
  // Usar el hook centralizado de datos de referencia para evitar fragmentación de cache
  const {
    categorias,
    presentaciones,
    isLoading: isPending,
    isFetching,
    error,
    refetch: refetchReferenceData
  } = useReferenceDataQuery(idInstitucion, { includeInactive });

  // Seleccionar los datos según el tipo
  const data = type === 'categoria' ? categorias : presentaciones;

  // Función de refetch optimizada que usa el hook centralizado
  const refetch = useCallback(async (): Promise<void> => {
    try {
      await refetchReferenceData();
    } catch (error) {
      console.error(`Error refetching ${type} data:`, error);
    }
  }, [refetchReferenceData, type]);

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

  return {
    options,
    isLoading: isPending,
    isFetching,
    isPending,
    error: error as Error | null,
    refetch,
    getOptionByValue,
    getOptionsByQuery
  };
};

export default useDynamicSelectOptions;