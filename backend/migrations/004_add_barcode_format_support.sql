-- Add barcode format support to materia_prima table
-- This migration adds support for multiple barcode formats (EAN-13, UPC, CODE128, CODE39, SKU, QR)

-- Add barcode format column
ALTER TABLE materia_prima 
ADD COLUMN IF NOT EXISTS codigo_barras_formato VARCHAR(20) DEFAULT 'CODE128';

-- Create check constraint for valid barcode formats
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_codigo_barras_formato' 
        AND table_name = 'materia_prima'
    ) THEN
        ALTER TABLE materia_prima DROP CONSTRAINT chk_codigo_barras_formato;
    END IF;
END $$;

ALTER TABLE materia_prima 
ADD CONSTRAINT chk_codigo_barras_formato 
CHECK (codigo_barras_formato IN ('EAN13', 'UPC', 'CODE128', 'CODE128A', 'CODE128B', 'CODE128C', 'CODE39', 'CODE39EXT', 'ITF14', 'SKU', 'QR'));

-- Update existing records to set default format (for backwards compatibility)
UPDATE materia_prima 
SET codigo_barras_formato = CASE 
    WHEN LENGTH(codigo_barras) = 13 AND codigo_barras ~ '^\d{13}$' THEN 'EAN13'
    WHEN LENGTH(codigo_barras) = 12 AND codigo_barras ~ '^\d{12}$' THEN 'UPC'
    WHEN codigo_barras ~ '^[A-Z0-9\-\.\ \$\/\+\%]+$' THEN 'CODE39'
    ELSE 'CODE128'
END 
WHERE codigo_barras_formato IS NULL OR codigo_barras_formato = '';

-- Add index for barcode format if needed for filtering
CREATE INDEX IF NOT EXISTS idx_materia_prima_codigo_barras_formato 
ON materia_prima(codigo_barras_formato) WHERE activo = true;

-- Add composite index for barcode + format for uniqueness validation
CREATE UNIQUE INDEX IF NOT EXISTS unique_codigo_barras_formato_active
ON materia_prima(codigo_barras, codigo_barras_formato) 
WHERE activo = true;

-- Create table for barcode validation patterns (helpful for UI)
CREATE TABLE IF NOT EXISTS barcode_validations (
    formato VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    descripcion TEXT,
    longitud_minima INTEGER,
    longitud_maxima INTEGER,
    patron VARCHAR(100), -- Regex pattern for validation
    ejemplos TEXT[], -- Array of example values
    checksum BOOLEAN DEFAULT false,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default barcode validation patterns
INSERT INTO barcode_validations (formato, nombre, descripcion, longitud_minima, longitud_maxima, patron, ejemplos, checksum)
VALUES 
    ('EAN13', 'EAN-13', 'Código europeo de 13 dígitos para productos de consumo', 13, 13, '^\d{13}$', ARRAY['7501234567890', '9780199532179'], true),
    ('UPC', 'UPC', 'Código universal de 12 dígitos para productos en EE.UU. y Canadá', 12, 12, '^\d{12}$', ARRAY['012345678901', '042100005264'], true),
    ('CODE128', 'CODE128', 'Código de alta densidad con soporte ASCII completo', 1, 80, '^.*$', ARRAY['EXAMPLE1234', '12345678'], false),
    ('CODE128A', 'CODE128A', 'CODE128 Subconjunto A (control y ASCII 00-95)', 1, 80, '^[\x00-\x5F]*$', ARRAY['!ABC', '123456'], false),
    ('CODE128B', 'CODE128B', 'CODE128 Subconjunto B (ASCII completo)', 1, 80, '^[\x20-\x7E]*$', ARRAY['Example1234', 'abc-123'], false),
    ('CODE128C', 'CODE128C', 'CODE128 Subconjunto C (dígitos por pares)', 2, 80, '^\d*$', ARRAY['12345678', '987654'], false),
    ('CODE39', 'CODE39', 'Código industrial alfanumérico', 1, 43, '^[A-Z0-9\-\.\ \$\/\+\%]+$', ARRAY['ABC123', '123-456'], false),
    ('CODE39EXT', 'CODE39EXT', 'CODE39 extendido con soporte ASCII completo', 1, 43, '^[A-Z0-9\-\.\ \$\/\+\%]+$', ARRAY['ABC123', '123-456'], false),
    ('ITF14', 'ITF14', 'Código intercalado de 2 de 5 para empaquetado', 14, 14, '^\d{14}$', ARRAY['15400141425432', '12345678901231'], true),
    ('SKU', 'SKU', 'Código personalizado para inventario', 1, 50, '^.{1,50}$', ARRAY['SKU-001', 'PRD-12345', 'ITEM-XYZ'], false),
    ('QR', 'QR Code', 'Código QR bidimensional', 1, 2000, '^.{1,2000}$', ARRAY['https://example.com', 'Contact:John Doe'], false)
ON CONFLICT (formato) DO NOTHING;

-- Add index for barcode validations
CREATE INDEX IF NOT EXISTS idx_barcode_validations_formato 
ON barcode_validations(formato);

-- Create trigger to validate barcode format before insert/update
CREATE OR REPLACE FUNCTION validar_codigo_barras_formato()
RETURNS TRIGGER AS $$
DECLARE
    validation_record barcode_validations%ROWTYPE;
BEGIN
    -- Skip validation if format is NULL
    IF NEW.codigo_barras_formato IS NULL THEN
        RETURN NEW;
    END IF;
    
    -- Get validation rules for the format
    SELECT * INTO validation_record 
    FROM barcode_validations 
    WHERE formato = NEW.codigo_barras_formato;
    
    -- If format not found, skip validation
    IF NOT FOUND THEN
        RETURN NEW;
    END IF;
    
    -- Validate barcode length
    IF NEW.codigo_barras IS NOT NULL THEN
        IF LENGTH(NEW.codigo_barras) < validation_record.longitud_minima 
           OR LENGTH(NEW.codigo_barras) > validation_record.longitud_maxima THEN
            RAISE EXCEPTION 'Longitud de código de barras inválida para formato %. Se esperan entre % y % caracteres', 
                NEW.codigo_barras_formato, validation_record.longitud_minima, validation_record.longitud_maxima;
        END IF;
        
        -- Validate pattern if exists
        IF validation_record.patron IS NOT NULL THEN
            IF NEW.codigo_barras !~ validation_record.patron THEN
                RAISE EXCEPTION 'Formato de código de barras inválido para %', NEW.codigo_barras_formato;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for barcode validation
DROP TRIGGER IF EXISTS trigger_validar_codigo_barras_formato ON materia_prima;
CREATE TRIGGER trigger_validar_codigo_barras_formato
    BEFORE INSERT OR UPDATE ON materia_prima
    FOR EACH ROW
    EXECUTE FUNCTION validar_codigo_barras_formato();

-- Add comment to the new column
COMMENT ON COLUMN materia_prima.codigo_barras_formato IS 'Formato del código de barras (EAN13, UPC, CODE128, CODE39, SKU, QR)';
COMMENT ON TABLE barcode_validations IS 'Tabla de validación de formatos de códigos de barras';

-- Migration completed successfully
SELECT '004_add_barcode_format_support migration completed successfully' as migration_status;
