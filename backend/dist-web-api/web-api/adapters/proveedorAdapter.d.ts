import { Request, Response, NextFunction } from 'express';
/**
 * Adaptador para exponer operaciones de Proveedores vía HTTP API
 * Utiliza el repositorio híbrido que soporta Kysely y PGTyped
 */
export declare class ProveedorAdapter {
    private repository;
    constructor();
    /**
     * Listar proveedores con filtros y paginación
     * POST /api/proveedores/listar
     */
    listar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Crear nuevo proveedor
     * POST /api/proveedores/crear
     */
    crear(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Actualizar proveedor existente
     * PUT /api/proveedores/actualizar/:id
     */
    actualizar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Eliminar (desactivar) proveedor
     * DELETE /api/proveedores/eliminar/:id
     */
    eliminar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtener detalles de un proveedor
     * GET /api/proveedores/detalles/:id
     */
    detalles(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Buscar proveedores por término
     * POST /api/proveedores/buscar
     */
    buscar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Buscar proveedor por RFC
     * POST /api/proveedores/buscar-rfc
     */
    buscarPorRFC(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtener estadísticas de proveedores
     * GET /api/proveedores/stats
     */
    stats(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default ProveedorAdapter;
//# sourceMappingURL=proveedorAdapter.d.ts.map