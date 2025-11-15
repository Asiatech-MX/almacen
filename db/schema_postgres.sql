-- Esquema PostgreSQL para Sistema de Almacén de Materia Prima
-- Migrado desde MySQL/MariaDB

-- Crear extensión para UUID (si se necesita en el futuro)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================
-- TABLAS DE CATÁLOGO (MAESTROS)
-- =====================================

-- Tabla de Instituciones
CREATE TABLE institucion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    estatus VARCHAR(20) NOT NULL DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Usuarios
CREATE TABLE usuario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL,
    apellido_paterno VARCHAR(30) NOT NULL,
    apellido_materno VARCHAR(30),
    username VARCHAR(30) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    tipo_usuario VARCHAR(30) NOT NULL DEFAULT 'CONSULTA' CHECK (tipo_usuario IN ('ADMIN', 'PROFESOR', 'CONSULTA')),
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    estatus VARCHAR(20) NOT NULL DEFAULT 'ACTIVO' CHECK (estatus IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP
);

-- Tabla de Proveedores
CREATE TABLE proveedor (
    id SERIAL PRIMARY KEY,
    id_fiscal VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    domicilio TEXT,
    telefono VARCHAR(50),
    email VARCHAR(255),
    contacto VARCHAR(255),
    rfc VARCHAR(20),
    curp VARCHAR(20),
    estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO' CHECK (estatus IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id)
);

