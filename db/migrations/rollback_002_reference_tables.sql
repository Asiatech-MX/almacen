-- =====================================
-- ROLLBACK 002: Dynamic Reference Data System
-- Issue #8 - Dynamic Database-Driven Presentations and Categories Management
-- =====================================
-- Rollback complete migration 002
-- =====================================

-- 1. Eliminar nuevas columnas (mantener backwards compatibility)
ALTER TABLE materia_prima
DROP COLUMN IF EXISTS presentacion_id,
DROP COLUMN IF EXISTS categoria_id;

-- 2. Eliminar triggers
DROP TRIGGER IF EXISTS trg_presentacion_timestamp ON presentacion;
DROP TRIGGER IF EXISTS trg_categoria_timestamp ON categoria;
DROP TRIGGER IF EXISTS trg_actualizar_ruta_categoria ON categoria;

-- 3. Eliminar funciones
DROP FUNCTION IF EXISTS actualizar_ruta_categoria();
DROP FUNCTION IF EXISTS mapear_texto_a_presentacion_id(TEXT, INTEGER);
DROP FUNCTION IF EXISTS mapear_texto_a_categoria_id(TEXT, INTEGER);

-- 4. Eliminar índices
DROP INDEX IF EXISTS idx_presentaciones_institucion_activas;
DROP INDEX IF EXISTS idx_categorias_institucion_activas;
DROP INDEX IF EXISTS idx_categorias_jerarquia;
DROP INDEX IF EXISTS idx_categorias_orden;

-- 5. Eliminar tablas (en orden correcto para respetar foreign keys)
DROP TABLE IF EXISTS presentacion;
DROP TABLE IF EXISTS categoria;

-- =====================================
-- VERIFICATION
-- =====================================

-- Verificar que las columnas originales de materia_prima existen
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='materia_prima'
        AND column_name='presentacion'
    ) THEN
        RAISE EXCEPTION 'Column presentacion missing from materia_prima table after rollback';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='materia_prima'
        AND column_name='categoria'
    ) THEN
        RAISE EXCEPTION 'Column categoria missing from materia_prima table after rollback';
    END IF;

    RAISE NOTICE 'Rollback completed successfully. Original materia_prima columns preserved.';
END $$;