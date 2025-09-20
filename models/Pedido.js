import { promises as fs } from 'fs'; // Promesas para I/O archivos
import { join, dirname } from 'path'; // Manejo de rutas
import { fileURLToPath } from 'url'; // Ruta actual
import Cliente from './Cliente.js'; // Importa modelo Cliente para consultas

class Pedido {
    constructor() { // Constructor inicializa ruta y modelo cliente
        const __filename = fileURLToPath(import.meta.url); // Archivo actual
        const __dirname = dirname(__filename); // Directorio
        this.filePath = join(__dirname, '../data/pedidos.json'); // Ruta JSON pedidos
        this.clienteModel = new Cliente(); // Instancia para acceder a clientes
    }

    async getAll() { // Obtiene todos los pedidos, mapeando cliente a string (nombre completo)
        try {
            const data = await fs.readFile(this.filePath, 'utf8'); // Lee JSON
            const json = JSON.parse(data); // Parsea
            const pedidos = json.pedidos || []; // Array o vacío
            const clientes = await this.clienteModel.getAll(); // Obtiene todos clientes

            // Mapear pedidos para incluir cliente como string (nombre completo)
            return pedidos.map(pedido => ({ // Para cada pedido, crea objeto con cliente como string
                ...pedido, // Copia propiedades originales
                cliente: pedido.clienteId // Si tiene clienteId
                    ? (clientes.find(c => c.id === parseInt(pedido.clienteId)) // Busca cliente
                        ? `${clientes.find(c => c.id === parseInt(pedido.clienteId)).nombre} ${clientes.find(c => c.id === parseInt(pedido.clienteId)).apellido}` // Nombre completo
                        : 'Cliente desconocido') // Si no, desconocido
                    : (typeof pedido.cliente === 'string' // Maneja casos viejos con cliente string
                        ? pedido.cliente
                        : 'Cliente no especificado') // O no especificado
            }));
        } catch (error) {
            console.error('Error al leer pedidos:', error); // Log
            return []; // Vacío
        }
    }

    async getById(id) { // Obtiene pedido por ID, usando getAll para mapeo cliente
        try {
            const pedidos = await this.getAll(); // Reusamos getAll para incluir cliente como string
            return pedidos.find(pedido => pedido.id === parseInt(id)) || null; // Encuentra o null
        } catch (error) {
            console.error('Error al obtener pedido por ID:', error); // Log
            return null;
        }
    }

    async getByTipo(tipo) { // Filtra pedidos por tipo (presencial/delivery)
        try {
            const pedidos = await this.getAll(); // Todos mapeados
            return pedidos.filter(pedido => pedido.tipo === tipo); // Filtra
        } catch (error) {
            console.error('Error al filtrar por tipo:', error); // Log
            return [];
        }
    }

    async getByPlataforma(plataforma) { // Filtra por plataforma (rappi, etc.)
        try {
            const pedidos = await this.getAll(); // Todos
            return pedidos.filter(pedido => pedido.plataforma === plataforma); // Filtra
        } catch (error) {
            console.error('Error al filtrar por plataforma:', error); // Log
            return [];
        }
    }

    async getByEstado(estado) { // Filtra por estado (pendiente, etc.)
        try {
            const pedidos = await this.getAll(); // Todos
            return pedidos.filter(pedido => pedido.estado === estado); // Filtra
        } catch (error) {
            console.error('Error al filtrar por estado:', error); // Log
            return [];
        }
    }

    async create(nuevoPedido) { // Crea nuevo pedido
        try {
            // Leemos el JSON crudo para evitar el mapeo de cliente
            const data = await fs.readFile(this.filePath, 'utf8'); // Lee crudo
            const pedidos = JSON.parse(data).pedidos || []; // Array crudo
            const nuevoId = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1; // Nuevo ID
            const pedido = { // Objeto crudo (usa clienteId)
                id: nuevoId,
                numeroOrden: nuevoPedido.numeroOrden || `ORD-${nuevoId.toString().padStart(3, '0')}`, // Número orden formateado
                clienteId: parseInt(nuevoPedido.clienteId), // ID cliente como entero
                items: nuevoPedido.items, // Items del pedido
                total: nuevoPedido.total, // Total
                tipo: nuevoPedido.tipo, // Tipo
                plataforma: nuevoPedido.plataforma, // Plataforma
                estado: nuevoPedido.estado || 'pendiente', // Estado, pendiente por defecto
                fechaCreacion: new Date().toISOString(), // Fecha creación
                tiempoEstimado: nuevoPedido.tiempoEstimado || 30, // Tiempo estimado, 30 min default
                observaciones: nuevoPedido.observaciones || '' // Observaciones, vacío default
            };
            pedidos.push(pedido); // Agrega
            await this.saveAll(pedidos); // Guarda crudo

            // Retornamos con cliente como string para la vista
            const cliente = await this.clienteModel.getById(pedido.clienteId); // Obtiene cliente
            return { // Retorna mapeado
                ...pedido,
                cliente: cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente desconocido'
            };
        } catch (error) {
            console.error('Error al crear pedido:', error); // Log
            throw error;
        }
    }

    async update(id, datosActualizados) { // Actualiza pedido por ID
        try {
            // Leemos el JSON crudo
            const data = await fs.readFile(this.filePath, 'utf8'); // Crudo
            const pedidos = JSON.parse(data).pedidos || []; // Array
            const index = pedidos.findIndex(pedido => pedido.id === parseInt(id)); // Índice
            if (index === -1) { // No encontrado
                throw new Error('Pedido no encontrado');
            }
            // Parseamos clienteId si viene
            if (datosActualizados.clienteId) { // Si nuevo clienteId
                datosActualizados.clienteId = parseInt(datosActualizados.clienteId); // A entero
            }
            // Eliminamos cliente si existe, ya que usamos clienteId
            delete datosActualizados.cliente; // Limpia propiedad cliente
            pedidos[index] = { ...pedidos[index], ...datosActualizados }; // Fusiona
            await this.saveAll(pedidos); // Guarda crudo

            // Retornamos con cliente como string
            const cliente = await this.clienteModel.getById(pedidos[index].clienteId); // Obtiene cliente
            return { // Mapea
                ...pedidos[index],
                cliente: cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente desconocido'
            };
        } catch (error) {
            console.error('Error al actualizar pedido:', error); // Log
            throw error;
        }
    }

    async delete(id) { // Elimina pedido por ID
        try {
            const pedidos = await this.getAll(); // Todos mapeados (pero usamos para contar)
            const pedidosFiltrados = pedidos.filter(pedido => pedido.id !== parseInt(id)); // Filtra
            if (pedidos.length === pedidosFiltrados.length) { // No se eliminó
                throw new Error('Pedido no encontrado');
            }
            // Guardamos el JSON crudo (sin cliente mapeado)
            await this.saveAll(pedidosFiltrados.map(p => ({ // Mapea a crudo, extrayendo clienteId
                ...p,
                clienteId: p.clienteId || (typeof p.cliente === 'string' ? undefined : p.cliente?.id) // Maneja casos viejos
            })));
            return true; // Confirma
        } catch (error) {
            console.error('Error al eliminar pedido:', error); // Log
            throw error;
        }
    }

    async saveAll(pedidos) { // Guarda array crudo en JSON
        try {
            const data = JSON.stringify({ pedidos }, null, 2); // Formatea
            await fs.writeFile(this.filePath, data, 'utf8'); // Escribe
        } catch (error) {
            console.error('Error al guardar pedidos:', error); // Log
            throw error;
        }
    }
}

export default Pedido; // Exporta