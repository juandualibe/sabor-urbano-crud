import PedidoModel from '../models/Pedido.js'; // Modelo Pedido
import ClienteModel from '../models/Cliente.js'; // Modelo Cliente para validaciones

class PedidosController { // Controlador para pedidos
    constructor() { // Inicializa modelos
        this.pedidoModel = new PedidoModel(); // Para pedidos
        this.clienteModel = new ClienteModel(); // Para clientes
    }

    async getAll(req, res) { // Todos pedidos: GET /
        try {
            const pedidos = await this.pedidoModel.getAll(); // Obtiene con mapeo de cliente
            res.json({ // Éxito
                success: true,
                data: pedidos,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Error en getAll pedidos:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al obtener los pedidos',
                error: error.message
            });
        }
    }

    async getById(req, res) { // Por ID: GET /:id
        try {
            const { id } = req.params; // ID
            const pedido = await this.pedidoModel.getById(id); // Busca
            if (!pedido) { // No encontrado
                return res.status(404).json({ // 404
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }
            res.json({ // Éxito
                success: true,
                data: pedido
            });
        } catch (error) {
            console.error('Error en getById pedido:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al obtener el pedido',
                error: error.message
            });
        }
    }

    async getByTipo(req, res) { // Por tipo: GET /tipo/:tipo
        try {
            const { tipo } = req.params; // Tipo
            const tiposValidos = ['presencial', 'delivery']; // Lista
            if (!tiposValidos.includes(tipo)) { // Valida
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Tipo no válido. Use: presencial, delivery'
                });
            }
            const pedidos = await this.pedidoModel.getByTipo(tipo); // Filtra
            res.json({ // Éxito
                success: true,
                data: pedidos,
                tipo: tipo,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Error en getByTipo:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al filtrar pedidos por tipo',
                error: error.message
            });
        }
    }

    async getByPlataforma(req, res) { // Por plataforma: GET /plataforma/:plataforma
        try {
            const { plataforma } = req.params; // Plataforma
            const plataformasValidas = ['rappi', 'pedidosya', 'propia', 'local']; // Lista
            if (!plataformasValidas.includes(plataforma)) { // Valida
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Plataforma no válida. Use: rappi, pedidosya, propia, local'
                });
            }
            const pedidos = await this.pedidoModel.getByPlataforma(plataforma); // Filtra
            res.json({ // Éxito
                success: true,
                data: pedidos,
                plataforma: plataforma,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Error en getByPlataforma:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al filtrar pedidos por plataforma',
                error: error.message
            });
        }
    }

    async getByEstado(req, res) { // Por estado: GET /estado/:estado (nota: no usado en rutas, pero definido)
        try {
            const { estado } = req.params; // Estado
            const estadosValidos = ['pendiente', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'finalizado']; // Lista
            if (!estadosValidos.includes(estado)) { // Valida
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Estado no válido. Use: pendiente, en_preparacion, listo, en_camino, entregado, finalizado'
                });
            }
            const pedidos = await this.pedidoModel.getByEstado(estado); // Filtra
            res.json({ // Éxito
                success: true,
                data: pedidos,
                estado: estado,
                total: pedidos.length
            });
        } catch (error) {
            console.error('Error en getByEstado:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al filtrar pedidos por estado',
                error: error.message
            });
        }
    }

    async create(req, res) { // Crea pedido: POST /
        try {
            const datosPedido = req.body; // Datos
            // Validar campos requeridos
            if (!datosPedido.clienteId || !datosPedido.itemsText || !datosPedido.total || !datosPedido.tipo || !datosPedido.plataforma) { // Obligatorios
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Campos requeridos faltantes: clienteId, itemsText, total, tipo, plataforma'
                });
            }
            // Parsear itemsText en un array de ítems
            const itemsText = datosPedido.itemsText.trim(); // Limpia texto de items
            const items = []; // Array vacío para items
            const itemLines = itemsText.split(',').map(line => line.trim()); // Divide por comas
            let totalItems = 0; // Contador de items
            for (const line of itemLines) { // Para cada línea
                const match = line.match(/^(\d+)\s+(.+)/); // Regex para cantidad + nombre
                if (match) { // Si coincide
                    const cantidad = parseInt(match[1]); // Cantidad
                    const producto = match[2]; // Producto
                    items.push({ producto, cantidad }); // Agrega
                    totalItems += cantidad; // Suma
                } else { // Si no, asume cantidad 1
                    items.push({ producto: line, cantidad: 1 });
                    totalItems += 1;
                }
            }
            // Asignar precio proporcional basado en el total
            const total = parseFloat(datosPedido.total); // Total numérico
            if (totalItems > 0) { // Si hay items
                const precioPorItem = total / totalItems; // Precio unitario
                items.forEach(item => { // Para cada item
                    item.precio = precioPorItem * item.cantidad; // Calcula precio
                });
            } else { // No hay items
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Debe especificar al menos un ítem'
                });
            }
            datosPedido.items = items; // Asigna items procesados
            delete datosPedido.itemsText; // Elimina texto original

            // Validar clienteId
            const cliente = await this.clienteModel.getById(datosPedido.clienteId); // Busca cliente
            if (!cliente) { // No existe
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            const tiposValidos = ['presencial', 'delivery']; // Valida tipo
            if (!tiposValidos.includes(datosPedido.tipo)) {
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Tipo no válido'
                });
            }
            const plataformasValidas = ['rappi', 'pedidosya', 'propia', 'local']; // Valida plataforma
            if (!plataformasValidas.includes(datosPedido.plataforma)) {
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Plataforma no válida'
                });
            }
            const nuevoPedido = await this.pedidoModel.create(datosPedido); // Crea
            res.status(201).json({ // 201
                success: true,
                message: 'Pedido creado exitosamente',
                data: nuevoPedido
            });
        } catch (error) {
            console.error('Error en create pedido:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al crear el pedido',
                error: error.message
            });
        }
    }

    async update(req, res) { // Actualiza pedido: PUT /:id (requiere todos los campos, como create)
        try {
            const { id } = req.params; // ID
            const datosActualizados = req.body; // Datos

            // Validar campos requeridos individualmente
            const missingFields = []; // Array para faltantes
            if (!datosActualizados.clienteId) missingFields.push('clienteId');
            if (!datosActualizados.itemsText) missingFields.push('itemsText');
            if (!datosActualizados.total) missingFields.push('total');
            if (!datosActualizados.tipo) missingFields.push('tipo');
            if (!datosActualizados.plataforma) missingFields.push('plataforma');
            if (missingFields.length > 0) { // Si faltan
                return res.status(400).json({ // 400
                    success: false,
                    message: `Campos requeridos faltantes: ${missingFields.join(', ')}`
                });
            }

            // Validar clienteId
            const cliente = await this.clienteModel.getById(datosActualizados.clienteId); // Busca
            if (!cliente) { // No existe
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Cliente no encontrado'
                });
            }

            // Parsear itemsText en un array de ítems
            const itemsText = datosActualizados.itemsText.trim(); // Limpia
            if (!itemsText) { // Vacío
                return res.status(400).json({ // 400
                    success: false,
                    message: 'El campo ítems no puede estar vacío'
                });
            }
            const items = []; // Array
            const itemLines = itemsText.split(',').map(line => line.trim()); // Divide
            let totalItems = 0;
            for (const line of itemLines) { // Procesa líneas
                if (!line) continue; // Ignora vacías
                const match = line.match(/^(\d+)\s+(.+)/); // Regex
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
            if (items.length === 0) { // No items válidos
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Debe especificar al menos un ítem válido'
                });
            }

            // Asignar precio proporcional basado en el total
            const total = parseFloat(datosActualizados.total); // Total
            if (isNaN(total) || total <= 0) { // Valida total
                return res.status(400).json({ // 400
                    success: false,
                    message: 'El total debe ser un número mayor a 0'
                });
            }
            const precioPorItem = total / totalItems; // Precio
            items.forEach(item => { // Asigna
                item.precio = precioPorItem * item.cantidad;
            });
            datosActualizados.items = items; // Asigna
            delete datosActualizados.itemsText; // Limpia

            // Validar tipo y plataforma
            const tiposValidos = ['presencial', 'delivery']; // Valida tipo
            if (!tiposValidos.includes(datosActualizados.tipo)) {
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Tipo no válido. Use: presencial, delivery'
                });
            }
            const plataformasValidas = ['rappi', 'pedidosya', 'propia', 'local']; // Valida plat
            if (!plataformasValidas.includes(datosActualizados.plataforma)) {
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Plataforma no válida. Use: rappi, pedidosya, propia, local'
                });
            }

            // Verificar que el pedido existe
            const pedidoExistente = await this.pedidoModel.getById(id); // Busca
            if (!pedidoExistente) {
                return res.status(404).json({ // 404
                    success: false,
                    message: 'Pedido no encontrado'
                });
            }

            // Actualizar el pedido
            const pedidoActualizado = await this.pedidoModel.update(id, datosActualizados); // Actualiza
            res.json({ // Éxito
                success: true,
                message: 'Pedido actualizado exitosamente',
                data: pedidoActualizado
            });
        } catch (error) {
            console.error('Error en update pedido:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al actualizar el pedido',
                error: error.message
            });
        }
    }

    async delete(req, res) { // Elimina: DELETE /:id
        try {
            const { id } = req.params; // ID
            const resultado = await this.pedidoModel.delete(id); // Elimina
            res.json({ // Éxito
                success: true,
                message: 'Pedido eliminado exitosamente',
                data: resultado
            });
        } catch (error) {
            console.error('Error en delete pedido:', error); // Log
            if (error.message === 'Pedido no encontrado') { // 404
                res.status(404).json({
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({ // 500
                    success: false,
                    message: 'Error al eliminar el pedido',
                    error: error.message
                });
            }
        }
    }

    // Métodos para renderizar vistas Pug
    async renderIndex(req, res) { // Renderiza vista index.pug con lista de pedidos
        try {
            const pedidos = await this.pedidoModel.getAll(); // Obtiene pedidos
            res.render('pedidos/index', { pedidos }); // Renderiza template con datos
        } catch (error) {
            console.error('Error al renderizar index de pedidos:', error); // Log
            res.status(500).send('Error al cargar la página'); // Error simple
        }
    }

    async renderNuevo(req, res) { // Renderiza nuevo.pug con lista de clientes
        try {
            const clientes = await this.clienteModel.getAll(); // Obtiene clientes
            res.render('pedidos/nuevo', { clientes }); // Renderiza
        } catch (error) {
            console.error('Error al renderizar nuevo pedido:', error); // Log
            res.status(500).send('Error al cargar la página');
        }
    }

    async renderEditar(req, res) { // Renderiza editar.pug con pedido y clientes
        try {
            const { id } = req.params; // ID
            const pedido = await this.pedidoModel.getById(id); // Obtiene pedido
            const clientes = await this.clienteModel.getAll(); // Clientes
            if (!pedido) { // No encontrado
                return res.status(404).send('Pedido no encontrado'); // 404
            }
            res.render('pedidos/editar', { pedido, clientes }); // Renderiza
        } catch (error) {
            console.error('Error al renderizar editar pedido:', error); // Log
            res.status(500).send('Error al cargar la página');
        }
    }
}

export default PedidosController; // Exporta