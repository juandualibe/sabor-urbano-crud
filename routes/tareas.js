import express from 'express'; // Express
import TareasController from '../controllers/tareasController.js'; // Controlador
import ValidationMiddleware from '../middleware/validation.js'; // Validaciones

const router = express.Router(); // Router tareas
const tareasController = new TareasController(); // Instancia

const validarTarea = (req, res, next) => { // Middleware: valida create/update tareas
    const { titulo, descripcion, area, estado, prioridad, empleadoAsignado, pedidoAsociado, observaciones } = req.body; // Campos

    if (req.method === 'PUT' && Object.keys(req.body).length === 0) { // PUT vacío
        return res.status(400).json({ success: false, message: 'Body vacío: proporcione al menos un campo.' });
    }

    if (req.method === 'PUT') { // PUT sin válidos
        const camposValidos = [titulo, descripcion, area, estado, prioridad, empleadoAsignado, pedidoAsociado, observaciones]
            .some(f => f !== undefined);
        if (!camposValidos) {
            return res.status(400).json({ success: false, message: 'Debe enviar al menos un campo válido.' });
        }
    }

    if (area && !['gestion_pedidos', 'control_inventario'].includes(area)) { // Área inválida
        return res.status(400).json({ success: false, message: 'Área debe ser: gestion_pedidos, control_inventario' });
    }
    if (estado && !['pendiente', 'en_proceso', 'finalizada'].includes(estado)) { // Estado inválido
        return res.status(400).json({ success: false, message: 'Estado debe ser: pendiente, en_proceso, finalizada' });
    }
    if (prioridad && !['alta', 'media', 'baja'].includes(prioridad)) { // Prioridad inválida
        return res.status(400).json({ success: false, message: 'Prioridad debe ser: alta, media, baja' });
    }
    next(); // Continúa
};

// GET con filtros (query)
router.get('/', (req, res) => tareasController.getAll(req, res)); // GET /tareas: todas con filtros query
router.get('/area/:area', (req, res) => tareasController.getByArea(req, res)); // GET /tareas/area/:area: por área
router.get('/:id', (req, res) => tareasController.getById(req, res)); // GET /tareas/:id: una

router.post('/',
    ValidationMiddleware.validarCamposRequeridos(['titulo', 'area']), // Obligatorios
    validarTarea, // Específicos
    (req, res) => tareasController.create(req, res) // POST /tareas: crea
);

router.put('/:id',
    validarTarea, // Valida
    (req, res) => tareasController.update(req, res) // PUT /tareas/:id: actualiza
);

// Transiciones de estado
router.patch('/:id/iniciar', (req, res) => tareasController.iniciar(req, res)); // PATCH /tareas/:id/iniciar: inicia
router.patch('/:id/finalizar', (req, res) => tareasController.finalizar(req, res)); // PATCH /tareas/:id/finalizar: finaliza

router.delete('/:id', (req, res) => tareasController.delete(req, res)); // DELETE /tareas/:id: elimina

export default router; // Exporta