-- Tabla de Empresas Proveedoras (extendida)
CREATE TABLE empresa_proveedora (
    id_fiscal VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    domicilio VARCHAR(200) NOT NULL,
    numero_interior VARCHAR(20),
    numero_exterior VARCHAR(50),
    colonia VARCHAR(100),
    ciudad VARCHAR(100),
    pais VARCHAR(100),
    codigo_postal INTEGER,
    telefono VARCHAR(100),
    email VARCHAR(100),
    contacto VARCHAR(100),
    condicion_pago VARCHAR(255),
    condicion_entrega VARCHAR(255),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Materia Prima
CREATE TABLE materia_prima (
    id SERIAL PRIMARY KEY,
    codigo_barras VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    presentacion VARCHAR(255) NOT NULL,
    stock DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    stock_minimo DECIMAL(10,2) DEFAULT 0 CHECK (stock_minimo >= 0),
    estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO' CHECK (estatus IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    imagen_url VARCHAR(500),
    unidad_medida VARCHAR(50) NOT NULL DEFAULT 'PIEZA'
);

-- Tabla de Productos Terminados
CREATE TABLE producto (
    id SERIAL PRIMARY KEY,
    codigo_barras VARCHAR(255) NOT NULL UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    marca VARCHAR(255) NOT NULL,
    modelo VARCHAR(255) NOT NULL,
    cantidad DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (cantidad >= 0),
    sku VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    unidad_medida VARCHAR(50) NOT NULL,
    tiempo_produccion DECIMAL(8,2) NOT NULL DEFAULT 0,
    unidad_medida_secundaria VARCHAR(50),
    stock DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (stock >= 0),
    estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO' CHECK (estatus IN ('ACTIVO', 'INACTIVO')),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    imagen_url VARCHAR(500)
);

-- Tabla de Detalles de Producto (dimensiones, precios)
CREATE TABLE producto_detalle (
    id SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    longitud DECIMAL(8,2),
    anchura DECIMAL(8,2),
    alto DECIMAL(8,2),
    peso_bruto DECIMAL(8,2),
    peso_neto DECIMAL(8,2),
    precio DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (precio >= 0),
    cantidad INTEGER NOT NULL DEFAULT 0,
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Detalles de Producción
CREATE TABLE producto_detalle_produccion (
    id SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
    orden_produccion VARCHAR(200) NOT NULL,
    fecha_fabricacion DATE,
    fecha_caducidad DATE,
    clave_empresa VARCHAR(200),
    status VARCHAR(50) DEFAULT 'PRODUCCION',
    escuela VARCHAR(200),
    fecha_registro TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================
-- TABLAS TRANSACCIONALES
-- =====================================

-- Tabla de Solicitudes de Compra
CREATE TABLE solicitud_compra (
    id SERIAL PRIMARY KEY,
    folio VARCHAR(100) NOT NULL UNIQUE,
    empresa_solicitante VARCHAR(255) NOT NULL,
    nombre_solicitante VARCHAR(255) NOT NULL,
    direccion_solicitante TEXT,
    rfc_solicitante VARCHAR(50),
    telefono_solicitante VARCHAR(50),
    correo_solicitante VARCHAR(100),
    uso_cfdi VARCHAR(100),
    forma_pago VARCHAR(100),
    departamento_solicitante VARCHAR(100),
    fecha_solicitud DATE NOT NULL,
    id_material INTEGER NOT NULL REFERENCES materia_prima(id),
    modelo_material VARCHAR(255),
    marca_material VARCHAR(255),
    cantidad_solicitada DECIMAL(10,2) NOT NULL CHECK (cantidad_solicitada > 0),
    unidad_medida VARCHAR(50) NOT NULL,
    id_proveedor INTEGER REFERENCES proveedor(id),
    id_usuario_solicitante INTEGER NOT NULL REFERENCES usuario(id),
    lugar_entrega TEXT,
    fecha_esperada DATE,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    estatus VARCHAR(50) NOT NULL DEFAULT 'PENDIENTE' CHECK (estatus IN ('PENDIENTE', 'APROBADO', 'RECHAZADO', 'COMPRADO', 'RECIBIDO')),
    fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP,
    id_usuario_autorizo INTEGER REFERENCES usuario(id),
    comentarios TEXT
);

-- Tabla de Entradas de Material
CREATE TABLE entrada_material (
    id SERIAL PRIMARY KEY,
    id_material INTEGER NOT NULL REFERENCES materia_prima(id),
    id_proveedor INTEGER NOT NULL REFERENCES proveedor(id),
    cantidad_anterior DECIMAL(10,2) NOT NULL CHECK (cantidad_anterior >= 0),
    cantidad_entrante DECIMAL(10,2) NOT NULL CHECK (cantidad_entrante > 0),
    cantidad_actual DECIMAL(10,2) NOT NULL CHECK (cantidad_actual >= 0),
    precio_unitario DECIMAL(12,4) NOT NULL CHECK (precio_unitario >= 0),
    tipo_moneda VARCHAR(10) NOT NULL DEFAULT 'MXN' CHECK (tipo_moneda IN ('MXN', 'USD', 'EUR')),
    estado_material VARCHAR(100) NOT NULL,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id),
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    numero_factura VARCHAR(100),
    fecha_factura DATE,
    comentarios TEXT,
    id_solicitud_compra INTEGER REFERENCES solicitud_compra(id) -- Opcional: si esta entrada corresponde a una solicitud
);

-- Tabla de Salidas de Material
CREATE TABLE salida_material (
    id SERIAL PRIMARY KEY,
    id_material INTEGER NOT NULL REFERENCES materia_prima(id),
    cantidad_anterior DECIMAL(10,2) NOT NULL CHECK (cantidad_anterior >= 0),
    cantidad_saliente DECIMAL(10,2) NOT NULL CHECK (cantidad_saliente > 0),
    cantidad_posterior DECIMAL(10,2) NOT NULL CHECK (cantidad_posterior >= 0),
    estado_material VARCHAR(100) NOT NULL,
    solicitante VARCHAR(250) NOT NULL,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id),
    razon_uso TEXT NOT NULL,
    orden_produccion VARCHAR(250),
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    autorizado_por INTEGER REFERENCES usuario(id),
    comentarios TEXT
);

-- Tabla de Entradas de Producto
CREATE TABLE entrada_producto (
    id SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES producto(id),
    fecha_caducidad DATE,
    cantidad_anterior DECIMAL(10,2) NOT NULL CHECK (cantidad_anterior >= 0),
    cantidad_entrante DECIMAL(10,2) NOT NULL CHECK (cantidad_entrante > 0),
    cantidad_actual DECIMAL(10,2) NOT NULL CHECK (cantidad_actual >= 0),
    numero_lotes INTEGER,
    cantidad_por_lote DECIMAL(10,2),
    codigo_lotes VARCHAR(100),
    estado_producto VARCHAR(100) NOT NULL,
    numero_orden_produccion VARCHAR(100),
    embalaje VARCHAR(200),
    otro_embalaje VARCHAR(100),
    pallet VARCHAR(100),
    id_usuario INTEGER NOT NULL REFERENCES usuario(id),
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comentarios TEXT
);

-- Tabla de Salidas de Producto
CREATE TABLE salida_producto (
    id SERIAL PRIMARY KEY,
    id_producto INTEGER NOT NULL REFERENCES producto(id),
    fecha_caducidad DATE,
    cantidad_anterior DECIMAL(10,2) NOT NULL CHECK (cantidad_anterior >= 0),
    cantidad_saliente DECIMAL(10,2) NOT NULL CHECK (cantidad_saliente > 0),
    cantidad_posterior DECIMAL(10,2) NOT NULL CHECK (cantidad_posterior >= 0),
    numero_lotes INTEGER,
    codigo_lotes VARCHAR(200),
    estado_producto VARCHAR(100) NOT NULL,
    orden_produccion VARCHAR(200) NOT NULL,
    autorizacion VARCHAR(250),
    id_cliente INTEGER, -- Referencia a empresa/cliente
    id_usuario INTEGER NOT NULL REFERENCES usuario(id),
    fecha_movimiento TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    comentarios TEXT
);

-- =====================================
-- TABLAS DE CONFIGURACIÓN Y SOPORTE
-- =====================================

-- Tabla de Parámetros del Sistema
CREATE TABLE parametro_sistema (
    id SERIAL PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor TEXT,
    descripcion TEXT,
    tipo_dato VARCHAR(20) NOT NULL DEFAULT 'STRING' CHECK (tipo_dato IN ('STRING', 'NUMBER', 'BOOLEAN', 'DATE')),
    id_institucion INTEGER REFERENCES institucion(id),
    fecha_actualizacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de Auditoría
CREATE TABLE auditoria (
    id SERIAL PRIMARY KEY,
    tabla_afectada VARCHAR(50) NOT NULL,
    id_registro_afectado INTEGER NOT NULL,
    tipo_operacion VARCHAR(20) NOT NULL CHECK (tipo_operacion IN ('INSERT', 'UPDATE', 'DELETE')),
    valor_anterior JSONB,
    valor_nuevo JSONB,
    id_usuario INTEGER NOT NULL REFERENCES usuario(id),
    fecha_operacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent TEXT
);

-- =====================================
-- ÍNDICES
-- =====================================

-- Índices para Materia Prima
CREATE INDEX idx_materia_prima_codigo_barras ON materia_prima(codigo_barras);
CREATE INDEX idx_materia_prima_nombre ON materia_prima(nombre);
CREATE INDEX idx_materia_prima_estatus ON materia_prima(estatus);
CREATE INDEX idx_materia_prima_institucion ON materia_prima(id_institucion);
CREATE INDEX idx_materia_prima_stock ON materia_prima(stock) WHERE stock <= stock_minimo;

-- Índices para Proveedores
CREATE INDEX idx_proveedor_id_fiscal ON proveedor(id_fiscal);
CREATE INDEX idx_proveedor_nombre ON proveedor(nombre);
CREATE INDEX idx_proveedor_rfc ON proveedor(rfc);
CREATE INDEX idx_proveedor_estatus ON proveedor(estatus);

-- Índices para Productos
CREATE INDEX idx_producto_codigo_barras ON producto(codigo_barras);
CREATE INDEX idx_producto_sku ON producto(sku);
CREATE INDEX idx_producto_nombre ON producto(nombre);
CREATE INDEX idx_producto_estatus ON producto(estatus);

-- Índices para Solicitudes
CREATE INDEX idx_solicitud_folio ON solicitud_compra(folio);
CREATE INDEX idx_solicitud_estatus ON solicitud_compra(estatus);
CREATE INDEX idx_solicitud_fecha ON solicitud_compra(fecha_solicitud);
CREATE INDEX idx_solicitud_material ON solicitud_compra(id_material);
CREATE INDEX idx_solicitud_proveedor ON solicitud_compra(id_proveedor);
CREATE INDEX idx_solicitud_institucion ON solicitud_compra(id_institucion);

-- Índices para Movimientos
CREATE INDEX idx_entrada_material_fecha ON entrada_material(fecha_movimiento);
CREATE INDEX idx_entrada_material_material ON entrada_material(id_material);
CREATE INDEX idx_entrada_material_proveedor ON entrada_material(id_proveedor);
CREATE INDEX idx_entrada_material_institucion ON entrada_material(id_institucion);

CREATE INDEX idx_salida_material_fecha ON salida_material(fecha_movimiento);
CREATE INDEX idx_salida_material_material ON salida_material(id_material);
CREATE INDEX idx_salida_material_solicitante ON salida_material(solicitante);
CREATE INDEX idx_salida_material_institucion ON salida_material(id_institucion);

CREATE INDEX idx_entrada_producto_fecha ON entrada_producto(fecha_movimiento);
CREATE INDEX idx_entrada_producto_producto ON entrada_producto(id_producto);

CREATE INDEX idx_salida_producto_fecha ON salida_producto(fecha_movimiento);
CREATE INDEX idx_salida_producto_producto ON salida_producto(id_producto);

-- Índices para Auditoría
CREATE INDEX idx_auditoria_fecha ON auditoria(fecha_operacion);
CREATE INDEX idx_auditoria_tabla ON auditoria(tabla_afectada);
CREATE INDEX idx_auditoria_usuario ON auditoria(id_usuario);

-- =====================================
-- TRIGGERS Y FUNCIONES
-- =====================================

-- Función para actualizar timestamp de actualización
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para solicitud_compra
CREATE TRIGGER trg_solicitud_compra_timestamp
    BEFORE UPDATE ON solicitud_compra
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Función para auditoría automática
CREATE OR REPLACE FUNCTION auditar_cambios()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria (tabla_afectada, id_registro_afectado, tipo_operacion, valor_anterior, id_usuario)
        VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), NULL);
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria (tabla_afectada, id_registro_afectado, tipo_operacion, valor_anterior, valor_nuevo, id_usuario)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), NEW.id_usuario);
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria (tabla_afectada, id_registro_afectado, tipo_operacion, valor_nuevo, id_usuario)
        VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), NEW.id_usuario);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers para auditoría (solo en tablas principales)
