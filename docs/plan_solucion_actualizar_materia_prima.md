# Plan de Implementación: Solución Botón Actualizar Materia Prima

## 🎯 Problema Identificado

El botón de actualizar no funciona en la sección `/materia-prima/editar/:id` debido a errores de validación en el backend:

- **Error de fecha**: `"expected date"` - el frontend envía string ISO (`'2024-12-31'`) pero el backend Zod schema espera `Date | null`
- **Error de URL**: `"URL de imagen inválida"` - el backend rechaza strings vacíos en campo URL opcional que debería aceptar `null`

## 🔍 Análisis de Causa Raíz

### Data Flow Actual (Roto):
```
Frontend Form → String Data → IPC Handler → Repository → Zod Validation → ❌ Error
                                    ↓
                            SIN CAPA DE TRANSFORMACIÓN
```

### Problemas Específicos:
1. **`fecha_caducidad`**: HTML date input produce string, backend espera Date object
2. **`imagen_url`**: Frontend envía `''` (empty string), backend Zod `.url()` rechaza vacíos
3. **Campos opcionales**: Empty strings vs null inconsistency

## 🏗️ Solución Dual-Layer Strategy

Respaldada por el análisis de 8 agentes de estrategia diferentes, con consenso mayoritario (6/8 agentes).

### Layer 1: Backend Data Transformation

#### Archivo: `backend/utils/dataTransform.ts` (NUEVO)
```typescript
// Utilidades para transformación de datos antes de validación Zod
export const transformFormDataForValidation = (data: any) => ({
  ...data,
  fecha_caducidad: transformDateField(data.fecha_caducidad),
  imagen_url: transformOptionalString(data.imagen_url),
  marca: transformOptionalString(data.marca),
  modelo: transformOptionalString(data.modelo),
  descripcion: transformOptionalString(data.descripcion),
  categoria: transformOptionalString(data.categoria),
  proveedor_id: transformOptionalString(data.proveedor_id)
})

const transformDateField = (value: any): Date | null => {
  if (!value || value === '' || value === null) return null
  if (value instanceof Date) return value
  if (typeof value === 'string') {
    const date = new Date(value)
    return isNaN(date.getTime()) ? null : date
  }
  return null
}

const transformOptionalString = (value: any): string | null => {
  if (!value || value === '' || value === null) return null
  return String(value).trim()
}
```

#### Archivo: `backend/repositories/materiaPrimaRepo.ts`
```typescript
// Aplicar transformación antes de validación Zod
async create(data: NewMateriaPrima, usuarioId?: string): Promise<MateriaPrimaDetail> {
  try {
    // Transformar datos antes de validación
    const transformedData = transformFormDataForValidation(data)

    // Validar con Zod schema mejorado
    const validatedData = materiaPrimaSchema.parse(transformedData)

    // Resto del código existente...
  } catch (error) {
    // Enhanced error handling...
  }
}
```

### Layer 2: Frontend Form Data Normalization

#### Archivo: `apps/electron-renderer/src/utils/formDataNormalizer.ts` (NUEVO)
```typescript
// Normalización de datos del formulario antes de enviar IPC
export const normalizeFormDataForIPC = (formData: any) => ({
  ...formData,
  fecha_caducidad: normalizeDateForIPC(formData.fecha_caducidad),
  imagen_url: normalizeOptionalField(formData.imagen_url),
  marca: normalizeOptionalField(formData.marca),
  modelo: normalizeOptionalField(formData.modelo),
  descripcion: normalizeOptionalField(formData.descripcion),
  categoria: normalizeOptionalField(formData.categoria),
  proveedor_id: normalizeOptionalField(formData.proveedor_id)
})

const normalizeDateForIPC = (value: any): string | null => {
  if (!value || value === '' || value === null) return null
  if (value instanceof Date) {
    return value.toISOString().split('T')[0] // YYYY-MM-DD format
  }
  return String(value)
}

const normalizeOptionalField = (value: any): string | null => {
  if (!value || value === '' || value === null) return null
  return String(value).trim()
}
```

