/* @name FindAllProveedores */
-- Obtiene todos los proveedores activos
SELECT
  id,
  nombre,
  rfc,
  telefono,
  email,
  domicilio as direccion,
  fecha_registro as creado_en,
  fecha_registro as actualizado_en
FROM proveedor
WHERE estatus = 'ACTIVO'
ORDER BY nombre;

/* @name FindProveedorById */
-- Obtiene un proveedor por ID
SELECT *
FROM proveedor
WHERE id = :id AND estatus = 'ACTIVO';

/* @name SearchProveedores */
-- Busca proveedores por texto
SELECT
  id, nombre, rfc, telefono, email
FROM proveedor
WHERE
  estatus = 'ACTIVO'
  AND (
    nombre ILIKE '%' || :searchTerm || '%' OR
    rfc ILIKE '%' || :searchTerm || '%' OR
    email ILIKE '%' || :searchTerm || '%'
  )
ORDER BY nombre
LIMIT :limit;

/* @name FindProveedorByRFC */
-- Busca proveedor por RFC
SELECT *
FROM proveedor
WHERE rfc = :rfc AND estatus = 'ACTIVO';