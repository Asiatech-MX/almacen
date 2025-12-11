# Migration Guide
## Migrating to Dynamic Reference Data System

This comprehensive guide covers the migration process from the legacy static reference data system to the new dynamic reference data system (DRDS).

## Table of Contents

1. [Migration Overview](#migration-overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Migration Process](#migration-process)
4. [Data Mapping and Validation](#data-mapping-and-validation)
5. [Post-Migration Tasks](#post-migration-tasks)
6. [Rollback Procedures](#rollback-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Validation Checklist](#validation-checklist)

## Migration Overview

### What's Changing

The migration transforms the reference data system from:
- **Static dropdown values** to **dynamic hierarchical categories**
- **Fixed presentation units** to **configurable presentations with conversion factors**
- **Hard-coded options** to **user-manageable reference data**

### Key Improvements

1. **Hierarchical Categories**: Multi-level category structure
2. **Dynamic Presentations**: Configurable units with conversion factors
3. **Audit Trail**: Complete change tracking
4. **Bulk Operations**: Import/export capabilities
5. **User Management**: Role-based access control
6. **Real-time Updates**: Immediate availability of changes

### Migration Scope

**Affected Data:**
- Materia prima (raw materials) categories
- Presentation units (unidades de presentación)
- Material records with category/presentation references
- Historical transactions and reports

**Estimated Downtime:** 2-4 hours
**Data Risk:** Low (comprehensive backup strategy)
**User Impact:** Medium (requires training on new interface)

## Pre-Migration Checklist

### System Requirements

1. **Application Version**
   - Ensure application version 2.0.0 or higher
   - Verify all users have updated clients
   - Confirm database compatibility

2. **Database Preparation**
   ```sql
   -- Check current database version
   SELECT version FROM database_version;

   -- Verify available disk space (minimum 2GB free)
   SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;
   ```

3. **Backup Verification**
   ```bash
   # Create full database backup
   pg_dump -h localhost -U postgres -d almacen_db > pre_migration_backup.sql

   # Verify backup integrity
   psql -h localhost -U postgres -d test_db < pre_migration_backup.sql
   ```

### Data Assessment

1. **Current Data Analysis**
   ```sql
   -- Count current materials by legacy category
   SELECT
     categoria_legacy,
     COUNT(*) as material_count,
     MIN(fecha_creacion) as oldest_record,
     MAX(fecha_creacion) as newest_record
   FROM materia_prima
   WHERE categoria_legacy IS NOT NULL
   GROUP BY categoria_legacy
   ORDER BY material_count DESC;

   -- Analyze presentation usage
   SELECT
     presentacion_legacy,
     COUNT(*) as usage_count,
     COUNT(DISTINCT id_categoria) as categories_used
   FROM materia_prima
   WHERE presentacion_legacy IS NOT NULL
   GROUP BY presentacion_legacy
   ORDER BY usage_count DESC;
   ```

2. **Data Quality Check**
   ```sql
   -- Check for null or invalid legacy categories
   SELECT COUNT(*) as uncategorized_materials
   FROM materia_prima
   WHERE categoria_legacy IS NULL OR categoria_legacy = '';

   -- Check for orphaned references
   SELECT DISTINCT categoria_legacy
   FROM materia_prima
   WHERE categoria_legacy NOT IN (
     SELECT valor FROM parametros WHERE parametro = 'categoria_valida'
   );
   ```

### User Preparation

1. **Communication Plan**
   - Announce migration date 2 weeks in advance
   - Send reminder notifications 3 days before
   - Schedule training sessions for power users

2. **User Access**
   - Verify all user accounts and permissions
   - Create temporary admin accounts for migration team
   - Document current access levels

3. **Training Materials**
   - Prepare user guides and video tutorials
   - Create sandbox environment for practice
   - Schedule hands-on training sessions

### Environment Setup

1. **Staging Environment**
   ```bash
   # Create staging database
   createdb -U postgres almacen_staging

   # Copy production data to staging
   pg_dump -U postgres almacen_prod | psql -U postgres almacen_staging

   # Apply migration scripts to staging
   psql -U postgres almacen_staging < migrations/001_create_reference_tables.sql
   ```

2. **Feature Flag Configuration**
   ```json
   {
     "dynamicReferenceData": {
       "enabled": false,
       "rolloutPercentage": 0,
       "allowAdminOverride": true,
       "migrationCompleted": false
     }
   }
   ```

## Migration Process

### Phase 1: Database Schema Migration

1. **Execute Migration Scripts**
   ```bash
   # Run main migration script
   npm run db:migrate:001

   # Verify migration success
   npm run db:validate
   ```

2. **Create Reference Data**
   ```sql
   -- Create institution if not exists
   INSERT INTO institucion (id_institucion, nombre, activo)
   VALUES (1, 'Institución Principal', true)
   ON CONFLICT (id_institucion) DO NOTHING;

   -- Create root category
   INSERT INTO categoria (
     id_categoria,
     nombre,
     descripcion,
     id_institucion,
     id_categoria_padre,
     nivel_orden,
     activo,
     fecha_creacion,
     usuario_creacion
   ) VALUES (
     gen_random_uuid(),
     'Categorías Principales',
     'Categoría raíz para todas las categorías de materiales',
     1,
     NULL,
     0,
     true,
     CURRENT_TIMESTAMP,
     'migration_user'
   );
   ```

### Phase 2: Data Mapping and Migration

1. **Category Migration Script**
   ```sql
   -- Create migration mapping table
   CREATE TABLE migration_category_mapping (
     legacy_category VARCHAR(100) PRIMARY KEY,
     new_category_id UUID REFERENCES categoria(id_categoria),
     migration_status VARCHAR(20) DEFAULT 'pending',
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   );

   -- Map legacy categories to new categories
   INSERT INTO migration_category_mapping (legacy_category, new_category_id, migration_status)
   SELECT
     categoria_legacy as legacy_category,
     (SELECT id_categoria FROM categoria WHERE nombre = categoria_legacy AND id_institucion = 1) as new_category_id,
     CASE
       WHEN EXISTS (SELECT 1 FROM categoria WHERE nombre = categoria_legacy AND id_institucion = 1)
       THEN 'mapped'
       ELSE 'create_needed'
     END as migration_status
   FROM (
     SELECT DISTINCT categoria_legacy
     FROM materia_prima
     WHERE categoria_legacy IS NOT NULL AND categoria_legacy != ''
   ) legacy_cats;
   ```

2. **Create Missing Categories**
   ```sql
   -- Create categories that don't exist yet
   INSERT INTO categoria (
     id_categoria,
     nombre,
     descripcion,
     id_institucion,
     id_categoria_padre,
     nivel_orden,
     activo,
     fecha_creacion,
     usuario_creacion
   )
   SELECT
     gen_random_uuid(),
     mcm.legacy_category,
     'Categoría migrada desde sistema legacy: ' || mcm.legacy_category,
     1,
     (SELECT id_categoria FROM categoria WHERE nombre = 'Categorías Principales' AND id_institucion = 1),
     1,
     true,
     CURRENT_TIMESTAMP,
     'migration_user'
   FROM migration_category_mapping mcm
   WHERE mcm.migration_status = 'create_needed'
   RETURNING id_categoria, nombre;

   -- Update mapping table with new category IDs
   UPDATE migration_category_mapping mcm
   SET new_category_id = c.id_categoria,
       migration_status = 'mapped'
   FROM categoria c
   WHERE c.nombre = mcm.legacy_category
     AND c.id_institucion = 1
     AND mcm.migration_status = 'create_needed';
   ```

3. **Material Category Updates**
   ```sql
   -- Update material records with new category references
   UPDATE materia_prima mp
   SET id_categoria = mcm.new_category_id,
       categoria_legacy = NULL, -- Clear legacy reference
       fecha_actualizacion = CURRENT_TIMESTAMP,
       usuario_actualizacion = 'migration_user'
   FROM migration_category_mapping mcm
   WHERE mp.categoria_legacy = mcm.legacy_category
     AND mcm.migration_status = 'mapped';

   -- Verify migration results
   SELECT
     COUNT(*) as total_materials,
     COUNT(CASE WHEN id_categoria IS NOT NULL THEN 1 END) as migrated_materials,
     COUNT(CASE WHEN categoria_legacy IS NOT NULL THEN 1 END) as still_legacy
   FROM materia_prima;
   ```

4. **Presentation Migration**
   ```sql
   -- Create presentation mapping
   CREATE TABLE migration_presentation_mapping (
     legacy_presentation VARCHAR(50) PRIMARY KEY,
     new_presentation_id UUID REFERENCES presentacion(id_presentacion),
     migration_status VARCHAR(20) DEFAULT 'pending'
   );

   -- Create standard presentations if they don't exist
   INSERT INTO presentacion (
     id_presentacion,
     nombre,
     abreviatura,
     descripcion,
     id_institucion,
     predeterminada,
     activo,
     fecha_creacion,
     usuario_creacion
   )
   VALUES
     (gen_random_uuid(), 'Unidad', 'UN', 'Unidad individual', 1, true, true, CURRENT_TIMESTAMP, 'migration_user'),
     (gen_random_uuid(), 'Caja', 'CAJ', 'Contenido en caja', 1, false, true, CURRENT_TIMESTAMP, 'migration_user'),
     (gen_random_uuid(), 'Paquete', 'PAQ', 'Contenido en paquete', 1, false, true, CURRENT_TIMESTAMP, 'migration_user'),
     (gen_random_uuid(), 'Kilogramo', 'KG', 'Medida en kilogramos', 1, false, true, CURRENT_TIMESTAMP, 'migration_user'),
     (gen_random_uuid(), 'Litro', 'LT', 'Medida en litros', 1, false, true, CURRENT_TIMESTAMP, 'migration_user')
   ON CONFLICT DO NOTHING;

   -- Map legacy presentations to new ones
   INSERT INTO migration_presentation_mapping (legacy_presentation, new_presentation_id, migration_status)
   SELECT
     mp.presentacion_legacy as legacy_presentation,
     p.id_presentacion as new_presentation_id,
     'mapped' as migration_status
   FROM (
     SELECT DISTINCT presentacion_legacy
     FROM materia_prima
     WHERE presentacion_legacy IS NOT NULL AND presentacion_legacy != ''
   ) mp
   LEFT JOIN presentacion p ON (
     UPPER(mp.presentacion_legacy) = UPPER(p.abreviatura) OR
     UPPER(mp.presentacion_legacy) = UPPER(p.nombre) OR
     (mp.presentacion_legacy LIKE '%unidad%' AND p.abreviatura = 'UN') OR
     (mp.presentacion_legacy LIKE '%caja%' AND p.abreviatura = 'CAJ') OR
     (mp.presentacion_legacy LIKE '%paq%' AND p.abreviatura = 'PAQ') OR
     (mp.presentacion_legacy LIKE '%kg%' AND p.abreviatura = 'KG') OR
     (mp.presentacion_legacy LIKE '%litro%' AND p.abreviatura = 'LT')
   )
   WHERE p.id_institucion = 1;

   -- Update material records with new presentation references
   UPDATE materia_prima mp
   SET id_presentacion = mpm.new_presentation_id,
       presentacion_legacy = NULL,
       fecha_actualizacion = CURRENT_TIMESTAMP,
       usuario_actualizacion = 'migration_user'
   FROM migration_presentation_mapping mpm
   WHERE mp.presentacion_legacy = mpm.legacy_presentation
     AND mpm.migration_status = 'mapped';
   ```

### Phase 3: Data Validation and Cleanup

1. **Migration Validation**
   ```sql
   -- Validate category migration
   SELECT
     'Category Migration' as migration_type,
     COUNT(*) as total_records,
     COUNT(CASE WHEN id_categoria IS NOT NULL THEN 1 END) as migrated,
     COUNT(CASE WHEN categoria_legacy IS NOT NULL THEN 1 END) as remaining_legacy,
     ROUND(COUNT(CASE WHEN id_categoria IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as migration_percentage
   FROM materia_prima
   UNION ALL
   SELECT
     'Presentation Migration' as migration_type,
     COUNT(*) as total_records,
     COUNT(CASE WHEN id_presentacion IS NOT NULL THEN 1 END) as migrated,
     COUNT(CASE WHEN presentacion_legacy IS NOT NULL THEN 1 END) as remaining_legacy,
     ROUND(COUNT(CASE WHEN id_presentacion IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2) as migration_percentage
   FROM materia_prima;
   ```

2. **Handle Unmapped Data**
   ```sql
   -- Create default category for unmapped materials
   INSERT INTO categoria (
     id_categoria,
     nombre,
     descripcion,
     id_institucion,
     id_categoria_padre,
     nivel_orden,
     activo,
     fecha_creacion,
     usuario_creacion
   ) VALUES (
     gen_random_uuid(),
     'Sin Categoría',
     'Categoría por defecto para materiales sin categoría asignada',
     1,
     (SELECT id_categoria FROM categoria WHERE nombre = 'Categorías Principales' AND id_institucion = 1),
     999,
     true,
     CURRENT_TIMESTAMP,
     'migration_user'
   )
   ON CONFLICT DO NOTHING;

   -- Assign unmapped materials to default category
   UPDATE materia_prima
   SET id_categoria = (SELECT id_categoria FROM categoria WHERE nombre = 'Sin Categoría' AND id_institucion = 1),
       fecha_actualizacion = CURRENT_TIMESTAMP,
       usuario_actualizacion = 'migration_user'
   WHERE id_categoria IS NULL;
   ```

3. **Cleanup Legacy Fields**
   ```sql
   -- Remove legacy fields (after successful migration)
   -- ALTER TABLE materia_prima DROP COLUMN IF EXISTS categoria_legacy;
   -- ALTER TABLE materia_prima DROP COLUMN IF EXISTS presentacion_legacy;

   -- Or keep for audit purposes
   ALTER TABLE materia_prima RENAME COLUMN categoria_legacy TO categoria_legacy_migrated;
   ALTER TABLE materia_prima RENAME COLUMN presentacion_legacy TO presentacion_legacy_migrated;
   ```

## Data Mapping and Validation

### Category Mapping Rules

| Legacy Category | New Category | Parent | Notes |
|-----------------|--------------|--------|-------|
| 'ELECTRONICOS' | 'Electrónicos' | Categorías Principales | Direct mapping |
| 'LIMPIEZA' | 'Materiales de Limpieza' | Categorías Principales | Expanded description |
| 'OFICINA' | 'Suministros de Oficina' | Categorías Principales | Professional naming |
| NULL/Empty | 'Sin Categoría' | Categorías Principales | Default category |
| 'UNKNOWN' | 'Por Clasificar' | Categorías Principales | Manual review needed |

### Presentation Mapping Rules

| Legacy Presentation | New Presentation | Abreviation | Factor | Notes |
|-------------------|------------------|-------------|--------|-------|
| 'UNITS' | 'Unidad' | UN | 1 | Default unit |
| 'BOX' | 'Caja' | CAJ | Variable | Depends on context |
| 'PACKAGE' | 'Paquete' | PAQ | Variable | Depends on context |
| 'KG' | 'Kilogramo' | KG | 1 | Weight measurement |
| 'L' | 'Litro' | LT | 1 | Volume measurement |

### Validation Queries

```sql
-- Check for orphaned materials
SELECT COUNT(*) as orphaned_materials
FROM materia_prima mp
LEFT JOIN categoria c ON mp.id_categoria = c.id_categoria
WHERE c.id_categoria IS NULL;

-- Verify presentation assignments
SELECT
  p.nombre as presentation,
  COUNT(*) as material_count,
  COUNT(CASE WHEN mp.stock_actual > 0 THEN 1 END) as with_stock
FROM materia_prima mp
JOIN presentacion p ON mp.id_presentacion = p.id_presentacion
GROUP BY p.id_presentacion, p.nombre
ORDER BY material_count DESC;

-- Audit trail verification
SELECT
  COUNT(*) as total_changes,
  COUNT(CASE WHEN usuario_actualizacion = 'migration_user' THEN 1 END) as migration_changes,
  MIN(fecha_actualizacion) as first_change,
  MAX(fecha_actualizacion) as last_change
FROM materia_prima
WHERE fecha_actualizacion >= CURRENT_DATE;
```

## Post-Migration Tasks

### Feature Flag Activation

1. **Enable Dynamic Reference Data**
   ```bash
   # Update feature flags configuration
   npm run feature-flags:set --feature=dynamicReferenceData --enabled=true --rollout=100
   ```

2. **Complete Migration Flag**
   ```bash
   # Mark migration as completed
   npm run feature-flags:complete-migration --feature=dynamicReferenceData
   ```

### User Notification and Training

1. **System Announcement**
   ```
   Subject: 🚀 Sistema Actualizado: Nuevas Categorías y Presentaciones Dinámicas

   Estimados usuarios,

   Hemos actualizado exitosamente nuestro sistema con un nuevo gestor de categorías y presentaciones dinámicas.

   ¿Qué hay de nuevo?
   - Categorías jerárquicas ilimitadas
   - Unidades de presentación configurables
   - Búsqueda avanzada y filtros
   - Importación/Exportación de datos

   Próximos pasos:
   1. Inicie sesión en el sistema actualizado
   2. Revise la guía de usuario adjunta
   3. Asista a la sesión de entrenamiento programada
   4. Reporte cualquier problema al soporte técnico

   Gracias por su paciencia durante la migración.

   Soporte Técnico
   ```

2. **Training Sessions**
   - Schedule hands-on training for all user groups
   - Provide sandbox environment for practice
   - Create video tutorials for common tasks

### System Monitoring

1. **Performance Monitoring**
   ```typescript
   // Monitor system performance after migration
   const healthCheck = await window.electronAPI.monitoring.healthCheck()
   if (healthCheck.status !== 'healthy') {
     // Alert administrators
   }
   ```

2. **Error Tracking**
   ```typescript
   // Monitor for migration-related errors
   window.electronAPI.monitoring.logUserAction('migration_completed', {
     timestamp: new Date().toISOString(),
     userCount: await getActiveUserCount(),
     systemLoad: await getSystemLoad()
   })
   ```

3. **User Activity Monitoring**
   - Track adoption of new features
   - Monitor for user errors or confusion
   - Collect feedback on new interface

### Documentation Updates

1. **User Documentation**
   - Update user manuals with new interface screenshots
   - Create quick reference guides
   - Update FAQ sections

2. **Technical Documentation**
   - Update API documentation
   - Document new database schema
   - Update deployment procedures

## Rollback Procedures

### Immediate Rollback (First 24 hours)

1. **Stop Application**
   ```bash
   # Stop all application instances
   npm run stop:all
   ```

2. **Database Rollback**
   ```bash
   # Restore from pre-migration backup
   psql -h localhost -U postgres -d almacen_db < pre_migration_backup.sql

   # Verify data integrity
   npm run db:validate
   ```

3. **Feature Flag Rollback**
   ```bash
   # Disable dynamic reference data
   npm run feature-flags:disable --feature=dynamicReferenceData
   ```

4. **Application Restart**
   ```bash
   # Restart with legacy configuration
   npm run start:production
   ```

### Partial Rollback (Data Issues Only)

1. **Identify Problematic Data**
   ```sql
   -- Find materials with migration issues
   SELECT id_material, nombre, categoria_legacy_migrated, id_categoria
   FROM materia_prima
   WHERE categoria_legacy_migrated IS NOT NULL
     AND id_categoria IS NULL;
   ```

2. **Selective Data Correction**
   ```sql
   -- Restore legacy references
   UPDATE materia_prima
   SET categoria_legacy = categoria_legacy_migrated,
       id_categoria = NULL
   WHERE id_categoria IS NULL
     AND categoria_legacy_migrated IS NOT NULL;
   ```

3. **Re-run Migration Script**
   ```bash
   # Re-run specific migration steps
   npm run migration:categories --validate-only
   npm run migration:categories --fix-issues
   ```

### Emergency Rollback Script

```bash
#!/bin/bash
# emergency_rollback.sh

echo "🚨 EMERGENCY ROLLBACK INITIATED"

# Configuration
DB_HOST="localhost"
DB_USER="postgres"
DB_NAME="almacen_db"
BACKUP_FILE="pre_migration_backup.sql"

# Stop application
echo "Stopping application..."
npm run stop:all

# Database rollback
echo "Rolling back database..."
if [ -f "$BACKUP_FILE" ]; then
    psql -h $DB_HOST -U $DB_USER -d $DB_NAME < $BACKUP_FILE
    echo "Database restored from backup"
else
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Disable feature flags
echo "Disabling feature flags..."
npm run feature-flags:disable --feature=dynamicReferenceData
npm run feature-flags:disable --feature=remoteLogging
npm run feature-flags:disable --feature=performanceMonitoring

# Restart application
echo "Restarting application..."
npm run start:production

echo "✅ Emergency rollback completed"
```

## Troubleshooting

### Common Migration Issues

#### Database Migration Failures

**Error:** `relation "categoria" does not exist`
**Cause:** Migration scripts not executed in correct order
**Solution:**
```bash
# Verify migration execution
npm run db:migrate:status
# Re-run missing migrations
npm run db:migrate:up
```

**Error:** `duplicate key value violates unique constraint`
**Cause:** Data already exists in target tables
**Solution:**
```sql
-- Check for existing data
SELECT COUNT(*) FROM categoria;
-- Clear target tables if needed
TRUNCATE TABLE categoria CASCADE;
TRUNCATE TABLE presentacion CASCADE;
```

#### Data Mapping Issues

**Error:** Materials with unmapped categories
**Cause:** Legacy categories don't match new category structure
**Solution:**
```sql
-- Find unmapped materials
SELECT DISTINCT categoria_legacy_migrated
FROM materia_prima
WHERE id_categoria IS NULL AND categoria_legacy_migrated IS NOT NULL;

-- Create missing categories manually
INSERT INTO categoria (nombre, id_institucion, ...)
VALUES ('Category Name', 1, ...);
```

#### Performance Issues

**Error:** Slow performance after migration
**Cause:** Missing indexes or large datasets
**Solution:**
```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM materia_prima WHERE id_categoria = 'uuid';

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_materia_prima_categoria
ON materia_prima(id_categoria);
```

### Error Reference

| Error | Description | Solution |
|-------|-------------|----------|
| MIG001 | Legacy category mapping failed | Create manual mapping |
| MIG002 | Presentation conversion error | Verify conversion factors |
| MIG003 | Foreign key constraint violation | Check data consistency |
| MIG004 | Duplicate record detected | Review source data |
| MIG005 | Insufficient permissions | Verify database user rights |

## Validation Checklist

### Pre-Migration Validation

- [ ] Database backup completed and verified
- [ ] Application version compatible with migration
- [ ] Staging environment tested successfully
- [ ] User notifications sent
- [ ] Training materials prepared
- [ ] Rollback procedures documented
- [ ] Support team on standby

### Migration Execution Validation

- [ ] Migration scripts executed without errors
- [ ] All materials have category assignments
- [ ] All materials have presentation assignments
- [ ] No orphaned records in database
- [ ] Legacy fields properly cleaned up
- [ ] Audit trail correctly populated
- [ ] Feature flags properly configured

### Post-Migration Validation

- [ ] Application starts successfully
- [ ] Users can log in without issues
- [ ] Category picker functions correctly
- [ ] Presentation selection works
- [ ] Search and filter functionality operational
- [ ] Reports generate correctly
- [ ] Performance within acceptable limits
- [ ] Error monitoring shows no critical issues

### User Acceptance Validation

- [ ] All user groups trained
- [ ] Users can perform essential tasks
- [ ] Feedback collected and addressed
- [ ] Documentation reviewed and approved
- [ ] Support tickets resolved
- [ ] System stability confirmed for 7 days

---

## Support Contacts

### Technical Support
- **Migration Team**: migration-team@company.com
- **Database Administrator**: dba@company.com
- **Application Support**: support@company.com

### Emergency Contacts
- **On-call Engineer**: +1-555-0123
- **Database Emergency**: +1-555-0124
- **System Administrator**: +1-555-0125

## Additional Resources

- [API Documentation](./API_REFERENCE.md)
- [User Administration Guide](./USER_ADMINISTRATION_GUIDE.md)
- [Monitoring System Guide](./MONITORING_SYSTEM.md)
- [System Architecture Documentation](./SYSTEM_ARCHITECTURE.md)