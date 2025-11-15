-- Migration to create materia_prima table with audit system
-- Compatible with current PostgreSQL version

-- Create the materia_prima table
CREATE TABLE IF NOT EXISTS materia_prima_migration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_barras VARCHAR(50) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(100),
    modelo VARCHAR(100),
    presentacion VARCHAR(50) NOT NULL,
    stock_actual DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_minimo DECIMAL(10,2) NOT NULL DEFAULT 0,
    costo_unitario DECIMAL(10,2),
    fecha_caducidad DATE,
    imagen_url VARCHAR(500),
    descripcion TEXT,
    categoria VARCHAR(100),
    proveedor_id UUID,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    eliminado_en TIMESTAMP WITH TIME ZONE
);

-- Create unique constraint without WHERE clause (PostgreSQL compatible)
ALTER TABLE materia_prima_migration
ADD CONSTRAINT IF NOT EXISTS unique_codigo_barras_active
UNIQUE (codigo_barras, activo);

-- Create audit table
CREATE TABLE IF NOT EXISTS materia_prima_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_prima_id UUID NOT NULL,
    accion VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'STOCK_UPDATE'
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id UUID,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_materia_prima_migration_codigo_barras ON materia_prima_migration(codigo_barras) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_migration_nombre ON materia_prima_migration(nombre) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_migration_stock_bajo ON materia_prima_migration(stock_actual, stock_minimo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_migration_proveedor ON materia_prima_migration(proveedor_id) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_migration_categoria ON materia_prima_migration(categoria) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_materia_prima_id ON materia_prima_auditoria(materia_prima_id);
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_fecha ON materia_prima_auditoria(fecha);

-- Ensure proveedores table exists
CREATE TABLE IF NOT EXISTS proveedores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    rfc VARCHAR(20) UNIQUE,
    telefono VARCHAR(50),
    email VARCHAR(255),
    direccion TEXT,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint to proveedores
ALTER TABLE materia_prima_migration
ADD CONSTRAINT IF NOT EXISTS fk_materia_prima_proveedor
FOREIGN KEY (proveedor_id) REFERENCES proveedores(id);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for automatic timestamp update
DROP TRIGGER IF EXISTS trigger_materia_prima_actualizado_en ON materia_prima_migration;
CREATE TRIGGER trigger_materia_prima_actualizado_en
    BEFORE UPDATE ON materia_prima_migration
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Create function for audit
CREATE OR REPLACE FUNCTION auditoria_materia_prima()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO materia_prima_auditoria (materia_prima_id, accion, datos_nuevos)
        VALUES (NEW.id, TG_OP, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only audit if there are relevant changes
        IF OLD IS DISTINCT FROM NEW THEN
            INSERT INTO materia_prima_auditoria (materia_prima_id, accion, datos_anteriores, datos_nuevos)
            VALUES (NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW));
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO materia_prima_auditoria (materia_prima_id, accion, datos_anteriores)
        VALUES (OLD.id, TG_OP, row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for audit
DROP TRIGGER IF EXISTS trigger_auditoria_materia_prima ON materia_prima_migration;
CREATE TRIGGER trigger_auditoria_materia_prima
    AFTER INSERT OR UPDATE OR DELETE ON materia_prima_migration
    FOR EACH ROW
    EXECUTE FUNCTION auditoria_materia_prima();

-- Data migration from existing materia_prima to new table
INSERT INTO materia_prima_migration (
    id, codigo_barras, nombre, marca, modelo, presentacion,
    stock_actual, stock_minimo, imagen_url, activo, creado_en
)
SELECT
    gen_random_uuid(),
    codigo_barras,
    nombre,
    marca,
    modelo,
    presentacion,
    stock,
    stock_minimo,
    imagen_url,
    CASE WHEN estatus = 'ACTIVO' THEN true ELSE false END,
    fecha_registro
FROM materia_prima
ON CONFLICT (codigo_barras, activo) DO NOTHING;

-- Drop old table and rename new table
-- WARNING: This will drop the existing materia_prima table
-- DROP TABLE IF EXISTS materia_prima CASCADE;
-- ALTER TABLE materia_prima_migration RENAME TO materia_prima;