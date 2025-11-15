-- @name FindAllMateriaPrima
-- Obtiene todos los materiales primas activos con información del proveedor
SELECT
  mp.id,
  mp.codigo_barras,
  mp.nombre,
  mp.marca,
  mp.modelo,
  mp.presentacion,
  mp.stock_actual,
  mp.stock_minimo,
  mp.costo_unitario,
  mp.fecha_caducidad,
  mp.imagen_url,
  mp.descripcion,
  mp.categoria,
  mp.proveedor_id,
  p.nombre as proveedor_nombre,
  p.rfc as proveedor_rfc,
  mp.creado_en,
  mp.actualizado_en
FROM materia_prima mp
LEFT JOIN proveedores p ON mp.proveedor_id = p.id
WHERE mp.activo = true
ORDER BY mp.nombre;

-- @name FindMateriaPrimaById
-- Obtiene un material prima por ID con información completa
SELECT
  mp.*,
  p.nombre as proveedor_nombre,
  p.rfc as proveedor_rfc,
  p.telefono as proveedor_telefono,
  p.email as proveedor_email
FROM materia_prima mp
LEFT JOIN proveedores p ON mp.proveedor_id = p.id
WHERE mp.id = :id AND mp.activo = true;

-- @name FindMateriaPrimaByCodigoBarras
-- Busca material prima por código de barras
SELECT *
FROM materia_prima
WHERE codigo_barras = :codigoBarras AND activo = true;

-- @name SearchMateriaPrima
-- Busca materiales por texto en múltiples campos
SELECT
  id, codigo_barras, nombre, marca, presentacion,
  stock_actual, stock_minimo, categoria, imagen_url,
  costo_unitario
FROM materia_prima
WHERE
  activo = true
  AND (
    nombre ILIKE '%' || :searchTerm || '%' OR
    marca ILIKE '%' || :searchTerm || '%' OR
    codigo_barras ILIKE '%' || :searchTerm || '%' OR
    categoria ILIKE '%' || :searchTerm || '%' OR
    presentacion ILIKE '%' || :searchTerm || '%'
  )
ORDER BY nombre
LIMIT :limit;

-- @name FindLowStockItems
-- Obtiene materiales con stock bajo o agotado
SELECT
  id, codigo_barras, nombre, marca, presentacion,
  stock_actual, stock_minimo, categoria,
  (stock_actual::DECIMAL / NULLIF(stock_minimo, 0)) as stock_ratio
FROM materia_prima
WHERE
  activo = true
  AND stock_actual <= stock_minimo
ORDER BY stock_ratio ASC;

-- @name CheckStockDisponible
-- Verifica si hay stock suficiente para una cantidad determinada
SELECT
  stock_actual >= :cantidad as disponible,
  stock_actual,
  stock_minimo,
  (stock_actual - :cantidad) as stock_restante
FROM materia_prima
WHERE id = :id AND activo = true;

-- @name FindMateriaPrimaByCategoria
-- Obtiene materiales por categoría
SELECT
  id, codigo_barras, nombre, marca, presentacion,
  stock_actual, stock_minimo, categoria, imagen_url
FROM materia_prima
WHERE categoria = :categoria AND activo = true
ORDER BY nombre;

-- @name FindMateriaPrimaByProveedor
-- Obtiene materiales por proveedor
SELECT
  mp.id, mp.codigo_barras, mp.nombre, mp.marca, mp.presentacion,
  mp.stock_actual, mp.stock_minimo, mp.categoria,
  p.nombre as proveedor_nombre
FROM materia_prima mp
INNER JOIN proveedores p ON mp.proveedor_id = p.id
WHERE mp.proveedor_id = :proveedorId AND mp.activo = true
ORDER BY mp.nombre;

-- @name GetMateriaPrimaStats
-- Obtiene estadísticas generales de materia prima
SELECT
  COUNT(*) as total_materiales,
  COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) as bajo_stock,
  COUNT(CASE WHEN stock_actual = 0 THEN 1 END) as sin_stock,
  COALESCE(SUM(stock_actual * COALESCE(costo_unitario, 0)), 0) as valor_total_inventario,
  COUNT(CASE WHEN categoria IS NOT NULL THEN 1 END) as con_categoria
FROM materia_prima
WHERE activo = true;

-- @name GetCategoriaStats
-- Obtiene estadísticas por categoría
SELECT
  categoria,
  COUNT(*) as cantidad,
  COALESCE(SUM(stock_actual * COALESCE(costo_unitario, 0)), 0) as valor_total,
  COUNT(CASE WHEN stock_actual <= stock_minimo THEN 1 END) as bajo_stock
FROM materia_prima
WHERE categoria IS NOT NULL AND activo = true
GROUP BY categoria
ORDER BY cantidad DESC;

-- @name FindMateriaPrimaParaActualizar
-- Query para actualizar un material prima (verifica que exista y esté activo)
SELECT id, stock_actual, actualizado_en
FROM materia_prima
WHERE id = :id AND activo = true
FOR UPDATE;

-- @name GetAuditTrail
-- Obtiene historial de auditoría de un material
SELECT
  mpa.id,
  mpa.accion,
  mpa.datos_anteriores,
  mpa.datos_nuevos,
  mpa.usuario_id,
  mpa.fecha,
  u.nombre as usuario_nombre
FROM materia_prima_auditoria mpa
LEFT JOIN usuarios u ON mpa.usuario_id = u.id
WHERE mpa.materia_prima_id = :materiaPrimaId
ORDER BY mpa.fecha DESC
LIMIT :limit;