// Sistema de Patrones de Error para Materia Prima
// Implementa Pattern Matching para clasificación automática de errores

import {
  MateriaPrimaError,
  crearStockDisponibleError,
  crearMaterialNoEncontradoError,
  crearConexionDatabaseError,
  crearValidacionError,
  crearErrorGenerico,
  generateCorrelationId
} from '../types/materiaPrimaErrors';

// Contexto para creación de errores
interface ErrorContext {
  layer: 'service' | 'hook' | 'component';
  idMaterial?: string;
  nombreMaterial?: string;
  stockActual?: number;
  campo?: string;
  valor?: any;
  detallesAdicionales?: string;
}

// Interfaz para patrón de error
interface ErrorPattern {
  // Regex para identificar el patrón
  pattern: RegExp;
  // Función que crea el error específico
  createError: (originalError: Error, context: ErrorContext) => MateriaPrimaError;
  // Prioridad del patrón (mayor = más específico)
  priority: number;
}

// Definición de patrones de error
export const ERROR_PATTERNS: Record<string, ErrorPattern> = {
  // Patrones de stock disponible
  STOCK_DISPONIBLE: {
    pattern: /No se puede eliminar.*stock.*disponible|no puede eliminar.*stock|material con stock|existen unidades/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'STOCK_DISPONIBLE',
      message: originalError.message,
      userMessage: 'No se puede eliminar el material porque tiene stock disponible',
      suggestedAction: 'Primero debe realizar las salidas correspondientes para agotar el stock',
      stockActual: context.stockActual || 0,
      idMaterial: context.idMaterial || '',
      nombreMaterial: context.nombreMaterial || 'Material sin identificar',
      severity: 'warning',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 10 // Alta prioridad, muy específico
  },

  STOCK_REFERENCIADO: {
    pattern: /referencia.*stock|stock.*referencia|dependencias.*stock/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'STOCK_DISPONIBLE',
      message: originalError.message,
      userMessage: 'No se puede eliminar el material porque tiene referencias de stock',
      suggestedAction: 'Verifique las salidas de material o desactive el material',
      stockActual: context.stockActual || 1,
      idMaterial: context.idMaterial || '',
      nombreMaterial: context.nombreMaterial || 'Material sin identificar',
      severity: 'warning',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 9
  },

  // Patrones de material no encontrado
  MATERIAL_NO_ENCONTRADO: {
    pattern: /no encontrado|not found|no existe|material.*[0-9]+.*no existe/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'MATERIAL_NO_ENCONTRADO',
      message: originalError.message,
      userMessage: 'El material no existe en el sistema',
      suggestedAction: 'Verifique el ID del material o recargue la lista',
      idMaterial: context.idMaterial || '',
      severity: 'error',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 8
  },

  REGISTRO_NO_ENCONTRADO: {
    pattern: /registro.*no encontrado|record.*not found|fila.*no existe/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'MATERIAL_NO_ENCONTRADO',
      message: originalError.message,
      userMessage: 'No se encontró el registro del material',
      suggestedAction: 'El material puede haber sido eliminado por otro usuario',
      idMaterial: context.idMaterial || '',
      severity: 'error',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 7
  },

  // Patrones de conexión a base de datos
  CONEXION_DATABASE: {
    pattern: /connection|database|timeout|conexión|base de datos|ECONNREFUSED|ENOTFOUND/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'CONEXION_DATABASE',
      message: originalError.message,
      userMessage: 'Error de conexión con la base de datos',
      suggestedAction: 'Verifique su conexión e intente nuevamente',
      detalles: context.detallesAdicionales || originalError.message,
      severity: 'error',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 6
  },

  CONEXION_PERDIDA: {
    pattern: /connection.*lost|conexión.*perdida|disconnect|se desconectó/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'CONEXION_DATABASE',
      message: originalError.message,
      userMessage: 'Se perdió la conexión con la base de datos',
      suggestedAction: 'Reinicie la aplicación o verifique la conexión',
      detalles: context.detallesAdicionales || originalError.message,
      severity: 'error',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 5
  },

  // Patrones de validación
  VALIDACION_CAMPO_VACIO: {
    pattern: /campo.*vacío|field.*empty|required.*missing|obligatorio/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'VALIDACION_ERROR',
      message: originalError.message,
      userMessage: 'Hay campos obligatorios que no han sido completados',
      suggestedAction: 'Complete todos los campos requeridos',
      campo: context.campo || 'desconocido',
      valor: context.valor || null,
      severity: 'error',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 4
  },

  VALIDACION_FORMATO: {
    pattern: /formato.*inválido|invalid.*format|invalid.*input/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'VALIDACION_ERROR',
      message: originalError.message,
      userMessage: 'El formato de los datos ingresados no es válido',
      suggestedAction: 'Verifique el formato de los datos ingresados',
      campo: context.campo || 'desconocido',
      valor: context.valor || null,
      severity: 'error',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 3
  },

  // Patrones de restricciones
  RESTRICCION_FORANEA: {
    pattern: /foreign.*key|constraint.*violation|llave.*foránea|referencia/i,
    createError: (originalError: Error, context: ErrorContext) => ({
      type: 'STOCK_DISPONIBLE',
      message: originalError.message,
      userMessage: 'No se puede eliminar el material porque tiene referencias asociadas',
      suggestedAction: 'Elimine primero las referencias o desactive el material',
      stockActual: 1, // Indicador de que hay referencias
      idMaterial: context.idMaterial || '',
      nombreMaterial: context.nombreMaterial || 'Material con referencias',
      severity: 'warning',
      timestamp: new Date(),
      layer: context.layer,
      correlationId: generateCorrelationId()
    }),
    priority: 2
  }
};

