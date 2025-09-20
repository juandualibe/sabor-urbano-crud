import express from 'express'; // Express
import PedidosController from '../controllers/pedidosController.js'; // Controlador
import ValidationMiddleware from '../middleware/validation.js'; // Validaciones

const router = express.Router(); // Router pedidos
const pedidosController = new PedidosController(); // Instancia

const validarPedido = (req, res, next) => { // Middleware: valida para create/update pedidos
    const { cliente, items, total, tipo, plataforma, estado, tiempoEstimado, observaciones } = req.body; // Campos

    // Validar que el body no esté vacío (para PUT)
    if (req.method === 'PUT' && Object.keys(req.body).length === 0) { // PUT vacío
        return res.status(400).json({
            success: false,
            message: 'El body de la solicitud no puede estar vacío. Debe incluir al menos un campo para actualizar.'
        });
    }

    // Validar que al menos un campo válido esté presente (para PUT)
    if (req.method === 'PUT') { // PUT sin válidos
        const camposValidos = [cliente, items, total, tipo, plataforma, estado, tiempoEstimado, observaciones].some(field => field !== undefined);
        if (!camposValidos) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo válido para actualizar.'
            });
        }
    }

    // Validar tipo si está presente
    if (tipo && !['presencial', 'delivery'].includes(tipo)) { // Tipo inválido
        return res.status(400).json({
            success: false,
            message: 'Tipo debe ser: presencial, delivery'
        });
    }

    // Validar plataforma si está presente
    if (plataforma && !['rappi', 'pedidosya', 'propia', 'local'].includes(plataforma)) { // Plataforma inválida
        return res.status(400).json({
            success: false,
            message: 'Plataforma debe ser: rappi, pedidosya, propia, local'
        });
    }

    // Validar estado si está presente
    if (estado && !['pendiente', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'finalizado'].includes(estado)) { // Estado inválido
        return res.status(400).json({
            success: false,
            message: 'Estado debe ser: pendiente, en_preparacion, listo, en_camino, entregado, finalizado'
        });
    }

    next(); // Continúa
};

// Rutas API
router.get('/', (req, res) => pedidosController.getAll(req, res)); // GET /pedidos: todos
router.get('/tipo/:tipo', (req, res) => pedidosController.getByTipo(req, res)); // GET /pedidos/tipo/:tipo: por tipo
router.get('/plataforma/:plataforma', (req, res) => pedidosController.getByPlataforma(req, res)); // GET /pedidos/plataforma/:plat: por plat
router.get('/:id', (req, res) => pedidosController.getById(req, res)); // GET /pedidos/:id: uno

router.post('/',  // POST /pedidos: crea
    ValidationMiddleware.validarCamposRequeridos(['cliente', 'items', 'total', 'tipo', 'plataforma', 'estado']),  // Obligatorios
    validarPedido,  // Específicos
    (req, res) => pedidosController.create(req, res) // Controlador
);

router.put('/:id',  // PUT /pedidos/:id: actualiza
    validarPedido,  // Valida
    (req, res) => pedidosController.update(req, res) // Controlador
);
router.delete('/:id', (req, res) => pedidosController.delete(req, res)); // DELETE /pedidos/:id: elimina

export default router; // Exporta