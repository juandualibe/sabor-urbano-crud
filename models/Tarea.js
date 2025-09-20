import { promises as fs } from 'fs'; // I/O asíncrono
import { join, dirname } from 'path'; // Rutas
import { fileURLToPath } from 'url'; // Ruta actual

class Tarea {
    constructor() { // Inicializa ruta al JSON de tareas
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        this.filePath = join(__dirname, '../data/tareas.json');
    }

    async getAll() { // Obtiene todas las tareas
        try {
            const data = await fs.readFile(this.filePath, 'utf8'); // Lee
            const json = JSON.parse(data); // Parsea
            return json.tareas || []; // Array o vacío
        } catch (error) {
            console.error('Error al leer tareas:', error); // Log
            return []; // Vacío
        }
    }

    async saveAll(tareas) { // Guarda array de tareas
        try {
            const data = { tareas }; // Objeto con array
            await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8'); // Escribe formateado
        } catch (error) {
            console.error('Error al guardar tareas:', error); // Log
            throw error; // Relanza
        }
    }

    async getById(id) { // Obtiene tarea por ID
        const tareas = await this.getAll(); // Todas
        return tareas.find(t => t.id === parseInt(id)); // Encuentra o undefined
    }

    async filtrar(filtros) { // Aplica filtros múltiples a las tareas
        let tareas = await this.getAll(); // Todas inicial

        if (filtros.estado) tareas = tareas.filter(t => t.estado === filtros.estado); // Filtra por estado
        if (filtros.prioridad) tareas = tareas.filter(t => t.prioridad === filtros.prioridad); // Por prioridad
        if (filtros.area) tareas = tareas.filter(t => t.area === filtros.area); // Por área
        if (filtros.empleadoAsignado) tareas = tareas.filter(t => t.empleadoAsignado === parseInt(filtros.empleadoAsignado)); // Por empleado (entero)

        // Fechas creación
        if (filtros.fechaDesde) { // Desde fecha creación
            tareas = tareas.filter(t => new Date(t.fechaCreacion) >= new Date(filtros.fechaDesde));
        }
        if (filtros.fechaHasta) { // Hasta fecha creación
            tareas = tareas.filter(t => new Date(t.fechaCreacion) <= new Date(filtros.fechaHasta));
        }

        // Fechas de inicio
        if (filtros.fechaInicioDesde) { // Desde fecha inicio (si existe)
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
        if ((filtros.tipoPedido && filtros.tipoPedido !== 'todos') || filtros.plataforma) { // Si hay filtro de pedido
            const { default: PedidoModel } = await import('./Pedido.js'); // Importa dinámico Pedido
            const pedidoModel = new PedidoModel(); // Instancia
            const pedidos = await pedidoModel.getAll(); // Todos pedidos
            let pedidosFiltrados = pedidos; // Inicial

            if (filtros.tipoPedido && filtros.tipoPedido !== 'todos') { // Filtra tipo
                pedidosFiltrados = pedidosFiltrados.filter(p => p.tipo === filtros.tipoPedido);
            }
            if (filtros.plataforma) { // Filtra plataforma
                pedidosFiltrados = pedidosFiltrados.filter(p => p.plataforma === filtros.plataforma);
            }

            const pedidosIds = new Set(pedidosFiltrados.map(p => p.id)); // Set de IDs filtrados
            tareas = tareas.filter(t => // Filtra tareas asociadas a esos pedidos o sin asociación
                t.pedidoAsociado === null ||
                pedidosIds.has(t.pedidoAsociado)
            );
        }

        return tareas; // Retorna filtradas
    }

    async create(datos) { // Crea nueva tarea
        const tareas = await this.getAll(); // Todas
        const nuevoId = tareas.length > 0 ? Math.max(...tareas.map(t => t.id)) + 1 : 1; // Nuevo ID

        const tarea = { // Objeto nuevo
            id: nuevoId,
            titulo: datos.titulo, // Título requerido
            descripcion: datos.descripcion || '', // Descripción opcional
            area: datos.area, // Área
            estado: datos.estado || 'pendiente', // Estado default pendiente
            prioridad: datos.prioridad || 'media', // Prioridad default media
            empleadoAsignado: datos.empleadoAsignado ? parseInt(datos.empleadoAsignado) : null, // Empleado opcional
            pedidoAsociado: datos.pedidoAsociado ? parseInt(datos.pedidoAsociado) : null, // Pedido opcional
            observaciones: datos.observaciones || '', // Observaciones
            fechaCreacion: new Date().toISOString(), // Fecha creación
            fechaInicio: null, // Inicial null
            fechaFinalizacion: null // Inicial null
        };

        tareas.push(tarea); // Agrega
        await this.saveAll(tareas); // Guarda
        return tarea; // Retorna
    }

    async update(id, datos) { // Actualiza tarea por ID
        const tareas = await this.getAll(); // Todas
        const index = tareas.findIndex(t => t.id === parseInt(id)); // Índice
        if (index === -1) throw new Error('Tarea no encontrada'); // Error si no

        tareas[index] = { // Actualiza fusionando con campos limpios
            ...tareas[index],
            ...this._limpiarCamposActualizacion(datos) // Usa método privado para limpiar
        };
        await this.saveAll(tareas); // Guarda
        return tareas[index]; // Retorna actualizada
    }

    _limpiarCamposActualizacion(datos) { // Privado: filtra solo campos permitidos para update
        const permitidos = ['titulo', 'descripcion', 'area', 'estado', 'prioridad', 'empleadoAsignado', 'pedidoAsociado', 'observaciones']; // Lista permitida
        const limpio = {}; // Objeto resultante
        for (const k of permitidos) { // Para cada campo
            if (datos[k] !== undefined) { // Si se proporciona
                if (['empleadoAsignado', 'pedidoAsociado'].includes(k) && datos[k] !== null) { // Si es ID y no null
                    limpio[k] = parseInt(datos[k]); // Convierte a entero
                } else {
                    limpio[k] = datos[k]; // Copia directo
                }
            }
        }
        return limpio; // Retorna limpio
    }

    async iniciar(id) { // Inicia tarea (setea fecha inicio y estado en_proceso)
        const tareas = await this.getAll(); // Todas
        const index = tareas.findIndex(t => t.id === parseInt(id)); // Índice
        if (index === -1) throw new Error('Tarea no encontrada'); // Error
        if (!tareas[index].fechaInicio) { // Si no tiene fecha inicio
            tareas[index].fechaInicio = new Date().toISOString(); // Setea ahora
        }
        tareas[index].estado = 'en_proceso'; // Cambia estado
        await this.saveAll(tareas); // Guarda
        return tareas[index]; // Retorna
    }

    async finalizar(id) { // Finaliza tarea (setea fecha fin y estado finalizada)
        const tareas = await this.getAll(); // Todas
        const index = tareas.findIndex(t => t.id === parseInt(id)); // Índice
        if (index === -1) throw new Error('Tarea no encontrada'); // Error
        if (!tareas[index].fechaInicio) { // Fallback si no inició
            tareas[index].fechaInicio = new Date().toISOString();
        }
        tareas[index].fechaFinalizacion = new Date().toISOString(); // Setea fin
        tareas[index].estado = 'finalizada'; // Estado final
        await this.saveAll(tareas); // Guarda
        return tareas[index]; // Retorna
    }

    async delete(id) { // Elimina tarea por ID
        const tareas = await this.getAll(); // Todas
        const index = tareas.findIndex(t => t.id === parseInt(id)); // Índice
        if (index === -1) throw new Error('Tarea no encontrada'); // Error
        const eliminada = tareas.splice(index, 1)[0]; // Elimina y guarda referencia
        await this.saveAll(tareas); // Guarda
        return eliminada; // Retorna eliminada
    }
}

export default Tarea; // Exporta