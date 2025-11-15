/**
 * Utilidades de normalización de datos del formulario antes de enviar IPC
 * Soluciona problemas de compatibilidad entre frontend y backend
 */

import type {
  NewMateriaPrima,
  MateriaPrimaUpdate,
  MateriaPrimaValidationErrors
} from '../../../../shared/types/materiaPrima'

/**
 * Normaliza los datos del formulario antes de enviar por IPC
 * Convierte fechas al formato adecuado y normaliza campos opcionales
 */
export const normalizeFormDataForIPC = (
  data: NewMateriaPrima | MateriaPrimaUpdate
): NewMateriaPrima | MateriaPrimaUpdate => {
  return {
    ...data,
    fecha_caducidad: normalizeDateForIPC(data.fecha_caducidad),
    imagen_url: normalizeOptionalField(data.imagen_url),
    marca: normalizeOptionalField(data.marca),
    modelo: normalizeOptionalField(data.modelo),
    descripcion: normalizeOptionalField(data.descripcion),
    categoria: normalizeOptionalField(data.categoria),
    proveedor_id: normalizeOptionalField(data.proveedor_id)
  }
}

/**
 * Normaliza el campo fecha para IPC
 * Convierte Date a string YYYY-MM-DD o maneja null
 */
export const normalizeDateForIPC = (value: any): string | null => {
  // Casos nulos o vacíos
  if (!value || value === null || value === undefined) {
    return null
  }

  // Si es Date, convertir a formato YYYY-MM-DD
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]
  }

  // Si es string, limpiar y validar formato
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      return null
    }

    // Validar formato YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      return trimmed
    }

    // Intentar convertir string a Date y luego a formato YYYY-MM-DD
    try {
      const date = new Date(trimmed)
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]
      }
    } catch {
      // Si no se puede convertir, retornar null
      return null
    }
  }

  // Para cualquier otro tipo, retornar null
  return null
}

/**
 * Normaliza campos opcionales de texto para IPC
 * Convierte strings vacíos a null y hace trim
 */
export const normalizeOptionalField = (value: any): string | null => {
  // Casos nulos o vacíos
  if (!value || value === null || value === undefined) {
    return null
  }

  // Convertir a string y hacer trim
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed === '' ? null : trimmed
  }

  // Para otros tipos, convertir a string si es posible
  const stringValue = String(value)
  const trimmed = stringValue.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Normaliza y valida el código de barras
 */
export const normalizeCodigoBarras = (value: any): string => {
  if (!value) {
    throw new Error('El código de barras es requerido')
  }

  const stringValue = String(value).trim()
  if (stringValue === '') {
    throw new Error('El código de barras no puede estar vacío')
  }

  if (stringValue.length > 50) {
    throw new Error('El código de barras no puede exceder 50 caracteres')
  }

  return stringValue
}

/**
 * Normaliza y valida el nombre
 */
export const normalizeNombre = (value: any): string => {
  if (!value) {
    throw new Error('El nombre es requerido')
  }

  const stringValue = String(value).trim()
  if (stringValue === '') {
    throw new Error('El nombre no puede estar vacío')
  }

  if (stringValue.length > 255) {
    throw new Error('El nombre no puede exceder 255 caracteres')
  }

  return stringValue
}

/**
 * Normaliza y valida la presentación
 */
export const normalizePresentacion = (value: any): string => {
  if (!value) {
    throw new Error('La presentación es requerida')
  }

  const stringValue = String(value).trim()
  if (stringValue === '') {
    throw new Error('La presentación no puede estar vacía')
  }

  if (stringValue.length > 50) {
    throw new Error('La presentación no puede exceder 50 caracteres')
  }

  return stringValue
}

/**
 * Normaliza campos numéricos opcionales
 */
export const normalizeOptionalNumber = (value: any): number | null => {
  // Casos nulos o vacíos
  if (value === null || value === undefined || value === '') {
    return null
  }

  // Si ya es número, validar
  if (typeof value === 'number') {
    return isNaN(value) ? null : value
  }

  // Si es string, intentar convertir
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') {
      return null
    }

    const parsed = Number(trimmed)
    return isNaN(parsed) ? null : parsed
  }

  return null
}

/**
 * Normaliza campos numéricos obligatorios (stock)
 */
