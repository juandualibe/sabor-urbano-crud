import PedidoModel from '../models/Pedido.js';
import ClienteModel from '../models/Cliente.js';

class PedidosController {
    constructor() {
        this.pedidoModel = new PedidoModel();
        this.clienteModel = new ClienteModel(); // Instancia de Cliente
    }

    async getAll(req, res) {
        try {
            const pedidos = await this.pedidoModel.getAll();
            res.json({
                success: true,
                data: pedidos,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Error en getAll pedidos:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los pedidos',
                error: error.message
            });
        }
    }

    async getById(req, res) {
        try {
            const { id } = req.params;
            const pedido = await this.pedidoModel.getById(id);
            if (!pedido) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }
            res.json({
                success: true,
                data: pedido
            });
        } catch (error) {
            console.error('Error en getById pedido:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener el pedido',
                error: error.message
            });
        }
    }

    async getByTipo(req, res) {
        try {
            const { tipo } = req.params;
            const tiposValidos = ['presencial', 'delivery'];
            if (!tiposValidos.includes(tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo no válido. Use: presencial, delivery'
                });
            }
            const pedidos = await this.pedidoModel.getByTipo(tipo);
            res.json({
                success: true,
                data: pedidos,
                tipo: tipo,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Error en getByTipo:', error);
            res.status(500).json({
                success: false,
                message: 'Error al filtrar pedidos por tipo',
                error: error.message
            });
        }
    }

    async getByPlataforma(req, res) {
        try {
            const { plataforma } = req.params;
            const plataformasValidas = ['rappi', 'pedidosya', 'propia', 'local'];
            if (!plataformasValidas.includes(plataforma)) {
                return res.status(400).json({
                    success: false,
                    message: 'Plataforma no válida. Use: rappi, pedidosya, propia, local'
                });
            }
            const pedidos = await this.pedidoModel.getByPlataforma(plataforma);
            res.json({
                success: true,
                data: pedidos,
                plataforma: plataforma,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Error en getByPlataforma:', error);
            res.status(500).json({
                success: false,
                message: 'Error al filtrar pedidos por plataforma',
                error: error.message
            });
        }
    }

    async getByEstado(req, res) {
        try {
            const { estado } = req.params;
            const estadosValidos = ['pendiente', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'finalizado'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado no válido. Use: pendiente, en_preparacion, listo, en_camino, entregado, finalizado'
                });
            }
            const pedidos = await this.pedidoModel.getByEstado(estado);
            res.json({
                success: true,
                data: pedidos,
                estado: estado,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Error en getByEstado:', error);
            res.status(500).json({
                success: false,
                message: 'Error al filtrar pedidos por estado',
                error: error.message
            });
        }
    }

    async create(req, res) {
        try {
            const datosPedido = req.body;
            // Validar campos requeridos
            if (!datosPedido.clienteId || !datosPedido.itemsText || !datosPedido.total || !datosPedido.tipo || !datosPedido.plataforma) {
                return res.status(400).json({
                    success: false,
                    message: 'Campos requeridos faltantes: clienteId, itemsText, total, tipo, plataforma'
                });
            }
            // Parsear itemsText en un array de ítems
            const itemsText = datosPedido.itemsText.trim();
            const items = [];
            const itemLines = itemsText.split(',').map(line => line.trim());
            let totalItems = 0;
            for (const line of itemLines) {
                const match = line.match(/^(\d+)\s+(.+)/);
                if (match) {
                    const cantidad = parseInt(match[1]);
                    const producto = match[2];
                    items.push({ producto, cantidad });
                    totalItems += cantidad;
                } else {
                    items.push({ producto: line, cantidad: 1 });
                    totalItems += 1;
                }
            }
            // Asignar precio proporcional basado en el total
            const total = parseFloat(datosPedido.total);
            if (totalItems > 0) {
                const precioPorItem = total / totalItems;
                items.forEach(item => {
                    item.precio = precioPorItem * item.cantidad;
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar al menos un ítem'
                });
            }
            datosPedido.items = items;
            delete datosPedido.itemsText; // Eliminamos itemsText del objeto

            // Validar clienteId
            const cliente = await this.clienteModel.getById(datosPedido.clienteId);
            if (!cliente) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            const tiposValidos = ['presencial', 'delivery'];
            if (!tiposValidos.includes(datosPedido.tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo no válido'
                });
            }
            const plataformasValidas = ['rappi', 'pedidosya', 'propia', 'local'];
            if (!plataformasValidas.includes(datosPedido.plataforma)) {
                return res.status(400).json({
                    success: false,
                    message: 'Plataforma no válida'
                });
            }
            const nuevoPedido = await this.pedidoModel.create(datosPedido);
            res.status(201).json({
                success: true,
                message: 'Pedido creado exitosamente',
                data: nuevoPedido
            });
        } catch (error) {
            console.error('Error en create pedido:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear el pedido',
                error: error.message
            });
        }
    }

    async update(req, res) {
        try {
            const { id } = req.params;
            const datosActualizados = req.body;

            // Validar campos requeridos individualmente
            const missingFields = [];
            if (!datosActualizados.clienteId) missingFields.push('clienteId');
            if (!datosActualizados.itemsText) missingFields.push('itemsText');
            if (!datosActualizados.total) missingFields.push('total');
            if (!datosActualizados.tipo) missingFields.push('tipo');
            if (!datosActualizados.plataforma) missingFields.push('plataforma');
            if (missingFields.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
                });
            }

            // Validar clienteId
            const cliente = await this.clienteModel.getById(datosActualizados.clienteId);
            if (!cliente) {
                return res.status(400).json({
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            // Parsear itemsText en un array de ítems
            const itemsText = datosActualizados.itemsText.trim();
            if (!itemsText) {
                return res.status(400).json({
                    success: false,
                    message: 'El campo ítems no puede estar vacío'
                });
            }
            const items = [];
            const itemLines = itemsText.split(',').map(line => line.trim());
            let totalItems = 0;
            for (const line of itemLines) {
                if (!line) continue; // Ignorar líneas vacías
                const match = line.match(/^(\d+)\s+(.+)/);
                if (match) {
                    const cantidad = parseInt(match[1]);
                    const producto = match[2];
                    items.push({ producto, cantidad });
                    totalItems += cantidad;
                } else {
                    items.push({ producto: line, cantidad: 1 });
                    totalItems += 1;
                }
            }
            if (items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Debe especificar al menos un ítem válido'
                });
            }

            // Asignar precio proporcional basado en el total
            const total = parseFloat(datosActualizados.total);
            if (isNaN(total) || total <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El total debe ser un número mayor a 0'
                });
            }
            const precioPorItem = total / totalItems;
            items.forEach(item => {
                item.precio = precioPorItem * item.cantidad;
            });
            datosActualizados.items = items;
            delete datosActualizados.itemsText;

            // Validar tipo y plataforma
            const tiposValidos = ['presencial', 'delivery'];
            if (!tiposValidos.includes(datosActualizados.tipo)) {
                return res.status(400).json({
                    success: false,
                    message: 'Tipo no válido. Use: presencial, delivery'
                });
            }
            const plataformasValidas = ['rappi', 'pedidosya', 'propia', 'local'];
            if (!plataformasValidas.includes(datosActualizados.plataforma)) {
                return res.status(400).json({
                    success: false,
                    message: 'Plataforma no válida. Use: rappi, pedidosya, propia, local'
                });
            }

            // Verificar que el pedido existe
            const pedidoExistente = await this.pedidoModel.getById(id);
            if (!pedidoExistente) {
                return res.status(404).json({
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }

            // Actualizar el pedido
            const pedidoActualizado = await this.pedidoModel.update(id, datosActualizados);
            res.json({
                success: true,
                message: 'Pedido actualizado exitosamente',
                data: pedidoActualizado
            });
        } catch (error) {
            console.error('Error en update pedido:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar el pedido',
                error: error.message
            });
        }
    }

    async delete(req, res) {
        try {
            const { id } = req.params;
            const resultado = await this.pedidoModel.delete(id);
            res.json({
                success: true,
                message: 'Pedido eliminado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('Error en delete pedido:', error);
            if (error.message === 'Pedido no encontrado') {
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Error al eliminar el pedido',
                    error: error.message
                });
            }
        }
    }

    // Métodos para renderizar vistas Pug
    async renderIndex(req, res) {
        try {
            const pedidos = await this.pedidoModel.getAll();
            res.render('pedidos/index', { pedidos });
        } catch (error) {
            console.error('Error al renderizar index de pedidos:', error);
            res.status(500).send('Error al cargar la página');
        }
    }

    async renderNuevo(req, res) {
        try {
            const clientes = await this.clienteModel.getAll();
            res.render('pedidos/nuevo', { clientes });
        } catch (error) {
            console.error('Error al renderizar nuevo pedido:', error);
            res.status(500).send('Error al cargar la página');
        }
    }

    async renderEditar(req, res) {
        try {
            const { id } = req.params;
            const pedido = await this.pedidoModel.getById(id);
            const clientes = await this.clienteModel.getAll();
            if (!pedido) {
                return res.status(404).send('Pedido no encontrado');
            }
            res.render('pedidos/editar', { pedido, clientes });
        } catch (error) {
            console.error('Error al renderizar editar pedido:', error);
            res.status(500).send('Error al cargar la página');
        }
    }
}

export default PedidosController;