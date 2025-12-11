-- Migration 003: Add institution support to reference tables
-- This migration adds multi-tenant support to categoria and presentacion tables

-- 1. Add id_institucion column to presentacion table
ALTER TABLE presentacion
ADD COLUMN id_institucion INTEGER REFERENCES institucion(id);

-- 2. Add id_institucion column to categoria table
ALTER TABLE categoria
ADD COLUMN id_institucion INTEGER REFERENCES institucion(id);

-- 3. Add unique constraints including institution
-- Note: We need to handle existing data first

-- Update existing records to use a default institution (assuming institution id = 1 exists)
-- This should be adjusted based on actual institutional data
UPDATE presentacion SET id_institucion = 1 WHERE id_institucion IS NULL;
UPDATE categoria SET id_institucion = 1 WHERE id_institucion IS NULL;

-- Make the columns NOT NULL after setting default values
ALTER TABLE presentacion ALTER COLUMN id_institucion SET NOT NULL;
ALTER TABLE categoria ALTER COLUMN id_institucion SET NOT NULL;

-- 4. Create institution-aware unique constraints
-- First, drop existing unique constraints
ALTER TABLE presentacion DROP CONSTRAINT IF EXISTS presentacion_nombre_key;
ALTER TABLE categoria DROP CONSTRAINT IF EXISTS categoria_nombre_categoria_padre_id_key;

-- Add new unique constraints that include institution
ALTER TABLE presentacion ADD CONSTRAINT presentacion_unique_institution
UNIQUE (nombre, id_institucion);

ALTER TABLE categoria ADD CONSTRAINT categoria_unique_institution
UNIQUE (nombre, categoria_padre_id, id_institucion);

-- 5. Create indexes for institution-based queries
CREATE INDEX idx_presentaciones_institution ON presentacion(id_institucion);
CREATE INDEX idx_categorias_institution ON categoria(id_institucion);

-- 6. Create compound indexes for common queries
CREATE INDEX idx_presentaciones_activas_institution ON presentacion(activo, id_institucion) WHERE activo = true;
CREATE INDEX idx_categorias_activas_institution ON categoria(activo, id_institucion) WHERE activo = true;

-- 7. Add comments for documentation
COMMENT ON COLUMN presentacion.id_institucion IS 'Institution to which this presentation belongs (multi-tenant support)';
COMMENT ON COLUMN categoria.id_institucion IS 'Institution to which this category belongs (multi-tenant support)';
COMMENT ON CONSTRAINT presentacion_unique_institution ON presentacion IS 'Ensures presentation names are unique within each institution';
COMMENT ON CONSTRAINT categoria_unique_institution ON categoria IS 'Ensures category names are unique within each institution and parent category';