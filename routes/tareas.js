import express from 'express';
import TareasController from '../controllers/tareasController.js';
import ValidationMiddleware from '../middleware/validation.js';

const router = express.Router();
const tareasController = new TareasController();

const validarTarea = (req, res, next) => {
    const { titulo, descripcion, area, estado, prioridad, empleadoAsignado, pedidoAsociado, observaciones } = req.body;

    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'Body vacío: proporcione al menos un campo.' });
    }

    if (req.method === 'PUT') {
        const camposValidos = [titulo, descripcion, area, estado, prioridad, empleadoAsignado, pedidoAsociado, observaciones]
            .some(f => f !== undefined);
        if (!camposValidos) {
            return res.status(400).json({ success: false, message: 'Debe enviar al menos un campo válido.' });
        }
    }

    if (area && !['gestion_pedidos', 'control_inventario'].includes(area)) {
        return res.status(400).json({ success: false, message: 'Área debe ser: gestion_pedidos, control_inventario' });
    }
    if (estado && !['pendiente', 'en_proceso', 'finalizada'].includes(estado)) {
        return res.status(400).json({ success: false, message: 'Estado debe ser: pendiente, en_proceso, finalizada' });
    }
    if (prioridad && !['alta', 'media', 'baja'].includes(prioridad)) {
        return res.status(400).json({ success: false, message: 'Prioridad debe ser: alta, media, baja' });
    }
    next();
};

// GET con filtros (query)
router.get('/', (req, res) => tareasController.getAll(req, res));
router.get('/area/:area', (req, res) => tareasController.getByArea(req, res));
router.get('/:id', (req, res) => tareasController.getById(req, res));

router.post('/',
    ValidationMiddleware.validarCamposRequeridos(['titulo', 'area']),
    validarTarea,
    (req, res) => tareasController.create(req, res)
);

router.put('/:id',
    validarTarea,
    (req, res) => tareasController.update(req, res)
);

// Transiciones de estado
router.patch('/:id/iniciar', (req, res) => tareasController.iniciar(req, res));
router.patch('/:id/finalizar', (req, res) => tareasController.finalizar(req, res));

router.delete('/:id', (req, res) => tareasController.delete(req, res));

export default router;