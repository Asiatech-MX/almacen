import { useState, useCallback, useRef, useEffect } from 'react';
import { Categoria, Presentacion, CategoriaUpdate, PresentacionUpdate } from '../../../../packages/shared-types/src/referenceData';
import {
  InlineValidator,
  createInlineValidator,
  ValidationResult,
  ValidationError,
  ValidationContext
} from '../lib/inlineValidation';

// Tipos para el editor inline
export interface InlineEditorState<T = Categoria | Presentacion> {
  isEditing: boolean;
  editingValue: T | null;
  originalValue: T | null;
  loading: boolean;
  error: string | null;
  hasChanges: boolean;
  validationResults: ValidationResult;
  fieldErrors: Record<string, ValidationError[]>;
  isValidating: boolean;
  // Enhanced accessibility state
  focusedField: string | null;
  fieldOrder: string[];
  history: T[];
  historyIndex: number;
  canUndo: boolean;
  canRedo: boolean;
}

export interface InlineEditorConfig {
  validateOnBlur?: boolean;
  autoSave?: boolean;
  debounceMs?: number;
  enableKeyboardShortcuts?: boolean;
  enableRealTimeValidation?: boolean;
  enableAsyncValidation?: boolean;
  validationDebounceMs?: number;
  // Enhanced accessibility options
  enableAdvancedShortcuts?: boolean;
  enableFocusTrapping?: boolean;
  enableArrowNavigation?: boolean;
  undoWithCtrlZ?: boolean;
  saveWithCtrlS?: boolean;
}

export interface InlineEditorActions<T = Categoria | Presentacion> {
  startEditing: (item: T) => void;
  cancelEditing: () => void;
  saveEditing: () => Promise<{ success: boolean; error?: string }>;
  updateValue: (field: keyof T, value: any) => void;
  setEditing: (editing: boolean) => void;
  clearError: () => void;
  validateField: (field: string, value: any) => ValidationResult;
  validateAll: () => Promise<ValidationResult>;
  clearValidation: () => void;
  getFieldError: (field: string) => ValidationError | null;
  hasFieldError: (field: string) => boolean;
  // Enhanced accessibility actions
  undoChanges: () => void;
  redoChanges: () => void;
  navigateToNextField: () => void;
  navigateToPreviousField: () => void;
  focusField: (fieldName: string) => void;
}

export type InlineEditorHook<T = Categoria | Presentacion> =
  InlineEditorState<T> &
  InlineEditorActions<T>;

interface UseInlineEditorOptions {
  onSave?: (item: T) => Promise<{ success: boolean; data?: T; error?: string }>;
  config?: InlineEditorConfig;
  validationContext?: {
    itemType: 'categoria' | 'presentacion';
    existingItems: T[];
    institutionId?: number;
  };
}

const DEFAULT_CONFIG: InlineEditorConfig = {
  validateOnBlur: true,
  autoSave: false,
  debounceMs: 300,
  enableKeyboardShortcuts: true,
  enableRealTimeValidation: true,
  enableAsyncValidation: true,
  validationDebounceMs: 400,
  // Enhanced accessibility defaults
  enableAdvancedShortcuts: true,
  enableFocusTrapping: true,
  enableArrowNavigation: true,
  undoWithCtrlZ: true,
  saveWithCtrlS: true
};

