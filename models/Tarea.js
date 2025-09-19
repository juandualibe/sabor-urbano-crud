import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

class Tarea {
    constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        this.filePath = join(__dirname, '../data/tareas.json');
    }

    async getAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            const json = JSON.parse(data);
            return json.tareas || [];
        } catch (error) {
            console.error('Error al leer tareas:', error);
            return [];
        }
    }

    async getById(id) {
        try {
            const tareas = await this.getAll();
            return tareas.find(tarea => tarea.id === parseInt(id));
        } catch (error) {
            console.error('Error al obtener tarea por ID:', error);
            return null;
        }
    }

    async getByEstado(estado) {
        try {
            const tareas = await this.getAll();
            return tareas.filter(tarea => tarea.estado === estado);
        } catch (error) {
            console.error('Error al filtrar por estado:', error);
            return [];
        }
    }

    async getByArea(area) {
        try {
            const tareas = await this.getAll();
            return tareas.filter(tarea => tarea.area === area);
        } catch (error) {
            console.error('Error al filtrar por área:', error);
            return [];
        }
    }

    async getByEmpleado(empleadoId) {
        try {
            const tareas = await this.getAll();
            return tareas.filter(tarea => tarea.empleadoAsignado === parseInt(empleadoId));
        } catch (error) {
            console.error('Error al filtrar por empleado:', error);
            return [];
        }
    }

    async filtrar(filtros) {
        try {
            let tareas = await this.getAll();
            if (filtros.estado) {
                tareas = tareas.filter(tarea => tarea.estado === filtros.estado);
            }
            if (filtros.prioridad) {
                tareas = tareas.filter(tarea => tarea.prioridad === filtros.prioridad);
            }
            if (filtros.area) {
                tareas = tareas.filter(tarea => tarea.area === filtros.area);
            }
            if (filtros.empleadoAsignado) {
                tareas = tareas.filter(tarea => tarea.empleadoAsignado === parseInt(filtros.empleadoAsignado));
            }
            if (filtros.fechaDesde) {
                tareas = tareas.filter(tarea => new Date(tarea.fechaCreacion) >= new Date(filtros.fechaDesde));
            }
            if (filtros.fechaHasta) {
                tareas = tareas.filter(tarea => new Date(tarea.fechaCreacion) <= new Date(filtros.fechaHasta));
            }
            if (filtros.tipoPedido && filtros.tipoPedido !== 'todos') {
                const { default: PedidoModel } = await import('./Pedido.js');
                const pedidoModel = new PedidoModel();
                const pedidos = await pedidoModel.getAll();
                const pedidosFiltrados = pedidos.filter(pedido => pedido.tipo === filtros.tipoPedido);
                const pedidosIds = pedidosFiltrados.map(p => p.id);
                tareas = tareas.filter(tarea => 
                    tarea.pedidoAsociado === null || pedidosIds.includes(tarea.pedidoAsociado)
                );
            }
            return tareas;
        } catch (error) {
            console.error('Error al filtrar tareas:', error);
            return [];
        }
    }

    async create(nuevaTarea) {
        try {
            const tareas = await this.getAll();
            const nuevoId = tareas.length > 0 ? Math.max(...tareas.map(t => t.id)) + 1 : 1;
            const tarea = {
                id: nuevoId,
                titulo: nuevaTarea.titulo,
                descripcion: nuevaTarea.descripcion,
                area: nuevaTarea.area,
                estado: 'pendiente',
                prioridad: nuevaTarea.prioridad || 'media',
                empleadoAsignado: parseInt(nuevaTarea.empleadoAsignado) || null,
                pedidoAsociado: parseInt(nuevaTarea.pedidoAsociado) || null,
                fechaCreacion: new Date().toISOString(),
                fechaInicio: null,
                fechaFinalizacion: null,
                observaciones: nuevaTarea.observaciones || ''
            };
            tareas.push(tarea);
            await this.saveAll(tareas);
            return tarea;
        } catch (error) {
            console.error('Error al crear tarea:', error);
            throw error;
        }
    }

    async update(id, datosActualizados) {
        try {
            const tareas = await this.getAll();
            const index = tareas.findIndex(tarea => tarea.id === parseInt(id));
            if (index === -1) {
                throw new Error('Tarea no encontrada');
            }
            if (datosActualizados.estado === 'en_proceso' && !tareas[index].fechaInicio) {
                datosActualizados.fechaInicio = new Date().toISOString();
            }
            if (datosActualizados.estado === 'finalizada' && !tareas[index].fechaFinalizacion) {
                datosActualizados.fechaFinalizacion = new Date().toISOString();
            }
            tareas[index] = { ...tareas[index], ...datosActualizados };
            await this.saveAll(tareas);
            return tareas[index];
        } catch (error) {
            console.error('Error al actualizar tarea:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const tareas = await this.getAll();
            const tareasFiltradas = tareas.filter(tarea => tarea.id !== parseInt(id));
            if (tareas.length === tareasFiltradas.length) {
                throw new Error('Tarea no encontrada');
            }
            await this.saveAll(tareasFiltradas);
            return true;
        } catch (error) {
            console.error('Error al eliminar tarea:', error);
            throw error;
        }
    }

    async saveAll(tareas) {
        try {
            const data = JSON.stringify({ tareas }, null, 2);
            await fs.writeFile(this.filePath, data, 'utf8');
        } catch (error) {
            console.error('Error al guardar tareas:', error);
            throw error;
        }
    }
}

export default Tarea;