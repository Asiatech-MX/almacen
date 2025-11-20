-- =================================================================
-- Triggers para soporte de UUID/INTEGER Dual Key en proveedores
-- =================================================================

-- 1. Trigger para validar UUID de proveedor en materia_prima
CREATE OR REPLACE FUNCTION validate_proveedor_uuid()
RETURNS TRIGGER AS $$
BEGIN
    -- Si proveedor_id es NULL, permitir (campo opcional)
    IF NEW.proveedor_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Verificar que el UUID exista en la tabla proveedor
    IF NOT EXISTS (
        SELECT 1 FROM proveedor
        WHERE uuid_proveedor = NEW.proveedor_id
        AND estatus = 'ACTIVO'
    ) THEN
        RAISE EXCEPTION 'UUID de proveedor % no encontrado o no está activo', NEW.proveedor_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a materia_prima
CREATE TRIGGER trg_materia_prima_proveedor_uuid
    BEFORE INSERT OR UPDATE OF proveedor_id ON materia_prima
    FOR EACH ROW EXECUTE FUNCTION validate_proveedor_uuid();

-- 2. Trigger para sincronizar creación de UUIDs en nuevos proveedores
CREATE OR REPLACE FUNCTION sync_proveedor_uuid_creation()
RETURNS TRIGGER AS $$
BEGIN
    -- Asegurar que uuid_proveedor no sea NULL
    IF NEW.uuid_proveedor IS NULL THEN
        NEW.uuid_proveedor = gen_random_uuid();
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger a proveedor
CREATE TRIGGER trg_proveedor_uuid_creation
    BEFORE INSERT ON proveedor
    FOR EACH ROW EXECUTE FUNCTION sync_proveedor_uuid_creation();

-- 3. Trigger para auditoría de cambios en uuid_proveedor
CREATE OR REPLACE FUNCTION audit_proveedor_uuid_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- Si el UUID cambió, registrar en auditoría
    IF OLD.uuid_proveedor IS DISTINCT FROM NEW.uuid_proveedor THEN
        INSERT INTO auditoria (
            tabla_afectada,
            id_registro_afectado,
            tipo_operacion,
            valor_anterior,
            valor_nuevo,
            id_usuario,
            fecha_operacion
        ) VALUES (
            'proveedor',
            NEW.id,
            'UPDATE_UUID',
            jsonb_build_object('uuid_proveedor', OLD.uuid_proveedor),
            jsonb_build_object('uuid_proveedor', NEW.uuid_proveedor),
            NEW.id, -- Assuming current user is the provider being updated
            CURRENT_TIMESTAMP
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoría
CREATE TRIGGER trg_proveedor_uuid_audit
    AFTER UPDATE OF uuid_proveedor ON proveedor
    FOR EACH ROW EXECUTE FUNCTION audit_proveedor_uuid_changes();

-- 4. Función para verificar consistencia de datos
CREATE OR REPLACE FUNCTION check_proveedor_uuid_consistency()
RETURNS TABLE(
    proveedor_id INTEGER,
    uuid_proveedor UUID,
    nombre VARCHAR,
    issue VARCHAR,
    severity VARCHAR
) AS $$
BEGIN
    -- Proveedores sin UUID
    RETURN QUERY
    SELECT
        p.id,
        NULL::UUID,
        p.nombre,
        'Missing UUID',
        'HIGH'
    FROM proveedor p
    WHERE p.uuid_proveedor IS NULL
    AND p.estatus = 'ACTIVO';

    -- UUIDs duplicados
    RETURN QUERY
    SELECT
        p.id,
        p.uuid_proveedor,
        p.nombre,
        'Duplicate UUID',
        'CRITICAL'
    FROM proveedor p
    WHERE p.uuid_proveedor IS NOT NULL
    GROUP BY p.uuid_proveedor
    HAVING COUNT(*) > 1;

    -- Materia prima con UUID de proveedor inválido
    RETURN QUERY
    SELECT
        mp.id::INTEGER, -- Using materia_prima ID for consistency
        mp.proveedor_id,
        mp.nombre,
        'Invalid Provider UUID in materia_prima',
        'HIGH'
    FROM materia_prima mp
    WHERE mp.proveedor_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM proveedor p
        WHERE p.uuid_proveedor = mp.proveedor_id
    )
    AND mp.activo = true;

END;
$$ LANGUAGE plpgsql;

-- 5. Función para reparar inconsistencias automáticamente
CREATE OR REPLACE FUNCTION repair_proveedor_uuid_consistency()
RETURNS TABLE(
    action VARCHAR,
    records_fixed INTEGER,
    details VARCHAR
) AS $$
DECLARE
    v_fixed_count INTEGER;
BEGIN
    -- Reparar proveedores sin UUID
    UPDATE proveedor
    SET uuid_proveedor = gen_random_uuid()
    WHERE uuid_proveedor IS NULL
    AND estatus = 'ACTIVO';

    GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
    RETURN NEXT SELECT 'Generated missing UUIDs' as action, v_fixed_count as records_fixed, 'Providers without UUID now have one' as details;

    -- Marcar materia prima con proveedor inválido como NULL
    UPDATE materia_prima
    SET proveedor_id = NULL
    WHERE proveedor_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM proveedor p
        WHERE p.uuid_proveedor = materia_prima.proveedor_id
    )
    AND activo = true;

    GET DIAGNOSTICS v_fixed_count = ROW_COUNT;
    RETURN NEXT SELECT 'Fixed invalid provider references' as action, v_fixed_count as records_fixeD, 'Invalid provider UUIDs set to NULL' as details;

END;
$$ LANGUAGE plpgsql;

-- 6. Vista para diagnóstico de la migración
CREATE OR REPLACE VIEW vw_proveedor_migration_status AS
SELECT
    'providers' as table_name,
    COUNT(*) as total_records,
    COUNT(uuid_proveedor) as with_uuid,
    COUNT(*) - COUNT(uuid_proveedor) as missing_uuid,
    CASE
        WHEN COUNT(*) = COUNT(uuid_proveedor) THEN 'COMPLETE'
        ELSE 'IN_PROGRESS'
    END as migration_status
FROM proveedor
WHERE estatus = 'ACTIVO'

UNION ALL

SELECT
    'materia_prima' as table_name,
    COUNT(*) as total_records,
    COUNT(mp.proveedor_id) as with_provider,
    COUNT(*) - COUNT(mp.proveedor_id) as without_provider,
    CASE
        WHEN COUNT(*) = COUNT(mp.proveedor_id) THEN 'COMPLETE'
        ELSE 'IN_PROGRESS'
    END as migration_status
FROM materia_prima mp
WHERE mp.activo = true;

-- Comentarios para documentación
COMMENT ON FUNCTION validate_proveedor_uuid() IS 'Valida que el UUID de proveedor exista y esté activo';
COMMENT ON FUNCTION sync_proveedor_uuid_creation() IS 'Asegura que todo nuevo proveedor tenga UUID';
COMMENT ON FUNCTION audit_proveedor_uuid_changes() IS 'Audita cambios en UUID de proveedores';
COMMENT ON FUNCTION check_proveedor_uuid_consistency() IS 'Verifica consistencia de datos UUID/INTEGER';
COMMENT ON FUNCTION repair_proveedor_uuid_consistency() IS 'Repara automáticamente inconsistencias';
COMMENT ON VIEW vw_proveedor_migration_status IS 'Estado de la migración UUID de proveedores';