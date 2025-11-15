#!/bin/bash

# =============================================================================
# SCRIPT DE MIGRACIÓN AUTOMATIZADA - FASE 3
# Sistema de Almacén - Migración Híbrida de materia_prima
# =============================================================================

# Configuración de parámetros
BATCH_SIZE=${BATCH_SIZE:-1000}
MAX_ERRORS=${MAX_ERRORS:-5}
ERROR_COUNT=0
PAUSE_DURATION=${PAUSE_DURATION:-2}
DATABASE_URL=${DATABASE_URL:-"postgresql://postgres:postgres@localhost:5432/almacen_db"}

# Colores para salida
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de logging
log_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

# Función para verificar conexión a base de datos
check_database_connection() {
    log_info "Verificando conexión a la base de datos..."

    if ! psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
        log_error "No se puede conectar a la base de datos: $DATABASE_URL"
        exit 1
    fi

    log_success "Conexión a base de datos establecida"
}

# Función para obtener estado actual de la migración
get_migration_status() {
    psql "$DATABASE_URL" -t -c "
        SELECT
            COUNT(*) as total_legacy,
            COALESCE((SELECT COUNT(*) FROM materia_prima_migration WHERE activo = true), 0) as total_migrated,
            CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((SELECT COUNT(*) FROM materia_prima_migration WHERE activo = true) * 100.0 / COUNT(*), 2)
            END as porcentaje_migrado
        FROM materia_prima;
    " | sed 's/^[ \t]*//;s/[ \t]*$//'
}

