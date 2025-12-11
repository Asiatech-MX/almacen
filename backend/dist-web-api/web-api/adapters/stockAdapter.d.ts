import { Request, Response, NextFunction } from 'express';
/**
 * Interfaz para movimientos de stock
 */
export interface StockMovementInput {
    materiaPrimaId: string;
    tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
    cantidad: number;
    motivo: string;
    referencia?: string;
    usuarioId?: string;
}
/**
 * Interfaz para ajuste de stock
 */
export interface StockAjusteInput {
    materiaPrimaId: string;
    cantidad: number;
    motivo: string;
    tipoAjuste: 'MANUAL' | 'AUTOMATICO' | 'CORRECCION';
    usuarioId?: string;
}
/**
 * Adaptador para exponer operaciones de Stock vía HTTP API
 */
export declare class StockAdapter {
    private materiaPrimaRepository;
    constructor();
    /**
     * Registrar movimiento de stock
     * POST /api/stock/movimientos
     */
    registrarMovimiento(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtener stock actual de un material
     * GET /api/stock/actual/:materialId
     */
    obtenerStockActual(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Realizar ajuste manual de stock
     * POST /api/stock/ajuste
     */
    realizarAjuste(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtener historial de movimientos de un material
     * GET /api/stock/historial/:materialId
     */
    obtenerHistorial(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Obtener reporte de stock bajo
     * GET /api/stock/bajo-stock
     */
    obtenerStockBajo(req: Request, res: Response, next: NextFunction): Promise<void>;
    /**
     * Determinar el tipo de movimiento basado en la acción de auditoría
     */
    private _determinarTipoMovimiento;
    /**
     * Extraer la cantidad del movimiento desde los datos de auditoría
     */
    private _extraerCantidadMovimiento;
    /**
     * Extraer el motivo del movimiento desde los datos de auditoría
     */
    private _extraerMotivoMovimiento;
}
export default StockAdapter;
//# sourceMappingURL=stockAdapter.d.ts.map