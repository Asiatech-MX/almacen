# Implementación de Deshabilitación/Habilitación de Materiales

## Resumen

Se ha implementado la funcionalidad de deshabilitar/habilitar materiales en el sistema de gestión de materia prima, permitiendo un mejor control sobre los materiales que pueden ser utilizados en operaciones sin necesidad de eliminarlos permanentemente.

## Características Implementadas

### 1. Acciones Condicionales en el Menú

- **Deshabilitar**: Disponible para materiales con estatus 'ACTIVO'
- **Habilitar**: Disponible para materiales con estatus 'INACTIVO' o 'SUSPENDIDO'
- **Eliminar**: Solo visible para materiales con stock igual a 0

### 2. Indicadores Visuales de Estado

Se han agregado badges con emojis para mejorar la legibilidad:

- ✅ **Activo**: Material disponible y operativo
- 🔒 **Inhabilitado**: Material desactivado temporalmente
- ⏸️ **Suspendido**: Material suspendido por alguna razón
- ❌ **Agotado**: Material sin existencia
- ⚠️ **Stock Bajo**: Material con existencia por debajo del mínimo

### 3. Filtro de Estado Avanzado

El DataTable incluye un filtro de estado que permite:

- Ver todos los materiales
- Filtrar por estatus específico (ACTIVO, INACTIVO, SUSPENDIDO)
- Filtrar por condiciones de stock (Agotado, Stock Bajo)

## Cambios Técnicos

### Base de Datos

No se requirieron cambios en el esquema ya que el campo `estatus` ya existía en la tabla `materia_prima`:

```sql
estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO' CHECK (estatus IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'))
```

### Componentes Modificados

1. **GestionMateriaPrimaResponsive.tsx**:
   - Agregada columna de estatus con indicadores visuales
   - Menú de acciones condicional basado en estado y stock
   - Modal de confirmación para cambio de estatus
   - Lógica de filtrado por estatus

2. **DataTableToolbar.tsx**:
   - Actualizado filtro para incluir opciones de estatus
   - Opciones con emojis para mejor usabilidad

### Flujo de Usuario

1. **Deshabilitar Material**:
   - Usuario selecciona "Deshabilitar" del menú de acciones
   - Aparece modal de confirmación con información del material
   - Al confirmar, el material cambia a estatus 'INACTIVO'
   - El material ya no aparece en búsquedas normales

2. **Habilitar Material**:
   - Usuario filtra por "Inhabilitado" para ver materiales desactivados
   - Selecciona "Habilitar" del menú de acciones
   - Aparece modal de confirmación
   - Al confirmar, el material vuelve a estatus 'ACTIVO'

3. **Eliminar Material**:
   - La opción "Eliminar" solo aparece si stock = 0
   - Evita eliminación accidental de materiales con existencia

## Mejoras de UX

- **Acciones Contextuales**: Los menús muestran solo las acciones relevantes
- **Confirmaciones Claras**: Modales informativos antes de realizar acciones
- **Indicadores Visuales**: Uso de colores y emojis para identificación rápida
- **Filtros Inteligentes**: Permiten encontrar fácilmente materiales en cualquier estado

## Consideraciones de Seguridad

- Las acciones destructivas (eliminar) requieren stock = 0
- Todas las acciones de cambio de estado requieren confirmación explícita
- Los materiales deshabilitados no pueden ser usados en movimientos
- Se mantiene auditoría de todos los cambios a través de triggers existentes

## Próximos Pasos

1. **Backend**: Implementar el endpoint para actualizar el estatus del material
2. **Permisos**: Agregar control de permisos para quién puede deshabilitar/habilitar
3. **Reportes**: Incluir materiales inactivos en reportes de auditoría
4. **Historial**: Agregar registro de cambios de estatus para trazabilidad

## Archivos Modificados

- `apps/electron-renderer/src/modules/materiaPrima/GestionMateriaPrimaResponsive.tsx`
- `apps/electron-renderer/src/components/data-table/data-table-toolbar.tsx`
- `db/migrations/002_update_materia_prima_status_usage.sql` (documentación)

## Testing

Para probar la implementación:

1. Abrir la gestión de materia prima
2. Verificar que los materiales muestran los estados correctos
3. Intentar deshabilitar un material activo
4. Verificar que aparece la opción "Habilitar" para materiales inactivos
5. Confirmar que "Eliminar" solo aparece para materiales con stock = 0
6. Probar el filtro por estado en el DataTable