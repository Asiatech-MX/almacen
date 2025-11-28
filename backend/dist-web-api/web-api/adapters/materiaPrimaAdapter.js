"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MateriaPrimaAdapter = void 0;
const materiaPrimaRepo_js_1 = require("../../repositories/materiaPrimaRepo.js");
const connection_1 = require("../../database/connection");
const errorHandler_js_1 = require("../middleware/errorHandler.js");
/**
 * Adaptador para exponer operaciones de MateriaPrimaRepository vía HTTP API
 * Convierte operaciones del repository a respuestas HTTP con manejo de errores adecuado
 */
class MateriaPrimaAdapter {
    constructor() {
        this.repository = new materiaPrimaRepo_js_1.MateriaPrimaRepository((0, connection_1.getDatabase)());
    }
    /**
     * Listar materiales con filtros y paginación
     * POST /api/materiaPrima/listar
     */
    async listar(req, res, next) {
        try {
            const { page = 1, limit = 50, search, categoria, proveedorId, activo, bajoStock, sinStock, sortBy = 'nombre', sortOrder = 'ASC' } = req.body;
            // Validar paginación
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            if (pageNum < 1 || limitNum < 1 || limitNum > 1000) {
                throw new errorHandler_js_1.ValidationError('Parámetros de paginación inválidos');
            }
            // Construir filtros
            const filters = {};
            if (search)
                filters.nombre = search;
            if (categoria)
                filters.categoria = categoria;
            if (proveedorId)
                filters.proveedorId = proveedorId;
            if (activo !== undefined)
                filters.activo = activo;
            if (bajoStock)
                filters.bajoStock = bajoStock;
            if (sinStock)
                filters.sinStock = sinStock;
            // Obtener datos
            const [materiales, total] = await Promise.all([
                this.repository.findAll(filters),
                this.repository.getStats()
            ]);
            // Aplicar paginación y ordenamiento en memoria (podría optimizarse a nivel SQL)
            let resultados = materiales;
            if (search) {
                const searchLower = search.toLowerCase();
                resultados = resultados.filter(m => m.nombre.toLowerCase().includes(searchLower) ||
                    m.codigo_barras.toLowerCase().includes(searchLower) ||
                    (m.marca && m.marca.toLowerCase().includes(searchLower)) ||
                    (m.categoria && m.categoria.toLowerCase().includes(searchLower)));
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
                stats: {
                    totalActivos: total.total,
                    bajoStock: total.bajoStock,
                    sinStock: total.sinStock,
                    valorTotal: total.valorTotal
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Crear nuevo material
     * POST /api/materiaPrima/crear
     */
    async crear(req, res, next) {
        try {
            const usuarioId = req.headers['x-user-id'];
            const nuevoMaterial = req.body;
            // Validaciones básicas
            if (!nuevoMaterial.codigo_barras || !nuevoMaterial.nombre || !nuevoMaterial.presentacion) {
                throw new errorHandler_js_1.ValidationError('Faltan campos requeridos: código_barras, nombre, presentacion');
            }
            // Verificar duplicado
            const existente = await this.repository.findByCodigoBarras(nuevoMaterial.codigo_barras);
            if (existente) {
                throw new errorHandler_js_1.ConflictError(`El código de barras ${nuevoMaterial.codigo_barras} ya existe`);
            }
            const resultado = await this.repository.create(nuevoMaterial, usuarioId);
            res.status(201).json({
                success: true,
                data: resultado,
                message: 'Material creado exitosamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Actualizar material existente
     * PUT /api/materiaPrima/actualizar/:id
     */
    async actualizar(req, res, next) {
        try {
            const { id } = req.params;
            const usuarioId = req.headers['x-user-id'];
            const datosActualizacion = req.body;
            if (!id) {
                throw new errorHandler_js_1.ValidationError('ID del material es requerido');
            }
            // Verificar que el material existe
            const existente = await this.repository.findById(id);
            if (!existente) {
                throw new errorHandler_js_1.NotFoundError('Material');
            }
            // Si se actualiza código de barras, verificar duplicado
            if (datosActualizacion.codigo_barras && datosActualizacion.codigo_barras !== existente.codigo_barras) {
                const duplicado = await this.repository.findByCodigoBarras(datosActualizacion.codigo_barras);
                if (duplicado) {
                    throw new errorHandler_js_1.ConflictError(`El código de barras ${datosActualizacion.codigo_barras} ya existe`);
                }
            }
            const resultado = await this.repository.update(id, datosActualizacion, usuarioId);
            res.json({
                success: true,
                data: resultado,
                message: 'Material actualizado exitosamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Eliminar material (hard delete)
     * DELETE /api/materiaPrima/eliminar/:id
     */
    async eliminar(req, res, next) {
        try {
            const { id } = req.params;
            const usuarioId = req.headers['x-user-id'];
            if (!id) {
                throw new errorHandler_js_1.ValidationError('ID del material es requerido');
            }
            // Verificar que el material existe
            const existente = await this.repository.findById(id);
            if (!existente) {
                throw new errorHandler_js_1.NotFoundError('Material');
            }
            // Solo permitir eliminar materiales INACTIVOS (soft delete)
            if (existente.activo) {
                throw new errorHandler_js_1.ConflictError('Solo se pueden eliminar materiales con estatus INACTIVO');
            }
            // Verificar que no tenga stock (convertir a número por si viene como string)
            const stockActual = Number(existente.stock_actual);
            if (stockActual > 0) {
                throw new errorHandler_js_1.ConflictError(`No se puede eliminar el material con ${stockActual} unidades en stock`);
            }
            await this.repository.delete(id, usuarioId);
            res.json({
                success: true,
                message: 'Material eliminado exitosamente'
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener detalles de un material
     * GET /api/materiaPrima/detalles/:id
     */
    async detalles(req, res, next) {
        try {
            const { id } = req.params;
            if (!id) {
                throw new errorHandler_js_1.ValidationError('ID del material es requerido');
            }
            const material = await this.repository.findById(id);
            if (!material) {
                throw new errorHandler_js_1.NotFoundError('Material');
            }
            // Obtener trail de auditoría
            const [auditTrail, stats] = await Promise.all([
                this.repository.getAuditTrail(id, 20),
                this.repository.getStats()
            ]);
            res.json({
                success: true,
                data: material,
                auditTrail,
                relatedStats: {
                    totalActivos: stats.total,
                    bajoStock: stats.bajoStock,
                    sinStock: stats.sinStock
                }
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener materiales con stock bajo
     * GET /api/materiaPrima/stock-bajo
     */
    async stockBajo(req, res, next) {
        try {
            const items = await this.repository.getLowStockItems();
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
     * Buscar materiales por término
     * POST /api/materiaPrima/buscar
     */
    async buscar(req, res, next) {
        try {
            const { termino, limit = 50 } = req.body;
            if (!termino || typeof termino !== 'string' || termino.trim().length === 0) {
                throw new errorHandler_js_1.ValidationError('Término de búsqueda es requerido');
            }
            const resultados = await this.repository.search(termino.trim(), parseInt(limit));
            res.json({
                success: true,
                data: resultados,
                count: resultados.length,
                searchTerm: termino.trim()
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Obtener estadísticas de materia prima
     * GET /api/materiaPrima/stats
     */
    async stats(req, res, next) {
        try {
            const stats = await this.repository.getStats();
            res.json({
                success: true,
                data: stats
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Verificar stock de material específico
     * POST /api/materiaPrima/verificar-stock
     */
    async verificarStock(req, res, next) {
        try {
            const { id, cantidad } = req.body;
            if (!id || !cantidad || cantidad <= 0) {
                throw new errorHandler_js_1.ValidationError('ID y cantidad son requeridos, cantidad debe ser mayor a 0');
            }
            const stockCheck = await this.repository.checkStock(id, cantidad);
            res.json({
                success: true,
                data: stockCheck,
                message: stockCheck.disponible
                    ? `Stock disponible: ${stockCheck.stock_actual} unidades`
                    : `Stock insuficiente: disponible ${stockCheck.stock_actual}, solicitado ${cantidad}`
            });
        }
        catch (error) {
            next(error);
        }
    }
    /**
     * Actualizar stock de material
     * POST /api/materiaPrima/actualizar-stock
     */
    async actualizarStock(req, res, next) {
        try {
            const { id, cantidad, motivo } = req.body;
            const usuarioId = req.headers['x-user-id'];
            if (!id || cantidad === undefined || !motivo) {
                throw new errorHandler_js_1.ValidationError('ID, cantidad y motivo son requeridos');
            }
            if (cantidad === 0) {
                throw new errorHandler_js_1.ValidationError('La cantidad no puede ser cero');
            }
            await this.repository.updateStock(id, cantidad, motivo, usuarioId);
            const materialActualizado = await this.repository.findById(id);
            res.json({
                success: true,
                data: materialActualizado,
                message: `Stock actualizado: ${cantidad > 0 ? '+' : ''}${cantidad} unidades`
            });
        }
        catch (error) {
            next(error);
        }
    }
}
exports.MateriaPrimaAdapter = MateriaPrimaAdapter;
exports.default = MateriaPrimaAdapter;
//# sourceMappingURL=materiaPrimaAdapter.js.map