# Función para ejecutar migración de lote
migrate_batch() {
    local batch_size=$1

    log_info "Ejecutando migración de lote (tamaño: $batch_size)..."

    # Usar la función existente migrar_lote_materia_prima
    local result=$(psql "$DATABASE_URL" -t -c "
        SELECT
            COALESCE(registros_migrados, 0)::text,
            COALESCE(registros_restantes, 0)::text,
            COALESCE(errores, '')::text
        FROM migrar_lote_materia_prima($batch_size);
    " | sed 's/^[ \t]*//;s/[ \t]*$//')

    if [ -z "$result" ]; then
        echo "0|0|Error desconocido"
        return 1
    fi

    echo "$result"
    return 0
}

# Función para validar consistencia después de la migración
validate_consistency() {
    log_info "Validando consistencia de datos migrados..."

    local inconsistencies=$(psql "$DATABASE_URL" -t -c "
        SELECT COUNT(*)
        FROM validar_consistencia_migracion()
        WHERE total_inconsistencias > 0;
    " | sed 's/^[ \t]*//;s/[ \t]*$//')

    if [ "$inconsistencies" -gt 0 ]; then
        log_warning "Se detectaron $inconsistencias tipos de inconsistencias"

        # Mostrar detalles de inconsistencias
        psql "$DATABASE_URL" -c "
            SELECT * FROM validar_consistencia_migracion()
            WHERE total_inconsistencias > 0;
        "

        return 1
    fi

    log_success "Validación de consistencia completada sin errores"
    return 0
}

# Función para mostrar estadísticas finales
show_final_statistics() {
    log_info "Generando estadísticas finales de migración..."

    echo ""
    echo "📊 ESTADÍSTICAS FINALES DE MIGRACIÓN"
    echo "======================================"

    psql "$DATABASE_URL" -c "
        SELECT
            'materia_prima' as tabla,
            COUNT(*) as total_legacy,
            (SELECT COUNT(*) FROM materia_prima_migration WHERE activo = true) as total_migrated,
            CASE
                WHEN COUNT(*) = 0 THEN 0
                ELSE ROUND((SELECT COUNT(*) FROM materia_prima_migration WHERE activo = true) * 100.0 / COUNT(*), 2)
            END as porcentaje_migrado,
            MIN(fecha_registro) as fecha_primer_registro,
            MAX(fecha_registro) as fecha_ultimo_registro
        FROM materia_prima;
    "

    echo ""
    echo "📈 AUDITORÍA DE MIGRACIÓN"
    echo "========================"

    psql "$DATABASE_URL" -c "
        SELECT
            accion,
            COUNT(*) as total_operaciones,
            MAX(fecha) as ultima_operacion
        FROM materia_prima_auditoria
        WHERE fecha >= CURRENT_DATE
        GROUP BY accion
        ORDER BY accion;
    "
}

# Función principal de migración
run_migration() {
    log_info "🚀 Iniciando Fase 3 - Migración Gradual de Datos"
    log_info "Fecha de inicio: $(date)"

    # Verificar conexión
    check_database_connection

    # Mostrar estado inicial
    echo ""
    log_info "ESTADO INICIAL DE MIGRACIÓN"
    psql "$DATABASE_URL" -c "SELECT * FROM vw_estado_migracion;"

    # Bucle principal de migración
    local iteration=0
    local start_time=$(date +%s)

    while true; do
        iteration=$((iteration + 1))

        echo ""
        log_info "📦 Iteración $iteration - Migrando lote de $BATCH_SIZE registros..."

        # Ejecutar migración
        local migration_result=$(migrate_batch $BATCH_SIZE)

        # Parsear resultado
        local migrados=$(echo "$migration_result" | cut -d'|' -f1)
        local restantes=$(echo "$migration_result" | cut -d'|' -f2)
        local errores=$(echo "$migration_result" | cut -d'|' -f3)

        # Manejar errores
        if [ -n "$errores" ] && [ "$errores" != "" ]; then
            ERROR_COUNT=$((ERROR_COUNT + 1))
            log_error "Error en lote: $errores"

            if [ $ERROR_COUNT -ge $MAX_ERRORS ]; then
                log_error "Demasiados errores ($ERROR_COUNT). Deteniendo migración."
                exit 1
            fi
        else
            log_success "Lote migrado: $migrados registros"
            log_info "Registros restantes: $restantes"
        fi

        # Verificar condición de término
        if [ "$migrados" -eq 0 ] || [ "$restantes" -eq 0 ]; then
            log_success "🎉 Migración completada!"
            break
        fi

        # Pausa para no sobrecargar el sistema
        log_info "Pausando $PAUSE_DURATION segundos..."
        sleep $PAUSE_DURATION
    done

    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    # Validación final de consistencia
    echo ""
    if validate_consistency; then
        log_success "✅ Validación final exitosa"
    else
        log_warning "⚠️ Se detectaron inconsistencias en la validación final"
    fi

    # Mostrar estadísticas finales
    show_final_statistics

    echo ""
    log_success "🎊 Fase 3 completada exitosamente"
    log_info "Duración total: $duration segundos"
    log_info "Total de iteraciones: $iteration"
    log_info "Total de errores: $ERROR_COUNT"

    # Verificar estado final
    echo ""
    log_info "ESTADO FINAL DE MIGRACIÓN"
    psql "$DATABASE_URL" -c "SELECT * FROM vw_estado_migracion;"
}

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [OPCIONES]"
    echo ""
    echo "Opciones:"
    echo "  -h, --help              Muestra esta ayuda"
    echo "  -s, --batch-size N      Tamaño del lote (default: 1000)"
    echo "  -e, --max-errors N      Máximo número de errores (default: 5)"
    echo "  -p, --pause N           Pausa entre lotes en segundos (default: 2)"
    echo "  -d, --database URL      URL de base de datos"
    echo "  --status-only           Solo muestra estado actual"
    echo "  --validate-only         Solo ejecuta validación de consistencia"
    echo ""
    echo "Variables de entorno:"
    echo "  BATCH_SIZE              Tamaño del lote"
    echo "  MAX_ERRORS              Máximo número de errores"
    echo "  PAUSE_DURATION          Pausa entre lotes"
    echo "  DATABASE_URL            URL de base de datos"
    echo ""
    echo "Ejemplos:"
    echo "  $0                      Ejecuta migración con valores por defecto"
    echo "  $0 -s 500 -e 10        Lotes de 500 registros, máximo 10 errores"
    echo "  $0 --status-only        Muestra estado actual de la migración"
}

# Manejo de argumentos
case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
    --status-only)
        check_database_connection
        echo "ESTADO ACTUAL DE MIGRACIÓN"
        psql "$DATABASE_URL" -c "SELECT * FROM vw_estado_migracion;"
        exit 0
        ;;
    --validate-only)
        check_database_connection
        if validate_consistency; then
            log_success "Validación completada sin inconsistencias"
            exit 0
        else
            log_error "Se detectaron inconsistencias"
            exit 1
        fi
        ;;
    -s|--batch-size)
        BATCH_SIZE="$2"
        shift 2
        ;;
    -e|--max-errors)
        MAX_ERRORS="$2"
        shift 2
        ;;
    -p|--pause)
        PAUSE_DURATION="$2"
        shift 2
        ;;
    -d|--database)
        DATABASE_URL="$2"
        shift 2
        ;;
esac

# Ejecutar migración principal
run_migration