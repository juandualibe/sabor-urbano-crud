import express from 'express';
import PedidosController from '../controllers/pedidosController.js';
import ValidationMiddleware from '../middleware/validation.js';

const router = express.Router();
const pedidosController = new PedidosController();

const validarPedido = (req, res, next) => {
    const { cliente, items, total, tipo, plataforma, estado, tiempoEstimado, observaciones } = req.body;

    // Validar que el body no esté vacío (para PUT)
    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'El body de la solicitud no puede estar vacío. Debe incluir al menos un campo para actualizar.'
        });
    }

    // Validar que al menos un campo válido esté presente (para PUT)
    if (req.method === 'PUT') {
        const camposValidos = [cliente, items, total, tipo, plataforma, estado, tiempoEstimado, observaciones].some(field => field !== undefined);
        if (!camposValidos) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo válido para actualizar.'
            });
        }
    }

    // Validar tipo si está presente
    if (tipo && !['presencial', 'delivery'].includes(tipo)) {
        return res.status(400).json({
            success: false,
            message: 'Tipo debe ser: presencial, delivery'
        });
    }

    // Validar plataforma si está presente
    if (plataforma && !['rappi', 'pedidosya', 'propia', 'local'].includes(plataforma)) {
        return res.status(400).json({
            success: false,
            message: 'Plataforma debe ser: rappi, pedidosya, propia, local'
        });
    }

    // Validar estado si está presente
    if (estado && !['pendiente', 'en_preparacion', 'listo', 'en_camino', 'entregado', 'finalizado'].includes(estado)) {
        return res.status(400).json({
            success: false,
            message: 'Estado debe ser: pendiente, en_preparacion, listo, en_camino, entregado, finalizado'
        });
    }

    next();
};

// Rutas API
router.get('/', (req, res) => pedidosController.getAll(req, res));
router.get('/tipo/:tipo', (req, res) => pedidosController.getByTipo(req, res));
router.get('/plataforma/:plataforma', (req, res) => pedidosController.getByPlataforma(req, res));
router.get('/:id', (req, res) => pedidosController.getById(req, res));

router.post('/', 
    ValidationMiddleware.validarCamposRequeridos(['cliente', 'items', 'total', 'tipo', 'plataforma', 'estado']), 
    validarPedido, 
    (req, res) => pedidosController.create(req, res)
);

router.put('/:id', 
    validarPedido, 
    (req, res) => pedidosController.update(req, res)
);
router.delete('/:id', (req, res) => pedidosController.delete(req, res));

export default router;