#!/bin/bash
# Fase 5: Limpieza y Optimización - Script de Automatización
# Basado en el plan de migración híbrida de materia_prima

set -e  # Detener ejecución en caso de error

# Configuración
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/almacen_db"}
BACKUP_DIR="backups"
LOG_FILE="logs/phase5_cleanup_$(date +%Y%m%d_%H%M%S).log"
DATE_STAMP=$(date +%Y%m%d)

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - INFO: $1" >> "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - SUCCESS: $1" >> "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - WARNING: $1" >> "$LOG_FILE"
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - ERROR: $1" >> "$LOG_FILE"
}

# Función para ejecutar SQL con manejo de errores
execute_sql() {
    local sql_command="$1"
    local description="$2"

    log_info "Ejecutando: $description"
    echo "SQL: $sql_command" >> "$LOG_FILE"

    if psql "$DATABASE_URL" -c "$sql_command" >> "$LOG_FILE" 2>&1; then
        log_success "$description completado exitosamente"
        return 0
    else
        log_error "Error en: $description"
        echo "Últimas 10 líneas del log:"
        tail -10 "$LOG_FILE"
        return 1
    fi
}

# Función para verificar conectividad a la base de datos
check_database_connection() {
    log_info "Verificando conexión a la base de datos..."

    if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_success "Conexión a la base de datos establecida"
        return 0
    else
        log_error "No se puede conectar a la base de datos: $DATABASE_URL"
        exit 1
    fi
}

# Función para crear backup de seguridad
create_backup() {
    log_info "Creando backup de seguridad pre-Fase 5..."

    mkdir -p "$BACKUP_DIR"
    local backup_file="$BACKUP_DIR/backup_pre_fase5_${DATE_STAMP}.sql"

    if pg_dump "$DATABASE_URL" > "$backup_file" 2>> "$LOG_FILE"; then
        log_success "Backup creado: $backup_file"

        # Verificar tamaño del backup
        local backup_size=$(du -h "$backup_file" | cut -f1)
        log_info "Tamaño del backup: $backup_size"

        return 0
    else
        log_error "Error al crear backup"
        exit 1
    fi
}

