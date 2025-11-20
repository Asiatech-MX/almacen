// Sistema de Tipos de Error para Materia Prima
// Implementación basada en el plan de solución con Pattern Matching + Type Guards

// Interfaz base para todos los errores
interface BaseError {
  timestamp: Date;
  layer: 'service' | 'hook' | 'component';
  correlationId: string;
  message: string;
  userMessage: string;
  suggestedAction: string;
  severity: 'warning' | 'error' | 'info';
}

// Error específico para stock disponible
export interface StockDisponibleError extends BaseError {
  type: 'STOCK_DISPONIBLE';
  stockActual: number;
  idMaterial: string;
  nombreMaterial: string;
}

// Error para material no encontrado
export interface MaterialNoEncontradoError extends BaseError {
  type: 'MATERIAL_NO_ENCONTRADO';
  idMaterial: string;
}

// Error de conexión a base de datos
export interface ConexionDatabaseError extends BaseError {
  type: 'CONEXION_DATABASE';
  detalles?: string;
}

// Error de validación
export interface ValidacionError extends BaseError {
  type: 'VALIDACION_ERROR';
  campo: string;
  valor: any;
}

// Error genérico
export interface ErrorGenerico extends BaseError {
  type: 'ERROR_GENERICO';
  errorOriginal?: string;
}

// Unión de tipos para todos los errores de materia prima
export type MateriaPrimaError =
  | StockDisponibleError
  | MaterialNoEncontradoError
  | ConexionDatabaseError
  | ValidacionError
  | ErrorGenerico;

// Función generadora de correlation ID
export const generateCorrelationId = (): string => {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Type Guards para identificación segura de tipos de error

/**
 * Verifica si el error es de tipo StockDisponibleError
 */
export const esStockDisponibleError = (error: unknown): error is StockDisponibleError => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    error.type === 'STOCK_DISPONIBLE' &&
    'stockActual' in error &&
    'idMaterial' in error &&
    'nombreMaterial' in error
  );
};

/**
 * Verifica si el error es de tipo MaterialNoEncontradoError
 */
export const esMaterialNoEncontradoError = (error: unknown): error is MaterialNoEncontradoError => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    error.type === 'MATERIAL_NO_ENCONTRADO' &&
    'idMaterial' in error
  );
};

/**
 * Verifica si el error es de tipo ConexionDatabaseError
 */
export const esConexionDatabaseError = (error: unknown): error is ConexionDatabaseError => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    error.type === 'CONEXION_DATABASE'
  );
};

/**
 * Verifica si el error es de tipo ValidacionError
 */
export const esValidacionError = (error: unknown): error is ValidacionError => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    error.type === 'VALIDACION_ERROR' &&
    'campo' in error &&
    'valor' in error
  );
};

/**
 * Verifica si el error es de tipo ErrorGenerico
 */
export const esErrorGenerico = (error: unknown): error is ErrorGenerico => {
  return (
    error !== null &&
    typeof error === 'object' &&
    'type' in error &&
    error.type === 'ERROR_GENERICO'
  );
};

/**
 * Verifica si un objeto es un MateriaPrimaError (cualquier tipo)
 */
export const esMateriaPrimaError = (error: unknown): error is MateriaPrimaError => {
  return (
    esStockDisponibleError(error) ||
    esMaterialNoEncontradoError(error) ||
    esConexionDatabaseError(error) ||
    esValidacionError(error) ||
    esErrorGenerico(error)
  );
};

// Utilidades para creación de errores específicos

/**
 * Crea un error de stock disponible
 */
export const crearStockDisponibleError = (
  stockActual: number,
  idMaterial: string,
  nombreMaterial: string,
  layer: 'service' | 'hook' | 'component' = 'service'
): StockDisponibleError => ({
  type: 'STOCK_DISPONIBLE',
  message: `No se puede eliminar el material con ${stockActual} unidades en stock`,
  userMessage: 'No se puede eliminar el material porque tiene stock disponible',
  suggestedAction: 'Primero debe realizar las salidas correspondientes para agotar el stock',
  stockActual,
  idMaterial,
  nombreMaterial: nombreMaterial || 'Material sin identificar',
  severity: 'warning',
  timestamp: new Date(),
  layer,
  correlationId: generateCorrelationId()
});

/**
 * Crea un error de material no encontrado
 */
export const crearMaterialNoEncontradoError = (
  idMaterial: string,
  layer: 'service' | 'hook' | 'component' = 'service'
): MaterialNoEncontradoError => ({
  type: 'MATERIAL_NO_ENCONTRADO',
  message: `Material con ID ${idMaterial} no encontrado`,
  userMessage: 'El material no existe en el sistema',
  suggestedAction: 'Verifique el ID del material o recargue la lista',
  idMaterial,
  severity: 'error',
  timestamp: new Date(),
  layer,
  correlationId: generateCorrelationId()
});

/**
 * Crea un error de conexión a base de datos
 */
export const crearConexionDatabaseError = (
  detalles?: string,
  layer: 'service' | 'hook' | 'component' = 'service'
): ConexionDatabaseError => ({
  type: 'CONEXION_DATABASE',
  message: 'Error de conexión con la base de datos',
  userMessage: 'No se puede conectar con la base de datos',
  suggestedAction: 'Verifique su conexión e intente nuevamente',
  detalles,
  severity: 'error',
  timestamp: new Date(),
  layer,
  correlationId: generateCorrelationId()
});

/**
 * Crea un error de validación
 */
export const crearValidacionError = (
  campo: string,
  valor: any,
  mensaje: string,
  layer: 'service' | 'hook' | 'component' = 'service'
): ValidacionError => ({
  type: 'VALIDACION_ERROR',
  message: mensaje,
  userMessage: `Error de validación en el campo ${campo}`,
  suggestedAction: 'Corrija los datos ingresados',
  campo,
  valor,
  severity: 'error',
  timestamp: new Date(),
  layer,
  correlationId: generateCorrelationId()
});

/**
 * Crea un error genérico
 */
export const crearErrorGenerico = (
  mensajeOriginal: string,
  layer: 'service' | 'hook' | 'component' = 'service'
): ErrorGenerico => ({
  type: 'ERROR_GENERICO',
  message: 'Error al procesar la solicitud',
  userMessage: 'Ha ocurrido un error inesperado',
  suggestedAction: 'Intente nuevamente o contacte soporte técnico',
  errorOriginal: mensajeOriginal,
  severity: 'error',
  timestamp: new Date(),
  layer,
  correlationId: generateCorrelationId()
});

// Exportar la función procesarError desde el archivo de patrones
export { procesarError } from '../utils/errorPatterns';

// Exportación de tipos por defecto
export default MateriaPrimaError;