CREATE TRIGGER aud_materia_prima
    AFTER INSERT OR UPDATE OR DELETE ON materia_prima
    FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

CREATE TRIGGER aud_proveedor
    AFTER INSERT OR UPDATE OR DELETE ON proveedor
    FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

CREATE TRIGGER aud_entrada_material
    AFTER INSERT OR UPDATE OR DELETE ON entrada_material
    FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

CREATE TRIGGER aud_salida_material
    AFTER INSERT OR UPDATE OR DELETE ON salida_material
    FOR EACH ROW EXECUTE FUNCTION auditar_cambios();

-- =====================================
-- VISTAS ÚTILES
-- =====================================

-- Vista de stock actual de materia prima
CREATE VIEW vw_stock_materia_prima AS
SELECT
    mp.id,
    mp.codigo_barras,
    mp.nombre,
    mp.marca,
    mp.modelo,
    mp.presentacion,
    mp.stock,
    mp.stock_minimo,
    CASE
        WHEN mp.stock <= mp.stock_minimo THEN 'STOCK BAJO'
        WHEN mp.stock = 0 THEN 'SIN STOCK'
        ELSE 'OK'
    END AS estatus_stock,
    mp.unidad_medida,
    i.nombre AS institucion,
    mp.estatus
FROM materia_prima mp
JOIN institucion i ON mp.id_institucion = i.id
WHERE mp.estatus = 'ACTIVO';

