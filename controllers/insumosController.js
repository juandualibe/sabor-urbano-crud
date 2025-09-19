import InsumoModel from '../models/Insumo.js';

class InsumosController {
    constructor() {
        this.insumoModel = new InsumoModel();
    }

    async getAll(req, res) {
        try {
            const insumos = await this.insumoModel.getAll();
            res.json({
                success: true,
                data: insumos,
                total: insumos.length
            });
        } catch (error) {
            console.error('Error en getAll insumos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los insumos',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const insumo = await this.insumoModel.getById(id);
            if (!insumo) {
                return res.status(404).json({
                    success: false,
                    message: 'Insumo no encontrado'
                });
            }
            res.json({
                success: true,
                data: insumo
            });
        } catch (error) {
            console.error('Error en getById insumo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el insumo',
                error: error.message
            });
        }
    }

    async getBajoStock(req, res) {
        try {
            const insumos = await this.insumoModel.getBajoStock();
            res.json({
                success: true,
                data: insumos,
                total: insumos.length
            });
        } catch (error) {
            console.error('Error en getBajoStock:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener insumos con stock bajo',
                error: error.message
            });
        }
    }

    async getByCategoria(req, res) {
        try {
            const { categoria } = req.params;
            const categoriasValidas = ['alimentos', 'bebidas', 'limpieza', 'utensilios', 'otros'];
            if (!categoriasValidas.includes(categoria)) {
                return res.status(400).json({
                    success: false,
                    message: 'Categoría no válida. Use: alimentos, bebidas, limpieza, utensilios, otros'
                });
            }
            const insumos = await this.insumoModel.getByCategoria(categoria);
            res.json({
                success: true,
                data: insumos,
                categoria: categoria,
                total: insumos.length
            });
        } catch (error) {
            console.error('Error en getByCategoria:', error);
            res.status(500).json({
                success: false,
                message: 'Error al filtrar insumos por categoría',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const datosInsumo = req.body;
            if (!datosInsumo.nombre || !datosInsumo.categoria) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre y categoría son obligatorios'
                });
            }
            const categoriasValidas = ['alimentos', 'bebidas', 'limpieza', 'utensilios', 'otros'];
            if (!categoriasValidas.includes(datosInsumo.categoria)) {
                return res.status(400).json({
                    success: false,
                    message: 'Categoría no válida'
                });
            }
            const nuevoInsumo = await this.insumoModel.create(datosInsumo);
            res.status(201).json({
                success: true,
                message: 'Insumo creado exitosamente',
                data: nuevoInsumo
            });
        } catch (error) {
            console.error('Error en create insumo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el insumo',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const datosActualizados = req.body;
            const insumoExistente = await this.insumoModel.getById(id);
            if (!insumoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Insumo no encontrado'
                });
            }
            const insumoActualizado = await this.insumoModel.update(id, datosActualizados);
            res.json({
                success: true,
                message: 'Insumo actualizado exitosamente',
                data: insumoActualizado
            });
        } catch (error) {
            console.error('Error en update insumo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el insumo',
                error: error.message
            });
        }
    }

    async actualizarStock(req, res) {
        try {
            const { id } = req.params;
            const { stock } = req.body;
            const insumoExistente = await this.insumoModel.getById(id);
            if (!insumoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Insumo no encontrado'
                });
            }
            const insumoActualizado = await this.insumoModel.actualizarStock(id, stock);
            res.json({
                success: true,
                message: 'Stock actualizado exitosamente',
                data: insumoActualizado
            });
        } catch (error) {
            console.error('Error en actualizarStock:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el stock',
                error: error.message
            });
        }
    }

    async descontarStock(req, res) {
        try {
            const { id } = req.params;
            const { cantidad } = req.body;
            const insumoExistente = await this.insumoModel.getById(id);
            if (!insumoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Insumo no encontrado'
                });
            }
            if (isNaN(parseInt(cantidad)) || parseInt(cantidad) <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La cantidad debe ser un número mayor a 0'
                });
            }
            const insumoActualizado = await this.insumoModel.descontarStock(id, cantidad);
            res.json({
                success: true,
                message: 'Stock descontado exitosamente',
                data: insumoActualizado
            });
        } catch (error) {
            console.error('Error en descontarStock:', error);
            if (error.message === 'Stock insuficiente') {
                res.status(400).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al descontar el stock',
                    error: error.message
                });
            }
        }
    }

    async getAlertas(req, res) {
        try {
            const alertas = await this.insumoModel.getAlertas();
            res.json({
                success: true,
                data: alertas,
                total: alertas.length
            });
        } catch (error) {
            console.error('Error en getAlertas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener alertas de stock',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const resultado = await this.insumoModel.delete(id);
            res.json({
                success: true,
                message: 'Insumo eliminado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('Error en delete insumo:', error);
            if (error.message === 'Insumo no encontrado') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al eliminar el insumo',
                    error: error.message
                });
            }
        }
    }
}

export default InsumosController;