-- Crear tabla materia_prima optimizada
CREATE TABLE IF NOT EXISTS materia_prima (
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
    proveedor_id UUID REFERENCES proveedores(id),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    eliminado_en TIMESTAMP WITH TIME ZONE
);

-- Crear unique constraint parcial para códigos de barras activos
CREATE UNIQUE INDEX IF NOT EXISTS unique_codigo_barras_active
ON materia_prima (codigo_barras)
WHERE activo = true;

-- Crear tabla de auditoría
CREATE TABLE IF NOT EXISTS materia_prima_auditoria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_prima_id UUID NOT NULL REFERENCES materia_prima(id),
    accion VARCHAR(20) NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'STOCK_UPDATE'
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    usuario_id UUID,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_materia_prima_codigo_barras ON materia_prima(codigo_barras) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_nombre ON materia_prima(nombre) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_stock_bajo ON materia_prima(stock_actual, stock_minimo) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_proveedor ON materia_prima(proveedor_id) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_categoria ON materia_prima(categoria) WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_materia_prima_id ON materia_prima_auditoria(materia_prima_id);
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_fecha ON materia_prima_auditoria(fecha);

-- Crear tabla proveedores si no existe
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

-- Trigger para actualizar actualizado_en
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_materia_prima_actualizado_en
    BEFORE UPDATE ON materia_prima
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Trigger para auditoría automática
CREATE OR REPLACE FUNCTION auditoria_materia_prima()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO materia_prima_auditoria (materia_prima_id, accion, datos_nuevos)
        VALUES (NEW.id, TG_OP, row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Solo auditar si hay cambios relevantes
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

CREATE TRIGGER trigger_auditoria_materia_prima
    AFTER INSERT OR UPDATE OR DELETE ON materia_prima
    FOR EACH ROW
    EXECUTE FUNCTION auditoria_materia_prima();