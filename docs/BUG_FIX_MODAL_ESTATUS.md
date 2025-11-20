# Bug Fix: Modal de Cambio de Estatus

## Problema Identificado

El usuario reportó que al hacer clic en "Deshabilitar" en el menú de acciones de un material, el modal que aparecía mostraba el botón "Habilitar" en lugar de "Deshabilitar", lo cual era confuso e incorrecto.

## Análisis del Problema

### Causa Raíz

El problema se debía a una inconsistencia en los tipos de datos:

1. **Campo en BD**: La tabla `materia_prima` tiene el campo `estatus VARCHAR(50)` con valores 'ACTIVO', 'INACTIVO', 'SUSPENDIDO'
2. **Tipos TypeScript**: El tipo `FindAllMateriaPrimaResult` no incluía el campo `estatus`
3. **Consulta SQL**: La consulta `FindAllMateriaPrima` no seleccionaba el campo `estatus`
4. **Frontend**: El código intentaba acceder a `material.estatus` pero este campo no existía

### Flujo del Bug

1. El frontend intenta mostrar "Deshabilitar" si `material.estatus === 'ACTIVO'`
2. Como `estatus` no existe en los datos, la condición evalúa a `undefined`
3. El fallback muestra "Habilitar" en lugar de "Deshabilitar"

## Solución Implementada

### 1. Actualización de Consulta SQL

**Archivo**: `backend/queries/materiaPrima.sql`

```sql
-- ANTES (sin campo estatus)
SELECT
  mp.id,
  mp.codigo_barras,
  ...
FROM materia_prima mp
WHERE mp.activo = true

-- DESPUÉS (con campo estatus)
SELECT
  mp.id,
  mp.codigo_barras,
  ...
  mp.estatus,
FROM materia_prima mp
-- Sin filtro WHERE para incluir todos los estatus
```

### 2. Actualización de Tipos TypeScript

**Archivo**: `backend/types/generated/materiaPrima.types.ts`

```typescript
// ANTES
export interface FindAllMateriaPrimaResult {
  id: string
  codigo_barras: string
  nombre: string
  // ... otros campos SIN estatus
}

// DESPUÉS
export interface FindAllMateriaPrimaResult {
  id: string
  codigo_barras: string
  nombre: string
  // ... otros campos
  estatus: string  // <-- Campo agregado
}
```

### 3. Lógica del Modal (Ya estaba correcta)

El código del modal estaba bien escrito:

```tsx
<DialogTitle>
  {selectedMaterial?.estatus === 'ACTIVO' ? '🔒 Deshabilitar Material' : '✅ Habilitar Material'}
</DialogTitle>

<Button onClick={handleToggleStatus}>
  {selectedMaterial?.estatus === 'ACTIVO' ? 'Deshabilitar' : 'Habilitar'}
</Button>
```

## Corrección Adicional: Inconsistencia de Schema

Se identificó otra inconsistencia importante:

- **Schema SQL**: Usa `estatus VARCHAR(50)`
- **Algunas consultas**: Usan `activo BOOLEAN`

Se decidió usar el campo `estatus` para mayor flexibilidad y compatibilidad con los requisitos del usuario.

## Pruebas de Verificación

Para verificar que el fix funciona correctamente:

1. **Material Activo** (`estatus: 'ACTIVO'`):
   - Menú muestra: "Deshabilitar"
   - Modal muestra: "🔒 Deshabilitar Material"
   - Botón muestra: "Deshabilitar"

2. **Material Inactivo** (`estatus: 'INACTIVO'`):
   - Menú muestra: "Habilitar"
   - Modal muestra: "✅ Habilitar Material"
   - Botón muestra: "Habilitar"

3. **Material Suspendido** (`estatus: 'SUSPENDIDO'`):
   - Menú muestra: "Habilitar"
   - Modal muestra: "✅ Habilitar Material"
   - Botón muestra: "Habilitar"

## Lecciones Aprendidas

1. **Consistencia de Schema**: Es crucial mantener consistencia entre schema de BD, tipos TypeScript y consultas SQL
2. **Validación de Datos**: Siempre validar que los campos necesarios existan en las respuestas de la API
3. **Testing Explícito**: Probar cada flujo de usuario para detectar inconsistencias de datos
4. **Documentación de Schema**: Mantener documentación clara de los campos y sus valores esperados

## Pasos Futuros

1. **Regeneración Tipos**: Configurar correctamente pgtyped para evitar ediciones manuales
2. **Validaciones Frontend**: Agregar validaciones para verificar presencia de campos requeridos
3. **Tests Unitarios**: Agregar tests para verificar los flujos de cambio de estatus
4. **Documentación**: Documentar el schema de datos completo para evitar futuras inconsistencias