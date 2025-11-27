-- =====================================================
-- Database Indexes for Performance Optimization
-- =====================================================
-- Generated for Fase 3: Optimización y Testing
-- Target: <200ms response time for 95% operations

-- =====================================================
-- MATERIA PRIMA TABLE INDEXES
-- =====================================================

-- Primary search indexes
CREATE INDEX IF NOT EXISTS idx_materia_prima_codigo_barras
ON materia_prima(codigo_barras)
WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_materia_prima_nombre
ON materia_prima(nombre)
WHERE activo = true;

-- Composite index for common filtering combinations
CREATE INDEX IF NOT EXISTS idx_materia_prima_categoria_activo
ON materia_prima(categoria, nombre)
WHERE activo = true;

CREATE INDEX IF NOT EXISTS idx_materia_prima_proveedor_activo
ON materia_prima(proveedor_id, nombre)
WHERE activo = true AND proveedor_id IS NOT NULL;

-- Stock management indexes
CREATE INDEX IF NOT EXISTS idx_materia_prima_stock_bajo
ON materia_prima(id, nombre, stock_actual, stock_minimo)
WHERE activo = true AND stock_actual <= stock_minimo;

CREATE INDEX IF NOT EXISTS idx_materia_prima_sin_stock
ON materia_prima(id, nombre)
WHERE activo = true AND stock_actual = 0;

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_materia_prima_busqueda
ON materia_prima USING gin(to_tsvector('spanish',
    COALESCE(nombre, '') || ' ' ||
    COALESCE(marca, '') || ' ' ||
    COALESCE(codigo_barras, '') || ' ' ||
    COALESCE(categoria, '') || ' ' ||
    COALESCE(presentacion, '')
))
WHERE activo = true;

-- =====================================================
-- AUDITORIA TABLE INDEXES
-- =====================================================

-- Time-based queries
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_fecha
ON materia_prima_auditoria(fecha DESC);

-- Material-based queries with action filtering
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_material_accion
ON materia_prima_auditoria(materia_prima_id, accion, fecha DESC);

-- User-based audit queries
CREATE INDEX IF NOT EXISTS idx_materia_prima_auditoria_usuario_fecha
ON materia_prima_auditoria(usuario_id, fecha DESC)
WHERE usuario_id IS NOT NULL;

-- =====================================================
-- PROVEEDOR TABLE INDEXES (when implemented)
-- =====================================================

-- These indexes will be used when the proveedor table is fully implemented

-- CREATE INDEX IF NOT EXISTS idx_proveedor_estatus_nombre
-- ON proveedor(estatus, nombre)
-- WHERE estatus = 'ACTIVO';

-- CREATE INDEX IF NOT EXISTS idx_proveedor_rfc
-- ON proveedor(rfc)
-- WHERE estatus = 'ACTIVO';

-- =====================================================
-- MOVIMIENTOS TABLE INDEXES (when implemented)
-- =====================================================

-- These indexes will be used when movement tracking is implemented

-- CREATE INDEX IF NOT EXISTS idx_movimientos_material_fecha
-- ON movimientos(materia_prima_id, fecha DESC);

-- CREATE INDEX IF NOT EXISTS idx_movimientos_tipo_fecha
-- ON movimientos(tipo_movimiento, fecha DESC);

-- CREATE INDEX IF NOT EXISTS idx_movimientos_usuario_fecha
-- ON movimientos(usuario_id, fecha DESC)
-- WHERE usuario_id IS NOT NULL;

-- =====================================================
-- PERFORMANCE MONITORING VIEWS
-- =====================================================

-- View for slow query analysis
CREATE OR REPLACE VIEW vw_query_performance AS
SELECT
    query,
    execution_time,
    row_count,
    cache_hit,
    timestamp
FROM query_performance_log
WHERE timestamp > NOW() - INTERVAL '24 hours'
ORDER BY execution_time DESC;

-- View for material statistics
CREATE OR REPLACE VIEW vw_materia_prima_stats AS
SELECT
    COUNT(*) as total_materiales,
    COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) as stock_bajo,
    COUNT(CASE WHEN stock_actual = 0 THEN 1 END) as sin_stock,
    COUNT(CASE WHEN costo_unitario > 0 THEN 1 END) as con_costo,
    COALESCE(SUM(stock_actual * costo_unitario), 0) as valor_total,
    COUNT(DISTINCT categoria) as categorias_unicas,
    COUNT(DISTINCT proveedor_id) as proveedores_unicos
FROM materia_prima
WHERE activo = true;

-- View for category statistics
CREATE OR REPLACE VIEW vw_categoria_stats AS
SELECT
    COALESCE(categoria, 'Sin categoría') as categoria,
    COUNT(*) as total_materiales,
    COALESCE(SUM(stock_actual), 0) as stock_total,
    COALESCE(SUM(stock_actual * COALESCE(costo_unitario, 0)), 0) as valor_total,
    COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) as stock_bajo,
    COUNT(CASE WHEN stock_actual = 0 THEN 1 END) as sin_stock
