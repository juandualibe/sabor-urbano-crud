import express from 'express';
import InsumosController from '../controllers/insumosController.js';
import ValidationMiddleware from '../middleware/validation.js';

const router = express.Router();
const insumosController = new InsumosController();

const validarInsumo = (req, res, next) => {
    const { nombre, categoria, stock, stockMinimo, unidadMedida, proveedor } = req.body;

    // Validar que el body no esté vacío (para PUT)
    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'El body de la solicitud no puede estar vacío. Debe incluir al menos un campo para actualizar.'
        });
    }

    // Validar que al menos un campo válido esté presente (para PUT)
    if (req.method === 'PUT') {
        const camposValidos = [nombre, categoria, stock, stockMinimo, unidadMedida, proveedor].some(field => field !== undefined);
        if (!camposValidos) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo válido para actualizar.'
            });
        }
    }

    // Validar categoría si está presente
    if (categoria && !['alimentos', 'bebidas', 'limpieza', 'utensilios', 'otros'].includes(categoria)) {
        return res.status(400).json({
            success: false,
            message: 'Categoría debe ser: alimentos, bebidas, limpieza, utensilios, otros'
        });
    }

    next();
};

// Rutas API
router.get('/', (req, res) => insumosController.getAll(req, res));
router.get('/categoria/:categoria', (req, res) => insumosController.getByCategoria(req, res));
router.get('/:id', (req, res) => insumosController.getById(req, res));

router.post('/', 
    ValidationMiddleware.validarCamposRequeridos(['nombre', 'categoria', 'stock', 'stockMinimo']), 
    validarInsumo, 
    (req, res) => insumosController.create(req, res)
);

router.put('/:id', 
    validarInsumo, 
    (req, res) => insumosController.update(req, res)
);
router.delete('/:id', (req, res) => insumosController.delete(req, res));

export default router;