/**
 * Clasifica un error genérico usando pattern matching
 */
export const clasificarError = (
  error: Error,
  context: Partial<ErrorContext> = {}
): MateriaPrimaError | null => {
  const mensajeCompleto = error.message.toLowerCase();

  // Obtener todos los patrones y ordenar por prioridad
  const patronesOrdenados = Object.entries(ERROR_PATTERNS)
    .sort(([, a], [, b]) => b.priority - a.priority);

  // Buscar coincidencia con patrones
  for (const [nombre, patron] of patronesOrdenados) {
    if (patron.pattern.test(mensajeCompleto)) {
      // Crear contexto completo
      const contextoCompleto: ErrorContext = {
        layer: context.layer || 'service',
        idMaterial: context.idMaterial,
        nombreMaterial: context.nombreMaterial,
        stockActual: context.stockActual,
        campo: context.campo,
        valor: context.valor,
        detallesAdicionales: context.detallesAdicionales
      };

      try {
        return patron.createError(error, contextoCompleto);
      } catch (createError) {
        console.warn(`Error al crear error para patrón ${nombre}:`, createError);
        // Continuar con siguiente patrón si hay error en la creación
        continue;
      }
    }
  }

  return null; // No se encontró coincidencia
};

/**
 * Clasifica un error con fallback a error genérico
 */
export const clasificarErrorConFallback = (
  error: Error,
  context: Partial<ErrorContext> = {}
): MateriaPrimaError => {
  const errorClasificado = clasificarError(error, context);

  if (errorClasificado) {
    return errorClasificado;
  }

  // Fallback: crear error genérico
  const contextoCompleto: ErrorContext = {
    layer: context.layer || 'service',
    idMaterial: context.idMaterial,
    nombreMaterial: context.nombreMaterial,
    detallesAdicionales: context.detallesAdicionales
  };

  return crearErrorGenerico(error.message, contextoCompleto.layer);
};

/**
 * Extrae información contextual del mensaje de error
 */
export const extraerContextoDelError = (error: Error): Partial<ErrorContext> => {
  const contexto: Partial<ErrorContext> = {};
  const mensaje = error.message;

  // Extraer ID de material si existe (patrón común: UUID o números)
  const matchId = mensaje.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})|(\d{5,})/i);
  if (matchId) {
    contexto.idMaterial = matchId[0];
  }

  // Extraer cantidad de stock si existe
  const matchStock = mensaje.match(/(\d+)\s*(unidades|items|piezas)/i);
  if (matchStock) {
    contexto.stockActual = parseInt(matchStock[1], 10);
  }

  // Extraer nombre de material si está entre comillas
  const matchNombre = mensaje.match(/["']([^"']+)["']/);
  if (matchNombre) {
    contexto.nombreMaterial = matchNombre[1];
  }

  return contexto;
};

/**
 * Procesa un error completo: extrae contexto y clasifica
 */
export const procesarError = (
  error: Error,
  layer: 'service' | 'hook' | 'component' = 'service'
): MateriaPrimaError => {
  // Extraer contexto del mensaje
  const contextoExtraido = extraerContextoDelError(error);

  // Combinar con el layer proporcionado
  const contextoCompleto: Partial<ErrorContext> = {
    ...contextoExtraido,
    layer
  };

  // Clasificar con fallback
  return clasificarErrorConFallback(error, contextoCompleto);
};

/**
 * Verifica si un mensaje de error contiene patrones específicos
 */
export const contienePatron = (mensaje: string, patrones: string[]): boolean => {
  const mensajeLower = mensaje.toLowerCase();
  return patrones.some(patron => mensajeLower.includes(patron.toLowerCase()));
};

/**
 * Obtiene patrones por tipo de error
 */
export const obtenerPatronesPorTipo = (tipoError: keyof typeof ERROR_PATTERNS): ErrorPattern | null => {
  return ERROR_PATTERNS[tipoError] || null;
};

/**
 * Agrega un patrón personalizado
 */
export const agregarPatronPersonalizado = (
  nombre: string,
  patron: ErrorPattern
): void => {
  ERROR_PATTERNS[nombre] = patron;
};

// Exportación de utilidades
export {
  type ErrorContext,
  type ErrorPattern
};

export default {
  ERROR_PATTERNS,
  clasificarError,
  clasificarErrorConFallback,
  extraerContextoDelError,
  procesarError,
  contienePatron,
  obtenerPatronesPorTipo,
  agregarPatronPersonalizado
};