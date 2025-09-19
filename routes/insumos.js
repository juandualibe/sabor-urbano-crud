import express from 'express';
import InsumosController from '../controllers/insumosController.js';
import ValidationMiddleware from '../middleware/validation.js';

const router = express.Router();
const insumosController = new InsumosController();

const validarInsumo = (req, res, next) => {
    const { nombre, categoria, stock, stockMinimo, unidadMedida, proveedor } = req.body;

    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, message: 'Body vacío: envíe al menos un campo.' });
    }
    if (req.method === 'PUT') {
        const alguno = [nombre, categoria, stock, stockMinimo, unidadMedida, proveedor].some(f => f !== undefined);
        if (!alguno) {
            return res.status(400).json({ success: false, message: 'Incluya algún campo para actualizar.' });
        }
    }
    if (categoria && !['alimentos', 'bebidas', 'limpieza', 'utensilios', 'otros'].includes(categoria)) {
        return res.status(400).json({
            success: false,
            message: 'Categoría debe ser: alimentos, bebidas, limpieza, utensilios, otros'
        });
    }
    next();
};

// Listado general
router.get('/', (req, res) => insumosController.getAll(req, res));
// Bajo stock
router.get('/bajo-stock', (req, res) => insumosController.getBajoStock(req, res));
// Alertas
router.get('/alertas', (req, res) => insumosController.getAlertas(req, res));
// Por categoría
router.get('/categoria/:categoria', (req, res) => insumosController.getByCategoria(req, res));
// Detalle
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

// Actualizar stock absoluto
router.put('/:id/stock', (req, res) => insumosController.actualizarStock(req, res));
// Descontar stock
router.put('/:id/descontar', (req, res) => insumosController.descontarStock(req, res));

router.delete('/:id', (req, res) => insumosController.delete(req, res));

export default router;