-- Vista de movimientos consolidados
CREATE VIEW vw_movimientos_material AS
SELECT
    'ENTRADA' AS tipo_movimiento,
    em.id,
    em.fecha_movimiento,
    mp.codigo_barras,
    mp.nombre AS material_nombre,
    p.nombre AS proveedor_nombre,
    em.cantidad_entrante AS cantidad,
    em.cantidad_anterior,
    em.cantidad_actual,
    em.tipo_moneda,
    em.precio_unitario,
    u.nombre AS usuario_nombre,
    i.nombre AS institucion,
    em.numero_factura
FROM entrada_material em
JOIN materia_prima mp ON em.id_material = mp.id
JOIN proveedor p ON em.id_proveedor = p.id
JOIN usuario u ON em.id_usuario = u.id
JOIN institucion i ON em.id_institucion = i.id

UNION ALL

SELECT
    'SALIDA' AS tipo_movimiento,
    sm.id,
    sm.fecha_movimiento,
    mp.codigo_barras,
    mp.nombre AS material_nombre,
    NULL AS proveedor_nombre,
    sm.cantidad_saliente AS cantidad,
    sm.cantidad_anterior,
    sm.cantidad_posterior,
    NULL AS tipo_moneda,
    NULL AS precio_unitario,
    u.nombre AS usuario_nombre,
    i.nombre AS institucion,
    NULL AS numero_factura
