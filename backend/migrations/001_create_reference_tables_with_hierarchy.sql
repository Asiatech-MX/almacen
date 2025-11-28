-- Migration 002: Create Dynamic Reference Data System
-- Create tables for categorias and presentaciones with hierarchy support

-- 1. Create presentacion table (simplified version without multi-tenancy for now)
CREATE TABLE IF NOT EXISTS presentacion (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    abreviatura VARCHAR(20), -- Para display compacto (ej: "kg", "L", "ud")
    unidad_base VARCHAR(20), -- Unidad base para conversiones (ej: "gramo" para "Kilogramo")
    factor_conversion DECIMAL(10,4), -- Factor para convertir a unidad_base
    activo BOOLEAN DEFAULT true,
    es_predeterminado BOOLEAN DEFAULT false, -- Opción por defecto
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre)
);

-- 2. Create categoria table with hierarchy (simplified version)
CREATE TABLE IF NOT EXISTS categoria (
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
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(nombre, categoria_padre_id)
);

-- 3. Create optimized indexes
CREATE INDEX idx_presentaciones_activas ON presentacion(activo) WHERE activo = true;
CREATE INDEX idx_categorias_activas ON categoria(activo) WHERE activo = true;
CREATE INDEX idx_categorias_jerarquia ON categoria(categoria_padre_id, nivel);
CREATE INDEX idx_categorias_orden ON categoria(nivel, orden);

-- 4. Create function to maintain ruta_completa
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

-- 5. Create trigger for ruta_completa maintenance
CREATE TRIGGER trg_actualizar_ruta_categoria
    BEFORE INSERT OR UPDATE ON categoria
    FOR EACH ROW EXECUTE FUNCTION actualizar_ruta_categoria();

-- 6. Update materia_prima table to add reference IDs (maintaining backward compatibility)
ALTER TABLE materia_prima
ADD COLUMN presentacion_id INTEGER REFERENCES presentacion(id),
ADD COLUMN categoria_id INTEGER REFERENCES categoria(id);

-- 7. Create functions for mapping text to IDs (used during migration)
CREATE OR REPLACE FUNCTION mapear_texto_a_presentacion_id(texto TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM presentacion
            WHERE LOWER(nombre) = LOWER(texto)
            LIMIT 1);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION mapear_texto_a_categoria_id(texto TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT id FROM categoria
            WHERE LOWER(nombre) = LOWER(texto)
            LIMIT 1);
END;
$$ LANGUAGE plpgsql;

-- 8. Migrate existing data from hardcoded arrays
-- Presentaciones
INSERT INTO presentacion (nombre, descripcion)
VALUES
    ('Unidad', 'Unidad básica de medida'),
    ('Caja', 'Contenedor tipo caja'),
    ('Paquete', 'Contenedor tipo paquete'),
    ('Saco', 'Contenedor tipo saco'),
    ('Bolsa', 'Contenedor tipo bolsa'),
    ('Kilogramo', 'Unidad de peso (kg)'),
    ('Gramo', 'Unidad de peso (g)'),
    ('Litro', 'Unidad de volumen (L)'),
    ('Mililitro', 'Unidad de volumen (mL)'),
    ('Metro', 'Unidad de longitud (m)'),
    ('Centímetro', 'Unidad de longitud (cm)'),
    ('Rollo', 'Material en rollo'),
    ('Tubo', 'Material en tubo'),
    ('Botella', 'Contenedor tipo botella'),
    ('Frasco', 'Contenedor tipo frasco')
ON CONFLICT (nombre) DO NOTHING;

-- Categorías
INSERT INTO categoria (nombre, descripcion)
VALUES
    ('Construcción', 'Materiales de construcción'),
    ('Electricidad', 'Materiales eléctricos'),
    ('Plomería', 'Materiales de plomería'),
    ('Pinturas', 'Pinturas y recubrimientos'),
    ('Herramientas', 'Herramientas y equipamiento'),
    ('Ferretería', 'Artículos de ferretería'),
    ('Limpieza', 'Productos de limpieza'),
    ('Oficina', 'Suministros de oficina'),
    ('Seguridad', 'Equipamiento de seguridad'),
    ('Jardinería', 'Artículos de jardinería'),
    ('Automotriz', 'Repuestos y accesorios automotrices'),
    ('Electrónica', 'Componentes electrónicos'),
    ('Otros', 'Otros productos no clasificados')
ON CONFLICT (nombre, categoria_padre_id) WHERE categoria_padre_id IS NULL DO NOTHING;

-- 9. Update existing materia_prima records with mapped IDs
UPDATE materia_prima
SET presentacion_id = mapear_texto_a_presentacion_id(presentacion)
WHERE presentacion IS NOT NULL AND presentacion_id IS NULL;

UPDATE materia_prima
SET categoria_id = mapear_texto_a_categoria_id(categoria)
WHERE categoria IS NOT NULL AND categoria_id IS NULL;

-- 10. Add comments for documentation
COMMENT ON TABLE presentacion IS 'Tabla de presentaciones dinámicas con soporte para unidades y conversiones';
COMMENT ON TABLE categoria IS 'Tabla de categorías con soporte para jerarquía ilimitada';
COMMENT ON COLUMN categoria.ruta_completa IS 'Ruta jerárquica completa para facilitar búsquedas y visualización';
COMMENT ON COLUMN presentacion.abreviatura IS 'Abreviatura para display en selects y formularios';
COMMENT ON COLUMN presentacion.factor_conversion IS 'Factor para convertir a unidad_base';