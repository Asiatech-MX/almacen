# Plan de Implementación: Fix Columna Estatus - Stock Bajo

**Issue**: Error "column mp.estatus does not exist" al acceder a la pestaña Stock Bajo
**Fecha**: 2025-12-09
**Prioridad**: CRÍTICA - Bloquea funcionalidad principal

## Resumen Ejecutivo

El módulo de ConsultasAvanzadas falla al intentar acceder a la pestaña "Stock Bajo" debido a que la consulta SQL referencia una columna `estatus` que no existe en la base de datos. Este documento detalla el plan de implementación para resolver el incidente.

## Fase 1: Diagnóstico y Preparación (5 min)

### Objetivo
Confirmar el estado actual y preparar el entorno para la implementación del fix.

### Tarea 1.1: Verificar Conexión a Base de Datos
- [ ] Conectarse a PostgreSQL Docker container
  ```bash
  docker exec -it almacen_postgres_1 psql -U postgres -d almacen
  ```
- [ ] Verificar conexión activa
- [ ] Anotar versión de PostgreSQL

**Resultado esperado**: Conexión establecida a la base de datos `almacen`

### Tarea 1.2: Inspeccionar Estructura Actual
- [ ] Listar columnas de tabla materia_prima
  ```sql
  \d materia_prima
  ```
- [ ] Confirmar ausencia de columna `estatus`
- [ ] Documentar columnas existentes

**Resultado esperado**: Confirmación visual de que la columna `estatus` no existe

### Tarea 1.3: Backup de Seguridad
- [ ] Crear backup antes de modificaciones
  ```bash
  pg_dump -h localhost -U postgres -d almacen > backup_pre_fix_$(date +%Y%m%d_%H%M%S).sql
  ```
- [ ] Verificar archivo de backup creado
- [ ] Guardar ubicación del backup

**Resultado esperado**: Backup completo guardado en carpeta `db/backups/`

### Tarea 1.4: Revisión de Código Relacionado
- [ ] Verificar query en `backend/repositories/materiaPrimaRepo.ts:439-463`
- [ ] Confirmar referencia a `mp.estatus` en línea 456
- [ ] Identificar otros archivos potencialmente afectados

**Resultado esperado**: Lista de archivos que usan la columna estatus

---

## Fase 2: Implementación del Fix (10 min)

### Objetivo
Agregar la columna faltante a la base de datos con la estructura correcta.

### Tarea 2.1: Ejecutar ALTER TABLE Principal
- [ ] Conectarse a la base de datos
- [ ] Ejecutar SQL para agregar columna
  ```sql
  ALTER TABLE materia_prima
  ADD COLUMN estatus VARCHAR(20) NOT NULL DEFAULT 'ACTIVO';
  ```
- [ ] Verificar ejecución exitosa
- [ ] Confirmar columna agregada

**Resultado esperado**: Columna `estatus` agregada exitosamente

### Tarea 2.2: Agregar Constraint de Validación
- [ ] Ejecutar SQL para constraint CHECK
  ```sql
  ALTER TABLE materia_prima
  ADD CONSTRAINT materia_prima_estatus_check
  CHECK (estatus IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'));
  ```
- [ ] Verificar constraint creado
- [ ] Testear constraint con valor inválido

**Resultado esperado**: Constraint activo validando valores permitidos

### Tarea 2.3: Crear Índice de Rendimiento
- [ ] Verificar si índice ya existe
- [ ] Crear índice para consultas
  ```sql
  CREATE INDEX CONCURRENTLY idx_materia_prima_estatus
  ON materia_prima(estatus);
  ```
- [ ] Confirmar creación de índice

**Resultado esperado**: Índice creado para optimizar consultas

### Tarea 2.4: Validar Datos Existentes
- [ ] Verificar que todos los registros tengan 'ACTIVO' como valor por defecto
  ```sql
  SELECT COUNT(*) as total_registros,
         COUNT(CASE WHEN estatus = 'ACTIVO' THEN 1 END) as activos
  FROM materia_prima;
  ```
- [ ] Confirmar no hay valores nulos

**Resultado esperado**: Todos los registros con estatus = 'ACTIVO'

---

## Fase 3: Verificación y Testing (15 min)

### Objetivo
Validar que el fix resuelve el problema y no introduce nuevos errores.

### Tarea 3.1: Testing de Funcionalidad Stock Bajo
- [ ] Iniciar aplicación Electron
  ```bash
  bun dev
  ```