#### Archivo: `apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx`
```typescript
// En handleSubmit(), antes de enviar IPC
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateForm()) {
    return
  }

  try {
    // 🔥 NUEVO: Normalizar datos antes de enviar
    const normalizedData = normalizeFormDataForIPC(formData)

    let materialGuardado: MateriaPrimaDetail

    if (esEdicion && finalId) {
      materialGuardado = await actualizarMaterial(finalId, normalizedData as MateriaPrimaUpdate)
    } else {
      materialGuardado = await crearMaterial(normalizedData as NewMateriaPrima)
    }

    // Resto del código existente...
  } catch (err) {
    // Enhanced error mapping...
    mapBackendValidationErrors(err)
  }
}
```

### Layer 3: Enhanced Error Handling

#### Mapeo de Errores Backend → Frontend
```typescript
// En Formulario.tsx
const mapBackendValidationErrors = (error: any) => {
  if (error.issues) { // Zod error format
    const fieldErrors: Record<string, string> = {}
    error.issues.forEach((issue: any) => {
      const fieldName = issue.path[0]
      const userMessage = translateZodError(issue.message)
      fieldErrors[fieldName] = userMessage
    })
    setFieldErrors(fieldErrors)
  }
}

const translateZodError = (zodMessage: string): string => {
  const translations: Record<string, string> = {
    'Expected date': 'Por favor ingresa una fecha válida',
    'Invalid url': 'La URL de la imagen no es válida o está vacía',
    'Required': 'Este campo es obligatorio'
  }
  return translations[zodMessage] || zodMessage
}
```

## 📋 Archivos a Modificar

### Archivos Existentes a Modificar:
1. **`backend/repositories/materiaPrimaRepo.ts`**
   - Importar utilidades de transformación
   - Aplicar transformación antes de validación Zod
   - Mejorar manejo de errores

2. **`apps/electron-renderer/src/modules/materiaPrima/Formulario.tsx`**
   - Importar normalizador de datos
   - Aplicar normalización en `handleSubmit()`
   - Implementar mapeo de errores mejorado

### Archivos Nuevos a Crear:
3. **`backend/utils/dataTransform.ts`**
   - Utilidades de transformación de datos para backend
   - Funciones específicas para cada tipo de dato

4. **`apps/electron-renderer/src/utils/formDataNormalizer.ts`**
   - Utilidades de normalización para frontend
   - Funciones para preparar datos antes de IPC

## ⏱️ Tiempo Estimado de Implementación

- **Fase 1 (Backend)**: 60 minutos
- **Fase 2 (Frontend)**: 45 minutos
- **Fase 3 (Testing)**: 15 minutos
- **Total**: ~2 horas

## ✅ Resultados Esperados

### Problemas Resueltos:
- ✅ Formulario de actualización funciona sin errores de validación
- ✅ Campo fecha acepta valores vacíos y formatos válidos
- ✅ Campo URL imagen acepta valores vacíos sin error
- ✅ Consistencia de tipos entre frontend y backend
- ✅ Mejor experiencia de usuario con mensajes claros

### Mejoras Adicionales:
- 🔄 Data flow consistente con type safety
- 🛡️ Manejo robusto de errores con contexto español
- 🧪 Código mantenible con separación de responsabilidades
- 📝 Logging mejorado para debugging futuro

## 🧪 Estrategia de Testing

### Casos de Test:
1. **Formulario vacío**: Todos los campos opcionales vacíos
2. **Formulario válido**: Todos los campos con datos válidos
3. **Formulario mixto**: Algunos campos vacíos, otros válidos
4. **Fechas inválidas**: Formatos de fecha incorrectos
5. **URLs inválidas**: URLs malformadas y vacías

### Validación:
- Test manual con Chrome DevTools
- Verificar console sin errores Zod
- Confirmar actualización exitosa en base de datos
- Validar feedback al usuario

## 🚀 Pasos Siguientes

1. **Implementar Layer 1**: Backend transformation utilities
2. **Actualizar Repository**: Aplicar transformaciones y mejorar errores
3. **Implementar Layer 2**: Frontend normalization utilities
4. **Actualizar Formulario**: Aplicar normalización y mapeo de errores
5. **Testing Integral**: Validar todos los casos de uso
6. **Deploy**: Verificar funcionamiento en producción

Este plan aborda la causa raíz del problema mientras mantiene la arquitectura existente y proporciona una base sólida para futuras mejoras en el manejo de formularios.