-- =====================================================
-- Migration: Add estatus column to materia_prima table
-- =====================================================
-- Date: 2025-12-09 22:41:18
-- Author: System (Fix for Issue #8)
-- Description:
--   - Adds estatus VARCHAR(20) column to materia_prima table
--   - Implements CHECK constraint for valid values
--   - Populates existing records with 'ACTIVO'
--   - Index for query optimization
-- Reason: Fix "column mp.estatus does not exist" error in Stock Bajo queries
-- Impact: Critical - Fixes main functionality in ConsultasAvanzadas module
-- =====================================================

BEGIN TRANSACTION;

-- Step 1: Add the estatus column with DEFAULT value
-- This ensures all existing records get populated with 'ACTIVO'
ALTER TABLE materia_prima
ADD COLUMN estatus VARCHAR(20) NOT NULL DEFAULT 'ACTIVO';

-- Step 2: Add CHECK constraint to validate allowed values
-- Ensures data integrity for the estatus field
ALTER TABLE materia_prima
ADD CONSTRAINT materia_prima_estatus_check
CHECK (estatus IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'));

-- Step 3: Verify the column was added correctly
-- This query should return information about the new column
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'materia_prima'
  AND column_name = 'estatus';

-- Step 4: Verify constraint was created
SELECT
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'materia_prima'
  AND constraint_name = 'materia_prima_estatus_check';

-- Step 5: Verify all records have estatus populated
-- Should return 0 if all records have estatus
SELECT COUNT(*) as records_without_estatus
FROM materia_prima
WHERE estatus IS NULL;

-- Step 6: Verify data distribution
-- Should show all records as 'ACTIVO' after this migration
SELECT
    estatus,
    COUNT(*) as count
FROM materia_prima
GROUP BY estatus
ORDER BY estatus;

COMMIT;

-- =====================================================
-- Verification Section (Run these after migration)
-- =====================================================

-- Verify the Stock Bajo query works correctly
-- This should return materials with stock <= stock_minimo and estatus = 'ACTIVO'
SELECT
    id,
    nombre,
    stock,
    stock_minimo,
    estatus
FROM materia_prima
WHERE stock <= stock_minimo
  AND estatus = 'ACTIVO'
ORDER BY stock / stock_minimo ASC;

-- Verify index exists (should already exist from schema)
SELECT indexname
FROM pg_indexes
WHERE indexname = 'idx_materia_prima_estatus';

-- =====================================================
-- Rollback Script (if needed)
-- =====================================================
/*
-- To rollback this migration, run:
BEGIN TRANSACTION;

-- Remove constraint first (required in PostgreSQL)
ALTER TABLE materia_prima
DROP CONSTRAINT IF EXISTS materia_prima_estatus_check;

-- Remove the column
ALTER TABLE materia_prima
DROP COLUMN IF EXISTS estatus;

COMMIT;
*/