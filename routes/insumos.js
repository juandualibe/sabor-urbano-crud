import express from 'express'; // Express
import InsumosController from '../controllers/insumosController.js'; // Controlador
import ValidationMiddleware from '../middleware/validation.js'; // Validaciones

const router = express.Router(); // Router insumos
const insumosController = new InsumosController(); // Instancia

const validarInsumo = (req, res, next) => { // Middleware: valida para create/update insumos
    const { nombre, categoria, stock, stockMinimo, unidadMedida, proveedor } = req.body; // Campos body

    if (req.method === 'PUT' && Object.keys(req.body).length === 0) { // PUT vacío
        return res.status(400).json({ success: false, message: 'Body vacío: envíe al menos un campo.' });
    }
    if (req.method === 'PUT') { // PUT sin campos válidos
        const alguno = [nombre, categoria, stock, stockMinimo, unidadMedida, proveedor].some(f => f !== undefined);
        if (!alguno) {
            return res.status(400).json({ success: false, message: 'Incluya algún campo para actualizar.' });
        }
    }
    if (categoria && !['alimentos', 'bebidas', 'limpieza', 'utensilios', 'otros'].includes(categoria)) { // Categoría inválida
        return res.status(400).json({
            success: false,
            message: 'Categoría debe ser: alimentos, bebidas, limpieza, utensilios, otros'
        });
    }
    next(); // Continúa
};

// Listado general
router.get('/', (req, res) => insumosController.getAll(req, res)); // GET /insumos: todos
// Bajo stock
router.get('/bajo-stock', (req, res) => insumosController.getBajoStock(req, res)); // GET /insumos/bajo-stock: bajos
// Alertas
router.get('/alertas', (req, res) => insumosController.getAlertas(req, res)); // GET /insumos/alertas: alertas
// Por categoría
router.get('/categoria/:categoria', (req, res) => insumosController.getByCategoria(req, res)); // GET /insumos/categoria/:cat: por cat
// Detalle
router.get('/:id', (req, res) => insumosController.getById(req, res)); // GET /insumos/:id: uno

router.post('/',
    ValidationMiddleware.validarCamposRequeridos(['nombre', 'categoria', 'stock', 'stockMinimo']), // Obligatorios
    validarInsumo, // Específicos
    (req, res) => insumosController.create(req, res) // POST /insumos: crea
);

router.put('/:id',
    validarInsumo, // Valida
    (req, res) => insumosController.update(req, res) // PUT /insumos/:id: actualiza general
);

// Actualizar stock absoluto
router.put('/:id/stock', (req, res) => insumosController.actualizarStock(req, res)); // PUT /insumos/:id/stock: stock nuevo
// Descontar stock
router.put('/:id/descontar', (req, res) => insumosController.descontarStock(req, res)); // PUT /insumos/:id/descontar: resta cantidad

router.delete('/:id', (req, res) => insumosController.delete(req, res)); // DELETE /insumos/:id: elimina

export default router; // Exporta