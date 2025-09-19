import express from 'express';
import TareasController from '../controllers/tareasController.js';
import ValidationMiddleware from '../middleware/validation.js';

const router = express.Router();
const tareasController = new TareasController();

const validarTarea = (req, res, next) => {
    const { titulo, descripcion, area, estado, prioridad, empleadoAsignado, pedidoAsociado, observaciones } = req.body;

    // Validar que el body no esté vacío (para PUT)
    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'El body de la solicitud no puede estar vacío. Debe incluir al menos un campo para actualizar.'
        });
    }

    // Validar que al menos un campo válido esté presente (para PUT)
    if (req.method === 'PUT') {
        const camposValidos = [titulo, descripcion, area, estado, prioridad, empleadoAsignado, pedidoAsociado, observaciones].some(field => field !== undefined);
        if (!camposValidos) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo válido para actualizar.'
            });
        }
    }

    // Validar área si está presente
    if (area && !['gestion_pedidos', 'control_inventario'].includes(area)) {
        return res.status(400).json({
            success: false,
            message: 'Área debe ser: gestion_pedidos, control_inventario'
        });
    }

    // Validar estado si está presente
    if (estado && !['pendiente', 'en_proceso', 'finalizada'].includes(estado)) {
        return res.status(400).json({
            success: false,
            message: 'Estado debe ser: pendiente, en_proceso, finalizada'
        });
    }

    // Validar prioridad si está presente
    if (prioridad && !['alta', 'media', 'baja'].includes(prioridad)) {
        return res.status(400).json({
            success: false,
            message: 'Prioridad debe ser: alta, media, baja'
        });
    }

    next();
};

// Rutas API
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
router.delete('/:id', (req, res) => tareasController.delete(req, res));

export default router;