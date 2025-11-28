"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StockAdapter = void 0;
const materiaPrimaRepo_1 = require("../../repositories/materiaPrimaRepo");
const connection_1 = require("../../database/connection");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Adaptador para exponer operaciones de Stock vía HTTP API
 */
class StockAdapter {
    constructor() {
        this.materiaPrimaRepository = new materiaPrimaRepo_1.MateriaPrimaRepository((0, connection_1.getDatabase)());
    }
    /**
     * Registrar movimiento de stock
     * POST /api/stock/movimientos
     */
    async registrarMovimiento(req, res, next) {
        try {
            const usuarioId = req.headers['x-user-id'];
            const movimiento = req.body;
            // Validaciones básicas
            if (!movimiento.materiaPrimaId || !movimiento.tipo || !movimiento.cantidad || !movimiento.motivo) {
                throw new errorHandler_1.ValidationError('Faltan campos requeridos: materiaPrimaId, tipo, cantidad, motivo');
            }
            if (!['ENTRADA', 'SALIDA', 'AJUSTE'].includes(movimiento.tipo)) {
                throw new errorHandler_1.ValidationError('Tipo de movimiento inválido. Debe ser: ENTRADA, SALIDA o AJUSTE');
            }
            if (movimiento.cantidad === 0) {
                throw new errorHandler_1.ValidationError('La cantidad no puede ser cero');
            }
            // Verificar que el material existe
            const material = await this.materiaPrimaRepository.findById(movimiento.materiaPrimaId);
            if (!material) {
                throw new errorHandler_1.NotFoundError('Material de materia prima');
            }
            // Determinar si es entrada o salida
            const cantidad = Math.abs(movimiento.cantidad);
            const esEntrada = movimiento.tipo === 'ENTRADA' || (movimiento.tipo === 'AJUSTE' && movimiento.cantidad > 0);
            // Actualizar stock usando el repositorio de materia prima
            await this.materiaPrimaRepository.updateStock(movimiento.materiaPrimaId, esEntrada ? cantidad : -cantidad, `${movimiento.tipo}: ${movimiento.motivo}`, usuarioId);
            res.status(201).json({
                success: true,
                message: 'Movimiento de stock registrado exitosamente',
                data: {
                    id: `mov-${Date.now()}`, // ID temporal
                    materiaPrimaId: movimiento.materiaPrimaId,
                    tipo: movimiento.tipo,
                    cantidad: movimiento.cantidad,
                    motivo: movimiento.motivo,
                    referencia: movimiento.referencia,
                    fecha: new Date().toISOString(),
                    stockAnterior: material.stock_actual,
                    stockNuevo: esEntrada ? material.stock_actual + cantidad : material.stock_actual - cantidad
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener stock actual de un material
     * GET /api/stock/actual/:materialId
     */
    async obtenerStockActual(req, res, next) {
        try {
            const { materialId } = req.params;
            if (!materialId) {
                throw new errorHandler_1.ValidationError('ID del material es requerido');
            }
            const material = await this.materiaPrimaRepository.findById(materialId);
            if (!material) {
                throw new errorHandler_1.NotFoundError('Material de materia prima');
            }
            const stockInfo = await this.materiaPrimaRepository.checkStock(materialId, 0);
            res.json({
                success: true,
                data: {
                    materiaPrimaId: material.id,
                    nombre: material.nombre,
                    codigoBarras: material.codigo_barras,
                    stockActual: material.stock_actual,
                    stockMinimo: material.stock_minimo,
                    stockBajo: material.stock_actual <= material.stock_minimo,
                    porcentajeStock: material.stock_minimo > 0
                        ? Math.round((material.stock_actual / material.stock_minimo) * 100)
                        : null,
                    ultimaActualizacion: material.actualizado_en
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Realizar ajuste manual de stock
     * POST /api/stock/ajuste
     */
    async realizarAjuste(req, res, next) {
        try {
            const usuarioId = req.headers['x-user-id'];
            const ajuste = req.body;
            // Validaciones básicas
            if (!ajuste.materiaPrimaId || !ajuste.cantidad || !ajuste.motivo) {
                throw new errorHandler_1.ValidationError('Faltan campos requeridos: materiaPrimaId, cantidad, motivo');
            }
            if (!['MANUAL', 'AUTOMATICO', 'CORRECCION'].includes(ajuste.tipoAjuste)) {
                throw new errorHandler_1.ValidationError('Tipo de ajuste inválido. Debe ser: MANUAL, AUTOMATICO o CORRECCION');
            }
            if (ajuste.cantidad === 0) {
                throw new errorHandler_1.ValidationError('La cantidad no puede ser cero');
            }
            // Verificar que el material existe
            const material = await this.materiaPrimaRepository.findById(ajuste.materiaPrimaId);
            if (!material) {
                throw new errorHandler_1.NotFoundError('Material de materia prima');
            }
            // Actualizar stock usando el repositorio de materia prima
            await this.materiaPrimaRepository.updateStock(ajuste.materiaPrimaId, ajuste.cantidad, `AJUSTE ${ajuste.tipoAjuste}: ${ajuste.motivo}`, usuarioId);
            const materialActualizado = await this.materiaPrimaRepository.findById(ajuste.materiaPrimaId);
            res.status(200).json({
                success: true,
                message: 'Ajuste de stock realizado exitosamente',
                data: {
                    id: `ajuste-${Date.now()}`, // ID temporal
                    materiaPrimaId: ajuste.materiaPrimaId,
                    tipoAjuste: ajuste.tipoAjuste,
                    cantidad: ajuste.cantidad,
                    motivo: ajuste.motivo,
                    fecha: new Date().toISOString(),
                    stockAnterior: material.stock_actual,
                    stockNuevo: materialActualizado?.stock_actual || 0,
                    diferencia: ajuste.cantidad
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener historial de movimientos de un material
     * GET /api/stock/historial/:materialId
     */
    async obtenerHistorial(req, res, next) {
        try {
            const { materialId } = req.params;
            const { limit = 50 } = req.query;
            if (!materialId) {
                throw new errorHandler_1.ValidationError('ID del material es requerido');
            }
            const material = await this.materiaPrimaRepository.findById(materialId);
            if (!material) {
                throw new errorHandler_1.NotFoundError('Material de materia prima');
            }
            // Obtener trail de auditoría (que incluye movimientos de stock)
            const auditTrail = await this.materiaPrimaRepository.getAuditTrail(materialId, parseInt(limit));
            // Filtrar solo movimientos de stock
            const movimientos = auditTrail.filter(item => item.accion === 'STOCK_UPDATE' ||
                item.accion === 'INSERT' ||
                item.accion === 'DELETE').map(item => ({
                id: item.id,
                materiaPrimaId: item.materia_prima_id,
                accion: item.accion,
                tipo: this._determinarTipoMovimiento(item),
                cantidad: this._extraerCantidadMovimiento(item),
                motivo: this._extraerMotivoMovimiento(item),
                usuarioId: item.usuario_id,
                fecha: item.fecha,
                datosAnteriores: item.datos_anteriores ? JSON.parse(item.datos_anteriores) : null,
                datosNuevos: item.datos_nuevos ? JSON.parse(item.datos_nuevos) : null
            }));
            res.json({
                success: true,
                data: {
                    materiaPrima: {
                        id: material.id,
                        nombre: material.nombre,
                        codigoBarras: material.codigo_barras,
                        stockActual: material.stock_actual
                    },
                    movimientos,
                    total: movimientos.length
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener reporte de stock bajo
     * GET /api/stock/bajo-stock
     */
    async obtenerStockBajo(req, res, next) {
        try {
            const items = await this.materiaPrimaRepository.getLowStockItems();
            res.json({
                success: true,
                data: items,
                count: items.length,
                message: items.length > 0
                    ? `Se encontraron ${items.length} materiales con stock bajo`
                    : 'No hay materiales con stock bajo'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Determinar el tipo de movimiento basado en la acción de auditoría
     */
    _determinarTipoMovimiento(item) {
        if (item.accion === 'STOCK_UPDATE') {
            const datos = JSON.parse(item.datos_nuevos || '{}');
            if (datos.cantidad > 0)
                return 'ENTRADA';
            if (datos.cantidad < 0)
                return 'SALIDA';
            return 'AJUSTE';
        }
        if (item.accion === 'INSERT')
            return 'ENTRADA';
        if (item.accion === 'DELETE')
            return 'SALIDA';
        return 'DESCONOCIDO';
    }
    /**
     * Extraer la cantidad del movimiento desde los datos de auditoría
     */
    _extraerCantidadMovimiento(item) {
        if (item.accion === 'STOCK_UPDATE') {
            const datos = JSON.parse(item.datos_nuevos || '{}');
            return datos.cantidad || 0;
        }
        return 0;
    }
    /**
     * Extraer el motivo del movimiento desde los datos de auditoría
     */
    _extraerMotivoMovimiento(item) {
        if (item.accion === 'STOCK_UPDATE') {
            const datos = JSON.parse(item.datos_nuevos || '{}');
            return datos.motivo || 'Movimiento de stock';
        }
        return item.accion || 'Movimiento desconocido';
    }
}
exports.StockAdapter = StockAdapter;
exports.default = StockAdapter;
//# sourceMappingURL=stockAdapter.js.map