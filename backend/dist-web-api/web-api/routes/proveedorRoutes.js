"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const proveedorAdapter_1 = __importDefault(require("../adapters/proveedorAdapter"));
const router = (0, express_1.Router)();
const adapter = new proveedorAdapter_1.default();
/**
 * Routes para gestión de Proveedores
 * Base path: /api/proveedores
 */
// POST /api/proveedores/listar - Listar proveedores con filtros y paginación
router.post('/listar', adapter.listar.bind(adapter));
// POST /api/proveedores/crear - Crear nuevo proveedor
router.post('/crear', adapter.crear.bind(adapter));
// PUT /api/proveedores/actualizar/:id - Actualizar proveedor existente
router.put('/actualizar/:id', adapter.actualizar.bind(adapter));
// DELETE /api/proveedores/eliminar/:id - Eliminar (desactivar) proveedor
router.delete('/eliminar/:id', adapter.eliminar.bind(adapter));
// GET /api/proveedores/detalles/:id - Obtener detalles de proveedor
router.get('/detalles/:id', adapter.detalles.bind(adapter));
// POST /api/proveedores/buscar - Buscar proveedores por término
router.post('/buscar', adapter.buscar.bind(adapter));
// POST /api/proveedores/buscar-rfc - Buscar proveedor por RFC
router.post('/buscar-rfc', adapter.buscarPorRFC.bind(adapter));
// GET /api/proveedores/stats - Obtener estadísticas de proveedores
router.get('/stats', adapter.stats.bind(adapter));
exports.default = router;
//# sourceMappingURL=proveedorRoutes.js.map