import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Edit2, Loader2, AlertCircle, AlertTriangle, Info, Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useInlineEditor, InlineEditorHook } from '@/hooks/useInlineEditor';
import { useDarkMode } from '@/hooks/useDarkMode';

interface InlineEditorProps<T = any> {
  // Datos
  value: T;
  onSave: (value: T) => Promise<{ success: boolean; data?: T; error?: string }>;

  // Configuración
  type: 'categoria' | 'presentacion';
  disabled?: boolean;
  placeholder?: string;
  className?: string;

  // Callbacks
  onStartEditing?: () => void;
  onCancelEditing?: () => void;
  onSaveSuccess?: (data: T) => void;
  onSaveError?: (error: string) => void;

  // Configuración del editor
  config?: {
    validateOnBlur?: boolean;
    autoSave?: boolean;
    debounceMs?: number;
    enableKeyboardShortcuts?: boolean;
    enableRealTimeValidation?: boolean;
    enableAsyncValidation?: boolean;
    validationDebounceMs?: number;
  };

  // Contexto de validación
  validationContext?: {
    existingItems: T[];
    institutionId?: number;
  };

  // Renderizado personalizado
  renderDisplay?: (value: T, onEdit: () => void) => React.ReactNode;
  renderEditing?: (value: T, onChange: (field: string, value: any) => void, onSave: () => void, onCancel: () => void) => React.ReactNode;
}

// Campos por tipo de dato
const CAMPOS_CATEGORIA = [
  { key: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 100 },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 500 }
];

const CAMPOS_PRESENTACION = [
  { key: 'nombre', label: 'Nombre', type: 'text', required: true, maxLength: 100 },
  { key: 'descripcion', label: 'Descripción', type: 'textarea', maxLength: 500 },
  { key: 'unidad_medida', label: 'Unidad de Medida', type: 'text', required: true, maxLength: 20 }
];

