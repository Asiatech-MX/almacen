-- Migración para aprovechar el campo estatus existente en materia_prima
-- El campo ya existe como 'estatus VARCHAR(50) NOT NULL DEFAULT 'ACTIVO' CHECK (estatus IN ('ACTIVO', 'INACTIVO', 'SUSPENDIDO'))'

-- No se requiere modificar el esquema ya que el campo estatus ya soporta los estados necesarios
-- Solo se necesita actualizar la lógica de la aplicación para usar estos valores correctamente

-- Actualizar el nombre de la columna stock a stock_actual para consistencia con el frontend
-- ALTER TABLE materia_prima RENAME COLUMN stock TO stock_actual;

-- Nota: La vista vw_stock_materia_prima ya está filtrando por mp.estatus = 'ACTIVO'
-- Esto podría modificarse para incluir todos los estatus y permitir filtrado en el frontend