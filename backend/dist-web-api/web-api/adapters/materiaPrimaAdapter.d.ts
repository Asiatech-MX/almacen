import { Request, Response, NextFunction } from 'express';
/**
 * Adaptador para exponer operaciones de MateriaPrimaRepository vía HTTP API
 * Convierte operaciones del repository a respuestas HTTP con manejo de errores adecuado
 */
export declare class MateriaPrimaAdapter {
    private repository;
    constructor();
    /**
     * Listar materiales con filtros y paginación
     * POST /api/materiaPrima/listar
     */
    listar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Crear nuevo material
     * POST /api/materiaPrima/crear
     */
    crear(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Actualizar material existente
     * PUT /api/materiaPrima/actualizar/:id
     */
    actualizar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Eliminar material (hard delete)
     * DELETE /api/materiaPrima/eliminar/:id
     */
    eliminar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtener detalles de un material
     * GET /api/materiaPrima/detalles/:id
     */
    detalles(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtener materiales con stock bajo
     * GET /api/materiaPrima/stock-bajo
     */
    stockBajo(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Buscar materiales por término
     * POST /api/materiaPrima/buscar
     */
    buscar(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtener estadísticas de materia prima
     * GET /api/materiaPrima/stats
     */
    stats(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Verificar stock de material específico
     * POST /api/materiaPrima/verificar-stock
     */
    verificarStock(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Actualizar stock de material
     * POST /api/materiaPrima/actualizar-stock
     */
    actualizarStock(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export default MateriaPrimaAdapter;
//# sourceMappingURL=materiaPrimaAdapter.d.ts.map