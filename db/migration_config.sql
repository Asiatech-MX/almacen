-- Migration Configuration Table for Feature Flags
-- Fase 4: Transición Controlada con Feature Flags

-- Drop table if exists (for testing)
DROP TABLE IF EXISTS migration_config CASCADE;

-- Create migration configuration table
CREATE TABLE migration_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    active BOOLEAN NOT NULL DEFAULT true,

    -- Feature flags
    use_migrated_reads BOOLEAN NOT NULL DEFAULT false,
    use_migrated_writes BOOLEAN NOT NULL DEFAULT false,
    enable_validation BOOLEAN NOT NULL DEFAULT true,

    -- Migration control
    migration_percentage INTEGER NOT NULL DEFAULT 0 CHECK (migration_percentage >= 0 AND migration_percentage <= 100),
    emergency_rollback BOOLEAN NOT NULL DEFAULT false,

    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NOT NULL DEFAULT 'system',

    -- Additional configuration
    notes TEXT,
    rollback_reason TEXT
);

-- Create indexes for performance
CREATE INDEX idx_migration_config_active ON migration_config(active);
CREATE INDEX idx_migration_config_updated_at ON migration_config(updated_at);
CREATE INDEX idx_migration_config_emergency ON migration_config(emergency_rollback);

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_migration_config_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_migration_config_updated_at
    BEFORE UPDATE ON migration_config
    FOR EACH ROW
    EXECUTE FUNCTION update_migration_config_timestamp();

-- Insert initial configuration
INSERT INTO migration_config (
    active,
    use_migrated_reads,
    use_migrated_writes,
    enable_validation,
    migration_percentage,
    emergency_rollback,
    updated_by,
    notes
) VALUES (
    true,
    false,  -- Start with legacy table for reads
    false,  -- Start with legacy table for writes
    true,   -- Enable validation logging
    0,      -- 0% migration initially
    false,  -- No emergency rollback
    'system',
    'Initial configuration for Phase 4: Transición Controlada con Feature Flags'
);