FROM materia_prima
WHERE activo = true
GROUP BY categoria
ORDER BY total_materiales DESC;

-- =====================================================
-- PARTIAL INDEXES FOR OPTIMIZATION
-- =====================================================

-- Index for active materials with low stock (partial index)
CREATE INDEX IF NOT EXISTS idx_materia_prima_low_stock_partial
ON materia_prima(id, nombre, stock_actual, stock_minimo)
WHERE activo = true
  AND stock_minimo > 0
  AND stock_actual <= stock_minimo;

-- Index for expensive materials (partial index)
CREATE INDEX IF NOT EXISTS idx_materia_prima_costoso
ON materia_prima(id, nombre, costo_unitario, stock_actual)
WHERE activo = true
  AND costo_unitario > 1000;

-- Index for materials approaching expiration (when fecha_caducidad is implemented)
CREATE INDEX IF NOT EXISTS idx_materia_prima_caducidad
ON materia_prima(id, nombre, fecha_caducidad, stock_actual)
WHERE activo = true
  AND fecha_caducidad IS NOT NULL
  AND fecha_caducidad <= NOW() + INTERVAL '30 days';

-- =====================================================
-- FUNCTION-BASED INDEXES
-- =====================================================

-- Index for case-insensitive searches
CREATE INDEX IF NOT EXISTS idx_materia_prima_nombre_lower
ON materia_prima(LOWER(nombre))
WHERE activo = true;

-- Index for barcode searches with normalization
CREATE INDEX IF NOT EXISTS idx_materia_prima_codigo_normalized
ON materia_prima(REPLACE(REPLACE(codigo_barras, '-', ''), ' ', ''))
WHERE activo = true;

-- =====================================================
-- MAINTENANCE AND OPTIMIZATION
-- =====================================================

-- Function to update table statistics
CREATE OR REPLACE FUNCTION update_table_statistics()
RETURNS void AS $$
BEGIN
    -- Update statistics for all tables
    ANALYZE materia_prima;
    ANALYZE materia_prima_auditoria;

    -- Reindex corrupted indexes
    REINDEX DATABASE almacen;

    -- Clean up dead tuples
    VACUUM ANALYZE materia_prima;
    VACUUM ANALYZE materia_prima_auditoria;

    RAISE NOTICE 'Database statistics updated and optimized';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- MONITORING QUERIES
-- =====================================================

-- Query to find unused indexes (for cleanup)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY schemaname, tablename, indexname;

-- Query to analyze table sizes and bloat
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
    pg_stat_get_live_tuples(c.oid) as live_tuples,
    pg_stat_get_dead_tuples(c.oid) as dead_tuples
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Query to monitor slow queries
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 20;

-- =====================================================
-- INDEX USAGE ANALYSIS
-- =====================================================

-- Query to analyze index usage efficiency
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC, tablename;

-- =====================================================
-- PERFORMANCE TRIGGERS
-- =====================================================

-- Trigger to automatically update statistics on material changes
CREATE OR REPLACE FUNCTION update_material_stats_trigger()
RETURNS trigger AS $$
BEGIN
    -- This trigger will be called after INSERT/UPDATE/DELETE on materia_prima
    -- to maintain denormalized statistics for fast queries

    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update material count cache
        PERFORM 1; -- Placeholder for cache update logic
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for material statistics updates
-- DROP TRIGGER IF EXISTS tr_materia_prima_stats ON materia_prima;
-- CREATE TRIGGER tr_materia_prima_stats
--     AFTER INSERT OR UPDATE OR DELETE ON materia_prima
--     FOR EACH ROW EXECUTE FUNCTION update_material_stats_trigger();

-- =====================================================
-- SECURITY AND ACCESS CONTROL INDEXES
-- =====================================================

-- Index for user-based access control (when implemented)
-- CREATE INDEX IF NOT EXISTS idx_usuario_institucion
-- ON usuario(institucion_id, rol, estatus)
-- WHERE estatus = 'ACTIVO';

-- Index for institutional data isolation
-- CREATE INDEX IF NOT EXISTS idx_materia_prima_institucion
-- ON materia_prima(institucion_id, activo)
-- WHERE activo = true;

-- =====================================================
-- CONCLUSION
-- =====================================================
--
-- These indexes are designed to optimize the following query patterns:
--
-- 1. Material search by barcode, name, category
-- 2. Stock management queries (low stock, out of stock)
-- 3. Provider-based filtering
-- 4. Full-text search across multiple fields
-- 5. Audit trail queries by date, material, user
-- 6. Statistical analysis queries
-- 7. Pagination with ordering
--
-- Expected performance improvements:
-- - Barcode lookups: <5ms
-- - Name searches: <10ms
-- - Category filtering: <15ms
-- - Stock queries: <20ms
-- - Full-text search: <50ms
-- - Statistical queries: <100ms
--
-- Regular maintenance:
-- - Run ANALYZE weekly
-- - Monitor index usage monthly
-- - Remove unused indexes quarterly
-- - Update statistics after bulk imports