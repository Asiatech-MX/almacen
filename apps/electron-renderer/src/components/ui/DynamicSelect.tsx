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
import { Controller, Control, FieldError, useWatch } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Edit2, Plus, ChevronRight, Loader2, AlertCircle, X, Check } from 'lucide-react';
import { Categoria, Presentacion, CategoriaUpdate, PresentacionUpdate } from '../../../../packages/shared-types/src/referenceData';
import { useDynamicSelectOptions } from '@/hooks/useDynamicSelectOptions';
import { useDynamicSelectValue } from '@/hooks/useDynamicSelectValue';
import { useEditarCategoriaMutation, useEditarPresentacionMutation, useCrearCategoriaMutation, useCrearPresentacionMutation } from '@/hooks/useReferenceDataQuery';
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
  onInlineEditError
}) => {
  const { measureRender, measureInteraction, measureAsync, recordMetric } = usePerformanceMonitor('DynamicSelect');

  // Obtener el valor actual del campo usando useWatch (recomendado por React Hook Form)
  const currentValue = useWatch({
    control,
    name,
    defaultValue: null
  });

  // Hook optimizado para obtener opciones
  const {
    options,
    isLoading: isPending,
    isFetching,
    error: optionsError,
    refetch
  } = useDynamicSelectOptions({
    type,
    idInstitucion: 1, // TODO: Obtener del contexto actual
    includeInactive: true
  });

  // Hook simplificado para resolver valores
  const {
    resolvedValue,
    getValueForForm,
    createTemporaryOption,
    isUpdating
  } = useDynamicSelectValue({
    currentValue,
    type,
    idInstitucion: 1,
    includeInactive: true,
    options,
    isFetching
  });

  // Mutaciones de TanStack Query para edición y creación
  const editarCategoriaMutation = useEditarCategoriaMutation();
  const editarPresentacionMutation = useEditarPresentacionMutation();
  const crearCategoriaMutation = useCrearCategoriaMutation();
  const crearPresentacionMutation = useCrearPresentacionMutation();

  const [isCreating, setIsCreating] = useState(false);
  const [editingItem, setEditingItem] = useState<Categoria | Presentacion | null>(null);
  const { isMobile, getSelectProps } = useResponsiveSelect();

  // Monitorear rendimiento del renderizado
  useEffect(() => {
    measureRender(() => {
      // El renderizado ya se completó aquí
    }, `${type}-select-${name}`);
  }, [type, name, isPending, isFetching]);

  // Memoized create option handler with useCallback - usando TanStack Query mutations
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
        result = await crearCategoriaMutation.mutateAsync(nuevoItem);
      } else {
        result = await crearPresentacionMutation.mutateAsync(nuevoItem);
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
  }, [type, crearCategoriaMutation, crearPresentacionMutation, onInlineEditSuccess, onInlineEditError, measureAsync, recordMetric, name]);

  // Memoized inline edit handler with useCallback - usando TanStack Query mutations
  const handleInlineEdit = useCallback(async (item: Categoria | Presentacion): Promise<{ success: boolean; data?: Categoria | Presentacion; error?: string }> => {
    try {
      let result;

      if (type === 'categoria') {
        const categoria = item as Categoria;
        const cambios: CategoriaUpdate = {
          nombre: categoria.nombre,
          descripcion: categoria.descripcion
        };
        result = await editarCategoriaMutation.mutateAsync({ id: categoria.id, cambios });
      } else {
        const presentacion = item as Presentacion;
        const cambios: PresentacionUpdate = {
          nombre: presentacion.nombre,
          descripcion: presentacion.descripcion,
          abreviatura: presentacion.abreviatura,
          unidad_base: presentacion.unidad_base,
          factor_conversion: presentacion.factor_conversion
        };
        result = await editarPresentacionMutation.mutateAsync({ id: presentacion.id, cambios });
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
  }, [type, editarCategoriaMutation, editarPresentacionMutation, onInlineEditSuccess, onInlineEditError]);

  
  
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

  // Enhanced loading skeleton component for initial load (isPending)
  const LoadingSkeleton = () => (
    <div className="space-y-2">
      <Label className={cn(
        "text-muted-foreground animate-pulse",
        "bg-muted rounded w-20 h-4 block",
        "relative overflow-hidden"
      )}>
        <div className="loading-skeleton-shine" />
        &nbsp;
      </Label>
      <div className="skeleton-select">
        <div className="loading-skeleton-shine" />
      </div>
    </div>
  );

  // Background fetching indicator component (isUpdating)
  const BackgroundFetchingIndicator = () => (
    <div className="absolute top-1 right-1 z-10">
      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm">
        <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
        <span className="text-xs font-medium">Actualizando...</span>
      </div>
    </div>
  );

  // Global loading state for select dropdown
  const SelectLoadingIndicator = () => (
    <div className="flex items-center gap-2 px-3 py-2 text-muted-foreground">
      <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      <span className="text-xs">Cargando opciones...</span>
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

          {/* Show skeleton during initial loading, otherwise show select with background fetching indicator */}
          {isPending ? (
            <LoadingSkeleton />
          ) : (
            <div className={cn(
              "relative",
              error && "border-destructive focus-within:ring-destructive/20"
            )}>
              {/* Background fetching indicator - shown when updating current value */}
              {isUpdating && <BackgroundFetchingIndicator />}
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
                    LoadingIndicator: () => <SelectLoadingIndicator />
                  }}
                  placeholder={placeholder}
                  isDisabled={disabled || isCreating}
                  isLoading={isPending || isCreating}
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
                    // Convert react-select string value to number for form consistency
                    // React Select internally uses string values, but form expects numbers
                    const value = selectedOption ? parseInt(selectedOption.value, 10) || 0 : 0;
                    field.onChange(value);
                  }}
                  value={resolvedValue}
                  onBlur={field.onBlur}
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
                    LoadingIndicator: () => <SelectLoadingIndicator />
                  }}
                  placeholder={placeholder}
                  isDisabled={disabled}
                  isLoading={isPending}
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
                    // Convert react-select string value to number for form consistency
                    // React Select internally uses string values, but form expects numbers
                    const value = selectedOption ? parseInt(selectedOption.value, 10) || 0 : 0;
                    field.onChange(value);
                  }}
                  value={resolvedValue}
                  onBlur={field.onBlur}
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
          {(error || optionsError) && (
            <p id={`${name}-error`} className="text-sm text-destructive flex items-center gap-1" role="alert">
              <AlertCircle className="w-3 h-3" />
              {error?.message || optionsError?.message || 'Error al cargar datos'}
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

// Memoized component with optimized comparison function using only primitive props
export const MemoizedDynamicSelect = memo(DynamicSelect, (prevProps, nextProps) => {
  // Solo re-render si cambian las propiedades primitivas importantes
  // Esto evita comparaciones de objetos que causan issues
  return (
    prevProps.name === nextProps.name &&
    prevProps.type === nextProps.type &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.required === nextProps.required &&
    prevProps.creatable === nextProps.creatable &&
    prevProps.allowEdit === nextProps.allowEdit &&
    prevProps.allowInlineEdit === nextProps.allowInlineEdit &&
    prevProps.label === nextProps.label &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.className === nextProps.className
    // Nota: No comparamos 'control' o 'error' porque son objetos
    // React Hook Form maneja las actualizaciones del formulario eficientemente
  );
});

// Add display names for debugging
MemoizedDynamicSelect.displayName = 'MemoizedDynamicSelect';

export default DynamicSelect;