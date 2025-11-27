# Plan de Implementación: Endpoint Específico para Actualización de Estatus

## 📋 Resumen del Problema

Las opciones de habilitar/deshabilitar materiales no funcionan en la aplicación web (http://localhost:5175) pero sí funcionan en Electron, mientras que la función de eliminar funciona correctamente en ambas plataformas.

### 🔍 Causa Raíz Identificada

El problema principal es una **inconsistencia crítica en el contrato API** entre el frontend web y el backend:

| Operación | Frontend Web | Backend | Resultado |
|-----------|--------------|---------|-----------|
| **Actualizar Estatus** | `PUT /api/materiaPrima/actualizar/:id` con `{activo: boolean}` | Espera `PATCH /api/materiaPrima/:id/estatus` con `{estatus: string}` | ❌ **No funciona** |
| **Eliminar** | `DELETE /api/materiaPrima/:id` | `DELETE /api/materiaPrima/eliminar/:id` | ✅ **Funciona** |

## 🎯 Solución Propuesta

Crear un **endpoint específico para actualización de estatus** que resuelva las inconsistencias identificadas.

### Endpoint Propuesto
```
PATCH /api/materiaPrima/:id/estatus
Body: { "estatus": "ACTIVO" | "INACTIVO" }
```

## 📅 Fases de Implementación

---

## **FASE 1: ANÁLISIS Y DIAGNÓSTICO**

### 1.1 Documentación del Problema Actual
- [ ] **Describir inconsistencia entre web y Electron**
  - [ ] Confirmar que habilitar/deshabilitar falla solo en web
  - [ ] Verificar que eliminar funciona en ambas plataformas
  - [ ] Documentar los mensajes de error específicos

### 1.2 Análisis de Archivos Actuales
- [ ] **Examinar WebMateriaPrimaService.ts (líneas 434-471)**
  - [ ] Identificar URL incorrecta: `/materiaPrima/actualizar/${data.id}`
  - [ ] Confirmar método HTTP incorrecto: PUT en lugar de PATCH
  - [ ] Documentar conversión problemática: estatus → activo

- [ ] **Revisar materiaPrimaRoutes.ts**
  - [ ] Verificar rutas existentes y sus métodos HTTP
  - [ ] Confirmar que no existe endpoint específico para estatus
  - [ ] Analizar middleware de validación actual

- [ ] **Analizar smartMateriaPrimaService.actualizarEstatus()**
  - [ ] Comparar implementación web vs Electron
  - [ ] Identificar diferencias en el manejo de datos
  - [ ] Documentar por qué funciona en IPC pero no en HTTP

### 1.3 Identificación de Problemas Específicos
- [ ] **Endpoint Incorrecto**
  - [ ] Documentar URL mismatch: PUT /actualizar vs PATCH /:id/estatus
  - [ ] Verificar que el endpoint llamado no existe

- [ ] **Conversión de Datos Incorrecta**
  - [ ] Documentar conversión: `{estatus: string}` → `{activo: boolean}`
  - [ ] Verificar que backend espera formato diferente

- [ ] **Middleware de Validación Restrictivo**
  - [ ] Analizar validación general que requiere todos los campos
  - [ ] Confirmar que actualización de estatus solo envía campo estatus

---

## **FASE 2: DISEÑO DE LA SOLUCIÓN**

### 2.1 Definición del Nuevo Endpoint
- [ ] **Especificación técnica**
  - [ ] Método: `PATCH /api/materiaPrima/:id/estatus`
  - [ ] Body request: `{"estatus": "ACTIVO" | "INACTIVO"}`
  - [ ] Response exitoso: `200 OK` con material actualizado
  - [ ] Response error: `400, 404, 500` con mensajes descriptivos

- [ ] **Definición de contrato API**
  - [ ] Documentar formato de request/response
  - [ ] Especificar códigos de estado HTTP
  - [ ] Definir estructura de mensajes de error

### 2.2 Diseño de Validaciones
- [ ] **Validación de input**
  - [ ] Validar que `estatus` sea 'ACTIVO' o 'INACTIVO'
  - [ ] Verificar formato del parámetro `id`
  - [ ] Validar tipos de datos

- [ ] **Validación de negocio**
  - [ ] Verificar que el material exista en base de datos
  - [ ] Validar permisos del usuario (si aplica)
  - [ ] Verificar que el estatus actual sea diferente al nuevo

### 2.3 Planificación de Integración
- [ ] **Modificación de WebMateriaPrimaService.ts**
  - [ ] Cambiar URL a `/materiaPrima/${data.id}/estatus`
  - [ ] Cambiar método HTTP a PATCH
  - [ ] Eliminar conversión a booleano (líneas 442-444)
  - [ ] Enviar directamente `{estatus: data.estatus}`

- [ ] **Mantener compatibilidad**
  - [ ] Preservar funcionalidad existente de Electron
  - [ ] Asegurar backward compatibility
  - [ ] Documentar cambios para desarrollo futuro

### 2.4 Consideraciones Adicionales
- [ ] **Manejo de concurrencia**
  - [ ] Prevenir race conditions en actualizaciones simultáneas
  - [ ] Implementar locking si es necesario

- [ ] **Auditoría y logging**
  - [ ] Registrar cambios de estatus
  - [ ] Implementar logs apropiados
  - [ ] Mantener trazabilidad de operaciones

- [ ] **Plan de rollback**
  - [ ] Documentar pasos para revertir cambios
  - [ ] Identificar puntos de verificación

---

## **FASE 3: IMPLEMENTACIÓN DEL BACKEND**

### 3.1 Creación del Endpoint Específico
- [ ] **Agregar ruta en materiaPrimaRoutes.ts**
  - [ ] Implementar `router.patch('/materiaPrima/:id/estatus', [...], actualizarEstatus)`
  - [ ] Importar middleware de validación necesario
  - [ ] Conectar con handler existente o crear nuevo

- [ ] **Implementar middleware de validación**
  - [ ] Validar parámetro `id` (formato numérico)
  - [ ] Validar body `{estatus: 'ACTIVO' | 'INACTIVO'}`
  - [ ] Agregar mensajes de error descriptivos

### 3.2 Implementación del Handler
- [ ] **Lógica principal de actualización**
  - [ ] Verificar existencia del material por ID
  - [ ] Validar valor de estatus
  - [ ] Actualizar campo `estatus` en base de datos
  - [ ] Retornar material actualizado

- [ ] **Manejo de transacciones**
  - [ ] Implementar transacción atómica
  - [ ] Incluir auditoría del cambio
  - [ ] Manejar rollback automático

### 3.3 Manejo de Errores
- [ ] **Códigos de estado HTTP**
  - [ ] `400 Bad Request`: Estatus inválido o formato incorrecto
  - [ ] `404 Not Found`: Material no encontrado
  - [ ] `500 Internal Server Error`: Error de base de datos

- [ ] **Logging y debugging**
  - [ ] Implementar logs estructurados
  - [ ] Incluir contexto en mensajes de error
  - [ ] Agregar métricas de monitoreo

### 3.4 Testing del Backend
- [ ] **Pruebas unitarias**
  - [ ] Test de actualización exitosa
  - [ ] Test de material no encontrado
  - [ ] Test de estatus inválido
  - [ ] Test de concurrencia

- [ ] **Pruebas de integración**
  - [ ] Integración con base de datos real
  - [ ] Test de transacciones
  - [ ] Verificación de auditoría

---

## **FASE 4: IMPLEMENTACIÓN DEL FRONTEND**

### 4.1 Modificación de WebMateriaPrimaService.ts
- [ ] **Actualizar método actualizarEstatus()**
  - [ ] Cambiar URL: `/materiaPrima/actualizar/${data.id}` → `/materiaPrima/${data.id}/estatus`
  - [ ] Cambiar método: `PUT` → `PATCH`
  - [ ] Eliminar líneas 442-444 (conversión a booleano)
  - [ ] Enviar directamente `{estatus: data.estatus}`

- [ ] **Actualizar tipado**
  - [ ] Verificar compatibilidad con `UpdateMateriaPrimaRequest`
  - [ ] Asegurar que tipos estén correctos
  - [ ] Mantener interfaces existentes

### 4.2 Manejo de Errores Mejorado
- [ ] **Actualizar manejo de códigos HTTP**
  - [ ] Manejar específicamente 400, 404, 500
  - [ ] Proporcionar mensajes descriptivos al usuario
  - [ ] Mantener consistencia con errores actuales

- [ ] **Mejorar experiencia de usuario**
  - [ ] Mostrar indicadores de loading apropiados
  - [ ] Proporcionar feedback inmediato
  - [ ] Manejar timeouts de red

### 4.3 Testing del Frontend
- [ ] **Pruebas funcionales**
  - [ ] Test de habilitar material INACTIVO
  - [ ] Test de deshabilitar material ACTIVO
  - [ ] Verificar actualización inmediata de UI

- [ ] **Pruebas de error**
  - [ ] Test con ID inexistente
  - [ ] Test con errores de red
  - [ ] Test de concurrencia

### 4.4 Verificación de Compatibilidad
- [ ] **Asegurar que Electron siga funcionando**
  - [ ] Verificar que smartMateriaPrimaService no se afecte
  - [ ] Confirmar que IPC handler siga operativo
  - [ ] Probar funcionalidad completa en Electron

---

## **FASE 5: PRUEBAS Y VERIFICACIÓN**

### 5.1 Pruebas Funcionales Integrales
- [ ] **Operaciones de estatus en web**
  - [ ] Probar habilitar material INACTIVO → ACTIVO
  - [ ] Probar deshabilitar material ACTIVO → INACTIVO
  - [ ] Verificar actualización inmediata en DataTable
  - [ ] Confirmar actualización en mobile cards

- [ ] **Operaciones de eliminación**
  - [ ] Probar que eliminar materiales INACTIVOS siga funcionando
  - [ ] Verificar que eliminar no se afecte por cambios
  - [ ] Confirmar feedback al usuario

### 5.2 Pruebas de Integración
- [ ] **Concurrencia y estado**
  - [ ] Probar múltiples operaciones simultáneas
  - [ ] Verificar manejo del estado `updatingStatus`
  - [ ] Test de race conditions

- [ ] **Actualización de UI**
  - [ ] Verificar que badges de estatus se actualicen
  - [ ] Confirmar actualización de estadísticas
  - [ ] Test de filtrado por estatus

### 5.3 Pruebas de Error y Edge Cases
- [ ] **Casos de error específicos**
  - [ ] Probar con ID de material inexistente
  - [ ] Probar con estatus inválido en request
  - [ ] Test con usuario sin permisos (si aplica)
  - [ ] Simular errores de red y timeouts

- [ ] **Recuperación de errores**
  - [ ] Verificar manejo adecuado de errores
  - [ ] Probar mensajes de error descriptivos
  - [ ] Confirmar que la aplicación no se rompa

### 5.4 Verificación de Performance y Compatibilidad
- [ ] **Performance**
  - [ ] Medir tiempo de respuesta del nuevo endpoint
  - [ ] Comparar con rendimiento de eliminación
  - [ ] Verificar uso de memoria

- [ ] **Compatibilidad entre plataformas**
  - [ ] Verificar comportamiento idéntico web vs Electron
  - [ ] Probar en diferentes navegadores
  - [ ] Test con diferentes tamaños de pantalla

### 5.5 Documentación y Deploy
- [ ] **Documentación técnica**
  - [ ] Actualizar documentación de API
  - [ ] Documentar cambios en servicios
  - [ ] Crear guía para desarrolladores

- [ ] **Preparación para deploy**
  - [ ] Verificar que todos los tests pasen
  - [ ] Confirmar que no haya regresiones
  - [ ] Preparar notas de release

---

## 📁 Archivos Clave a Modificar

### Backend
- `backend/src/web-api/routes/materiaPrimaRoutes.ts`
- `backend/src/web-api/controllers/materiaPrimaController.ts`
- `backend/src/web-api/middleware/validations/materiaPrimaValidation.ts`

### Frontend
- `apps/electron-renderer/src/services/WebMateriaPrimaService.ts`
- `apps/electron-renderer/src/modules/materiaPrima/GestionMateriaPrimaResponsive.tsx`

### Testing
- `backend/tests/api/materiaPrima.test.ts`
- `apps/electron-renderer/src/__tests__/services/WebMateriaPrimaService.test.ts`

---

## ✅ Criterios de Éxito

- [ ] Las operaciones de habilitar/deshabilitar funcionan consistentemente en la aplicación web
- [ ] No hay regresiones en la funcionalidad existente
- [ ] El comportamiento es idéntico entre web y Electron
- [ ] Todos los tests automatizados pasan
- [ ] La documentación está actualizada
- [ ] El rendimiento es aceptable (< 2 segundos por operación)

---

## 🔄 Plan de Rollback

Si surgieran problemas durante la implementación:

1. **Revertir cambios en WebMateriaPrimaService.ts**
2. **Remover nuevo endpoint del backend**
3. **Restaurar rutas originales**
4. **Verificar que todo vuelva a funcionar como antes**

---

## 📊 Métricas de Monitoreo

- Tiempo de respuesta del endpoint PATCH /materiaPrima/:id/estatus
- Tasa de éxito de operaciones de actualización de estatus
- Comparación de performance web vs Electron
- Número de errores por tipo (400, 404, 500)

---

**Última Actualización:** 25/11/2025
**Responsable:** Equipo de Desarrollo
**Estado:** Planificación Completa - Listo para Implementación