/**
 * Utilidades para transformación de datos antes de validación Zod
 * Soluciona problemas de compatibilidad entre frontend y backend
 */

import type { NewMateriaPrima, MateriaPrimaUpdate } from '../../shared/types/materiaPrima'

/**
 * Transforma los datos del formulario para validación Zod
 * Convierte strings a objetos Date y normaliza campos opcionales
 */
export const transformFormDataForValidation = (
  data: NewMateriaPrima | MateriaPrimaUpdate
): NewMateriaPrima | MateriaPrimaUpdate => {
  return {
    ...data,
    fecha_caducidad: transformDateField(data.fecha_caducidad),
    imagen_url: transformOptionalString(data.imagen_url),
    marca: transformOptionalString(data.marca),
    modelo: transformOptionalString(data.modelo),
    descripcion: transformOptionalString(data.descripcion),
    categoria: transformOptionalString(data.categoria),
    proveedor_id: transformOptionalString(data.proveedor_id)
  }
}

/**
 * Transforma un campo de fecha string a Date object
 * Acepta strings formato YYYY-MM-DD, ISO strings, objetos Date y null
 */
export const transformDateField = (value: any): Date | null => {
  // Casos nulos o vacíos
  if (!value || value === '' || value === null || value === undefined) {
    return null
  }

  // Si ya es Date, validar y retornar
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }

  // Si es string, intentar convertir
  if (typeof value === 'string') {
    // Manejar formato YYYY-MM-DD (date input HTML)
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const date = new Date(value + 'T00:00:00.000Z')
      return isNaN(date.getTime()) ? null : date
    }

    // Manejar formato ISO completo
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }

  // Para cualquier otro tipo, retornar null
  return null
}

/**
 * Transforma un campo de texto opcional
 * Convierte strings vacíos a null y hace trim de valores
 */
export const transformOptionalString = (value: any): string | null => {
  // Casos nulos o vacíos
  if (!value || value === '' || value === null || value === undefined) {
    return null
  }

  // Convertir a string y hacer trim
  const stringValue = String(value).trim()

  // Si después del trim queda vacío, retornar null
  if (stringValue === '') {
    return null
  }

  return stringValue
}

/**
 * Transforma campos numéricos opcionales
 * Convierte strings vacíos o inválidos a null
 */
export const transformOptionalNumber = (value: any): number | null => {
  // Casos nulos o vacíos
  if (!value || value === '' || value === null || value === undefined) {
    return null
  }

  // Si ya es número, validar
  if (typeof value === 'number') {
    return isNaN(value) ? null : value
  }

  // Si es string, intentar convertir
  if (typeof value === 'string') {
    const trimmedValue = value.trim()
    if (trimmedValue === '') {
      return null
    }

    const parsed = Number(trimmedValue)
    return isNaN(parsed) ? null : parsed
  }

  return null
}

/**
 * Transforma y valida el código de barras
 * Asegura formato válido y hace trim
 */
export const transformCodigoBarras = (value: any): string => {
  if (!value || typeof value !== 'string') {
    throw new Error('El código de barras es requerido y debe ser un texto')
  }

  const trimmed = value.trim()
  if (trimmed === '') {
    throw new Error('El código de barras no puede estar vacío')
  }

  // Validar formato básico (solo números, letras, guiones y guiones bajos)
  if (!/^[A-Za-z0-9\-_]+$/.test(trimmed)) {
    throw new Error('El código de barras solo puede contener letras, números, guiones y guiones bajos')
  }

  if (trimmed.length > 50) {
    throw new Error('El código de barras no puede exceder 50 caracteres')
  }

  return trimmed
}

/**
 * Transforma y valida el nombre del material
 */
export const transformNombre = (value: any): string => {
  if (!value || typeof value !== 'string') {
    throw new Error('El nombre es requerido y debe ser un texto')
  }

  const trimmed = value.trim()
  if (trimmed === '') {
    throw new Error('El nombre no puede estar vacío')
  }

  if (trimmed.length > 255) {
    throw new Error('El nombre no puede exceder 255 caracteres')
  }

  return trimmed
}

