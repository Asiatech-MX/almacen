/**
 * Inline Validation System for Reference Data
 *
 * Provides independent validation decoupled from main form validation
 * Based on modern React Hook Form and Zod patterns from Context7 documentation
 */

import { z } from 'zod';
import { ReferenceItem } from '@logistica/shared-types';

// Validation error types for better UX
export interface ValidationError {
  code: string;
  message: string;
  path?: string[];
  type: 'error' | 'warning' | 'info';
}

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  info: ValidationError[];
}

// Validation context for async operations
export interface ValidationContext {
  existingItems: ReferenceItem[];
  itemType: 'categoria' | 'presentacion';
  originalItem?: ReferenceItem;
  institutionId: number;
}

// Base validation schemas with custom error messages
const baseSchemas = {
  categoria: z.object({
    nombre: z.string({
      required_error: "El nombre de la categoría es obligatorio",
      invalid_type_error: "El nombre debe ser un texto"
    })
      .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
      .max(100, { message: "El nombre no puede exceder 100 caracteres" })
      .trim()
      .refine(
        (val) => !/^\s*$/.test(val),
        { message: "El nombre no puede estar vacío o contener solo espacios" }
      )
      .refine(
        (val) => !/[<>\"'&]/.test(val),
        { message: "El nombre contiene caracteres no permitidos" }
      ),

    descripcion: z.string({
      invalid_type_error: "La descripción debe ser un texto"
    })
      .max(500, { message: "La descripción no puede exceder 500 caracteres" })
      .trim()
      .optional()
      .nullable(),

    activo: z.boolean({
      invalid_type_error: "El estado debe ser verdadero o falso"
    }).default(true)
  }),

  presentacion: z.object({
    nombre: z.string({
      required_error: "El nombre de la presentación es obligatorio",
      invalid_type_error: "El nombre debe ser un texto"
    })
      .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
      .max(100, { message: "El nombre no puede exceder 100 caracteres" })
      .trim()
      .refine(
        (val) => !/^\s*$/.test(val),
        { message: "El nombre no puede estar vacío o contener solo espacios" }
      )
      .refine(
        (val) => !/[<>\"'&]/.test(val),
        { message: "El nombre contiene caracteres no permitidos" }
      ),

    descripcion: z.string({
      invalid_type_error: "La descripción debe ser un texto"
    })
      .max(500, { message: "La descripción no puede exceder 500 caracteres" })
      .trim()
      .optional()
      .nullable(),

    unidad_medida: z.string({
      required_error: "La unidad de medida es obligatoria",
      invalid_type_error: "La unidad de medida debe ser un texto"
    })
      .min(1, { message: "La unidad de medida es obligatoria" })
      .max(20, { message: "La unidad de medida no puede exceder 20 caracteres" })
      .trim(),

    activo: z.boolean({
      invalid_type_error: "El estado debe ser verdadero o falso"
    }).default(true)
  })
};

// Async validation for duplicates using superRefine pattern
const createAsyncValidationSchema = (
  context: ValidationContext,
  isAsync: boolean = true
) => {
  const baseSchema = baseSchemas[context.itemType];

  if (!isAsync) {
    return baseSchema;
  }

  return baseSchema.superRefine(async (data, ctx) => {
    const { nombre, existingItems, originalItem, itemType } = context;

    // Check for duplicates (case-insensitive)
    const normalizedName = nombre.trim().toLowerCase();
    const duplicateCheck = existingItems.find(item =>
      item.nombre.trim().toLowerCase() === normalizedName &&
      item.id !== originalItem?.id
    );

    if (duplicateCheck) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Ya existe una ${itemType === 'categoria' ? 'categoría' : 'presentación'} con el nombre "${nombre}"`,
        path: ['nombre']
      });
      return z.NEVER;
    }

    // Additional business validations
    if (itemType === 'presentacion' && 'unidad_medida' in data) {
      // Validate unidad_medida format
      const unidadMedida = data.unidad_medida as string;
      if (!/^[a-zA-Z°º³²]+(\s*[a-zA-Z°º³²]+)*$/.test(unidadMedida.trim())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "La unidad de medida solo puede contener letras y símbolos comunes (kg, m, L, °C, etc.)",
          path: ['unidad_medida']
        });
      }
    }
  });
};

// Real-time validation with debouncing
export class InlineValidator {
  private validationCache = new Map<string, ValidationResult>();
  private debounceTimeouts = new Map<string, NodeJS.Timeout>();

  constructor(private context: ValidationContext) {}

  // Synchronous validation for immediate feedback
  validateSync(data: unknown, field?: string): ValidationResult {
    const cacheKey = this.getCacheKey(data, false);

    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    try {
      const schema = createAsyncValidationSchema(this.context, false);
      const result = schema.safeParse(data);

      if (result.success) {
        const validationResult: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          info: []
        };

        this.validationCache.set(cacheKey, validationResult);
        return validationResult;
      } else {
        const validationResult = this.formatZodErrors(result.error, field);
        this.validationCache.set(cacheKey, validationResult);
        return validationResult;
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'validation_error',
          message: 'Error en la validación',
          type: 'error'
        }],
        warnings: [],
        info: []
      };
    }
  }

  // Asynchronous validation for comprehensive checks
  async validateAsync(data: unknown, field?: string): Promise<ValidationResult> {
    const cacheKey = this.getCacheKey(data, true);

    if (this.validationCache.has(cacheKey)) {
      return this.validationCache.get(cacheKey)!;
    }

    try {
      const schema = createAsyncValidationSchema(this.context, true);
      const result = await schema.safeParseAsync(data);

      if (result.success) {
        const validationResult: ValidationResult = {
          isValid: true,
          errors: [],
          warnings: [],
          info: []
        };

        this.validationCache.set(cacheKey, validationResult);
        return validationResult;
      } else {
        const validationResult = this.formatZodErrors(result.error, field);
        this.validationCache.set(cacheKey, validationResult);
        return validationResult;
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [{
          code: 'async_validation_error',
          message: 'Error en la validación asíncrona',
          type: 'error'
        }],
        warnings: [],
        info: []
      };
    }
  }

  // Debounced validation for better UX during typing
  validateDebounced(
    data: unknown,
    delay: number = 300,
    field?: string,
    callback?: (result: ValidationResult) => void
  ): void {
    const cacheKey = this.getCacheKey(data, true);

    // Clear existing timeout for this field
    if (this.debounceTimeouts.has(cacheKey)) {
      clearTimeout(this.debounceTimeouts.get(cacheKey)!);
    }

    // Set new timeout
    const timeout = setTimeout(async () => {
      const result = await this.validateAsync(data, field);
      callback?.(result);
      this.debounceTimeouts.delete(cacheKey);
    }, delay);

    this.debounceTimeouts.set(cacheKey, timeout);
  }

  // Validate a specific field
  validateField(fieldName: string, value: unknown): ValidationResult {
    const partialData = { [fieldName]: value };
    return this.validateSync(partialData, fieldName);
  }

  // Clear validation cache
  clearCache(): void {
    this.validationCache.clear();

    // Clear all pending timeouts
    this.debounceTimeouts.forEach(timeout => clearTimeout(timeout));
    this.debounceTimeouts.clear();
  }

  // Update validation context
  updateContext(newContext: Partial<ValidationContext>): void {
    this.context = { ...this.context, ...newContext };
    this.clearCache();
  }

  // Helper methods
  private formatZodErrors(zodError: z.ZodError, field?: string): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];
    const info: ValidationError[] = [];

    zodError.issues.forEach(issue => {
      const validationError: ValidationError = {
        code: issue.code,
        message: issue.message,
        path: issue.path,
        type: 'error'
      };

      // Filter by field if specified
      if (!field || issue.path.includes(field)) {
        // Determine severity based on error code
        if (issue.code === z.ZodIssueCode.custom) {
          errors.push(validationError);
        } else if (issue.code === z.ZodIssueCode.invalid_type) {
          errors.push(validationError);
        } else {
          warnings.push({ ...validationError, type: 'warning' });
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info
    };
  }

  private getCacheKey(data: unknown, isAsync: boolean): string {
    return `${this.context.itemType}-${JSON.stringify(data)}-${isAsync ? 'async' : 'sync'}`;
  }
}

// Factory function for creating validators
export const createInlineValidator = (
  itemType: 'categoria' | 'presentacion',
  existingItems: ReferenceItem[],
  originalItem?: ReferenceItem,
  institutionId: number = 1
): InlineValidator => {
  const context: ValidationContext = {
    itemType,
    existingItems,
    originalItem,
    institutionId
  };

  return new InlineValidator(context);
};

// Utility functions for common validation patterns
export const ValidationUtils = {
  // Check if string is empty or whitespace only
  isEmptyOrWhitespace: (value: string): boolean => {
    return !value || /^\s*$/.test(value);
  },

  // Check for dangerous characters
  hasUnsafeCharacters: (value: string): boolean => {
    return /[<>\"'&]/.test(value);
  },

  // Normalize string for comparison
  normalizeForComparison: (value: string): string => {
    return value.trim().toLowerCase();
  },

  // Validate unidad_medida format
  isValidUnidadMedida: (unidad: string): boolean => {
    return /^[a-zA-Z°º³²]+(\s*[a-zA-Z°º³²]+)*$/.test(unidad.trim());
  },

  // Get field-specific error messages
  getFieldErrorMessage: (field: string, error: ValidationError): string => {
    const fieldMessages: Record<string, string> = {
      nombre: {
        required_error: "El nombre es obligatorio",
        invalid_type_error: "El nombre debe ser un texto",
        too_small: "El nombre es demasiado corto",
        too_big: "El nombre es demasiado largo",
        custom: error.message
      },
      descripcion: {
        too_big: "La descripción es demasiado larga",
        custom: error.message
      },
      unidad_medida: {
        required_error: "La unidad de medida es obligatoria",
        invalid_type_error: "La unidad de medida debe ser un texto",
        custom: error.message
      }
    };

    return fieldMessages[field]?.[error.code] || error.message;
  }
};