export function useInlineEditor<T = Categoria | Presentacion>({
  onSave,
  config = {},
  validationContext
}: UseInlineEditorOptions = {}): InlineEditorHook<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Create validator instance if validation context is provided
  const validatorRef = useRef<InlineValidator | null>(null);

  if (validationContext && !validatorRef.current) {
    validatorRef.current = createInlineValidator(
      validationContext.itemType,
      validationContext.existingItems,
      undefined, // Will be set when editing starts
      validationContext.institutionId
    );
  }

  const [state, setState] = useState<InlineEditorState<T>>({
    isEditing: false,
    editingValue: null,
    originalValue: null,
    loading: false,
    error: null,
    hasChanges: false,
    validationResults: {
      isValid: true,
      errors: [],
      warnings: [],
      info: []
    },
    fieldErrors: {},
    isValidating: false,
    // Enhanced accessibility state
    focusedField: null,
    fieldOrder: [],
    history: [],
    historyIndex: -1,
    canUndo: false,
    canRedo: false
  });

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const fieldRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const previousFocusedElementRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (state.isEditing && inputRef.current) {
      inputRef.current.focus();
      // Select all text for easy editing
      if (inputRef.current.select) {
        inputRef.current.select();
      }
    }
  }, [state.isEditing]);

  // Enhanced keyboard shortcuts with focus management
  useEffect(() => {
    if (!finalConfig.enableKeyboardShortcuts || !state.isEditing) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      // Target element for context-aware shortcuts
      const target = event.target as HTMLElement;
      const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';

      // Prevent propagation for custom shortcuts
      if (isInputElement || target.closest('[data-inline-editor]')) {
        // Basic shortcuts (always enabled)
        if (event.key === 'Enter' && !event.shiftKey && isInputElement) {
          event.preventDefault();
          saveEditing();
          return;
        }

        if (event.key === 'Escape') {
          event.preventDefault();
          cancelEditing();
          return;
        }

        // Advanced shortcuts (Ctrl/Cmd combinations)
        if (finalConfig.enableAdvancedShortcuts && (event.ctrlKey || event.metaKey)) {
          switch (event.key.toLowerCase()) {
            case 's':
              if (finalConfig.saveWithCtrlS) {
                event.preventDefault();
                saveEditing();
                return;
              }
              break;
            case 'z':
              if (finalConfig.undoWithCtrlZ && !event.shiftKey) {
                event.preventDefault();
                undoChanges();
                return;
              }
              break;
            case 'y':
              if (finalConfig.undoWithCtrlZ) {
                event.preventDefault();
                redoChanges();
                return;
              }
              break;
            case 'a':
              if (isInputElement) {
                // Allow select all in inputs
                return;
              }
              break;
          }
        }

        // Arrow key navigation between fields
        if (finalConfig.enableArrowNavigation && isInputElement) {
          switch (event.key) {
            case 'ArrowDown':
            case 'ArrowRight':
              event.preventDefault();
              navigateToNextField();
              return;
            case 'ArrowUp':
            case 'ArrowLeft':
              event.preventDefault();
              navigateToPreviousField();
              return;
          }
        }

        // Tab navigation with focus trapping
        if (finalConfig.enableFocusTrapping && event.key === 'Tab') {
          const container = containerRef.current;
          if (container && container.contains(target)) {
            const focusableElements = container.querySelectorAll(
              'input:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );

            if (focusableElements.length > 0) {
              const currentIndex = Array.from(focusableElements).indexOf(target as HTMLElement);
              let nextIndex;

              if (event.shiftKey) {
                nextIndex = currentIndex <= 0 ? focusableElements.length - 1 : currentIndex - 1;
              } else {
                nextIndex = currentIndex >= focusableElements.length - 1 ? 0 : currentIndex + 1;
              }

              event.preventDefault();
              (focusableElements[nextIndex] as HTMLElement).focus();
              return;
            }
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true); // Use capture for better control
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [
    state.isEditing,
    state.hasChanges,
    state.focusedField,
    finalConfig.enableKeyboardShortcuts,
    finalConfig.enableAdvancedShortcuts,
    finalConfig.enableFocusTrapping,
    finalConfig.enableArrowNavigation,
    finalConfig.saveWithCtrlS,
    finalConfig.undoWithCtrlZ
  ]);

  // Enhanced navigation and history functions
  const undoChanges = useCallback(() => {
    if (!state.canUndo || state.historyIndex <= 0) return;

    const newIndex = state.historyIndex - 1;
    const previousValue = state.history[newIndex];

    setState(prev => ({
      ...prev,
      editingValue: { ...previousValue },
      historyIndex: newIndex,
      canUndo: newIndex > 0,
      canRedo: true,
      hasChanges: true
    }));
  }, [state.canUndo, state.historyIndex, state.history]);

  const redoChanges = useCallback(() => {
    if (!state.canRedo || state.historyIndex >= state.history.length - 1) return;

    const newIndex = state.historyIndex + 1;
    const nextValue = state.history[newIndex];

    setState(prev => ({
      ...prev,
      editingValue: { ...nextValue },
      historyIndex: newIndex,
      canUndo: true,
      canRedo: newIndex < state.history.length - 1,
      hasChanges: true
    }));
  }, [state.canRedo, state.historyIndex, state.history]);

  const navigateToNextField = useCallback(() => {
    if (state.fieldOrder.length === 0) return;

    const currentIndex = state.focusedField
      ? state.fieldOrder.indexOf(state.focusedField)
      : -1;

    const nextIndex = currentIndex >= state.fieldOrder.length - 1 ? 0 : currentIndex + 1;
    const nextField = state.fieldOrder[nextIndex];

    focusField(nextField);
  }, [state.fieldOrder, state.focusedField]);

  const navigateToPreviousField = useCallback(() => {
    if (state.fieldOrder.length === 0) return;

    const currentIndex = state.focusedField
      ? state.fieldOrder.indexOf(state.focusedField)
      : 0;

    const prevIndex = currentIndex <= 0 ? state.fieldOrder.length - 1 : currentIndex - 1;
    const prevField = state.fieldOrder[prevIndex];

    focusField(prevField);
  }, [state.fieldOrder, state.focusedField]);

  const focusField = useCallback((fieldName: string) => {
    const fieldRef = fieldRefs.current[fieldName];
    if (fieldRef) {
      fieldRef.focus();

      // Select text for input fields
      if (fieldRef.tagName === 'INPUT' || fieldRef.tagName === 'TEXTAREA') {
        fieldRef.select();
      }

      setState(prev => ({ ...prev, focusedField: fieldName }));
    }
  }, []);

  // Enhanced validation methods
  const validateField = useCallback((field: string, value: any): ValidationResult => {
    if (!validatorRef.current) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
      };
    }

    return validatorRef.current.validateField(field, value);
  }, []);

  const validateAll = useCallback(async (): Promise<ValidationResult> => {
    if (!validatorRef.current || !state.editingValue) {
      return {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
      };
    }

    setState(prev => ({ ...prev, isValidating: true }));

    try {
      const result = finalConfig.enableAsyncValidation
        ? await validatorRef.current!.validateAsync(state.editingValue)
        : validatorRef.current!.validateSync(state.editingValue);

      // Update field errors for display
      const fieldErrors: Record<string, ValidationError[]> = {};
      result.errors.forEach(error => {
        const fieldName = error.path?.[0] as string || 'general';
        if (!fieldErrors[fieldName]) {
          fieldErrors[fieldName] = [];
        }
        fieldErrors[fieldName].push(error);
      });

      setState(prev => ({
        ...prev,
        validationResults: result,
        fieldErrors,
        isValidating: false
      }));

      return result;
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [{
          code: 'validation_failed',
          message: 'Error en la validación',
          type: 'error'
        }],
        warnings: [],
        info: []
      };

      setState(prev => ({
        ...prev,
        validationResults: errorResult,
        isValidating: false
      }));

      return errorResult;
    }
  }, [state.editingValue, finalConfig.enableAsyncValidation]);

  const clearValidation = useCallback(() => {
    setState(prev => ({
      ...prev,
      validationResults: {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
      },
      fieldErrors: {}
    }));

    if (validatorRef.current) {
      validatorRef.current.clearCache();
    }
  }, []);

  const getFieldError = useCallback((field: string): ValidationError | null => {
    return state.fieldErrors[field]?.[0] || null;
  }, [state.fieldErrors]);

  const hasFieldError = useCallback((field: string): boolean => {
    return !!(state.fieldErrors[field]?.length);
  }, [state.fieldErrors]);

  // Debounced validation for real-time feedback
  const debouncedValidate = useCallback((value: T, field?: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!finalConfig.enableRealTimeValidation || !validatorRef.current) {
      return;
    }

    setState(prev => ({ ...prev, isValidating: true }));

    debounceTimerRef.current = setTimeout(() => {
      if (field) {
        // Field-specific validation
        const result = validatorRef.current!.validateField(field, (value as any)[field]);
        setState(prev => ({
          ...prev,
          validationResults: result,
          fieldErrors: {
            ...prev.fieldErrors,
            [field]: result.errors
          },
          isValidating: false
        }));
      } else {
        // Full object validation
        const result = validatorRef.current!.validateSync(value);
        const fieldErrors: Record<string, ValidationError[]> = {};
        result.errors.forEach(error => {
          const fieldName = error.path?.[0] as string || 'general';
          if (!fieldErrors[fieldName]) {
            fieldErrors[fieldName] = [];
          }
          fieldErrors[fieldName].push(error);
        });

        setState(prev => ({
          ...prev,
          validationResults: result,
          fieldErrors,
          isValidating: false
        }));
      }
    }, finalConfig.validationDebounceMs);
  }, [
    finalConfig.enableRealTimeValidation,
    finalConfig.validationDebounceMs
  ]);

  // Legacy validation function for backwards compatibility
  const validateValue = useCallback((value: T): string | null => {
    if (!validatorRef.current) return null;

    const result = validatorRef.current.validateSync(value);
    return result.isValid ? null : result.errors[0]?.message || 'Error de validación';
  }, []);

  // Start editing
  const startEditing = useCallback((item: T) => {
    // Store previously focused element for restoration
    previousFocusedElementRef.current = document.activeElement as HTMLElement;

    // Update validator context with original item for duplicate checking
    if (validatorRef.current && validationContext) {
      validatorRef.current.updateContext({
        originalItem: item
      });
    }

    // Determine field order based on item type
    const fieldOrder = Object.keys(item as any).filter(key =>
      typeof (item as any)[key] === 'string' || typeof (item as any)[key] === 'number'
    );

    setState({
      isEditing: true,
      editingValue: { ...item },
      originalValue: item,
      loading: false,
      error: null,
      hasChanges: false,
      validationResults: {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
      },
      fieldErrors: {},
      isValidating: false,
      // Enhanced accessibility state
      focusedField: fieldOrder[0] || null,
      fieldOrder,
      history: [{ ...item }],
      historyIndex: 0,
      canUndo: false,
      canRedo: false
    });
  }, [validationContext]);

  // Cancel editing with focus restoration
  const cancelEditing = useCallback(() => {
    if (state.loading) return;

    setState({
      isEditing: false,
      editingValue: null,
      originalValue: null,
      loading: false,
      error: null,
      hasChanges: false,
      validationResults: {
        isValid: true,
        errors: [],
        warnings: [],
        info: []
      },
      fieldErrors: {},
      isValidating: false,
      // Reset accessibility state
      focusedField: null,
      fieldOrder: [],
      history: [],
      historyIndex: -1,
      canUndo: false,
      canRedo: false
    });

    // Clear validation cache
    if (validatorRef.current) {
      validatorRef.current.clearCache();
    }

    // Restore focus to previously focused element
    if (previousFocusedElementRef.current && previousFocusedElementRef.current.focus) {
      previousFocusedElementRef.current.focus();
    }
  }, [state.loading]);

  // Save editing
  const saveEditing = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!state.editingValue || !state.originalValue || state.loading) {
      return { success: false, error: 'No hay cambios para guardar' };
    }

    // Enhanced validation before saving
    setState(prev => ({ ...prev, loading: true, error: null, isValidating: true }));

    try {
      // Run comprehensive validation
      const validationResult = await validateAll();

      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors[0]?.message || 'Error de validación';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
          isValidating: false
        }));
        return { success: false, error: errorMessage };
      }

      // If there are warnings, we still proceed but let user know
      if (validationResult.warnings.length > 0) {
        console.warn('Validation warnings:', validationResult.warnings);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en la validación';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        isValidating: false
      }));
      return { success: false, error: errorMessage };
    }

    try {
      if (onSave) {
        const result = await onSave(state.editingValue);

        if (result.success) {
          setState({
            isEditing: false,
            editingValue: null,
            originalValue: null,
            loading: false,
            error: null,
            hasChanges: false
          });
          return { success: true };
        } else {
          setState(prev => ({
            ...prev,
            loading: false,
            error: result.error || 'Error al guardar'
          }));
          return { success: false, error: result.error };
        }
      }

      // Si no hay función onSave, simplemente cerramos el editor
      setState({
        isEditing: false,
        editingValue: null,
        originalValue: null,
        loading: false,
        error: null,
        hasChanges: false
      });
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      return { success: false, error: errorMessage };
    }
  }, [state.editingValue, state.originalValue, state.loading, onSave, validateValue]);

  // Update specific field with history tracking
  const updateValue = useCallback((field: keyof T, value: any) => {
    if (!state.editingValue) return;

    const fieldName = field as string;
    const updatedValue = { ...state.editingValue, [field]: value };

    // Update history for undo/redo functionality
    const newHistory = state.history.slice(0, state.historyIndex + 1);
    newHistory.push({ ...updatedValue });

    setState(prev => ({
      ...prev,
      editingValue: updatedValue,
      hasChanges: true,
      error: null, // Limpiar error al hacer cambios
      history: newHistory,
      historyIndex: newHistory.length - 1,
      canUndo: true,
      canRedo: false
    }));

    // Enhanced real-time validation
    if (finalConfig.enableRealTimeValidation && validatorRef.current) {
      if (finalConfig.validateOnBlur === false) {
        // Immediate validation if not validating on blur
        debouncedValidate(updatedValue, fieldName);
      } else {
        // Validate just the updated field
        validatorRef.current.validateDebounced(
          updatedValue,
          finalConfig.validationDebounceMs,
          fieldName,
          (result) => {
            setState(prev => ({
              ...prev,
              validationResults: result,
              fieldErrors: {
                ...prev.fieldErrors,
                [fieldName]: result.errors
              },
              isValidating: false
            }));
          }
        );
      }
    }
  }, [
    state.editingValue,
    finalConfig.validateOnBlur,
    finalConfig.enableRealTimeValidation,
    finalConfig.validationDebounceMs,
    debouncedValidate
  ]);

  // Set editing state manually
  const setEditing = useCallback((editing: boolean) => {
    if (editing && !state.isEditing && state.originalValue) {
      setState(prev => ({ ...prev, isEditing: true }));
    } else if (!editing) {
      cancelEditing();
    }
  }, [state.isEditing, state.originalValue, cancelEditing]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    ...state,
    startEditing,
    cancelEditing,
    saveEditing,
    updateValue,
    setEditing,
    clearError,
    validateField,
    validateAll,
    clearValidation,
    getFieldError,
    hasFieldError,
    // Enhanced accessibility functions
    undoChanges,
    redoChanges,
    navigateToNextField,
    navigateToPreviousField,
    focusField,
    // Enhanced refs for accessibility
    inputRef,
    fieldRefs,
    containerRef
  };
}