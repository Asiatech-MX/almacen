import { useMemo, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Categoria, Presentacion } from '../../../../packages/shared-types/src/referenceData';
import { referenceDataKeys } from './useReferenceDataQuery';
import { DynamicSelectOption } from './useDynamicSelectOptions';

export interface UseDynamicSelectValueProps {
  currentValue: string | number | null | undefined;
  type: 'categoria' | 'presentacion';
  idInstitucion: number;
  includeInactive?: boolean;
  options: DynamicSelectOption[];
  isFetching: boolean;
}

export interface UseDynamicSelectValueReturn {
  resolvedValue: DynamicSelectOption | null;
  getValueForForm: () => string | number | null;
  createTemporaryOption: (value: string | number) => DynamicSelectOption;
  isUpdating: boolean;
}

/**
 * Hook simplificado para resolución de valores en DynamicSelect.
 *
 * Características:
 * - Resolución de valores sin dependencias circulares
 * - Manejo de valores temporales durante carga
 * - Tipos seguros para conversión string/number
 * - Fallbacks robustos para estados de carga
 */
export const useDynamicSelectValue = ({
  currentValue,
  type,
  idInstitucion,
  includeInactive = true,
  options,
  isFetching
}: UseDynamicSelectValueProps): UseDynamicSelectValueReturn => {
  const queryClient = useQueryClient();
  const previousValueRef = useRef(currentValue);

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

  // Función para crear una opción temporal
  const createTemporaryOption = useCallback((value: string | number): DynamicSelectOption => {
    const valueStr = value.toString();

    // Buscar en caché si tenemos información previa
    const cacheKey = type === 'categoria'
      ? referenceDataKeys.categoriasList(idInstitucion, includeInactive)
      : referenceDataKeys.presentacionesList(idInstitucion, includeInactive);

    const cachedData = queryClient.getQueryData(cacheKey) as Categoria[] | Presentacion[] | undefined;
    const cachedItem = cachedData?.find(item => item.id.toString() === valueStr);

    if (cachedItem) {
      return {
        value: valueStr,
        label: getDisplayLabel(cachedItem),
        data: cachedItem,
        isDisabled: !cachedItem.activo
      };
    }

    // Si no hay datos en caché, crear opción básica
    return {
      value: valueStr,
      label: `${valueStr} (${isFetching ? 'actualizando...' : 'no encontrado'})`,
      data: null,
      isDisabled: false
    };
  }, [queryClient, type, idInstitucion, includeInactive, isFetching, getDisplayLabel]);

  // Resolver el valor actual
  const resolvedValue = useMemo((): DynamicSelectOption | null => {
    if (!currentValue || currentValue === 0 || currentValue === '0') {
      return null;
    }

    const valueStr = currentValue.toString();

    // Buscar en opciones actuales
    const currentOption = options.find(option =>
      option.value === valueStr || option.value.toString() === valueStr
    );

    if (currentOption) {
      return currentOption;
    }

    // Si no se encuentra, crear opción temporal
    return createTemporaryOption(currentValue);
  }, [currentValue, options, createTemporaryOption]);

  // Actualizar referencia de valor anterior (sin efecto secundario en useMemo)
  if (currentValue && currentValue !== previousValueRef.current) {
    previousValueRef.current = currentValue;
  }

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

    // Si no hay datos resueltos pero hay un valor, devolver como número si es posible
    const numValue = Number(currentValue);
    return isNaN(numValue) ? currentValue : numValue;
  }, [currentValue, resolvedValue, type]);

  // Determinar si estamos actualizando el valor actual
  const isUpdating = useMemo((): boolean => {
    if (!currentValue || !isFetching) {
      return false;
    }

    const valueStr = currentValue.toString();
    const currentOption = options.find(option =>
      option.value === valueStr || option.value.toString() === valueStr
    );

    // Si no hay opción actual pero hay un valor, estamos actualizando
    return !currentOption && !!currentValue;
  }, [currentValue, options, isFetching]);

  return {
    resolvedValue,
    getValueForForm,
    createTemporaryOption,
    isUpdating
  };
};

export default useDynamicSelectValue;