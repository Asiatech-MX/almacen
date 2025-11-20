-- Migration 001: Update materia_prima table schema to match repository expectations
-- This migration updates the existing materia_prima table to work with the new repository code

-- Begin transaction
BEGIN;

-- Add new columns expected by the repository code
ALTER TABLE materia_prima
ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS stock_actual DECIMAL(10,2) DEFAULT 0 CHECK (stock_actual >= 0),
ADD COLUMN IF NOT EXISTS creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS eliminado_en TIMESTAMP,
ADD COLUMN IF NOT EXISTS proveedor_id UUID REFERENCES proveedor(id),
ADD COLUMN IF NOT EXISTS costo_unitario DECIMAL(12,2) CHECK (costo_unitario >= 0),
ADD COLUMN IF NOT EXISTS fecha_caducidad DATE,
ADD COLUMN IF NOT EXISTS descripcion TEXT,
ADD COLUMN IF NOT EXISTS categoria VARCHAR(100);

-- Migrate data from old fields to new fields
UPDATE materia_prima SET
    activo = CASE WHEN estatus = 'ACTIVO' THEN true ELSE false END,
    stock_actual = stock,
    creado_en = fecha_registro,
    actualizado_en = fecha_registro
WHERE activo IS NULL OR stock_actual IS NULL OR creado_en IS NULL;

-- Create a trigger to automatically update actualizado_en
CREATE OR REPLACE FUNCTION update_actualizado_en_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER materia_prima_actualizado_en_trigger
    BEFORE UPDATE ON materia_prima
    FOR EACH ROW EXECUTE FUNCTION update_actualizado_en_column();

-- Create index for better performance on activo field
CREATE INDEX IF NOT EXISTS idx_materia_prima_activo ON materia_prima(activo);

-- Create audit table for materia_prima
CREATE TABLE IF NOT EXISTS materia_prima_auditoria (
    id SERIAL PRIMARY KEY,
    materia_prima_id INTEGER NOT NULL REFERENCES materia_prima(id),
    materia_prima_legacy_id INTEGER DEFAULT -1,
    accion VARCHAR(50) NOT NULL,
    datos_anteriores TEXT,
    datos_nuevos TEXT,
    usuario_id VARCHAR(255),
    fecha TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index for audit table
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_materia_id ON materia_prima_auditoria(materia_prima_id);
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_fecha ON materia_prima_auditoria(fecha);

-- Commit transaction
COMMIT;

-- Verify the migration
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'materia_prima'
ORDER BY ordinal_position;