-- Function to get current configuration
CREATE OR REPLACE FUNCTION get_migration_config()
RETURNS TABLE(
    id UUID,
    active BOOLEAN,
    use_migrated_reads BOOLEAN,
    use_migrated_writes BOOLEAN,
    enable_validation BOOLEAN,
    migration_percentage INTEGER,
    emergency_rollback BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    updated_by VARCHAR(255)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        mc.id,
        mc.active,
        mc.use_migrated_reads,
        mc.use_migrated_writes,
        mc.enable_validation,
        mc.migration_percentage,
        mc.emergency_rollback,
        mc.created_at,
        mc.updated_at,
        mc.updated_by
    FROM migration_config mc
    WHERE mc.active = true
    ORDER BY mc.updated_at DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to update migration configuration
CREATE OR REPLACE FUNCTION update_migration_config(
    p_use_migrated_reads BOOLEAN DEFAULT NULL,
    p_use_migrated_writes BOOLEAN DEFAULT NULL,
    p_enable_validation BOOLEAN DEFAULT NULL,
    p_migration_percentage INTEGER DEFAULT NULL,
    p_emergency_rollback BOOLEAN DEFAULT NULL,
    p_updated_by VARCHAR(255) DEFAULT 'system',
    p_notes TEXT DEFAULT NULL
)
RETURNS TABLE(
    success BOOLEAN,
    message TEXT,
    old_config JSONB,
    new_config JSONB
) AS $$
DECLARE
    current_config migration_config%ROWTYPE;
    updated_config migration_config%ROWTYPE;
    changes_made BOOLEAN := false;
BEGIN
    -- Get current active configuration
    SELECT * INTO current_config
    FROM migration_config
    WHERE active = true
    ORDER BY updated_at DESC
    LIMIT 1;

    IF current_config IS NULL THEN
        RETURN QUERY SELECT false, 'No active configuration found', NULL, NULL;
        RETURN;
    END IF;

    -- Check for emergency rollback
    IF p_emergency_rollback = true AND current_config.emergency_rollback = false THEN
        -- Emergency rollback - disable all migration features
        UPDATE migration_config
        SET
            use_migrated_reads = false,
            use_migrated_writes = false,
            migration_percentage = 0,
            emergency_rollback = true,
            updated_by = p_updated_by,
            notes = COALESCE(p_notes, 'Emergency rollback activated'),
            rollback_reason = 'Emergency rollback requested'
        WHERE id = current_config.id;

        changes_made := true;
    ELSIF p_emergency_rollback = false AND current_config.emergency_rollback = true THEN
        -- Coming out of emergency rollback
        UPDATE migration_config
        SET
            emergency_rollback = false,
            updated_by = p_updated_by,
            notes = COALESCE(p_notes, 'Emergency rollback deactivated'),
            rollback_reason = NULL
        WHERE id = current_config.id;

        changes_made := true;
    END IF;

    -- Update other parameters if provided and not in emergency rollback
    IF current_config.emergency_rollback = false THEN
        IF p_use_migrated_reads IS NOT NULL AND p_use_migrated_reads <> current_config.use_migrated_reads THEN
            UPDATE migration_config
            SET use_migrated_reads = p_use_migrated_reads, updated_by = p_updated_by
            WHERE id = current_config.id;
            changes_made := true;
        END IF;

        IF p_use_migrated_writes IS NOT NULL AND p_use_migrated_writes <> current_config.use_migrated_writes THEN
            UPDATE migration_config
            SET use_migrated_writes = p_use_migrated_writes, updated_by = p_updated_by
            WHERE id = current_config.id;
            changes_made := true;
        END IF;

        IF p_enable_validation IS NOT NULL AND p_enable_validation <> current_config.enable_validation THEN
            UPDATE migration_config
            SET enable_validation = p_enable_validation, updated_by = p_updated_by
            WHERE id = current_config.id;
            changes_made := true;
        END IF;

        IF p_migration_percentage IS NOT NULL AND p_migration_percentage <> current_config.migration_percentage THEN
            UPDATE migration_config
            SET migration_percentage = p_migration_percentage, updated_by = p_updated_by
            WHERE id = current_config.id;
            changes_made := true;
        END IF;
    END IF;

    -- Get updated configuration
    SELECT * INTO updated_config
    FROM migration_config
    WHERE id = current_config.id;

    IF changes_made THEN
        RETURN QUERY SELECT
            true,
            'Configuration updated successfully',
            row_to_json(current_config)::JSONB,
            row_to_json(updated_config)::JSONB;
    ELSE
        RETURN QUERY SELECT
            true,
            'No changes needed',
            row_to_json(current_config)::JSONB,
            row_to_json(current_config)::JSONB;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create audit log for configuration changes
CREATE OR REPLACE FUNCTION migration_config_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log configuration changes
        INSERT INTO materia_prima_auditoria (
            materia_prima_legacy_id,
            accion,
            datos_anteriores,
            datos_nuevos,
            fecha
        ) VALUES (
            -1, -- Use -1 to indicate system configuration change
            'MIGRATION_CONFIG_UPDATE',
            row_to_json(OLD),
            row_to_json(NEW),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO materia_prima_auditoria (
            materia_prima_legacy_id,
            accion,
            datos_nuevos,
            fecha
        ) VALUES (
            -1, -- Use -1 to indicate system configuration change
            'MIGRATION_CONFIG_CREATE',
            row_to_json(NEW),
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger for migration_config
CREATE TRIGGER trigger_migration_config_audit
    AFTER INSERT OR UPDATE ON migration_config
    FOR EACH ROW
    EXECUTE FUNCTION migration_config_audit_trigger();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON migration_config TO postgres;
GRANT EXECUTE ON FUNCTION get_migration_config() TO postgres;
GRANT EXECUTE ON FUNCTION update_migration_config(
    BOOLEAN, BOOLEAN, BOOLEAN, INTEGER, BOOLEAN, VARCHAR(255), TEXT
) TO postgres;

COMMIT;