FROM salida_material sm
JOIN materia_prima mp ON sm.id_material = mp.id
JOIN usuario u ON sm.id_usuario = u.id
JOIN institucion i ON sm.id_institucion = i.id;

-- Vista de solicitudes por estatus
CREATE VIEW vw_solicitudes_resumen AS
SELECT
    estatus,
    COUNT(*) AS total_solicitudes,
    SUM(cantidad_solicitada) AS cantidad_total,
    COUNT(DISTINCT id_material) AS materiales_distintos,
    COUNT(DISTINCT id_proveedor) AS proveedores_distintos
FROM solicitud_compra
GROUP BY estatus;

-- =====================================
-- INSERCIÓN DE DATOS INICIALES
-- =====================================

-- Insertar institución por defecto
INSERT INTO institucion (nombre, descripcion)
VALUES ('ACK', 'Institución ACK por defecto');

-- Insertar parámetros del sistema
INSERT INTO parametro_sistema (clave, valor, descripcion, tipo_dato) VALUES
('STOCK_MINIMO_DEFAULT', '10', 'Stock mínimo por defecto para nueva materia prima', 'NUMBER'),
('MONEDA_DEFAULT', 'MXN', 'Moneda por defecto para movimientos', 'STRING'),
('DIAS_CADUCIDAD_ALERTA', '30', 'Días antes de la fecha de caducidad para alertar', 'NUMBER'),
('MAX_INTENTOS_LOGIN', '3', 'Máximo de intentos fallidos de login', 'NUMBER');

-- =====================================
-- COMENTARIOS FINALES
-- =====================================

-- Este esquema está diseñado para:
-- 1. Mantener integridad referencial con foreign keys
-- 2. Optimizar consultas con índices apropiados
-- 3. Tener auditoría automática de cambios
-- 4. Soportar múltiples instituciones
-- 5. Manejar stock de forma segura con checks
-- 6. Proporcionar vistas útiles para reportes
-- 7. Ser extensible para futuras funcionalidades