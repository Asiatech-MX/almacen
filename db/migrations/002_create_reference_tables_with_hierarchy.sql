-- =====================================
-- MIGRATION 002: Dynamic Reference Data System
-- Issue #8 - Dynamic Database-Driven Presentations and Categories Management
-- =====================================
-- Phase 1: Create tables with hierarchy support
-- =====================================

-- Tabla de Presentaciones (Mejorada)
CREATE TABLE presentacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    abreviatura VARCHAR(20), -- Para display compacto (ej: "kg", "L", "ud")
    unidad_base VARCHAR(20), -- Unidad base para conversiones (ej: "gramo" para "Kilogramo")
    factor_conversion DECIMAL(10,4), -- Factor para convertir a unidad_base
    activo BOOLEAN DEFAULT true,
    es_predeterminado BOOLEAN DEFAULT false, -- Opción por defecto para nuevas instituciones
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, id_institucion)
);

-- Tabla de Categorías con Jerarquía
CREATE TABLE categoria (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_padre_id INTEGER REFERENCES categoria(id), -- Auto-referencia para jerarquía
    nivel INTEGER NOT NULL DEFAULT 1, -- Nivel jerárquico (1=raíz, 2=subcategoría, etc.)
    ruta_completa TEXT, -- Path jerárquico: "Construcción > Electricidad > Cableado"
    icono VARCHAR(50), -- Icono para UI (opcional)
    color VARCHAR(7), -- Color hexadecimal para UI (opcional)
    orden INTEGER DEFAULT 0, -- Orden de visualización
    activo BOOLEAN DEFAULT true,
    es_predeterminado BOOLEAN DEFAULT false,
    id_institucion INTEGER NOT NULL REFERENCES institucion(id),
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, id_institucion, categoria_padre_id)
);

-- Índices Optimizados
CREATE INDEX idx_presentaciones_institucion_activas ON presentacion(id_institucion, activo) WHERE activo = true;
CREATE INDEX idx_categorias_institucion_activas ON categoria(id_institucion, activo) WHERE activo = true;
CREATE INDEX idx_categorias_jerarquia ON categoria(categoria_padre_id, nivel);
CREATE INDEX idx_categorias_orden ON categoria(id_institucion, nivel, orden);

-- Trigger para mantener ruta_completa actualizada
CREATE OR REPLACE FUNCTION actualizar_ruta_categoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        IF NEW.categoria_padre_id IS NULL THEN
            NEW.ruta_completa = NEW.nombre;
            NEW.nivel = 1;
        ELSE
            SELECT ruta_completa || ' > ' || NEW.nombre, nivel + 1
            INTO NEW.ruta_completa, NEW.nivel
            FROM categoria WHERE id = NEW.categoria_padre_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_ruta_categoria
    BEFORE INSERT OR UPDATE ON categoria
    FOR EACH ROW EXECUTE FUNCTION actualizar_ruta_categoria();

-- Actualizar timestamp para presentaciones
CREATE TRIGGER trg_presentacion_timestamp
    BEFORE UPDATE ON presentacion
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Actualizar timestamp para categorías
CREATE TRIGGER trg_categoria_timestamp
    BEFORE UPDATE ON categoria
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- Actualizar tabla materia_prima (mantener backward compatibility)
ALTER TABLE materia_prima
ADD COLUMN presentacion_id INTEGER REFERENCES presentacion(id),
ADD COLUMN categoria_id INTEGER REFERENCES categoria(id);

-- Crear función para mapear textos a IDs (usada durante migración)
CREATE OR REPLACE FUNCTION mapear_texto_a_presentacion_id(texto TEXT, id_institucion INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM presentacion
            WHERE LOWER(nombre) = LOWER(texto)
            AND id_institucion = id_institucion
            LIMIT 1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mapear_texto_a_categoria_id(texto TEXT, id_institucion INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM categoria
            WHERE LOWER(nombre) = LOWER(texto)
            AND id_institucion = id_institucion
            LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- =====================================
-- MIGRATION DATA
-- =====================================

-- Insertar presentaciones predeterminadas para cada institución
INSERT INTO presentacion (nombre, descripcion, abreviatura, unidad_base, factor_conversion, id_institucion)
SELECT
    unnest(ARRAY['Unidad', 'Caja', 'Paquete', 'Saco', 'Bolsa', 'Kilogramo', 'Gramo',
                    'Litro', 'Mililitro', 'Metro', 'Centímetro', 'Rollo', 'Tubo',
                    'Botella', 'Frasco']) as nombre,
    unnest(ARRAY['Unidad individual', 'Caja con múltiples unidades', 'Paquete empaquetado',
                    'Saco de gran capacidad', 'Bolsa flexible', 'Kilogramo (1000 gramos)',
                    'Gramo básico', 'Litro de volumen', 'Mililitro (1/1000 litro)',
                    'Metro lineal', 'Centímetro (1/100 metro)', 'Rollo enrollado',
                    'Tubo cilíndrico', 'Botella contenedora', 'Frasco de vidrio']) as descripcion,
    unnest(ARRAY['ud', 'cja', 'paq', 'sco', 'bolsa', 'kg', 'g', 'L', 'mL', 'm', 'cm', 'rollo', 'tubo', 'bot', 'frasco']) as abreviatura,
    unnest(ARRAY[NULL, NULL, NULL, NULL, NULL, 'gramo', 'gramo', 'mililitro', 'mililitro', 'centimetro', 'centimetro', NULL, NULL, NULL, NULL]) as unidad_base,
    unnest(ARRAY[NULL, NULL, NULL, NULL, NULL, 1000, 1, 1000, 1, 100, 1, NULL, NULL, NULL, NULL])::DECIMAL(10,4) as factor_conversion,
    id
FROM institucion;

-- Insertar categorías predeterminadas para cada institución (como categorías raíz por ahora)
INSERT INTO categoria (nombre, descripcion, id_institucion)
SELECT
    unnest(ARRAY['Construcción', 'Electricidad', 'Plomería', 'Pinturas', 'Herramientas',
                    'Ferretería', 'Limpieza', 'Oficina', 'Seguridad', 'Jardinería',
                    'Automotriz', 'Electrónica', 'Otros']) as nombre,
    unnest(ARRAY['Materiales de construcción general', 'Materiales y componentes eléctricos',
                    'Tuberías y accesorios de plomería', 'Pinturas y recubrimientos',
                    'Herramientas manuales y eléctricas', 'Ferretería y sujetadores',
                    'Productos de limpieza y desinfección', 'Artículos de oficina',
                    'Equipo de protección y seguridad', 'Herramientas de jardinería',
                    'Repuestos y accesorios automotrices', 'Componentes electrónicos',
                    'Otros materiales no clasificados']) as descripcion,
    id
FROM institucion;

-- Actualizar registros existentes con mapeo (solo si hay datos)
UPDATE materia_prima
SET presentacion_id = mapear_texto_a_presentacion_id(presentacion, id_institucion)
WHERE presentacion IS NOT NULL AND presentacion_id IS NULL;

UPDATE materia_prima
SET categoria_id = mapear_texto_a_categoria_id(categoria, id_institucion)
WHERE categoria IS NOT NULL AND categoria_id IS NULL;

-- Agregar categoria columna a la tabla materia_prima si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='materia_prima'
        AND column_name='categoria'
    ) THEN
        ALTER TABLE materia_prima ADD COLUMN categoria VARCHAR(100);
    END IF;
END $$;