export const normalizeRequiredNumber = (value: any, fieldName: string): number => {
  // Casos vacíos se convierten a 0 para campos de stock
  if (value === null || value === undefined || value === '') {
    return 0
  }

  // Si ya es número, validar
  if (typeof value === 'number') {
    if (isNaN(value)) return 0
    if (value < 0) throw new Error(`${fieldName} no puede ser negativo`)
    return value
  }

  // Si es string, intentar convertir
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed === '') return 0

    const parsed = Number(trimmed)
    if (isNaN(parsed)) return 0
    if (parsed < 0) throw new Error(`${fieldName} no puede ser negativo`)
    return parsed
  }

  return 0
}

/**
 * Aplica todas las normalizaciones necesarias a los datos de materia prima
 * Realiza validaciones básicas y normalización de tipos
 */
export const normalizeMateriaPrimaFormData = (
  data: NewMateriaPrima | MateriaPrimaUpdate
): NewMateriaPrima | MateriaPrimaUpdate => {
  try {
    return {
      codigo_barras: normalizeCodigoBarras(data.codigo_barras),
      nombre: normalizeNombre(data.nombre),
      marca: normalizeOptionalField(data.marca),
      modelo: normalizeOptionalField(data.modelo),
      presentacion: normalizePresentacion(data.presentacion),
      stock_actual: normalizeRequiredNumber(data.stock_actual, 'Stock actual'),
      stock_minimo: normalizeRequiredNumber(data.stock_minimo, 'Stock mínimo'),
      costo_unitario: normalizeOptionalNumber(data.costo_unitario),
      fecha_caducidad: normalizeDateForIPC(data.fecha_caducidad),
      imagen_url: normalizeOptionalField(data.imagen_url),
      descripcion: normalizeOptionalField(data.descripcion),
      categoria: normalizeOptionalField(data.categoria),
      proveedor_id: normalizeOptionalField(data.proveedor_id)
    }
  } catch (error) {
    // Re-lanzar el error para que sea manejado por el componente
    throw error
  }
}

/**
 * Prepara los datos del formulario para enviar al backend
 * Aplica normalización y valida campos obligatorios
 */
export const prepareFormDataForSubmission = (
  formData: any,
  isEdit: boolean = false
): NewMateriaPrima | MateriaPrimaUpdate => {
  try {
    // Normalizar datos
    const normalizedData = normalizeMateriaPrimaFormData(formData)

    // Para edición, incluir solo campos que han cambiado
    if (isEdit) {
      const updateData: MateriaPrimaUpdate = {}

      // Solo incluir campos que tienen valores definidos
      Object.keys(normalizedData).forEach(key => {
        const value = normalizedData[key as keyof typeof normalizedData]
        if (value !== undefined) {
          (updateData as any)[key] = value
        }
      })

      return updateData
    }

    return normalizedData
  } catch (error) {
    throw error
  }
}

/**
 * Mapea errores de backend a estructura de errores de formulario
 */
export const mapBackendErrorToFieldErrors = (
  backendError: string
): MateriaPrimaValidationErrors => {
  const fieldErrors: MateriaPrimaValidationErrors = {}

  // Buscar patrones de errores comunes
  if (backendError.includes('código de barras')) {
    fieldErrors.codigo_barras = 'Error en el código de barras'
  }

  if (backendError.includes('nombre')) {
    fieldErrors.nombre = 'Error en el nombre'
  }

  if (backendError.includes('fecha')) {
    fieldErrors.fecha_caducidad = 'Error en la fecha de caducidad'
  }

  if (backendError.includes('imagen')) {
    fieldErrors.imagen_url = 'Error en la URL de la imagen'
  }

  if (backendError.includes('proveedor')) {
    fieldErrors.proveedor_id = 'Error en el ID del proveedor'
  }

  return fieldErrors
}

/**
 * Extrae mensajes de error específicos de errores de backend
 */
export const extractValidationErrors = (error: any): {
  generalError: string
  fieldErrors: MateriaPrimaValidationErrors
} => {
  const errorMessage = error?.message || error?.toString() || 'Error desconocido'

  // Si es un error de validación con campos específicos
  if (errorMessage.includes('Error de validación:')) {
    const fieldErrors = mapBackendErrorToFieldErrors(errorMessage)
    return {
      generalError: 'Por favor, corrija los errores en el formulario',
      fieldErrors
    }
  }

  // Si es un error general
  return {
    generalError: errorMessage,
    fieldErrors: {}
  }
}