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

    async saveAll(tareas) {
        try {
            const data = { tareas };
            await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8');
        } catch (error) {
            console.error('Error al guardar tareas:', error);
            throw error;
        }
    }

    async getById(id) {
        const tareas = await this.getAll();
        return tareas.find(t => t.id === parseInt(id));
    }

    async filtrar(filtros) {
        let tareas = await this.getAll();

        if (filtros.estado) tareas = tareas.filter(t => t.estado === filtros.estado);
        if (filtros.prioridad) tareas = tareas.filter(t => t.prioridad === filtros.prioridad);
        if (filtros.area) tareas = tareas.filter(t => t.area === filtros.area);
        if (filtros.empleadoAsignado) tareas = tareas.filter(t => t.empleadoAsignado === parseInt(filtros.empleadoAsignado));

        // Fechas creación
        if (filtros.fechaDesde) {
            tareas = tareas.filter(t => new Date(t.fechaCreacion) >= new Date(filtros.fechaDesde));
        }
        if (filtros.fechaHasta) {
            tareas = tareas.filter(t => new Date(t.fechaCreacion) <= new Date(filtros.fechaHasta));
        }

        // Fechas de inicio
        if (filtros.fechaInicioDesde) {
            tareas = tareas.filter(t => t.fechaInicio && new Date(t.fechaInicio) >= new Date(filtros.fechaInicioDesde));
        }
        if (filtros.fechaInicioHasta) {
            tareas = tareas.filter(t => t.fechaInicio && new Date(t.fechaInicio) <= new Date(filtros.fechaInicioHasta));
        }

        // Fechas de finalización
        if (filtros.fechaFinDesde) {
            tareas = tareas.filter(t => t.fechaFinalizacion && new Date(t.fechaFinalizacion) >= new Date(filtros.fechaFinDesde));
        }
        if (filtros.fechaFinHasta) {
            tareas = tareas.filter(t => t.fechaFinalizacion && new Date(t.fechaFinalizacion) <= new Date(filtros.fechaFinHasta));
        }

        // Filtro por tipoPedido/plataforma a través del pedido asociado
        if ((filtros.tipoPedido && filtros.tipoPedido !== 'todos') || filtros.plataforma) {
            const { default: PedidoModel } = await import('./Pedido.js');
            const pedidoModel = new PedidoModel();
            const pedidos = await pedidoModel.getAll();
            let pedidosFiltrados = pedidos;

            if (filtros.tipoPedido && filtros.tipoPedido !== 'todos') {
                pedidosFiltrados = pedidosFiltrados.filter(p => p.tipo === filtros.tipoPedido);
            }
            if (filtros.plataforma) {
                pedidosFiltrados = pedidosFiltrados.filter(p => p.plataforma === filtros.plataforma);
            }

            const pedidosIds = new Set(pedidosFiltrados.map(p => p.id));
            tareas = tareas.filter(t =>
                t.pedidoAsociado === null ||
                pedidosIds.has(t.pedidoAsociado)
            );
        }

        return tareas;
    }

    async create(datos) {
        const tareas = await this.getAll();
        const nuevoId = tareas.length > 0 ? Math.max(...tareas.map(t => t.id)) + 1 : 1;

        const tarea = {
            id: nuevoId,
            titulo: datos.titulo,
            descripcion: datos.descripcion || '',
            area: datos.area,
            estado: datos.estado || 'pendiente',
            prioridad: datos.prioridad || 'media',
            empleadoAsignado: datos.empleadoAsignado ? parseInt(datos.empleadoAsignado) : null,
            pedidoAsociado: datos.pedidoAsociado ? parseInt(datos.pedidoAsociado) : null,
            observaciones: datos.observaciones || '',
            fechaCreacion: new Date().toISOString(),
            fechaInicio: null,
            fechaFinalizacion: null
        };

        tareas.push(tarea);
        await this.saveAll(tareas);
        return tarea;
    }

    async update(id, datos) {
        const tareas = await this.getAll();
        const index = tareas.findIndex(t => t.id === parseInt(id));
        if (index === -1) throw new Error('Tarea no encontrada');

        tareas[index] = {
            ...tareas[index],
            ...this._limpiarCamposActualizacion(datos)
        };
        await this.saveAll(tareas);
        return tareas[index];
    }

    _limpiarCamposActualizacion(datos) {
        const permitidos = ['titulo', 'descripcion', 'area', 'estado', 'prioridad', 'empleadoAsignado', 'pedidoAsociado', 'observaciones'];
        const limpio = {};
        for (const k of permitidos) {
            if (datos[k] !== undefined) {
                if (['empleadoAsignado', 'pedidoAsociado'].includes(k) && datos[k] !== null) {
                    limpio[k] = parseInt(datos[k]);
                } else {
                    limpio[k] = datos[k];
                }
            }
        }
        return limpio;
    }

    async iniciar(id) {
        const tareas = await this.getAll();
        const index = tareas.findIndex(t => t.id === parseInt(id));
        if (index === -1) throw new Error('Tarea no encontrada');
        if (!tareas[index].fechaInicio) {
            tareas[index].fechaInicio = new Date().toISOString();
        }
        tareas[index].estado = 'en_proceso';
        await this.saveAll(tareas);
        return tareas[index];
    }

    async finalizar(id) {
        const tareas = await this.getAll();
        const index = tareas.findIndex(t => t.id === parseInt(id));
        if (index === -1) throw new Error('Tarea no encontrada');
        if (!tareas[index].fechaInicio) {
            tareas[index].fechaInicio = new Date().toISOString(); // fallback si alguien finaliza sin iniciar
        }
        tareas[index].fechaFinalizacion = new Date().toISOString();
        tareas[index].estado = 'finalizada';
        await this.saveAll(tareas);
        return tareas[index];
    }

    async delete(id) {
        const tareas = await this.getAll();
        const index = tareas.findIndex(t => t.id === parseInt(id));
        if (index === -1) throw new Error('Tarea no encontrada');
        const eliminada = tareas.splice(index, 1)[0];
        await this.saveAll(tareas);
        return eliminada;
    }
}

export default Tarea;