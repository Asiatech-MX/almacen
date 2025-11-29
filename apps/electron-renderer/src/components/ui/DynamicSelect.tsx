import React, { useMemo, useState } from 'react';
import Select, { GroupBase, components, StylesConfig } from 'react-select';
import CreatableSelect from 'react-select/creatable';
import { Controller, Control, FieldError } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { Label } from './label';
import { Edit2, Plus, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Categoria, Presentacion } from '../../../../packages/shared-types/src/referenceData';
import { useReferenceData } from '@/hooks/useReferenceData';
import { useResponsiveSelect } from '@/hooks/useResponsiveSelect';

interface DynamicSelectProps {
  control: Control<any>;
  name: string;
  label: string;
  type: 'categoria' | 'presentacion';
  placeholder?: string;
  creatable?: boolean;
  allowEdit?: boolean;
  onEdit?: (item: Categoria | Presentacion) => void;
  onMove?: (id: string, nuevoPadreId?: string) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  error?: FieldError;
}

export const DynamicSelect: React.FC<DynamicSelectProps> = ({
  control,
  name,
  label,
  type,
  placeholder = `Seleccionar ${label}...`,
  creatable = true,
  allowEdit = false,
  onEdit,
  onMove,
  disabled = false,
  required = false,
  className,
  error
}) => {
  const { categoriasOptions, categoriasFlatOptions, presentacionesOptions, loading } = useReferenceData({
    idInstitucion: 1 // TODO: Obtener del contexto actual
  });

  const [isCreating, setIsCreating] = useState(false);
  const { isMobile, getSelectProps } = useResponsiveSelect();

  // Opciones con jerarquía para categorías
  const categoriaOptions = useMemo(() => {
    if (type === 'categoria') {
      return categoriasOptions || [];
    }
    return [];
  }, [type, categoriasOptions]);

  // Opciones para presentaciones
  const presentacionOptions = useMemo(() => {
    if (type === 'presentacion') {
      return presentacionesOptions || [];
    }
    return [];
  }, [type, presentacionesOptions]);

  const options = type === 'categoria' ? categoriaOptions : presentacionOptions;

  // Para el value matching, usar opciones planas
  const flatOptions = type === 'categoria' ? categoriasFlatOptions : presentacionesOptions;

  const handleCreateOption = async (inputValue: string) => {
    const nuevoItem = {
      nombre: inputValue.trim(),
      id_institucion: 1 // TODO: Obtener del contexto actual
    };

    setIsCreating(true);

    try {
      let result;
      if (type === 'categoria') {
        result = await window.electronAPI.categoria.crear(nuevoItem, undefined);
      } else {
        result = await window.electronAPI.presentacion.crear(nuevoItem);
      }

      if (result && result.id) {
        return result.id.toString();
      } else {
        console.error('Error creating option:', result);
        return null;
      }
    } catch (error) {
      console.error('Error creating option:', error);
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  const CustomOption = ({ children, ...props }: any) => {
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

    // Regular option with hierarchy indicators
    const hierarchyLevel = data.nivel ? data.nivel - 1 : 0;
    const hasChildren = data.hijos && data.hijos.length > 0;

    return (
      <components.Option {...props}>
        <div className={cn(
          "flex items-center justify-between group",
          "hierarchy-line",
          hierarchyLevel > 0 && `hierarchy-indent-${Math.min(hierarchyLevel, 4)}`
        )}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Hierarchy indicator */}
            {type === 'categoria' && (
              <>
                {hierarchyLevel > 0 && (
                  <div className="flex items-center gap-1">
                    {[...Array(hierarchyLevel)].map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-border rounded-full" />
                    ))}
                  </div>
                )}
                {hasChildren && (
                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                )}
                {/* Category icon if available */}
                {data.data?.icono && (
                  <span className="text-sm">{data.data.icono}</span>
                )}
                {/* Category color indicator */}
                {data.data?.color && (
                  <div
                    className="w-2 h-2 rounded-full border border-border"
                    style={{ backgroundColor: data.data.color }}
                  />
                )}
              </>
            )}

            {/* Option label with truncation */}
            <span className="truncate" title={children}>
              {children}
            </span>

            {/* Additional info */}
            {type === 'presentacion' && data.data?.abreviatura && (
              <span className="text-xs text-muted-foreground ml-1">
                ({data.data.abreviatura})
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {allowEdit && data.data && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(data.data);
                }}
                className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title={`Editar ${type}`}
                aria-label={`Editar ${children}`}
              >
                <Edit2 className="w-3 h-3" />
              </button>
            )}

            </div>
        </div>
      </components.Option>
    );
  };

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
              {required && <span className="text-destructive ml-1">*</span>}
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
                  onCreateOption={handleCreateOption}
                  components={{
                    Option: CustomOption,
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
                    // Extract just the value (string) from the selected option
                    const value = selectedOption ? selectedOption.value : null;
                    field.onChange(value);
                  }}
                  value={flatOptions.find(option => option.value === field.value) || null}
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
                    Option: CustomOption,
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
                    // Extract just the value (string) from the selected option
                    const value = selectedOption ? selectedOption.value : null;
                    field.onChange(value);
                  }}
                  value={flatOptions.find(option => option.value === field.value) || null}
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

// Memoize el componente para evitar re-renders innecesarios
export const MemoizedDynamicSelect = React.memo(DynamicSelect, (prevProps, nextProps) => {
  // Re-render solo si cambian las propiedades importantes
  return (
    prevProps.control === nextProps.control &&
    prevProps.name === nextProps.name &&
    prevProps.value === nextProps.value &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.required === nextProps.required &&
    prevProps.type === nextProps.type
  );
});

export default DynamicSelect;