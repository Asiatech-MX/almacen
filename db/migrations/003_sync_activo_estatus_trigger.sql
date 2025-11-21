-- Migration 003: Create trigger to synchronize activo and estatus fields
-- This trigger ensures that when estatus changes, activo field is automatically updated

-- Begin transaction
BEGIN;

-- Create function to synchronize activo field based on estatus
CREATE OR REPLACE FUNCTION sync_activo_with_estatus()
RETURNS TRIGGER AS $$
BEGIN
    -- Update activo based on estatus value
    NEW.activo = CASE
        WHEN NEW.estatus = 'ACTIVO' THEN true
        ELSE false
    END;

    -- Always update the timestamp
    NEW.actualizado_en = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger that fires before any update on materia_prima
DROP TRIGGER IF EXISTS materia_prima_sync_activo_trigger ON materia_prima;
CREATE TRIGGER materia_prima_sync_activo_trigger
    BEFORE UPDATE ON materia_prima
    FOR EACH ROW EXECUTE FUNCTION sync_activo_with_estatus();

-- Create trigger that fires before insert to ensure consistency
DROP TRIGGER IF EXISTS materia_prima_sync_activo_insert_trigger ON materia_prima;
CREATE TRIGGER materia_prima_sync_activo_insert_trigger
    BEFORE INSERT ON materia_prima
    FOR EACH ROW EXECUTE FUNCTION sync_activo_with_estatus();

-- Create trigger specifically for estatus changes
CREATE OR REPLACE FUNCTION on_estatus_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log estatus change in audit table if estatus actually changed
    IF OLD.estatus IS DISTINCT FROM NEW.estatus THEN
        INSERT INTO materia_prima_auditoria (
            materia_prima_id,
            materia_prima_legacy_id,
            accion,
            datos_anteriores,
            datos_nuevos,
            usuario_id,
            fecha
        ) VALUES (
            NEW.id,
            -1,
            'STATUS_CHANGE',
            json_build_object(
                'estatus_anterior', OLD.estatus,
                'activo_anterior', OLD.activo
            ),
            json_build_object(
                'estatus_nuevo', NEW.estatus,
                'activo_nuevo', CASE WHEN NEW.estatus = 'ACTIVO' THEN true ELSE false END
            ),
            COALESCE(NEW.actualizado_por, 'SYSTEM'),
            CURRENT_TIMESTAMP
        );
    END IF;

    -- Ensure activo is synchronized
    NEW.activo = CASE
        WHEN NEW.estatus = 'ACTIVO' THEN true
        ELSE false
    END;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for estatus change auditing
DROP TRIGGER IF EXISTS materia_prima_estatus_audit_trigger ON materia_prima;
CREATE TRIGGER materia_prima_estatus_audit_trigger
    AFTER UPDATE ON materia_prima
    FOR EACH ROW WHEN (OLD.estatus IS DISTINCT FROM NEW.estatus)
    EXECUTE FUNCTION on_estatus_change();

-- Create index for better performance on estatus queries
CREATE INDEX IF NOT EXISTS idx_materia_prima_estatus ON materia_prima(estatus);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_materia_prima_activo_estatus ON materia_prima(activo, estatus);

-- Commit transaction
COMMIT;

-- Verify the trigger creation
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing,
    action_condition,
    action_statement
FROM information_schema.triggers
WHERE trigger_table = 'materia_prima'
ORDER BY trigger_name;