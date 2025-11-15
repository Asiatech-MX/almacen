-- @name FindAllProveedores
-- Obtiene todos los proveedores activos
SELECT
  id,
  nombre,
  rfc,
  telefono,
  email,
  direccion,
  creado_en,
  actualizado_en
FROM proveedores
WHERE activo = true
ORDER BY nombre;

-- @name FindProveedorById
-- Obtiene un proveedor por ID
SELECT *
FROM proveedores
WHERE id = :id AND activo = true;

-- @name SearchProveedores
-- Busca proveedores por texto
SELECT
  id, nombre, rfc, telefono, email
FROM proveedores
WHERE
  activo = true
  AND (
    nombre ILIKE '%' || :searchTerm || '%' OR
    rfc ILIKE '%' || :searchTerm || '%' OR
    email ILIKE '%' || :searchTerm || '%'
  )
ORDER BY nombre
LIMIT :limit;

-- @name FindProveedorByRFC
-- Busca proveedor por RFC
SELECT *
FROM proveedores
WHERE rfc = :rfc AND activo = true;