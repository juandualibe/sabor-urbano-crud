import TareaModel from '../models/Tarea.js';

class TareasController {
    constructor() {
        this.tareaModel = new TareaModel();
    }

    async getAll(req, res) {
        try {
            const tareas = await this.tareaModel.filtrar(req.query);
            res.json({ success: true, total: tareas.length, data: tareas });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener tareas', error: error.message });
        }
    }

    async getById(req, res) {
        try {
            const tarea = await this.tareaModel.getById(req.params.id);
            if (!tarea) return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
            res.json({ success: true, data: tarea });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener la tarea', error: error.message });
        }
    }

    async getByArea(req, res) {
        try {
            const tareas = await this.tareaModel.filtrar({ area: req.params.area });
            res.json({ success: true, total: tareas.length, data: tareas });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al filtrar por área', error: error.message });
        }
    }

    async create(req, res) {
        try {
            const nueva = await this.tareaModel.create(req.body);
            res.status(201).json({ success: true, message: 'Tarea creada', data: nueva });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al crear tarea', error: error.message });
        }
    }

    async update(req, res) {
        try {
            const actualizada = await this.tareaModel.update(req.params.id, req.body);
            res.json({ success: true, message: 'Tarea actualizada', data: actualizada });
        } catch (error) {
            if (error.message === 'Tarea no encontrada') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Error al actualizar tarea', error: error.message });
            }
        }
    }

    async iniciar(req, res) {
        try {
            const tarea = await this.tareaModel.iniciar(req.params.id);
            res.json({ success: true, message: 'Tarea iniciada', data: tarea });
        } catch (error) {
            if (error.message === 'Tarea no encontrada') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Error al iniciar tarea', error: error.message });
            }
        }
    }

    async finalizar(req, res) {
        try {
            const tarea = await this.tareaModel.finalizar(req.params.id);
            res.json({ success: true, message: 'Tarea finalizada', data: tarea });
        } catch (error) {
            if (error.message === 'Tarea no encontrada') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Error al finalizar tarea', error: error.message });
            }
        }
    }

    async delete(req, res) {
        try {
            const eliminada = await this.tareaModel.delete(req.params.id);
            res.json({ success: true, message: 'Tarea eliminada', data: eliminada });
        } catch (error) {
            if (error.message === 'Tarea no encontrada') {
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Error al eliminar tarea', error: error.message });
            }
        }
    }
}

export default TareasController;