import TareaModel from '../models/Tarea.js'; // Importa modelo Tarea

class TareasController { // Controlador para tareas
    constructor() { // Inicializa
        this.tareaModel = new TareaModel(); // Instancia modelo
    }

    async getAll(req, res) { // Todas con filtros: GET /?filtros=...
        try {
            const tareas = await this.tareaModel.filtrar(req.query); // Aplica filtros del query al modelo
            res.json({ success: true, total: tareas.length, data: tareas }); // Éxito con conteo
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener tareas', error: error.message }); // 500
        }
    }

    async getById(req, res) { // Por ID: GET /:id
        try {
            const tarea = await this.tareaModel.getById(req.params.id); // Busca
            if (!tarea) return res.status(404).json({ success: false, message: 'Tarea no encontrada' }); // 404
            res.json({ success: true, data: tarea }); // Éxito
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al obtener la tarea', error: error.message }); // 500
        }
    }

    async getByArea(req, res) { // Por área: GET /area/:area (usa filtrar internamente)
        try {
            const tareas = await this.tareaModel.filtrar({ area: req.params.area }); // Filtra por área
            res.json({ success: true, total: tareas.length, data: tareas }); // Éxito
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al filtrar por área', error: error.message }); // 500
        }
    }

    async create(req, res) { // Crea: POST /
        try {
            const nueva = await this.tareaModel.create(req.body); // Crea con body
            res.status(201).json({ success: true, message: 'Tarea creada', data: nueva }); // 201
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error al crear tarea', error: error.message }); // 500
        }
    }

    async update(req, res) { // Actualiza: PUT /:id
        try {
            const actualizada = await this.tareaModel.update(req.params.id, req.body); // Actualiza
            res.json({ success: true, message: 'Tarea actualizada', data: actualizada }); // Éxito
        } catch (error) {
            if (error.message === 'Tarea no encontrada') { // 404
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Error al actualizar tarea', error: error.message }); // 500
            }
        }
    }

    async iniciar(req, res) { // Inicia tarea: PATCH /:id/iniciar
        try {
            const tarea = await this.tareaModel.iniciar(req.params.id); // Cambia estado a en_proceso
            res.json({ success: true, message: 'Tarea iniciada', data: tarea }); // Éxito
        } catch (error) {
            if (error.message === 'Tarea no encontrada') { // 404
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Error al iniciar tarea', error: error.message }); // 500
            }
        }
    }

    async finalizar(req, res) { // Finaliza: PATCH /:id/finalizar
        try {
            const tarea = await this.tareaModel.finalizar(req.params.id); // Cambia a finalizada
            res.json({ success: true, message: 'Tarea finalizada', data: tarea }); // Éxito
        } catch (error) {
            if (error.message === 'Tarea no encontrada') { // 404
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Error al finalizar tarea', error: error.message }); // 500
            }
        }
    }

    async delete(req, res) { // Elimina: DELETE /:id
        try {
            const eliminada = await this.tareaModel.delete(req.params.id); // Elimina
            res.json({ success: true, message: 'Tarea eliminada', data: eliminada }); // Éxito
        } catch (error) {
            if (error.message === 'Tarea no encontrada') { // 404
                res.status(404).json({ success: false, message: error.message });
            } else {
                res.status(500).json({ success: false, message: 'Error al eliminar tarea', error: error.message }); // 500
            }
        }
    }
}

export default TareasController; // Exporta