/**
 * Transforma y valida la presentación
 */
export const transformPresentacion = (value: any): string => {
  if (!value) {
    throw new Error('La presentación es requerida y debe ser un texto')
  }

  // Convertir a string y limpiar
  let stringValue = value.toString().trim()

  // Si es un ID numérico, necesitamos buscar el nombre real
  if (/^\d+$/.test(stringValue)) {
    // Por ahora, retornamos el ID como string fallback
    // TODO: Implementar lookup de base de datos para obtener el nombre real
    console.log(`⚠️ transformPresentacion: recibió ID ${stringValue}, usando fallback`)
    if (stringValue === '1') stringValue = 'Unidad'
    else if (stringValue === '2') stringValue = 'Caja'
    else if (stringValue === '3') stringValue = 'Paquete'
    else if (stringValue === '4') stringValue = 'Litro'
    else if (stringValue === '5') stringValue = 'Kilogramo'
    else stringValue = `Presentación ID: ${stringValue}`
  }

  if (stringValue === '') {
    throw new Error('La presentación no puede estar vacía')
  }

  if (stringValue.length > 50) {
    throw new Error('La presentación no puede exceder 50 caracteres')
  }

  return stringValue
}

/**
 * Aplica todas las transformaciones necesarias a los datos de materia prima
 * Realiza validaciones básicas y transformación de tipos
 */
export const transformMateriaPrimaData = (
  data: NewMateriaPrima | MateriaPrimaUpdate
): NewMateriaPrima | MateriaPrimaUpdate => {
  try {
    return {
      codigo_barras: transformCodigoBarras(data.codigo_barras),
      nombre: transformNombre(data.nombre),
      marca: transformOptionalString(data.marca),
      modelo: transformOptionalString(data.modelo),
      // Soportar ambos: presentacion (string) o presentacion_id (number/string)
      presentacion: transformPresentacion(
        data.presentacion ||
        data.presentacion_id ||
        ''
      ),
      stock_actual: data.stock_actual !== undefined ? Number(data.stock_actual) : 0,
      stock_minimo: data.stock_minimo !== undefined ? Number(data.stock_minimo) : 0,
      costo_unitario: transformOptionalNumber(data.costo_unitario),
      fecha_caducidad: transformDateField(data.fecha_caducidad),
      imagen_url: transformOptionalString(data.imagen_url),
      descripcion: transformOptionalString(data.descripcion),
      // Soportar ambos: categoria (string) o categoria_id (number/string)
      categoria: transformOptionalString(
        data.categoria ||
        data.categoria_id ||
        null
      ),
      proveedor_id: transformOptionalString(data.proveedor_id),
      // Mantener los IDs originales para referencia
      presentacion_id: data.presentacion_id,
      categoria_id: data.categoria_id
    }
  } catch (error) {
    // Re-lanzar el error para que sea manejado por el caller
    throw error
  }
}

/**
 * Mapea errores de Zod a mensajes más amigables en español
 */
export const mapZodErrorToSpanish = (error: any): string => {
  if (!error || !error.message) {
    return 'Error de validación desconocido'
  }

  const message = error.message.toLowerCase()

  // Mapeo de errores comunes
  const errorMap: Record<string, string> = {
    'expected date': 'Por favor ingresa una fecha válida',
    'invalid date': 'La fecha ingresada no es válida',
    'invalid url': 'La URL de la imagen no es válida',
    'url de imagen inválida': 'La URL de la imagen no es válida o está vacía',
    'required': 'Este campo es obligatorio',
    'invalid_string': 'El texto ingresado no es válido',
    'too_small': 'El valor es demasiado pequeño',
    'too_big': 'El valor es demasiado grande',
    'invalid_type': 'El tipo de dato no es válido'
  }

  // Buscar coincidencias parciales
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) {
      return value
    }
  }

  // Retornar mensaje original si no hay mapeo
  return error.message
}