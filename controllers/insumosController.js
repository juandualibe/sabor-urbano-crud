import InsumoModel from '../models/Insumo.js'; // Importa modelo Insumo

class InsumosController { // Controlador para insumos: lógica de rutas
    constructor() { // Inicializa modelo
        this.insumoModel = new InsumoModel(); // Instancia para métodos
    }

    async getAll(req, res) { // Todos los insumos: GET /
        try {
            const insumos = await this.insumoModel.getAll(); // Obtiene array
            res.json({ // JSON éxito
                success: true,
                data: insumos,
                total: insumos.length
            });
        } catch (error) {
            console.error('Error en getAll insumos:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al obtener los insumos',
                error: error.message
            });
        }
    }

    async getById(req, res) { // Por ID: GET /:id
        try {
            const { id } = req.params; // ID
            const insumo = await this.insumoModel.getById(id); // Busca
            if (!insumo) { // No encontrado
                return res.status(404).json({ // 404
                    success: false,
                    message: 'Insumo no encontrado'
                });
            }
            res.json({ // Éxito
                success: true,
                data: insumo
            });
        } catch (error) {
            console.error('Error en getById insumo:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al obtener el insumo',
                error: error.message
            });
        }
    }

    async getBajoStock(req, res) { // Insumos con stock bajo: GET /bajo-stock
        try {
            const insumos = await this.insumoModel.getBajoStock(); // Filtra en modelo
            res.json({ // Éxito
                success: true,
                data: insumos,
                total: insumos.length
            });
        } catch (error) {
            console.error('Error en getBajoStock:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al obtener insumos con stock bajo',
                error: error.message
            });
        }
    }

    async getByCategoria(req, res) { // Por categoría: GET /categoria/:categoria
        try {
            const { categoria } = req.params; // Categoría
            const categoriasValidas = ['alimentos', 'bebidas', 'limpieza', 'utensilios', 'otros']; // Lista
            if (!categoriasValidas.includes(categoria)) { // Valida
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Categoría no válida. Use: alimentos, bebidas, limpieza, utensilios, otros'
                });
            }
            const insumos = await this.insumoModel.getByCategoria(categoria); // Filtra
            res.json({ // Éxito
                success: true,
                data: insumos,
                categoria: categoria,
                total: insumos.length
            });
        } catch (error) {
            console.error('Error en getByCategoria:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al filtrar insumos por categoría',
                error: error.message
            });
        }
    }

    async create(req, res) { // Crea insumo: POST /
        try {
            const datosInsumo = req.body; // Datos
            if (!datosInsumo.nombre || !datosInsumo.categoria) { // Obligatorios
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Nombre y categoría son obligatorios'
                });
            }
            const categoriasValidas = ['alimentos', 'bebidas', 'limpieza', 'utensilios', 'otros']; // Valida cat
            if (!categoriasValidas.includes(datosInsumo.categoria)) {
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Categoría no válida'
                });
            }
            const nuevoInsumo = await this.insumoModel.create(datosInsumo); // Crea
            res.status(201).json({ // 201
                success: true,
                message: 'Insumo creado exitosamente',
                data: nuevoInsumo
            });
        } catch (error) {
            console.error('Error en create insumo:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al crear el insumo',
                error: error.message
            });
        }
    }

    async update(req, res) { // Actualiza insumo: PUT /:id
        try {
            const { id } = req.params; // ID
            const datosActualizados = req.body; // Datos
            const insumoExistente = await this.insumoModel.getById(id); // Verifica
            if (!insumoExistente) {
                return res.status(404).json({ // 404
                    success: false,
                    message: 'Insumo no encontrado'
                });
            }
            const insumoActualizado = await this.insumoModel.update(id, datosActualizados); // Actualiza
            res.json({ // Éxito
                success: true,
                message: 'Insumo actualizado exitosamente',
                data: insumoActualizado
            });
        } catch (error) {
            console.error('Error en update insumo:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al actualizar el insumo',
                error: error.message
            });
        }
    }

    async actualizarStock(req, res) { // Actualiza stock absoluto: PUT /:id/stock
        try {
            const { id } = req.params; // ID
            const { stock } = req.body; // Nuevo stock
            const insumoExistente = await this.insumoModel.getById(id); // Verifica
            if (!insumoExistente) {
                return res.status(404).json({ // 404
                    success: false,
                    message: 'Insumo no encontrado'
                });
            }
            const insumoActualizado = await this.insumoModel.actualizarStock(id, stock); // Actualiza stock
            res.json({ // Éxito
                success: true,
                message: 'Stock actualizado exitosamente',
                data: insumoActualizado
            });
        } catch (error) {
            console.error('Error en actualizarStock:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al actualizar el stock',
                error: error.message
            });
        }
    }

    async descontarStock(req, res) { // Descuenta stock: PUT /:id/descontar
        try {
            const { id } = req.params; // ID
            const { cantidad } = req.body; // Cantidad a restar
            const insumoExistente = await this.insumoModel.getById(id); // Verifica
            if (!insumoExistente) {
                return res.status(404).json({ // 404
                    success: false,
                    message: 'Insumo no encontrado'
                });
            }
            if (isNaN(parseInt(cantidad)) || parseInt(cantidad) <= 0) { // Valida cantidad
                return res.status(400).json({ // 400
                    success: false,
                    message: 'La cantidad debe ser un número mayor a 0'
                });
            }
            const insumoActualizado = await this.insumoModel.descontarStock(id, cantidad); // Descuenta
            res.json({ // Éxito
                success: true,
                message: 'Stock descontado exitosamente',
                data: insumoActualizado
            });
        } catch (error) {
            console.error('Error en descontarStock:', error); // Log
            if (error.message === 'Stock insuficiente') { // Específico
                res.status(400).json({ // 400
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({ // 500
                    success: false,
                    message: 'Error al descontar el stock',
                    error: error.message
                });
            }
        }
    }

    async getAlertas(req, res) { // Obtiene alertas de stock: GET /alertas
        try {
            const alertas = await this.insumoModel.getAlertas(); // Llama modelo
            res.json({ // Éxito
                success: true,
                data: alertas,
                total: alertas.length
            });
        } catch (error) {
            console.error('Error en getAlertas:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al obtener alertas de stock',
                error: error.message
            });
        }
    }

    async delete(req, res) { // Elimina insumo: DELETE /:id
        try {
            const { id } = req.params; // ID
            const resultado = await this.insumoModel.delete(id); // Elimina
            res.json({ // Éxito
                success: true,
                message: 'Insumo eliminado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('Error en delete insumo:', error); // Log
            if (error.message === 'Insumo no encontrado') { // 404
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({ // 500
                    success: false,
                    message: 'Error al eliminar el insumo',
                    error: error.message
                });
            }
        }
    }
}

export default InsumosController; // Exporta