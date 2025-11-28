-- Rollback script for migration 002: Dynamic Reference Data System
-- This script will undo all changes made by the reference tables migration

-- 1. Remove new columns from materia_prima table
ALTER TABLE materia_prima
DROP COLUMN IF EXISTS presentacion_id,
DROP COLUMN IF EXISTS categoria_id;

-- 2. Drop functions used for mapping
DROP FUNCTION IF EXISTS mapear_texto_a_presentacion_id(TEXT, INTEGER);
DROP FUNCTION IF EXISTS mapear_texto_a_categoria_id(TEXT, INTEGER);

-- 3. Drop trigger
DROP TRIGGER IF EXISTS trg_actualizar_ruta_categoria ON categoria;

-- 4. Drop function for ruta maintenance
DROP FUNCTION IF EXISTS actualizar_ruta_categoria();

-- 5. Drop indexes
DROP INDEX IF EXISTS idx_presentaciones_institucion_activas;
DROP INDEX IF EXISTS idx_categorias_institucion_activas;
DROP INDEX IF EXISTS idx_categorias_jerarquia;
DROP INDEX IF EXISTS idx_categorias_orden;

-- 6. Drop tables
DROP TABLE IF EXISTS presentacion;
DROP TABLE IF EXISTS categoria;

-- 7. Remove migration record from kysely_migration table
DELETE FROM kysely_migration WHERE name = '002_create_reference_tables_with_hierarchy.sql';

-- Rollback completed successfully
-- The materia_prima table now has its original structure with text fields