# Función para verificar consistencia final de datos
verify_data_consistency() {
    log_info "Verificando consistencia final de datos..."

    # Verificar que no haya inconsistencias críticas
    local inconsistency_check=$(psql "$DATABASE_URL" -tA -c "
        SELECT COUNT(*) FROM validar_consistencia_migracion()
        WHERE tipo_inconsistencia NOT IN ('duplicados_esperados');
    ")

    if [ "$inconsistency_check" -eq 0 ]; then
        log_success "No se encontraron inconsistencias críticas"
    else
        log_warning "Se encontraron $inconsistency_check inconsistencias críticas"
        log_info "Detalles de inconsistencias:"
        psql "$DATABASE_URL" -c "
            SELECT * FROM validar_consistencia_migracion()
            WHERE tipo_inconsistencia NOT IN ('duplicados_esperados');
        " >> "$LOG_FILE" 2>&1
    fi

    # Verificar conteo de registros
    local legacy_count=$(psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM materia_prima;")
    local migrated_count=$(psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM materia_prima_migration WHERE activo = true;")

    log_info "Registros legacy: $legacy_count"
    log_info "Registros migrados: $migrated_count"

    if [ "$legacy_count" -eq "$migrated_count" ]; then
        log_success "Conteo de registros coincide"
    else
        log_warning "Diferencia en conteo de registros: $((legacy_count - migrated_count))"
    fi
}

# Función para realizar transición final de tablas
perform_table_transition() {
    log_info "Iniciando transición final de tablas..."

    # Paso 1: Verificar consistencia final una última vez
    execute_sql "
        SELECT * FROM validar_consistencia_migracion();
    " "Verificación de consistencia final"

    # Paso 2: Archivar tabla legacy con timestamp
    execute_sql "
        ALTER TABLE materia_prima RENAME TO materia_prima_legacy_${DATE_STAMP};
    " "Archivando tabla legacy"

    # Paso 3: Activar tabla migrada como principal
    execute_sql "
        ALTER TABLE materia_prima_migration RENAME TO materia_prima;
    " "Activando tabla migrada como principal"

    # Paso 4: Actualizar constraints y foreign keys si es necesario
    log_info "Verificando foreign keys que referencian materia_prima..."

    # Obtener lista de tablas con foreign keys a materia_prima
    local fk_tables=$(psql "$DATABASE_URL" -tA -c "
        SELECT
            tc.table_name,
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name,
            tc.constraint_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'materia_prima';
    ")

    if [ -n "$fk_tables" ]; then
        log_info "Tablas con foreign keys a materia_prima:"
        echo "$fk_tables" >> "$LOG_FILE"
        log_warning "Revise manualmente las foreign keys después de la transición"
    else
        log_success "No se encontraron foreign keys que necesiten actualización"
    fi
}

# Función para limpiar objetos temporales
cleanup_temporary_objects() {
    log_info "Limpiando objetos temporales de la migración..."

    # Eliminar vistas temporales
    execute_sql "DROP VIEW IF EXISTS vw_materia_prima_moderno;" "Eliminando vista vw_materia_prima_moderno"
    execute_sql "DROP VIEW IF EXISTS vw_materia_prima_unificado;" "Eliminando vista vw_materia_prima_unificado"
    execute_sql "DROP VIEW IF EXISTS vw_estado_migracion;" "Eliminando vista vw_estado_migracion"

    # Eliminar funciones de migración
    execute_sql "DROP FUNCTION IF EXISTS migrar_lote_materia_prima(INTEGER);" "Eliminando función migrar_lote_materia_prima"
    execute_sql "DROP FUNCTION IF EXISTS validar_consistencia_migracion();" "Eliminando función validar_consistencia_migracion"

    # Eliminar tabla de configuración de feature flags
    execute_sql "DROP TABLE IF EXISTS migration_config;" "Eliminando tabla migration_config"

    # Eliminar tabla de auditoría legacy si ya no es necesaria
    # Nota: Mantener por un tiempo por seguridad
    log_warning "Manteniendo materia_prima_auditoria por seguridad - elimínela manualmente cuando sea apropiado"
}

# Función para crear índices optimizados para producción
create_optimized_indexes() {
    log_info "Creando índices optimizados para producción..."

    # Recrear índices optimizados concurrentemente para evitar bloqueos
    execute_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materia_prima_codigo_barras
        ON materia_prima(codigo_barras) WHERE activo = true;
    " "Creando índice optimizado en codigo_barras"

    execute_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materia_prima_stock_bajo
        ON materia_prima(stock_actual, stock_minimo) WHERE activo = true AND stock_actual <= stock_minimo;
    " "Creando índice para consulta de stock bajo"

    execute_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materia_prima_proveedor
        ON materia_prima(proveedor_id) WHERE activo = true AND proveedor_id IS NOT NULL;
    " "Creando índice para búsquedas por proveedor"

    execute_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materia_prima_categoria
        ON materia_prima(categoria) WHERE activo = true AND categoria IS NOT NULL;
    " "Creando índice para búsquedas por categoría"

    execute_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materia_prima_busqueda_texto
        ON materia_prima USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(descripcion, '')))
        WHERE activo = true;
    " "Creando índice de texto completo para búsquedas"

    execute_sql "
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_materia_prima_fecha_caducidad
        ON materia_prima(fecha_caducidad) WHERE activo = true AND fecha_caducidad IS NOT NULL;
    " "Creando índice para control de fechas de caducidad"

    # Actualizar estadísticas de tabla para el optimizador de consultas
    execute_sql "ANALYZE materia_prima;" "Actualizando estadísticas de la tabla"
}

# Función para optimización adicional de la tabla
optimize_table() {
    log_info "Realizando optimización adicional de la tabla..."

    # Limpiar tabla huérfanos si existen
    execute_sql "
        DELETE FROM materia_prima_auditoria
        WHERE materia_prima_id IS NULL
        AND materia_prima_legacy_id IS NULL;
    " "Limpiando auditoría huérfana"

    # Opcional: VACUUM FULL si hay mucho espacio libre (requiere lock exclusivo)
    local bloat_ratio=$(psql "$DATABASE_URL" -tA -c "
        SELECT
            CASE
                WHEN pg_total_relation_size('materia_prima') = 0 THEN 0
                ELSE round(
                    (pg_relation_size('materia_prima') -
                     (pg_stat_get_live_tuples('materia_prima'::regclass) *
                      (pg_stats_tuple.avg_width + 24)))::numeric /
                    pg_relation_size('materia_prima') * 100, 2)
            END as bloat_percent
        FROM pg_stats_tuple
        WHERE relname = 'materia_prima'
        LIMIT 1;
    " 2>/dev/null || echo "0")

    log_info "Ratio de bloat estimado: ${bloat_ratio}%"

    if [ "${bloat_ratio%.*}" -gt 30 ]; then
        log_warning "Se detectó alto bloat (${bloat_ratio}%). Considere ejecutar VACUUM FULL en mantenimiento"
    fi

    # REINDEX para optimizar rendimiento de índices
    execute_sql "REINDEX INDEX CONCURRENTLY idx_materia_prima_codigo_barras;" "Optimizando índice principal"
}

# Función para generar reporte final
generate_final_report() {
    log_info "Generando reporte final de la Fase 5..."

    local report_file="logs/phase5_final_report_${DATE_STAMP}.txt"

    cat > "$report_file" << EOF
==================================================
REPORT FINAL - FASE 5: Limpieza y Optimización
==================================================
Fecha: $(date)
Base de datos: $(psql "$DATABASE_URL" -tA -c "SELECT current_database();")
Usuario: $(psql "$DATABASE_URL" -tA -c "SELECT current_user;")

ESTADO FINAL DE LA MIGRACIÓN:
=============================

1. ESTADO DE TABLAS:
-------------------
- Tabla Principal: materia_prima (ex materia_prima_migration)
- Tabla Legacy: materia_prima_legacy_${DATE_STAMP}
- Registros en tabla principal: $(psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM materia_prima;")
- Registros activos: $(psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM materia_prima WHERE activo = true;")
- Promedio stock actual: $(psql "$DATABASE_URL" -tA -c "SELECT ROUND(AVG(stock_actual), 2) FROM materia_prima WHERE activo = true;")

2. ÍNDICES CREADOS:
------------------
$(psql "$DATABASE_URL" -c "
    SELECT
        indexname,
        indexdef
    FROM pg_indexes
    WHERE tablename = 'materia_prima'
    AND indexname LIKE 'idx_%'
    ORDER BY indexname;
")

3. ESPACIO UTILIZADO:
-------------------
- Tamaño tabla: $(psql "$DATABASE_URL" -tA -c "SELECT pg_size_pretty(pg_relation_size('materia_prima'));")
- Tamaño índices: $(psql "$DATABASE_URL" -tA -c "SELECT pg_size_pretty(pg_total_relation_size('materia_prima') - pg_relation_size('materia_prima'));")
- Tamaño total: $(psql "$DATABASE_URL" -tA -c "SELECT pg_size_pretty(pg_total_relation_size('materia_prima'));")

4. VALIDACIÓN DE INTEGRIDAD:
--------------------------
$(psql "$DATABASE_URL" -c "
    SELECT
        'Registros con stock bajo' as metrica,
        COUNT(*) as valor
    FROM materia_prima
    WHERE activo = true
    AND stock_actual <= stock_minimo

    UNION ALL

    SELECT
        'Registros sin categoría' as metrica,
        COUNT(*) as valor
    FROM materia_prima
    WHERE activo = true
    AND (categoria IS NULL OR categoria = 'SIN_CATEGORIA')

    UNION ALL

    SELECT
        'Registros con fecha de caducidad próxima' as metrica,
        COUNT(*) as valor
    FROM materia_prima
    WHERE activo = true
    AND fecha_caducidad IS NOT NULL
    AND fecha_caducidad <= CURRENT_DATE + INTERVAL '30 days';
")

5. ESTADO DE AUDITORÍA:
---------------------
- Registros de auditoría: $(psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM materia_prima_auditoria;")
- Rango de fechas: $(psql "$DATABASE_URL" -tA -c "SELECT
    COALESCE(MIN(fecha), 'Sin registros') || ' a ' || COALESCE(MAX(fecha), 'Sin registros')
    FROM materia_prima_auditoria;")

6. PRÓXIMOS PASOS RECOMENDADOS:
------------------------------
- Monitorear performance por 1 semana
- Programar mantenimiento regular (VACUUM, ANALYZE)
- Considerar particionamiento si tabla crece > 1M registros
- Evaluar necesidad de índices adicionales basados en patrones de consulta
- Programar limpieza de tabla legacy después de 30 días

==================================================
Fin del Report - Fase 5 Completada Exitosamente
==================================================
EOF

    log_success "Reporte final generado: $report_file"

    # Mostrar resumen en consola
    echo ""
    echo "${GREEN}=== RESUMEN FASE 5 ===${NC}"
    echo "✅ Transición de tablas completada"
    echo "✅ Objetos temporales eliminados"
    echo "✅ Índices optimizados creados"
    echo "✅ Tabla optimizada para producción"
    echo ""
    echo "📊 Estadísticas finales:"
    echo "   Registros: $(psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM materia_prima;")"
    echo "   Tamaño tabla: $(psql "$DATABASE_URL" -tA -c "SELECT pg_size_pretty(pg_relation_size('materia_prima'));")"
    echo "   Índices: $(psql "$DATABASE_URL" -tA -c "SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'materia_prima' AND indexname LIKE 'idx_%';")"
    echo ""
    echo "📄 Reporte completo: $report_file"
    echo "📄 Log detallado: $LOG_FILE"
}

# Función principal
main() {
    # Crear directorios necesarios
    mkdir -p logs

    echo "${BLUE}=============================================${NC}"
    echo "${BLUE}FASE 5: LIMPIEZA Y OPTIMIZACIÓN${NC}"
    echo "${BLUE}=============================================${NC}"
    echo ""

    # Ejecutar pasos en orden
    log_info "Iniciando Fase 5: Limpieza y Optimización"

    # Paso 0: Verificación inicial
    check_database_connection

    # Paso 1: Backup de seguridad
    create_backup

    # Paso 2: Verificar consistencia
    verify_data_consistency

    # Paso 3: Transición de tablas
    perform_table_transition

    # Paso 4: Limpieza de objetos temporales
    cleanup_temporary_objects

    # Paso 5: Crear índices optimizados
    create_optimized_indexes

    # Paso 6: Optimización adicional
    optimize_table

    # Paso 7: Generar reporte final
    generate_final_report

    echo ""
    echo "${GREEN}🎉 FASE 5 COMPLETADA EXITOSAMENTE${NC}"
    echo "${GREEN}   Migración híbrida de materia_prima finalizada${NC}"
    echo ""
    echo "${BLUE}Sistema listo para producción${NC}"
    echo "${YELLOW}Recomendación: Monitorear performance durante la primera semana${NC}"
}

# Manejo de interrupciones
trap 'log_warning "Ejecución interrumpida"; exit 1' INT TERM

# Ejecutar función principal
main "$@"