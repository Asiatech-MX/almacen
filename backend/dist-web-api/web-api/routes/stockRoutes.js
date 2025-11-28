"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stock_adapter_1 = require("../../adapters/stock.adapter");
const router = (0, express_1.Router)();
/**
 * Routes para gestión de Stock y Movimientos
 * Base path: /api/stock
 */
// POST /api/stock/movimientos - Registrar movimiento de stock
router.post('/movimientos', async (req, res, next) => {
    try {
        const { materia_prima_id, tipo_movimiento, cantidad, motivo, creado_por } = req.body;
        const movement = await stock_adapter_1.stockAdapter.createMovement({
            materia_prima_id,
            tipo_movimiento,
            cantidad,
            motivo,
            creado_por
        });
        res.status(201).json({
            success: true,
            data: movement,
            message: 'Movimiento de stock registrado exitosamente'
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/stock/actual/:materialId - Obtener stock actual de material
router.get('/actual/:materialId', async (req, res, next) => {
    try {
        const { materialId } = req.params;
        const stock = await stock_adapter_1.stockAdapter.getStockByMateriaPrima(materialId);
        res.json({
            success: true,
            data: { materia_prima_id: materialId, stock_actual: stock }
        });
    }
    catch (error) {
        next(error);
    }
});
// POST /api/stock/ajuste - Realizar ajuste manual de stock
router.post('/ajuste', async (req, res, next) => {
    try {
        const { materia_prima_id, cantidad, motivo, creado_por } = req.body;
        const success = await stock_adapter_1.stockAdapter.updateStock(materia_prima_id, cantidad, 'ajuste', motivo, creado_por);
        res.json({
            success,
            message: success ? 'Ajuste de stock realizado exitosamente' : 'Error al realizar ajuste de stock'
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/stock/historial/:materialId - Obtener historial de movimientos
router.get('/historial/:materialId', async (req, res, next) => {
    try {
        const { materialId } = req.params;
        const { days } = req.query;
        const history = await stock_adapter_1.stockAdapter.getStockHistory(materialId, days ? parseInt(days) : undefined);
        res.json({
            success: true,
            data: history
        });
    }
    catch (error) {
        next(error);
    }
});
// GET /api/stock/bajo-stock - Obtener materiales con stock bajo
router.get('/bajo-stock', async (req, res, next) => {
    try {
        const lowStock = await stock_adapter_1.stockAdapter.getLowStockItems();
        res.json({
            success: true,
            data: lowStock
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
//# sourceMappingURL=stockRoutes.js.map