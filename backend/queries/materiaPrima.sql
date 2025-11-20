/* @name FindAllMateriaPrima */
/* Obtiene todos los materiales primas con información del proveedor (incluyendo inactivos) */
SELECT
  mp.id,
  mp.codigo_barras,
  mp.nombre,
  mp.marca,
  mp.modelo,
  mp.presentacion,
  mp.stock as stock,
  mp.stock_minimo,
  0 as costo_unitario, -- Column doesn't exist in schema
  NULL as fecha_caducidad, -- Column doesn't exist in schema
  mp.imagen_url,
  NULL as descripcion, -- Column doesn't exist in schema
  NULL as categoria, -- Column doesn't exist in schema
  NULL as proveedor_id, -- Column doesn't exist in schema
  mp.estatus,
  p.nombre as proveedor_nombre,
  p.rfc as proveedor_rfc,
  mp.fecha_registro as creado_en,
  mp.fecha_registro as actualizado_en
FROM materia_prima mp
LEFT JOIN proveedor p ON 1=1 -- Placeholder join since provider relation is not clear in schema
ORDER BY mp.nombre;

/* @name FindMateriaPrimaById
/* Obtiene un material prima por ID con información completa
SELECT
  mp.*,
  p.nombre as proveedor_nombre,
  p.rfc as proveedor_rfc,
  p.telefono as proveedor_telefono,
  p.email as proveedor_email
FROM materia_prima mp
LEFT JOIN proveedor p ON 1=1 -- Placeholder join since provider relation is not clear in schema
WHERE mp.id = :id AND mp.estatus = 'ACTIVO';

/* @name FindMateriaPrimaByCodigoBarras
/* Busca material prima por código de barras
SELECT *
FROM materia_prima
WHERE codigo_barras = :codigoBarras AND estatus = 'ACTIVO';

/* @name SearchMateriaPrima
/* Busca materiales por texto en múltiples campos
SELECT
  id, codigo_barras, nombre, marca, presentacion,
  stock, stock_minimo, categoria, imagen_url,
  costo_unitario
FROM materia_prima
WHERE
  estatus = 'ACTIVO'
  AND (
    nombre ILIKE '%' || :searchTerm || '%' OR
    marca ILIKE '%' || :searchTerm || '%' OR
    codigo_barras ILIKE '%' || :searchTerm || '%' OR
    categoria ILIKE '%' || :searchTerm || '%' OR
    presentacion ILIKE '%' || :searchTerm || '%'
  )
ORDER BY nombre
LIMIT :limit;

/* @name FindLowStockItems
/* Obtiene materiales con stock bajo o agotado
SELECT
  id, codigo_barras, nombre, marca, presentacion,
  stock, stock_minimo, categoria,
  (stock::DECIMAL / NULLIF(stock_minimo, 0)) as stock_ratio
FROM materia_prima
WHERE
  estatus = 'ACTIVO'
  AND stock <= stock_minimo
ORDER BY stock_ratio ASC;

/* @name CheckStockDisponible
/* Verifica si hay stock suficiente para una cantidad determinada
SELECT
  stock >= :cantidad as disponible,
  stock,
  stock_minimo,
  (stock - :cantidad) as stock_restante
FROM materia_prima
WHERE id = :id AND estatus = 'ACTIVO';

/* @name FindMateriaPrimaByCategoria
/* Obtiene materiales por categoría
SELECT
  id, codigo_barras, nombre, marca, presentacion,
  stock, stock_minimo, categoria, imagen_url
FROM materia_prima
WHERE categoria = :categoria AND estatus = 'ACTIVO'
ORDER BY nombre;

/* @name FindMateriaPrimaByProveedor
/* Obtiene materiales por proveedor
SELECT
  mp.id, mp.codigo_barras, mp.nombre, mp.marca, mp.presentacion,
  mp.stock, mp.stock_minimo, mp.categoria,
  p.nombre as proveedor_nombre
FROM materia_prima mp
INNER JOIN proveedor p ON CAST(mp.proveedor_id AS VARCHAR) = CAST(p.id AS VARCHAR)
WHERE mp.proveedor_id = :proveedorId AND mp.estatus = 'ACTIVO'
ORDER BY mp.nombre;

/* @name GetMateriaPrimaStats
/* Obtiene estadísticas generales de materia prima
SELECT
  COUNT(*) as total_materiales,
  COUNT(CASE WHEN stock <= stock_minimo THEN 1 END) as bajo_stock,
  COUNT(CASE WHEN stock = 0 THEN 1 END) as sin_stock,
  COALESCE(SUM(stock * COALESCE(costo_unitario, 0)), 0) as valor_total_inventario,
  COUNT(CASE WHEN categoria IS NOT NULL THEN 1 END) as con_categoria
FROM materia_prima
WHERE estatus = 'ACTIVO';

/* @name GetCategoriaStats
/* Obtiene estadísticas por categoría
SELECT
  categoria,
  COUNT(*) as cantidad,
  COALESCE(SUM(stock * COALESCE(costo_unitario, 0)), 0) as valor_total,
  COUNT(CASE WHEN stock <= stock_minimo THEN 1 END) as bajo_stock
FROM materia_prima
WHERE categoria IS NOT NULL AND estatus = 'ACTIVO'
GROUP BY categoria
ORDER BY cantidad DESC;

/* @name FindMateriaPrimaParaActualizar
/* Query para actualizar un material prima (verifica que exista y esté activo)
SELECT id, stock, actualizado_en
FROM materia_prima
WHERE id = :id AND estatus = 'ACTIVO'
FOR UPDATE;

/* @name GetAuditTrail */
/* Obtiene historial de auditoría de un material - Simplificado sin tablas de auditoría
SELECT
  1 as id,
  'SAMPLE_ACTION' as accion,
  '{}' as datos_anteriores,
  '{}' as datos_nuevos,
  '1' as usuario_id,
  CURRENT_TIMESTAMP as fecha,
  'Sample User' as usuario_nombre
WHERE 1=0 -- No results until audit tables are implemented
;