// Animation variants for Framer Motion
const animationVariants = {
  // Container animations
  container: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Field animations
  field: {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Button animations
  button: {
    hover: {
      scale: 1.05,
      transition: { duration: 0.15 }
    },
    tap: {
      scale: 0.98,
      transition: { duration: 0.1 }
    },
    disabled: {
      scale: 1,
      opacity: 0.6,
      transition: { duration: 0.2 }
    }
  },

  // Icon animations
  icon: {
    hover: {
      rotate: 15,
      scale: 1.1,
      transition: { duration: 0.15 }
    },
    hidden: {
      opacity: 0,
      scale: 0.8,
      rotate: -15
    },
    visible: {
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Error/Warning animations
  message: {
    hidden: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      marginBottom: 0
    },
    visible: {
      opacity: 1,
      height: 'auto',
      marginTop: '0.5rem',
      marginBottom: 0,
      transition: {
        duration: 0.3,
        ease: [0.4, 0, 0.2, 1]
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      marginBottom: 0,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  },

  // Loading spinner animation
  spinner: {
    animate: {
      rotate: 360,
      transition: {
        duration: 1,
        ease: "linear",
        repeat: Infinity
      }
    }
  },

  // Success check animation
  success: {
    hidden: {
      scale: 0,
      opacity: 0,
      pathLength: 0
    },
    visible: {
      scale: 1,
      opacity: 1,
      pathLength: 1,
      transition: {
        duration: 0.5,
        ease: [0.4, 0, 0.2, 1]
      }
    }
  }
};

function InlineEditorComponent<T extends Record<string, any>>({
  value,
  onSave,
  type,
  disabled = false,
  placeholder = 'Hacer clic para editar',
  className = '',
  onStartEditing,
  onCancelEditing,
  onSaveSuccess,
  onSaveError,
  config = {},
  validationContext,
  renderDisplay,
  renderEditing
}: InlineEditorProps<T>) {
  const [isHovered, setIsHovered] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const { isDark, effectiveTheme } = useDarkMode();

  // Enhanced configuration with accessibility defaults
  const enhancedConfig = {
    validateOnBlur: true,
    autoSave: false,
    debounceMs: 300,
    enableKeyboardShortcuts: true,
    enableRealTimeValidation: true,
    enableAsyncValidation: true,
    validationDebounceMs: 400,
    // Enhanced accessibility options
    enableAdvancedShortcuts: true,
    enableFocusTrapping: true,
    enableArrowNavigation: true,
    undoWithCtrlZ: true,
    saveWithCtrlS: true,
    ...config
  };

  const editor = useInlineEditor<T>({
    onSave,
    config: enhancedConfig,
    validationContext: validationContext ? {
      itemType: type,
      existingItems: validationContext.existingItems,
      institutionId: validationContext.institutionId
    } : undefined
  });

  // Accessibility announcements for screen readers
  const announceToScreenReader = (message: string) => {
    setAnnouncementMessage(message);
    // Clear the message after it's announced
    setTimeout(() => setAnnouncementMessage(''), 100);
  };

  const handleStartEditing = () => {
    if (disabled || editor.loading) return;

    editor.startEditing(value);
    onStartEditing?.();

    // Announce editing mode start
    const itemType = type === 'categoria' ? 'categoría' : 'presentación';
    announceToScreenReader(`Modo de edición activado para ${itemType}. Use Tab para navegar entre campos, Enter para guardar y Escape para cancelar.`);
  };

  const handleSave = async () => {
    const result = await editor.saveEditing();

    if (result.success) {
      const itemType = type === 'categoria' ? 'categoría' : 'presentación';
      announceToScreenReader(`${itemType} guardada exitosamente.`);
      onSaveSuccess?.(editor.editingValue!);
    } else {
      announceToScreenReader(`Error al guardar: ${result.error || 'Error desconocido'}`);
      onSaveError?.(result.error || 'Error al guardar');
    }
  };

  const handleCancel = () => {
    editor.cancelEditing();
    onCancelEditing?.();
    announceToScreenReader('Edición cancelada.');
  };

  const updateValue = (field: string, fieldValue: any) => {
    editor.updateValue(field as keyof T, fieldValue);
  };

  // Renderizado por defecto para modo display con enhanced accessibility, animaciones y dark mode
  const defaultRenderDisplay = (item: T, onEdit: () => void) => {
    const displayName = item.nombre || 'Sin nombre';
    const displayDescription = item.descripcion;
    const itemType = type === 'categoria' ? 'categoría' : 'presentación';

    return (
      <motion.div
        className={cn(
          'flex items-center justify-between p-2 rounded-md border border-transparent cursor-pointer group',
          'focus-within:bg-gray-50 dark:focus-within:bg-gray-800',
          'focus-within:border-gray-200 dark:focus-within:border-gray-700',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        initial={{ opacity: 1, scale: 1 }}
        whileHover={!disabled ? {
          backgroundColor: isDark ? 'rgb(31 41 55)' : 'rgb(249 250 251)',
          borderColor: isDark ? 'rgb(55 65 81)' : 'rgb(229 231 235)',
          transition: { duration: 0.2 }
        } : {}}
        whileTap={!disabled ? { scale: 0.98 } : {}}
        onClick={disabled ? undefined : onEdit}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Editar ${itemType}: ${displayName}`}
        aria-describedby={displayDescription ? `desc-${item.id || 'item'}` : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onEdit();
          }
        }}
      >
        <div className="flex-1 min-w-0">
          <div className={cn(
            'font-medium truncate',
            isDark ? 'text-gray-100' : 'text-gray-900'
          )}>
            {displayName}
          </div>
          {displayDescription && (
            <div
              id={item.id ? `desc-${item.id}` : 'desc-item'}
              className={cn(
                'text-sm truncate',
                isDark ? 'text-gray-400' : 'text-gray-500'
              )}
            >
              {displayDescription}
            </div>
          )}
          {type === 'presentacion' && item.abreviatura && (
            <div className={cn(
              'text-xs',
              isDark ? 'text-gray-500' : 'text-gray-400'
            )}>
              ({item.abreviatura})
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
          {editor.loading && (
            <motion.div
              variants={animationVariants.spinner}
              animate="animate"
            >
              <Loader2
                className={cn(
                  'w-4 h-4',
                  isDark ? 'text-blue-400' : 'text-blue-500'
                )}
                aria-hidden="true"
              />
            </motion.div>
          )}
          {!disabled && !editor.loading && (
            <motion.div
              variants={animationVariants.icon}
              initial="hidden"
              animate={isHovered ? "hover" : "visible"}
              exit="hidden"
            >
              <Edit2
                className={cn(
                  'w-4 h-4 group-hover:transition-colors',
                  isDark
                    ? 'text-gray-500 group-hover:text-gray-300'
                    : 'text-gray-400 group-hover:text-gray-600'
                )}
                aria-hidden="true"
              />
            </motion.div>
          )}
        </div>
      </motion.div>
    );
  };

  // Renderizado por defecto para modo edición con enhanced accessibility, animaciones y dark mode
  const defaultRenderEditing = (item: T, onChange: (field: string, value: any) => void, onSave: () => void, onCancel: () => void) => {
    const campos = type === 'categoria' ? CAMPOS_CATEGORIA : CAMPOS_PRESENTACION;
    const itemType = type === 'categoria' ? 'categoría' : 'presentación';

    return (
      <motion.div
        ref={editor.containerRef}
        className={cn(
          'p-3 border-2 rounded-lg shadow-lg',
          isDark
            ? 'bg-gray-900 border-blue-400 shadow-blue-900/20'
            : 'bg-white border-blue-500 shadow-blue-500/20'
        )}
        variants={animationVariants.container}
        initial="hidden"
        animate="visible"
        exit="exit"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`edit-title-${item.id || 'item'}`}
        aria-describedby={`edit-description-${item.id || 'item'}`}
        data-inline-editor
      >
        {/* Hidden screen reader announcements */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcementMessage}
        </div>

        {/* Edit mode title */}
        <div id={`edit-title-${item.id || 'item'}`} className="sr-only">
          Editando {itemType}
        </div>

        <div id={`edit-description-${item.id || 'item'}`} className="sr-only">
          Formulario de edición para {itemType}. Use Tab para navegar, Enter para guardar, Escape para cancelar.
        </div>

        <div className="space-y-3">
          {campos.map((campo, index) => {
            const fieldValue = item[campo.key];
            const fieldError = editor.getFieldError(campo.key);
            const hasError = !!fieldError;
            const hasWarning = editor.validationResults.warnings.some(w => w.path?.includes(campo.key));
            const fieldId = `field-${campo.key}-${item.id || 'item'}`;
            const errorId = `${fieldId}-error`;
            const descriptionId = `${fieldId}-description`;

            return (
              <motion.div
                key={campo.key}
                className="space-y-1"
                variants={animationVariants.field}
                initial="hidden"
                animate="visible"
                custom={index}
                transition={{ delay: index * 0.05 }}
              >
                <label
                  htmlFor={fieldId}
                  className={cn(
                    'block text-sm font-medium flex items-center gap-1',
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  )}
                  id={`${fieldId}-label`}
                >
                  {campo.label}
                  {campo.required && (
                    <span
                      className={cn(
                        'ml-1',
                        isDark ? 'text-red-400' : 'text-red-500'
                      )}
                      aria-label="requerido"
                    >
                      *
                    </span>
                  )}
                  {editor.isValidating && (
                    <motion.div
                      variants={animationVariants.spinner}
                      animate="animate"
                    >
                      <Loader2
                        className={cn(
                          'w-3 h-3',
                          isDark ? 'text-blue-400' : 'text-blue-500'
                        )}
                        aria-hidden="true"
                      />
                    </motion.div>
                  )}
                </label>

                <div className="relative">
                  {campo.type === 'textarea' ? (
                    <textarea
                      id={fieldId}
                      ref={(el) => {
                        if (campo.key === 'nombre') {
                          (editor.inputRef as any).current = el;
                        }
                        editor.fieldRefs.current[campo.key] = el;
                      }}
                      value={fieldValue || ''}
                      onChange={(e) => onChange(campo.key, e.target.value)}
                      onFocus={() => {
                        // Focus management
                        editor.focusField(campo.key);
                      }}
                      onBlur={() => {
                        if (editor.config?.validateOnBlur) {
                          editor.validateField(campo.key, fieldValue);
                        }
                      }}
                      className={cn(
                        'w-full px-3 py-2 border rounded-md resize-none focus:outline-hidden focus:ring-2 focus:ring-offset-1 transition-colors duration-200',
                        hasError
                          ? isDark
                            ? 'border-red-800 bg-red-900/20 text-red-100 focus:ring-red-600'
                            : 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500'
                          : hasWarning
                            ? isDark
                              ? 'border-yellow-800 bg-yellow-900/20 text-yellow-100 focus:ring-yellow-600'
                              : 'border-yellow-300 bg-yellow-50 text-yellow-900 focus:ring-yellow-500'
                            : isDark
                              ? 'border-gray-600 bg-gray-800 text-gray-100 focus:ring-blue-500 focus:border-blue-400'
                              : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                      )}
                      placeholder={`Ingrese ${campo.label.toLowerCase()}`}
                      rows={2}
                      maxLength={campo.maxLength}
                      disabled={editor.loading}
                      aria-labelledby={`${fieldId}-label`}
                      aria-describedby={hasError ? errorId : descriptionId}
                      aria-invalid={hasError}
                      aria-required={campo.required}
                      data-field={campo.key}
                      data-field-index={index}
                    />
                  ) : (
                    <input
                      id={fieldId}
                      ref={(el) => {
                        if (campo.key === 'nombre') {
                          (editor.inputRef as any).current = el;
                        }
                        editor.fieldRefs.current[campo.key] = el;
                      }}
                      type={campo.type}
                      value={fieldValue || ''}
                      onChange={(e) => {
                        const value = campo.type === 'number'
                          ? (e.target.value ? Number(e.target.value) : '')
                          : e.target.value;
                        onChange(campo.key, value);
                      }}
                      onFocus={() => {
                        // Focus management
                        editor.focusField(campo.key);
                      }}
                      onBlur={() => {
                        if (editor.config?.validateOnBlur) {
                          editor.validateField(campo.key, fieldValue);
                        }
                      }}
                      className={cn(
                        'w-full px-3 py-2 border rounded-md focus:outline-hidden focus:ring-2 focus:ring-offset-1 transition-colors duration-200',
                        hasError
                          ? isDark
                            ? 'border-red-800 bg-red-900/20 text-red-100 focus:ring-red-600'
                            : 'border-red-300 bg-red-50 text-red-900 focus:ring-red-500'
                          : hasWarning
                            ? isDark
                              ? 'border-yellow-800 bg-yellow-900/20 text-yellow-100 focus:ring-yellow-600'
                              : 'border-yellow-300 bg-yellow-50 text-yellow-900 focus:ring-yellow-500'
                            : isDark
                              ? 'border-gray-600 bg-gray-800 text-gray-100 focus:ring-blue-500 focus:border-blue-400'
                              : 'border-gray-300 bg-white text-gray-900 focus:ring-blue-500 focus:border-blue-500'
                      )}
                      placeholder={`Ingrese ${campo.label.toLowerCase()}`}
                      maxLength={campo.maxLength}
                      min={campo.min}
                      max={campo.type === 'number' ? 999999 : undefined}
                      disabled={editor.loading}
                      aria-labelledby={`${fieldId}-label`}
                      aria-describedby={hasError ? errorId : descriptionId}
                      aria-invalid={hasError}
                      aria-required={campo.required}
                      data-field={campo.key}
                      data-field-index={index}
                    />
                  )}

                  {/* Field validation status indicator */}
                  {fieldError && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2" aria-hidden="true">
                      <AlertCircle className={cn(
                        'w-4 h-4',
                        isDark ? 'text-red-400' : 'text-red-500'
                      )} />
                    </div>
                  )}
                  {hasWarning && !fieldError && (
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2" aria-hidden="true">
                      <AlertTriangle className={cn(
                        'w-4 h-4',
                        isDark ? 'text-yellow-400' : 'text-yellow-500'
                      )} />
                    </div>
                  )}
                </div>

                {/* Field character count with accessibility */}
                {campo.type === 'text' && (
                  <div
                    id={descriptionId}
                    className={cn(
                      'text-xs text-right transition-colors duration-200',
                      hasError
                        ? isDark ? 'text-red-400' : 'text-red-600'
                        : hasWarning
                          ? isDark ? 'text-yellow-400' : 'text-yellow-600'
                          : isDark ? 'text-gray-400' : 'text-gray-500'
                    )}
                    aria-live="polite"
                  >
                    Caracteres: {fieldValue?.length || 0} de {campo.maxLength}
                  </div>
                )}

                {/* Field-specific error message con animaciones */}
                <AnimatePresence>
                  {fieldError && (
                    <motion.div
                      id={errorId}
                      className="flex items-start gap-2 p-2 bg-red-50 border border-red-200 rounded-md"
                      role="alert"
                      aria-live="assertive"
                      variants={animationVariants.message}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <motion.div
                        initial={{ rotate: 0, scale: 1 }}
                        animate={{ rotate: 10, scale: 1.1 }}
                        transition={{
                          duration: 0.3,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      >
                        <AlertCircle className="w-3 h-3 text-red-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      </motion.div>
                      <span className="text-xs text-red-700">{fieldError.message}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Field-specific warnings con animaciones */}
                <AnimatePresence>
                  {hasWarning && !fieldError && (
                    <motion.div
                      className="flex items-start gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md"
                      variants={animationVariants.message}
                      initial="hidden"
                      animate="visible"
                      exit="exit"
                    >
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 5 }}
                        transition={{
                          duration: 0.5,
                          repeat: Infinity,
                          repeatType: "reverse",
                          ease: "easeInOut"
                        }}
                      >
                        <AlertTriangle className="w-3 h-3 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      </motion.div>
                      <span className="text-xs text-yellow-700">
                        {editor.validationResults.warnings.find(w => w.path?.includes(campo.key))?.message}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}

          {/* General error message */}
          {editor.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <span className="text-sm text-red-700">{editor.error}</span>
            </div>
          )}

          {/* Validation warnings/info */}
          {editor.validationResults.warnings.length > 0 && !editor.error && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-700">
                <span className="font-medium">Advertencias:</span>
                <ul className="mt-1 space-y-1">
                  {editor.validationResults.warnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-yellow-500">•</span>
                      <span>{warning.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Validation info messages */}
          {editor.validationResults.info.length > 0 && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700">
                <ul className="space-y-1">
                  {editor.validationResults.info.map((info, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-blue-500">•</span>
                      <span>{info.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Action buttons with enhanced accessibility */}
          <div className={cn(
                  'flex justify-between items-center pt-2 border-t',
                  isDark ? 'border-gray-700' : 'border-gray-200'
                )}>
            {/* Keyboard shortcuts help */}
            <div className={cn(
              'text-xs',
              isDark ? 'text-gray-400' : 'text-gray-500'
            )}>
              <span className="sr-only">Atajos de teclado:</span>
              <span aria-hidden="true">Esc: Cancelar • Enter: Guardar</span>
              {enhancedConfig.enableAdvancedShortcuts && (
                <span aria-hidden="true"> • Ctrl+S: Guardar • Ctrl+Z: Deshacer</span>
              )}
            </div>

            <div className="flex gap-2">
              <motion.button
                onClick={onCancel}
                disabled={editor.loading}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md border transition-colors duration-200',
                  isDark
                    ? 'bg-gray-800 border-gray-600 text-gray-200 hover:bg-gray-700 focus:ring-gray-500'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500',
                  'focus:outline-hidden focus:ring-2 focus:ring-offset-1',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                variants={animationVariants.button}
                whileHover={!editor.loading ? "hover" : "disabled"}
                whileTap={!editor.loading ? "tap" : "disabled"}
                animate={editor.loading ? "disabled" : "visible"}
                aria-label="Cancelar edición"
                title="Cancelar (Escape)"
              >
                <X className="w-4 h-4 inline mr-1" aria-hidden="true" />
                Cancelar
              </motion.button>

              <motion.button
                onClick={onSave}
                disabled={editor.loading || !editor.hasChanges || editor.isValidating || !editor.validationResults.isValid}
                className={cn(
                  'px-3 py-2 text-sm font-medium rounded-md border transition-colors duration-200',
                  isDark
                    ? 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 focus:ring-blue-400'
                    : 'bg-blue-600 border-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
                  'focus:outline-hidden focus:ring-2 focus:ring-offset-1',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                variants={animationVariants.button}
                whileHover={!editor.loading && editor.hasChanges && !editor.isValidating && editor.validationResults.isValid ? "hover" : "disabled"}
                whileTap={!editor.loading && editor.hasChanges && !editor.isValidating && editor.validationResults.isValid ? "tap" : "disabled"}
                animate={editor.loading || !editor.hasChanges || editor.isValidating || !editor.validationResults.isValid ? "disabled" : "visible"}
                aria-label={
                  editor.loading || editor.isValidating
                    ? editor.isValidating ? 'Validando datos...' : 'Guardando...'
                    : 'Guardar cambios'
                }
                title={enhancedConfig.saveWithCtrlS ? 'Guardar (Enter o Ctrl+S)' : 'Guardar (Enter)'}
              >
                {editor.loading || editor.isValidating ? (
                  <>
                    <motion.div
                      variants={animationVariants.spinner}
                      animate="animate"
                      className="inline mr-1"
                    >
                      <Loader2 className="w-4 h-4" aria-hidden="true" />
                    </motion.div>
                    {editor.isValidating ? 'Validando...' : 'Guardando...'}
                  </>
                ) : (
                  <>
                    <motion.div
                      variants={animationVariants.success}
                      initial="hidden"
                      animate="visible"
                      className="inline mr-1"
                    >
                      <Check className="w-4 h-4" aria-hidden="true" />
                    </motion.div>
                    Guardar
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {editor.isEditing && editor.editingValue ? (
        <motion.div
          key="editing"
          className="inline-edit-editor"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {renderEditing
            ? renderEditing(editor.editingValue, updateValue, handleSave, handleCancel)
            : defaultRenderEditing(editor.editingValue, updateValue, handleSave, handleCancel)
          }
        </motion.div>
      ) : (
        <motion.div
          key="display"
          className="inline-edit-display"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        >
          {renderDisplay
            ? renderDisplay(value, handleStartEditing)
            : defaultRenderDisplay(value, handleStartEditing)
          }
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Type assertion para usar el componente genérico
const InlineEditor = InlineEditorComponent as <T extends Record<string, any>>(
  props: InlineEditorProps<T>
) => React.ReactElement;

export default InlineEditor;