import express from 'express'; // Express para rutas
import EmpleadosController from '../controllers/empleadosController.js'; // Controlador empleados
import ValidationMiddleware from '../middleware/validation.js'; // Middleware validaciones
import Empleado from '../models/Empleado.js'; // Modelo para algunas ops

const router = express.Router(); // Router para empleados
const empleadosController = new EmpleadosController(); // Instancia controlador
const empleadoModel = new Empleado(); // Instancia modelo (usado en algunos lugares, pero no en rutas directas)

// Middleware para validar campos específicos de empleados
const validarEmpleado = (req, res, next) => { // Middleware: valida body para create/update empleados
    const { nombre, apellido, email, telefono, rol, area, fechaIngreso } = req.body; // Extrae campos de body

    // Validar que el body no esté vacío (para PUT)
    if (req.method === 'PUT' && Object.keys(req.body).length === 0) { // Para PUT, si body vacío
        return res.status(400).json({ // Error 400
            success: false,
            message: 'El body de la solicitud no puede estar vacío. Debe incluir al menos un campo para actualizar (nombre, apellido, email, telefono, rol, area, fechaIngreso).'
        });
    }

    // Validar que al menos un campo válido esté presente (para PUT)
    if (req.method === 'PUT') { // Para PUT
        const camposValidos = [nombre, apellido, email, telefono, rol, area, fechaIngreso].some(field => field !== undefined); // Verifica si algún campo definido
        if (!camposValidos) { // Si ninguno
            return res.status(400).json({ // Error
                success: false,
                message: 'Debe proporcionar al menos un campo válido para actualizar (nombre, apellido, email, telefono, rol, area, fechaIngreso).'
            });
        }
    }

    // Validar rol si está presente
    if (rol && !['administrador', 'cocinero', 'repartidor', 'mozo', 'encargado_stock'].includes(rol)) { // Si rol no en lista permitida
        return res.status(400).json({ // Error
            success: false,
            message: 'Rol debe ser: administrador, cocinero, repartidor, mozo, encargado_stock'
        });
    }

    // Validar área si está presente
    if (area && !['cocina', 'reparto', 'salon', 'inventario', 'administracion'].includes(area)) { // Área inválida
        return res.status(400).json({ // Error
            success: false,
            message: 'Área debe ser: cocina, reparto, salon, inventario, administracion'
        });
    }

    // Validar email si está presente (para POST, ya que PUT usa ValidationMiddleware.validarEmail)
    if (req.method === 'POST' && email) { // Solo POST y si email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex email
        if (!emailRegex.test(email)) { // No válido
            return res.status(400).json({ // Error
                success: false,
                message: 'Formato de email no válido'
            });
        }
    }

    next(); // Continúa
};

// Rutas API
router.get('/', (req, res) => empleadosController.getAll(req, res)); // GET /empleados: todos
router.get('/rol/:rol', (req, res) => empleadosController.getByRol(req, res)); // GET /empleados/rol/:rol: por rol
router.get('/area/:area', (req, res) => empleadosController.getByArea(req, res)); // GET /empleados/area/:area: por área
router.get('/:id', (req, res) => empleadosController.getById(req, res)); // GET /empleados/:id: uno
router.get('/validar-email', (req, res) => empleadosController.validarEmail(req, res)); // GET /empleados/validar-email?email=...: valida único

router.post('/',  // POST /empleados: crea
    ValidationMiddleware.validarCamposRequeridos(['nombre', 'apellido', 'email', 'rol', 'area']),  // Campos obligatorios
    ValidationMiddleware.validarEmail, // Valida formato email
    validarEmpleado,  // Validaciones específicas
    (req, res) => empleadosController.create(req, res) // Controlador
);

router.put('/:id',  // PUT /empleados/:id: actualiza
    ValidationMiddleware.validarEmail, // Valida email si presente
    validarEmpleado,  // Específicas
    (req, res) => empleadosController.update(req, res) // Controlador
);
router.delete('/:id', (req, res) => empleadosController.delete(req, res)); // DELETE /empleados/:id: elimina

export default router; // Exporta