/**
 * Index file for all type adapters
 * Centralizes all adapters for easy imports
 */

// Materia Prima adapters
export {
  MateriaPrimaUnificada,
  adaptKyselyMateriaPrisma,
  adaptLegacyMateriaPrisma,
  adaptToKyselyMateriaPrisma,
  validateMateriaPrismaConsistency
} from './materiaPrima.adapter';

// Proveedores adapters
export {
  ProveedorUnificado,
  adaptKyselyProveedor,
  adaptToKyselyProveedor,
  validateProveedorConsistency
} from './proveedores.adapter';

// Re-exportar tipos de Kysely para conveniencia
export type {
  DB,
  MateriaPrima,
  Proveedor,
  SolicitudCompra,
  Usuario,
  Institucion
} from '../generated/database.types';

// Tipos de utilidad para migración
export interface MigrationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  warnings?: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

// Utilidades comunes para adaptadores
export class AdapterError extends Error {
  constructor(
    message: string,
    public readonly context: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'AdapterError';
  }
}

// Helper para manejar conversiones seguras de tipos
export function safeNumericConversion(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }

  const num = Number(value);
  return isNaN(num) ? null : num;
}

// Helper para convertir strings de fecha
export function safeDateConversion(value: any): Date | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (value instanceof Date) {
    return value;
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}