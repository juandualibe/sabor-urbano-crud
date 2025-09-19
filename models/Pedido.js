import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import Cliente from './Cliente.js'; // Importamos el modelo Cliente

class Pedido {
    constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        this.filePath = join(__dirname, '../data/pedidos.json');
        this.clienteModel = new Cliente(); // Instancia del modelo Cliente
    }

    async getAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            const json = JSON.parse(data);
            const pedidos = json.pedidos || [];
            const clientes = await this.clienteModel.getAll();

            // Mapear pedidos para incluir cliente como string (nombre completo)
            return pedidos.map(pedido => ({
                ...pedido,
                cliente: pedido.clienteId
                    ? (clientes.find(c => c.id === parseInt(pedido.clienteId))
                        ? `${clientes.find(c => c.id === parseInt(pedido.clienteId)).nombre} ${clientes.find(c => c.id === parseInt(pedido.clienteId)).apellido}`
                        : 'Cliente desconocido')
                    : (typeof pedido.cliente === 'string'
                        ? pedido.cliente
                        : 'Cliente no especificado') // Maneja casos antiguos con cliente como string u objeto
            }));
        } catch (error) {
            console.error('Error al leer pedidos:', error);
            return [];
        }
    }

    async getById(id) {
        try {
            const pedidos = await this.getAll(); // Reusamos getAll para incluir cliente como string
            return pedidos.find(pedido => pedido.id === parseInt(id)) || null;
        } catch (error) {
            console.error('Error al obtener pedido por ID:', error);
            return null;
        }
    }

    async getByTipo(tipo) {
        try {
            const pedidos = await this.getAll();
            return pedidos.filter(pedido => pedido.tipo === tipo);
        } catch (error) {
            console.error('Error al filtrar por tipo:', error);
            return [];
        }
    }

    async getByPlataforma(plataforma) {
        try {
            const pedidos = await this.getAll();
            return pedidos.filter(pedido => pedido.plataforma === plataforma);
        } catch (error) {
            console.error('Error al filtrar por plataforma:', error);
            return [];
        }
    }

    async getByEstado(estado) {
        try {
            const pedidos = await this.getAll();
            return pedidos.filter(pedido => pedido.estado === estado);
        } catch (error) {
            console.error('Error al filtrar por estado:', error);
            return [];
        }
    }

    async create(nuevoPedido) {
        try {
            // Leemos el JSON crudo para evitar el mapeo de cliente
            const data = await fs.readFile(this.filePath, 'utf8');
            const pedidos = JSON.parse(data).pedidos || [];
            const nuevoId = pedidos.length > 0 ? Math.max(...pedidos.map(p => p.id)) + 1 : 1;
            const pedido = {
                id: nuevoId,
                numeroOrden: nuevoPedido.numeroOrden || `ORD-${nuevoId.toString().padStart(3, '0')}`,
                clienteId: parseInt(nuevoPedido.clienteId), // Usamos clienteId (número)
                items: nuevoPedido.items,
                total: nuevoPedido.total,
                tipo: nuevoPedido.tipo,
                plataforma: nuevoPedido.plataforma,
                estado: nuevoPedido.estado || 'pendiente',
                fechaCreacion: new Date().toISOString(),
                tiempoEstimado: nuevoPedido.tiempoEstimado || 30,
                observaciones: nuevoPedido.observaciones || ''
            };
            pedidos.push(pedido);
            await this.saveAll(pedidos);

            // Retornamos con cliente como string para la vista
            const cliente = await this.clienteModel.getById(pedido.clienteId);
            return {
                ...pedido,
                cliente: cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente desconocido'
            };
        } catch (error) {
            console.error('Error al crear pedido:', error);
            throw error;
        }
    }

    async update(id, datosActualizados) {
        try {
            // Leemos el JSON crudo
            const data = await fs.readFile(this.filePath, 'utf8');
            const pedidos = JSON.parse(data).pedidos || [];
            const index = pedidos.findIndex(pedido => pedido.id === parseInt(id));
            if (index === -1) {
                throw new Error('Pedido no encontrado');
            }
            // Parseamos clienteId si viene
            if (datosActualizados.clienteId) {
                datosActualizados.clienteId = parseInt(datosActualizados.clienteId);
            }
            // Eliminamos cliente si existe, ya que usamos clienteId
            delete datosActualizados.cliente;
            pedidos[index] = { ...pedidos[index], ...datosActualizados };
            await this.saveAll(pedidos);

            // Retornamos con cliente como string
            const cliente = await this.clienteModel.getById(pedidos[index].clienteId);
            return {
                ...pedidos[index],
                cliente: cliente ? `${cliente.nombre} ${cliente.apellido}` : 'Cliente desconocido'
            };
        } catch (error) {
            console.error('Error al actualizar pedido:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const pedidos = await this.getAll();
            const pedidosFiltrados = pedidos.filter(pedido => pedido.id !== parseInt(id));
            if (pedidos.length === pedidosFiltrados.length) {
                throw new Error('Pedido no encontrado');
            }
            // Guardamos el JSON crudo (sin cliente mapeado)
            await this.saveAll(pedidosFiltrados.map(p => ({
                ...p,
                clienteId: p.clienteId || (typeof p.cliente === 'string' ? undefined : p.cliente?.id)
            })));
            return true;
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            throw error;
        }
    }

    async saveAll(pedidos) {
        try {
            const data = JSON.stringify({ pedidos }, null, 2);
            await fs.writeFile(this.filePath, data, 'utf8');
        } catch (error) {
            console.error('Error al guardar pedidos:', error);
            throw error;
        }
    }
}

export default Pedido;