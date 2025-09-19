import express from 'express';
import EmpleadosController from '../controllers/empleadosController.js';
import ValidationMiddleware from '../middleware/validation.js';
import Empleado from '../models/Empleado.js';

const router = express.Router();
const empleadosController = new EmpleadosController();
const empleadoModel = new Empleado();

// Middleware para validar campos específicos de empleados
const validarEmpleado = (req, res, next) => {
    const { nombre, apellido, email, telefono, rol, area, fechaIngreso } = req.body;

    // Validar que el body no esté vacío (para PUT)
    if (req.method === 'PUT' && Object.keys(req.body).length === 0) {
        return res.status(400).json({
            success: false,
            message: 'El body de la solicitud no puede estar vacío. Debe incluir al menos un campo para actualizar (nombre, apellido, email, telefono, rol, area, fechaIngreso).'
        });
    }

    // Validar que al menos un campo válido esté presente (para PUT)
    if (req.method === 'PUT') {
        const camposValidos = [nombre, apellido, email, telefono, rol, area, fechaIngreso].some(field => field !== undefined);
        if (!camposValidos) {
            return res.status(400).json({
                success: false,
                message: 'Debe proporcionar al menos un campo válido para actualizar (nombre, apellido, email, telefono, rol, area, fechaIngreso).'
            });
        }
    }

    // Validar rol si está presente
    if (rol && !['administrador', 'cocinero', 'repartidor', 'mozo', 'encargado_stock'].includes(rol)) {
        return res.status(400).json({
            success: false,
            message: 'Rol debe ser: administrador, cocinero, repartidor, mozo, encargado_stock'
        });
    }

    // Validar área si está presente
    if (area && !['cocina', 'reparto', 'salon', 'inventario', 'administracion'].includes(area)) {
        return res.status(400).json({
            success: false,
            message: 'Área debe ser: cocina, reparto, salon, inventario, administracion'
        });
    }

    // Validar email si está presente (para POST, ya que PUT usa ValidationMiddleware.validarEmail)
    if (req.method === 'POST' && email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de email no válido'
            });
        }
    }

    next();
};

// Rutas API
router.get('/', (req, res) => empleadosController.getAll(req, res));
router.get('/rol/:rol', (req, res) => empleadosController.getByRol(req, res));
router.get('/area/:area', (req, res) => empleadosController.getByArea(req, res));
router.get('/:id', (req, res) => empleadosController.getById(req, res));
router.get('/validar-email', (req, res) => empleadosController.validarEmail(req, res));

router.post('/', 
    ValidationMiddleware.validarCamposRequeridos(['nombre', 'apellido', 'email', 'rol', 'area']), 
    ValidationMiddleware.validarEmail,
    validarEmpleado, 
    (req, res) => empleadosController.create(req, res)
);

router.put('/:id', 
    ValidationMiddleware.validarEmail,
    validarEmpleado, 
    (req, res) => empleadosController.update(req, res)
);
router.delete('/:id', (req, res) => empleadosController.delete(req, res));

export default router;