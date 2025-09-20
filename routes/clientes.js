import express from 'express'; // Importa Express para crear rutas
import ClientesController from '../controllers/clientesController.js'; // Controlador para lógica de clientes
import ValidationMiddleware from '../middleware/validation.js'; // Middleware para validaciones

const router = express.Router(); // Crea un router de Express para agrupar rutas de clientes
const controller = new ClientesController(); // Instancia del controlador

const validarEmailFormato = (req, res, next) => { // Middleware personalizado: valida formato de email en body o query
  const email = req.body.email || req.query.email; // Obtiene email de body o query params
  if (email) { // Si existe
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Patrón regex para email básico
    if (!regex.test(email)) { // Si no coincide
      return res.status(400).json({ success: false, message: 'Formato de email no válido' }); // Respuesta de error 400
    }
  }
  next(); // Continúa al siguiente middleware o handler
};

// Listar todos
router.get('/', (req, res) => controller.getAll(req, res)); // Ruta GET /clientes: lista todos, llama al controlador

// Buscar por nombre/apellido (query)
router.get('/buscar', (req, res) => controller.buscar(req, res)); // GET /clientes/buscar?nombre=...&apellido=...: busca con params de query

// Validar email disponible
router.get('/validar-email', validarEmailFormato, (req, res) => controller.validarEmail(req, res)); // GET /clientes/validar-email?email=...: valida email único, con middleware de formato

// Obtener uno
router.get('/:id', ValidationMiddleware.validarParametroId, (req, res) => controller.getById(req, res)); // GET /clientes/:id: obtiene uno por ID, valida ID con middleware

// Crear
router.post('/',
  ValidationMiddleware.validarCamposRequeridos(['nombre', 'apellido', 'email']), // Middleware: verifica campos obligatorios en body
  validarEmailFormato, // Valida formato email
  (req, res) => controller.create(req, res) // POST /clientes: crea nuevo, llama controlador
);

// Actualizar
router.put('/:id',
  ValidationMiddleware.validarParametroId, // Valida ID en param
  validarEmailFormato, // Valida email si se envía
  (req, res) => controller.update(req, res) // PUT /clientes/:id: actualiza, con body parcial
);

// Eliminar
router.delete('/:id',
  ValidationMiddleware.validarParametroId, // Valida ID
  (req, res) => controller.delete(req, res) // DELETE /clientes/:id: elimina
);

export default router; // Exporta el router para usarlo en app principal