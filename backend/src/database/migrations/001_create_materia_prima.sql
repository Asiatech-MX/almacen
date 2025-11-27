-- Create materia_prima table
CREATE TABLE IF NOT EXISTS materia_prima (
    id SERIAL PRIMARY KEY,
    uuid UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria VARCHAR(100),
    unidad_medida VARCHAR(20) NOT NULL,
    stock_actual DECIMAL(10,2) DEFAULT 0,
    stock_minimo DECIMAL(10,2) DEFAULT 0,
    stock_maximo DECIMAL(10,2) DEFAULT 0,
    costo_unitario DECIMAL(10,2) DEFAULT 0,
    proveedor_id UUID REFERENCES proveedores(id),
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    creado_por VARCHAR(100),
    actualizado_por VARCHAR(100)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_materia_prima_codigo ON materia_prima(codigo);
CREATE INDEX IF NOT EXISTS idx_materia_prima_nombre ON materia_prima(nombre);
CREATE INDEX IF NOT EXISTS idx_materia_prima_categoria ON materia_prima(categoria);
CREATE INDEX IF NOT EXISTS idx_materia_prima_activo ON materia_prima(activo);
CREATE INDEX IF NOT EXISTS idx_materia_prima_proveedor ON materia_prima(proveedor_id);

-- Create trigger for updating fecha_actualizacion
CREATE OR REPLACE FUNCTION update_materia_prima_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER materia_prima_update_timestamp
    BEFORE UPDATE ON materia_prima
    FOR EACH ROW
    EXECUTE FUNCTION update_materia_prima_timestamp();

-- Create trigger for stock validation
CREATE OR REPLACE FUNCTION validate_stock_materia_prima()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.stock_actual < 0 THEN
        RAISE EXCEPTION 'Stock actual no puede ser negativo';
    END IF;
    IF NEW.stock_minimo < 0 THEN
        RAISE EXCEPTION 'Stock mínimo no puede ser negativo';
    END IF;
    IF NEW.stock_maximo < 0 THEN
        RAISE EXCEPTION 'Stock máximo no puede ser negativo';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER materia_prima_stock_validation
    BEFORE INSERT OR UPDATE ON materia_prima
    FOR EACH ROW
    EXECUTE FUNCTION validate_stock_materia_prima();