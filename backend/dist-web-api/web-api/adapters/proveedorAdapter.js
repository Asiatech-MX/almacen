"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProveedorAdapter = void 0;
const proveedores_hybrid_1 = require("../../repositories/hybrid/proveedores.hybrid");
const errorHandler_1 = require("../middleware/errorHandler");
/**
 * Adaptador para exponer operaciones de Proveedores vía HTTP API
 * Utiliza el repositorio híbrido que soporta Kysely y PGTyped
 */
class ProveedorAdapter {
    constructor() {
        // Importar dinámicamente para evitar errores de importación
        let db;
        try {
            db = require('../../database/connection').getDatabase();
        }
        catch {
            // Fallback para pruebas
            db = null;
        }
        let pgTypedDb = null;
        try {
            // En un entorno real, esto vendría de la configuración de PGTyped
            pgTypedDb = {}; // Placeholder - en implementación real sería la instancia de PGTyped
        }
        catch {
            pgTypedDb = {};
        }
        this.repository = new proveedores_hybrid_1.ProveedoresHybridRepository(db, pgTypedDb);
    }
    /**
     * Listar proveedores con filtros y paginación
     * POST /api/proveedores/listar
     */
    async listar(req, res, next) {
        try {
            const { page = 1, limit = 50, search, estatus, sortBy = 'nombre', sortOrder = 'ASC' } = req.body;
            // Validar paginación
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            if (pageNum < 1 || limitNum < 1 || limitNum > 1000) {
                throw new errorHandler_1.ValidationError('Parámetros de paginación inválidos');
            }
            // Construir contexto de operación
            const context = {
                operation: 'listar',
                user: req.headers['x-user-id'],
                filters: { search, estatus, sortBy, sortOrder }
            };
            // Obtener datos del repositorio híbrido
            const result = await this.repository.findAll(context);
            // Aplicar paginación en memoria
            let resultados = result.data || [];
            if (search) {
                const searchLower = search.toLowerCase();
                resultados = resultados.filter(p => p.nombre.toLowerCase().includes(searchLower) ||
                    (p.idFiscal && p.idFiscal.toLowerCase().includes(searchLower)) ||
                    (p.rfc && p.rfc.toLowerCase().includes(searchLower)) ||
                    (p.email && p.email.toLowerCase().includes(searchLower)));
            }
            // Ordenamiento
            resultados.sort((a, b) => {
                const aValue = a[sortBy] || '';
                const bValue = b[sortBy] || '';
                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortOrder === 'ASC'
                        ? aValue.localeCompare(bValue)
                        : bValue.localeCompare(aValue);
                }
                if (typeof aValue === 'number' && typeof bValue === 'number') {
                    return sortOrder === 'ASC' ? aValue - bValue : bValue - aValue;
                }
                return 0;
            });
            // Aplicar paginación
            const paginatedResults = resultados.slice(offset, offset + limitNum);
            const totalPages = Math.ceil(resultados.length / limitNum);
            res.json({
                success: true,
                data: paginatedResults,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total: resultados.length,
                    totalPages,
                    hasNext: pageNum < totalPages,
                    hasPrev: pageNum > 1
                },
                meta: {
                    usedKysely: result.usedKysely,
                    performanceMetrics: result.performanceMetrics,
                    validationWarnings: result.validationWarnings,
                    featureFlags: result.metadata?.featureFlagsUsed || []
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Crear nuevo proveedor
     * POST /api/proveedores/crear
     */
    async crear(req, res, next) {
        try {
            const usuarioId = req.headers['x-user-id'];
            const nuevoProveedor = req.body;
            // Validaciones básicas
            if (!nuevoProveedor.nombre || !nuevoProveedor.idFiscal) {
                throw new errorHandler_1.ValidationError('Faltan campos requeridos: nombre, idFiscal');
            }
            // Construir contexto de operación
            const context = {
                operation: 'crear',
                user: usuarioId,
                input: nuevoProveedor
            };
            const resultado = await this.repository.create(nuevoProveedor, context);
            res.status(201).json({
                success: true,
                data: resultado.data,
                message: 'Proveedor creado exitosamente',
                meta: {
                    usedKysely: resultado.usedKysely,
                    performanceMetrics: resultado.performanceMetrics,
                    validationWarnings: resultado.validationWarnings
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Actualizar proveedor existente
     * PUT /api/proveedores/actualizar/:id
     */
    async actualizar(req, res, next) {
        try {
            const { id } = req.params;
            const usuarioId = req.headers['x-user-id'];
            const datosActualizacion = req.body;
            if (!id) {
                throw new errorHandler_1.ValidationError('ID del proveedor es requerido');
            }
            // Construir contexto de operación
            const context = {
                operation: 'actualizar',
                user: usuarioId,
                proveedorId: id,
                input: datosActualizacion
            };
            const resultado = await this.repository.update(id, datosActualizacion, context);
            if (!resultado.data) {
                throw new errorHandler_1.NotFoundError('Proveedor');
            }
            res.json({
                success: true,
                data: resultado.data,
                message: 'Proveedor actualizado exitosamente',
                meta: {
                    usedKysely: resultado.usedKysely,
                    performanceMetrics: resultado.performanceMetrics,
                    validationWarnings: resultado.validationWarnings
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Eliminar (desactivar) proveedor
     * DELETE /api/proveedores/eliminar/:id
     */
    async eliminar(req, res, next) {
        try {
            const { id } = req.params;
            const usuarioId = req.headers['x-user-id'];
            if (!id) {
                throw new errorHandler_1.ValidationError('ID del proveedor es requerido');
            }
            // Construir contexto de operación
            const context = {
                operation: 'eliminar',
                user: usuarioId,
                proveedorId: id
            };
            await this.repository.delete(id, context);
            res.json({
                success: true,
                message: 'Proveedor desactivado exitosamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener detalles de un proveedor
     * GET /api/proveedores/detalles/:id
     */
    async detalles(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_1.ValidationError('ID del proveedor es requerido');
            }
            // Construir contexto de operación
            const context = {
                operation: 'detalles',
                user: req.headers['x-user-id'],
                proveedorId: id
            };
            const resultado = await this.repository.findById(id, context);
            if (!resultado.data) {
                throw new errorHandler_1.NotFoundError('Proveedor');
            }
            res.json({
                success: true,
                data: resultado.data,
                meta: {
                    usedKysely: resultado.usedKysely,
                    performanceMetrics: resultado.performanceMetrics,
                    validationWarnings: resultado.validationWarnings
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Buscar proveedores por término
     * POST /api/proveedores/buscar
     */
    async buscar(req, res, next) {
        try {
            const { termino, limit = 50 } = req.body;
            if (!termino || typeof termino !== 'string' || termino.trim().length === 0) {
                throw new errorHandler_1.ValidationError('Término de búsqueda es requerido');
            }
            // Construir contexto de operación
            const context = {
                operation: 'buscar',
                user: req.headers['x-user-id'],
                filters: { termino, limit }
            };
            const resultado = await this.repository.search(termino.trim(), parseInt(limit), context);
            res.json({
                success: true,
                data: resultado.data,
                count: resultado.data?.length || 0,
                searchTerm: termino.trim(),
                meta: {
                    usedKysely: resultado.usedKysely,
                    performanceMetrics: resultado.performanceMetrics,
                    validationWarnings: resultado.validationWarnings
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Buscar proveedor por RFC
     * POST /api/proveedores/buscar-rfc
     */
    async buscarPorRFC(req, res, next) {
        try {
            const { rfc } = req.body;
            if (!rfc || typeof rfc !== 'string' || rfc.trim().length === 0) {
                throw new errorHandler_1.ValidationError('RFC es requerido');
            }
            // Construir contexto de operación
            const context = {
                operation: 'buscarPorRFC',
                user: req.headers['x-user-id'],
                filters: { rfc }
            };
            const resultado = await this.repository.findByRFC(rfc.trim(), context);
            if (!resultado.data) {
                throw new errorHandler_1.NotFoundError('Proveedor con RFC especificado');
            }
            res.json({
                success: true,
                data: resultado.data,
                meta: {
                    usedKysely: resultado.usedKysely,
                    performanceMetrics: resultado.performanceMetrics,
                    validationWarnings: resultado.validationWarnings
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener estadísticas de proveedores
     * GET /api/proveedores/stats
     */
    async stats(req, res, next) {
        try {
            // Construir contexto de operación
            const context = {
                operation: 'stats',
                user: req.headers['x-user-id']
            };
            const result = await this.repository.findAll(context);
            const proveedores = result.data || [];
            const totalActivos = proveedores.filter(p => p.estatus === 'ACTIVO').length;
            const totalInactivos = proveedores.filter(p => p.estatus === 'INACTIVO').length;
            res.json({
                success: true,
                data: {
                    total: proveedores.length,
                    activos: totalActivos,
                    inactivos: totalInactivos,
                    porcentajeActivos: totalActivos > 0 ? ((totalActivos / proveedores.length) * 100) : 0
                },
                meta: {
                    usedKysely: result.usedKysely,
                    performanceMetrics: result.performanceMetrics,
                    validationWarnings: result.validationWarnings
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.ProveedorAdapter = ProveedorAdapter;
exports.default = ProveedorAdapter;
//# sourceMappingURL=proveedorAdapter.js.map