import TareaModel from '../models/Tarea.js';

class TareasController {
    constructor() {
        this.tareaModel = new TareaModel();
    }

    async getAll(req, res) {
        try {
            const filtros = req.query;
            const tareas = await this.tareaModel.filtrar(filtros);
            res.json({
                success: true,
                data: tareas,
                total: tareas.length
            });
        } catch (error) {
            console.error('Error en getAll tareas:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener las tareas',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const tarea = await this.tareaModel.getById(id);
            if (!tarea) {
                return res.status(404).json({
                    success: false,
                    message: 'Tarea no encontrada'
                });
            }
            res.json({
                success: true,
                data: tarea
            });
        } catch (error) {
            console.error('Error en getById tarea:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener la tarea',
                error: error.message
            });
        }
    }

    async getByArea(req, res) {
        try {
            const { area } = req.params;
            const areasValidas = ['gestion_pedidos', 'control_inventario'];
            if (!areasValidas.includes(area)) {
                return res.status(400).json({
                    success: false,
                    message: 'Área no válida. Use: gestion_pedidos, control_inventario'
                });
            }
            const tareas = await this.tareaModel.getByArea(area);
            res.json({
                success: true,
                data: tareas,
                area: area,
                total: tareas.length
            });
        } catch (error) {
            console.error('Error en getByArea:', error);
            res.status(500).json({
                success: false,
                message: 'Error al filtrar tareas por área',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const datosTarea = req.body;
            if (!datosTarea.titulo || !datosTarea.area) {
                return res.status(400).json({
                    success: false,
                    message: 'Título y área son obligatorios'
                });
            }
            const areasValidas = ['gestion_pedidos', 'control_inventario'];
            if (!areasValidas.includes(datosTarea.area)) {
                return res.status(400).json({
                    success: false,
                    message: 'Área no válida'
                });
            }
            const prioridadesValidas = ['alta', 'media', 'baja'];
            if (datosTarea.prioridad && !prioridadesValidas.includes(datosTarea.prioridad)) {
                return res.status(400).json({
                    success: false,
                    message: 'Prioridad no válida'
                });
            }
            const nuevaTarea = await this.tareaModel.create(datosTarea);
            res.status(201).json({
                success: true,
                message: 'Tarea creada exitosamente',
                data: nuevaTarea
            });
        } catch (error) {
            console.error('Error en create tarea:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear la tarea',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const datosActualizados = req.body;
            const tareaExistente = await this.tareaModel.getById(id);
            if (!tareaExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Tarea no encontrada'
                });
            }
            const tareaActualizada = await this.tareaModel.update(id, datosActualizados);
            res.json({
                success: true,
                message: 'Tarea actualizada exitosamente',
                data: tareaActualizada
            });
        } catch (error) {
            console.error('Error en update tarea:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar la tarea',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const resultado = await this.tareaModel.delete(id);
            if (!resultado) {
                return res.status(404).json({
                    success: false,
                    message: 'Tarea no encontrada'
                });
            }
            res.json({
                success: true,
                message: 'Tarea eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error en delete tarea:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar la tarea',
                error: error.message
            });
        }
    }
}

export default TareasController;