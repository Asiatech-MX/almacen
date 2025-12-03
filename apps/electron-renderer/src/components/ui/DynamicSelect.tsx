import React, {
  useMemo,
  useState,
  useCallback,
  memo,
  useRef,
  useEffect
} from 'react';
import { usePerformanceMonitor } from '@/lib/performanceMonitor';
import Select, { GroupBase, components, StylesConfig } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Controller, Control, FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Edit2, Plus, ChevronRight, Loader2, AlertCircle, X, Check } from 'lucide-react';
import { Categoria, Presentacion, CategoriaUpdate, PresentacionUpdate } from '../../../../packages/shared-types/src/referenceData';
import { useReferenceData } from '@/hooks/useReferenceData';
import { useResponsiveSelect } from '@/hooks/useResponsiveSelect';
import { useInlineEditor } from '@/hooks/useInlineEditor';
import InlineEditor from '@/components/ui/InlineEditor';

interface DynamicSelectProps {
  control: Control<any>;
  name: string;
  label: string;
  type: 'categoria' | 'presentacion';
  placeholder?: string;
  creatable?: boolean;
  allowEdit?: boolean;
  allowInlineEdit?: boolean;  // Nueva propiedad para edición inline
  onEdit?: (item: Categoria | Presentacion) => void;
  onMove?: (id: string, nuevoPadreId?: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: FieldError;
  // Callbacks para edición inline
  onInlineEditStart?: (item: Categoria | Presentacion) => void;
  onInlineEditSuccess?: (item: Categoria | Presentacion) => void;
  onInlineEditError?: (item: Categoria | Presentacion, error: string) => void;
  // Key para forzar re-render cuando los datos de referencia cambian
  refreshKey?: number;
}


export const DynamicSelect: React.FC<DynamicSelectProps> = ({
  control,
  name,
  label,
  type,
  placeholder = `Seleccionar ${label}...`,
  creatable = true,
  allowEdit = false,
  allowInlineEdit = false,
  onEdit,
  onMove,
  disabled = false,
  required = false,
  className,
  error,
  onInlineEditStart,
  onInlineEditSuccess,
  onInlineEditError,
  refreshKey
}) => {
  const { measureRender, measureInteraction, measureAsync, recordMetric } = usePerformanceMonitor('DynamicSelect');

  const {
    categorias,
    presentaciones,
    loading,
    actions
  } = useReferenceData({
    idInstitucion: 1 // TODO: Obtener del contexto actual
  });

  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<Categoria | Presentacion | null>(null);
  const { isMobile, getSelectProps } = useResponsiveSelect();

  // Composite key for targeted re-renders when reference data changes
  const compositeKey = useMemo(() => {
    const dataVersion = type === 'categoria'
      ? categorias?.length || 0
      : presentaciones?.length || 0;
    const dataHash = type === 'categoria'
      ? categorias?.map(c => `${c.id}:${c.actualizado_en}`).join('|') || ''
      : presentaciones?.map(p => `${p.id}:${p.actualizado_en}`).join('|') || '';

    return `${type}-${dataVersion}-${dataHash}-${refreshKey || 0}-${loading}`;
  }, [type, categorias, presentaciones, refreshKey, loading]);

  // Monitorear rendimiento del renderizado
  useEffect(() => {
    measureRender(() => {
      // El renderizado ya se completó aquí
    }, `${type}-select-${name}`);
  }, [type, name, loading]);

  // Opciones simples para categorías
  const categoriaOptions = useMemo(() => {
    if (type === 'categoria' && categorias) {
      return categorias.map(categoria => ({
        value: categoria.id,
        label: categoria.nombre,
        data: categoria
      }));
    }
    return [];
  }, [type, categorias]);

  // Opciones para presentaciones
  const presentacionOptions = useMemo(() => {
    if (type === 'presentacion' && presentaciones) {
      return presentaciones.map(presentacion => ({
        value: presentacion.id,
        label: presentacion.nombre,
        data: presentacion
      }));
    }
    return [];
  }, [type, presentaciones]);

  const options = type === 'categoria' ? categoriaOptions : presentacionOptions;
  const flatOptions = options;

  // Memoized create option handler with useCallback
  const handleCreateOption = useCallback(async (inputValue: string) => {
    const nuevoItem = {
      nombre: inputValue.trim(),
      descripcion: '',
      id_institucion: 1 // TODO: Obtener del contexto actual
    };

    setIsCreating(true);

    try {
      let result;
      if (type === 'categoria') {
        result = await actions.crearCategoria(nuevoItem);
      } else {
        result = await actions.crearPresentacion(nuevoItem);
      }

      if (result.success && result.data) {
        // Devolver el ID del nuevo elemento para que react-select lo seleccione
        return result.data.id.toString();
      } else {
        console.error('Error creating option:', result?.error);
        // Mostrar error al usuario (podríamos agregar un toast aquí)
        return null;
      }
    } catch (error) {
      console.error('Error creating option:', error);
      // Mostrar error al usuario (podríamos agregar un toast aquí)
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [type, actions, onInlineEditSuccess, onInlineEditError, measureAsync, recordMetric, name]);

  // Memoized inline edit handler with useCallback
  const handleInlineEdit = useCallback(async (item: Categoria | Presentacion): Promise<{ success: boolean; data?: Categoria | Presentacion; error?: string }> => {
    try {
      let result;

      if (type === 'categoria') {
        const categoria = item as Categoria;
        const cambios: CategoriaUpdate = {
          nombre: categoria.nombre,
          descripcion: categoria.descripcion
        };
        result = await actions.editarCategoria(categoria.id, cambios);
      } else {
        const presentacion = item as Presentacion;
        const cambios: PresentacionUpdate = {
          nombre: presentacion.nombre,
          descripcion: presentacion.descripcion,
          abreviatura: presentacion.abreviatura,
          unidad_base: presentacion.unidad_base,
          factor_conversion: presentacion.factor_conversion
        };
        result = await actions.editarPresentacion(presentacion.id, cambios);
      }

      if (result.success) {
        onInlineEditSuccess?.(result.data!);
        return { success: true, data: result.data };
      } else {
        onInlineEditError?.(item, result.error || 'Error al editar');
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onInlineEditError?.(item, errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [type, actions, onInlineEditSuccess, onInlineEditError]);

  
  
  const customStyles: StylesConfig<any, boolean, GroupBase<any>> = {
    control: (base, state) => ({
      ...base,
      minHeight: '2.5rem',
      borderColor: error ? 'hsl(var(--destructive))' : state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--input))',
      '&:hover': {
        borderColor: state.isFocused ? 'hsl(var(--primary))' : 'hsl(var(--input))'
      },
      boxShadow: state.isFocused ? '0 0 0 2px hsl(var(--primary) / 0.2)' : 'none',
      backgroundColor: 'hsl(var(--background))'
    }),
    option: (base, { isDisabled, isFocused, isSelected }) => ({
      ...base,
      backgroundColor: isDisabled
        ? undefined
        : isSelected
        ? 'hsl(var(--primary))'
        : isFocused
        ? 'hsl(var(--accent))'
        : undefined,
      color: isDisabled
        ? 'hsl(var(--muted-foreground))'
        : isSelected
        ? 'hsl(var(--primary-foreground))'
        : 'hsl(var(--foreground))',
      '&:active': {
        backgroundColor: isSelected ? 'hsl(var(--primary))' : 'hsl(var(--accent))'
      }
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
      zIndex: 50
    }),
    menuList: (base) => ({
      ...base,
      padding: '0'
    }),
    group: (base) => ({
      ...base,
      paddingTop: '0',
      paddingBottom: '0'
    }),
    groupHeading: (base) => ({
      ...base,
      padding: '0.5rem 0.75rem',
      margin: '0',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      backgroundColor: 'hsl(var(--muted) / 0.5)',
      color: 'hsl(var(--muted-foreground))',
      borderBottom: '1px solid hsl(var(--border))'
    }),
    singleValue: (base) => ({
      ...base,
      color: 'hsl(var(--foreground))'
    }),
    input: (base) => ({
      ...base,
      color: 'hsl(var(--foreground))'
    }),
    placeholder: (base) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))'
    }),
    clearIndicator: (base) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))',
      '&:hover': {
        color: 'hsl(var(--destructive))'
      }
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: 'hsl(var(--muted-foreground))',
      '&:hover': {
        color: 'hsl(var(--foreground))'
      }
    }),
    loadingIndicator: (base) => ({
      ...base,
      color: 'hsl(var(--primary))'
    })
  };

  // Loading skeleton component
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      <Label className={cn("text-muted-foreground animate-pulse", "bg-muted rounded w-20 h-4 block")}>
        &nbsp;
      </Label>
      <div className="skeleton-select" />
    </div>
  );

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <div className={cn("space-y-2", className)}>
          {/* Label */}
          <div className="flex items-center gap-2">
            <Label htmlFor={name} className={cn(error && "text-destructive")}>
              {label}
            </Label>

            {/* Loading indicator for create operation */}
            {isCreating && (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            )}

            </div>

          {/* Show skeleton during initial loading */}
          {loading ? (
            <LoadingSkeleton />
          ) : (
            <div className={cn(
              "relative",
              error && "border-destructive focus-within:ring-destructive/20"
            )}>
              {creatable ? (
                <CreatableSelect
                  options={options}
                  onCreateOption={async (inputValue) => {
                    const newValue = await handleCreateOption(inputValue);
                    // Preseleccionar el nuevo elemento si se creó exitosamente
                    if (newValue) {
                      field.onChange(newValue);
                    }
                  }}
                  components={{
                    Option: memo(({ children, ...props }: any) => {
                      const { data } = props;

                      // Group heading
                      if (data.__isGroup__) {
                        return (
                          <div className={cn(
                            "font-semibold px-3 py-2 text-muted-foreground bg-muted/50",
                            "uppercase tracking-wide text-xs flex items-center gap-2"
                          )}>
                            <ChevronRight className="w-3 h-3" />
                            {children}
                          </div>
                        );
                      }

                      // Memoized calculations for regular options
                      const hierarchyLevel = useMemo(() =>
                        data.nivel ? data.nivel - 1 : 0, [data.nivel]);

                      const hasChildren = useMemo(() =>
                        data.hijos && data.hijos.length > 0, [data.hijos]);

                      const itemData = useMemo(() => data.data, [data.data]);

                      // Memoized styling classes
                      const containerClasses = useMemo(() => cn(
                        "flex items-center justify-between group",
                        "hierarchy-line",
                        hierarchyLevel > 0 && `hierarchy-indent-${Math.min(hierarchyLevel, 4)}`
                      ), [hierarchyLevel]);

                      // Si estamos editando este ítem inline, mostrar el editor
                      if (allowInlineEdit && editingItem && itemData && editingItem.id === itemData.id) {
                        return (
                          <div className="p-2 bg-white border-2 border-blue-500 shadow-lg" onClick={(e) => e.stopPropagation()}>
                            <InlineEditor
                              value={editingItem}
                              onSave={handleInlineEdit}
                              type={type}
                              disabled={disabled}
                              onStartEditing={() => onInlineEditStart?.(editingItem)}
                              onSaveSuccess={(savedItem) => {
                                setEditingItem(null);
                                onInlineEditSuccess?.(savedItem);
                              }}
                              onSaveError={(error) => {
                                onInlineEditError?.(editingItem, error);
                              }}
                            />
                          </div>
                        );
                      }

                      return (
                        <components.Option {...props}>
                          <div className={containerClasses}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Hierarchy indicators */}
                              {type === 'categoria' && (
                                <>
                                  {hierarchyLevel > 0 && (
                                    <div className="flex items-center gap-1">
                                      {useMemo(() =>
                                        [...Array(hierarchyLevel)].map((_, i) => (
                                          <div key={i} className="w-1 h-1 bg-border rounded-full" />
                                        )), [hierarchyLevel])
                                      }
                                    </div>
                                  )}
                                  {hasChildren && (
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                  )}
                                  {/* Category icon if available */}
                                  {itemData?.icono && (
                                    <span className="text-sm">{itemData.icono}</span>
                                  )}
                                  {/* Category color indicator */}
                                  {itemData?.color && (
                                    <div
                                      className="w-2 h-2 rounded-full border border-border"
                                      style={{ backgroundColor: itemData.color }}
                                    />
                                  )}
                                </>
                              )}

                              {/* Option label with truncation */}
                              <span className="truncate" title={children}>
                                {children}
                              </span>

                              {/* Additional info */}
                              {type === 'presentacion' && itemData?.abreviatura && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({itemData.abreviatura})
                                </span>
                              )}
                            </div>

                            {/* Inline edit button */}
                            {allowInlineEdit && itemData && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(itemData);
                                  onInlineEditStart?.(itemData);
                                }}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title={`Editar inline ${type}`}
                                aria-label={`Editar inline ${children}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Modal edit button */}
                            {allowEdit && !allowInlineEdit && itemData && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit?.(itemData);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title={`Editar ${type}`}
                                aria-label={`Editar ${children}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </components.Option>
                      );
                    }),
                    LoadingIndicator: () => <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  }}
                  placeholder={placeholder}
                  isDisabled={disabled || isCreating}
                  isLoading={loading || isCreating}
                  className={cn("react-select-container", error && "error")}
                  classNamePrefix="react-select"
                  formatCreateLabel={(inputValue) => (
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {isMobile ? 'Crear' : `Crear "${inputValue}"`}
                    </div>
                  )}
                  noOptionsMessage={({ inputValue }) => (
                    inputValue
                      ? `No se encontraron resultados para "${inputValue}"`
                      : 'No hay opciones disponibles'
                  )}
                  isClearable
                  isSearchable={!isMobile}
                  aria-label={`${label} ${required ? '(requerido)' : ''}`}
                  {...getSelectProps({ customStyles })}
                  aria-describedby={error ? `${name}-error` : undefined}
                  aria-required={required}
                  role="combobox"
                  menuPortalTarget={document.body}
                  onChange={(selectedOption) => {
                    // Extract just the value (string) from the selected option, or 0 for no selection
                    // z.coerce.number() will handle the string to number conversion
                    const value = selectedOption ? selectedOption.value : 0;
                    field.onChange(value);
                  }}
                  value={(() => {
                    // Ensure the selected value is maintained even if options are updating
                    const currentValue = field.value;
                    if (!currentValue || currentValue === 0) return null;

                    // Try to find the option in current options
                    const selectedOption = flatOptions.find(option =>
                      option.value === currentValue ||
                      option.value.toString() === currentValue.toString()
                    );

                    // If not found, create a temporary option to maintain the selection
                    if (!selectedOption && currentValue) {
                      return {
                        value: currentValue,
                        label: `ID: ${currentValue} (actualizando...)`,
                        data: null
                      };
                    }

                    return selectedOption || null;
                  })()}
                  onBlur={field.onBlur}
                  // Usar clave compuesta para re-renderizado optimizado
                  key={compositeKey}
                  styles={{
                    ...customStyles,
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 9999,
                      position: 'fixed'
                    })
                  }}
                />
              ) : (
                <Select
                  options={options}
                  components={{
                    Option: memo(({ children, ...props }: any) => {
                      const { data } = props;

                      // Group heading
                      if (data.__isGroup__) {
                        return (
                          <div className={cn(
                            "font-semibold px-3 py-2 text-muted-foreground bg-muted/50",
                            "uppercase tracking-wide text-xs flex items-center gap-2"
                          )}>
                            <ChevronRight className="w-3 h-3" />
                            {children}
                          </div>
                        );
                      }

                      // Memoized calculations for regular options
                      const hierarchyLevel = useMemo(() =>
                        data.nivel ? data.nivel - 1 : 0, [data.nivel]);

                      const hasChildren = useMemo(() =>
                        data.hijos && data.hijos.length > 0, [data.hijos]);

                      const itemData = useMemo(() => data.data, [data.data]);

                      // Memoized styling classes
                      const containerClasses = useMemo(() => cn(
                        "flex items-center justify-between group",
                        "hierarchy-line",
                        hierarchyLevel > 0 && `hierarchy-indent-${Math.min(hierarchyLevel, 4)}`
                      ), [hierarchyLevel]);

                      // Si estamos editando este ítem inline, mostrar el editor
                      if (allowInlineEdit && editingItem && itemData && editingItem.id === itemData.id) {
                        return (
                          <div className="p-2 bg-white border-2 border-blue-500 shadow-lg" onClick={(e) => e.stopPropagation()}>
                            <InlineEditor
                              value={editingItem}
                              onSave={handleInlineEdit}
                              type={type}
                              disabled={disabled}
                              onStartEditing={() => onInlineEditStart?.(editingItem)}
                              onSaveSuccess={(savedItem) => {
                                setEditingItem(null);
                                onInlineEditSuccess?.(savedItem);
                              }}
                              onSaveError={(error) => {
                                onInlineEditError?.(editingItem, error);
                              }}
                            />
                          </div>
                        );
                      }

                      return (
                        <components.Option {...props}>
                          <div className={containerClasses}>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {/* Hierarchy indicators */}
                              {type === 'categoria' && (
                                <>
                                  {hierarchyLevel > 0 && (
                                    <div className="flex items-center gap-1">
                                      {useMemo(() =>
                                        [...Array(hierarchyLevel)].map((_, i) => (
                                          <div key={i} className="w-1 h-1 bg-border rounded-full" />
                                        )), [hierarchyLevel])
                                      }
                                    </div>
                                  )}
                                  {hasChildren && (
                                    <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                  )}
                                  {/* Category icon if available */}
                                  {itemData?.icono && (
                                    <span className="text-sm">{itemData.icono}</span>
                                  )}
                                  {/* Category color indicator */}
                                  {itemData?.color && (
                                    <div
                                      className="w-2 h-2 rounded-full border border-border"
                                      style={{ backgroundColor: itemData.color }}
                                    />
                                  )}
                                </>
                              )}

                              {/* Option label with truncation */}
                              <span className="truncate" title={children}>
                                {children}
                              </span>

                              {/* Additional info */}
                              {type === 'presentacion' && itemData?.abreviatura && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({itemData.abreviatura})
                                </span>
                              )}
                            </div>

                            {/* Inline edit button */}
                            {allowInlineEdit && itemData && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingItem(itemData);
                                  onInlineEditStart?.(itemData);
                                }}
                                className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                                title={`Editar inline ${type}`}
                                aria-label={`Editar inline ${children}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}

                            {/* Modal edit button */}
                            {allowEdit && !allowInlineEdit && itemData && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit?.(itemData);
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title={`Editar ${type}`}
                                aria-label={`Editar ${children}`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </components.Option>
                      );
                    }),
                    LoadingIndicator: () => <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  }}
                  placeholder={placeholder}
                  isDisabled={disabled}
                  isLoading={loading}
                  className={cn("react-select-container", error && "error")}
                  classNamePrefix="react-select"
                  noOptionsMessage={() => 'No hay opciones disponibles'}
                  isClearable
                  isSearchable={!isMobile}
                  aria-label={`${label} ${required ? '(requerido)' : ''}`}
                  {...getSelectProps({ customStyles })}
                  aria-describedby={error ? `${name}-error` : undefined}
                  aria-required={required}
                  role="combobox"
                  menuPortalTarget={document.body}
                  onChange={(selectedOption) => {
                    // Extract just the value (string) from the selected option, or 0 for no selection
                    // z.coerce.number() will handle the string to number conversion
                    const value = selectedOption ? selectedOption.value : 0;
                    field.onChange(value);
                  }}
                  value={(() => {
                    // Ensure the selected value is maintained even if options are updating
                    const currentValue = field.value;
                    if (!currentValue || currentValue === 0) return null;

                    // Try to find the option in current options
                    const selectedOption = flatOptions.find(option =>
                      option.value === currentValue ||
                      option.value.toString() === currentValue.toString()
                    );

                    // If not found, create a temporary option to maintain the selection
                    if (!selectedOption && currentValue) {
                      return {
                        value: currentValue,
                        label: `ID: ${currentValue} (actualizando...)`,
                        data: null
                      };
                    }

                    return selectedOption || null;
                  })()}
                  onBlur={field.onBlur}
                  // Usar clave compuesta para re-renderizado optimizado
                  key={compositeKey}
                  styles={{
                    ...customStyles,
                    menuPortal: (base) => ({
                      ...base,
                      zIndex: 9999,
                      position: 'fixed'
                    })
                  }}
                />
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <p id={`${name}-error`} className="text-sm text-destructive flex items-center gap-1" role="alert">
              <AlertCircle className="w-3 h-3" />
              {error.message}
            </p>
          )}

          {/* Create operation status */}
          {isCreating && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              Creando nueva {type}...
            </p>
          )}
        </div>
      )}
    />
  );
};

// Memoized component with custom comparison function
export const MemoizedDynamicSelect = memo(DynamicSelect, (prevProps, nextProps) => {
  // Re-render si cambian las propiedades importantes O el refreshKey
  const basicPropsEqual = (
    prevProps.control === nextProps.control &&
    prevProps.name === nextProps.name &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.error === nextProps.error &&
    prevProps.required === nextProps.required &&
    prevProps.type === nextProps.type &&
    prevProps.allowInlineEdit === nextProps.allowInlineEdit &&
    prevProps.allowEdit === nextProps.allowEdit &&
    prevProps.creatable === nextProps.creatable &&
    prevProps.label === nextProps.label &&
    prevProps.refreshKey === nextProps.refreshKey // Incluir refreshKey en la comparación
  );

  return basicPropsEqual;
});

// Add display names for debugging
MemoizedDynamicSelect.displayName = 'MemoizedDynamicSelect';

export default DynamicSelect;