- [ ] Navegar a Materia Prima → Consultas Avanzadas
- [ ] Hacer clic en pestaña "Stock Bajo"
- [ ] Verificar que carga sin errores
- [ ] Capturar pantalla de resultado exitoso

**Resultado esperado**: Pestaña Stock Bajo funciona correctamente

### Tarea 3.2: Testing de Consulta Directa
- [ ] Ejecutar query del repository en BD
  ```sql
  SELECT * FROM materia_prima
  WHERE stock <= stock_minimo
    AND estatus = 'ACTIVO'
  ORDER BY stock / stock_minimo ASC;
  ```
- [ ] Verificar resultados vs expected
- [ ] Confirmar filtro por estatus funciona

**Resultado esperado**: Query retorna solo materiales con stock bajo y estatus ACTIVO

### Tarea 3.3: Regression Testing
- [ ] Probar pestaña "Búsqueda" con filtros
- [ ] Probar pestaña "Estadísticas"
- [ ] Verificar CRUD de materia prima
- [ ] Confirmar que no hay errores en consola

**Resultado esperado**: Todas las funcionalidades trabajan correctamente

### Tarea 3.4: Testing de Performance
- [ ] Medir tiempo de carga de Stock Bajo
- [ ] Verificar uso del nuevo índice con EXPLAIN
- [ ] Confirmar no hay degradación de performance

**Resultado esperado**: Tiempos de respuesta aceptables (<2s)

---

## Fase 4: Documentación y Prevención (10 min)

### Objetivo
Documentar el cambio y prevenir futuros incidentes similares.

### Tarea 4.1: Actualizar Documentación
- [ ] Registrar fix en CHANGELOG.md
- [ ] Actualizar diagrama de base de datos
- [ ] Documentar nueva columna en API docs

**Resultado esperado**: Documentación actualizada reflejando cambios

### Tarea 4.2: Implementar Validación de Schema
- [ ] Crear script de validación de schema
  ```bash
  # db/validate-schema.sh
  psql -c "\d materia_prima" | grep -q "estatus" || exit 1
  ```
- [ ] Agregar a package.json como "db:validate"
- [ ] Configurar pre-commit hook

**Resultado esperado**: Validación automática de schema en commits

### Tarea 4.3: Crear Proceso de Migraciones
- [ ] Crear directorio `db/migrations/`
- [ ] Diseñar formato para archivos de migración
- [ ] Documentar proceso para cambios futuros

**Resultado esperado**: Sistema de migraciones implementado

### Tarea 4.4: Comunicación al Equipo
- [ ] Enviar notificación del fix implementado
- [ ] Compartir lessons learned
- [ ] Agregar a wiki de desarrollo

**Resultado esperado**: Equipo informado del cambio y medidas preventivas

---

## Checklist de Validación Final

- [ ] Pestaña Stock Bajo carga sin errores
- [ ] Muestra correctamente materiales con stock bajo
- [ ] Solo muestra materiales con estatus 'ACTIVO'
- [ ] No hay errores en consola de desarrollador
- [ ] Performance aceptable (<2s)
- [ ] Backup creado exitosamente
- [ ] Documentación actualizada
- [ ] Validación de schema implementada
- [ ] Equipo notificado del cambio

---

## Plan de Rollback (si es necesario)

Si ocurre algún problema crítico:

1. **Detener aplicación**: `Ctrl+C` en terminal de desarrollo
2. **Restaurar backup**:
   ```bash
   psql -h localhost -U postgres -d almacen < backup_pre_fix_YYYYMMDD_HHMMSS.sql
   ```
3. **Verificar funcionalidad**: Confirmar que todo vuelve a estado anterior
4. **Notificar al equipo**: Comunicar rollback y siguiente plan de acción

---

## Tiempos Estimados

| Fase | Tiempo Estimado | Tiempo Real |
|------|-----------------|-------------|
| Fase 1: Diagnóstico | 5 min | |
| Fase 2: Implementación | 10 min | |
| Fase 3: Testing | 15 min | |
| Fase 4: Documentación | 10 min | |
| **Total** | **40 min** | |

---

## Responsables

- **Ejecución**: Desarrollador asignado
- **Revisión**: Tech Lead
- **Aprobación**: Product Owner

---

## Criterios de Éxito

1. **Funcional**: Stock Bajo opera sin errores
2. **Performance**: Tiempos de respuesta < 2 segundos
3. **Calidad**: No se introducen nuevos bugs
4. **Mantenibilidad**: Schema validado automáticamente
5. **Conocimiento**: Equipo documentado sobre el cambio