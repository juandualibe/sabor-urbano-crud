import EmpleadoModel from '../models/Empleado.js'; // Importa el modelo de Empleado para manejar datos

class EmpleadosController { // Clase del controlador: lógica para rutas de empleados
    constructor() { // Constructor inicializa el modelo
        this.empleadoModel = new EmpleadoModel(); // Instancia del modelo para acceder a métodos
    }

    async getAll(req, res) { // Obtiene todos los empleados: GET /
        try {
            const empleados = await this.empleadoModel.getAll(); // Llama al modelo para array de empleados
            res.json({ // Respuesta JSON exitosa
                success: true,
                data: empleados,
                total: empleados.length // Incluye conteo
            });
        } catch (error) {
            console.error('Error en getAll empleados:', error); // Log del error
            res.status(500).json({ // Error 500
                success: false,
                message: 'Error al obtener los empleados',
                error: error.message
            });
        }
    }
    
    async getById(req, res) { // Obtiene empleado por ID: GET /:id
        try {
            const { id } = req.params; // Extrae ID
            const empleado = await this.empleadoModel.getById(id); // Busca en modelo
            if (!empleado) { // Si no encontrado
                return res.status(404).json({ // 404
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }
            res.json({ // Éxito
                success: true,
                data: empleado
            });
        } catch (error) {
            console.error('Error en getById empleado:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al obtener el empleado',
                error: error.message
            });
        }
    }

    async getByRol(req, res) { // Filtra empleados por rol: GET /rol/:rol
        try {
            const { rol } = req.params; // Extrae rol
            const rolesValidos = ['administrador', 'cocinero', 'repartidor', 'mozo', 'encargado_stock']; // Lista permitida
            if (!rolesValidos.includes(rol)) { // Valida rol
                return res.status(400).json({ // 400 si inválido
                    success: false,
                    message: 'Rol no válido. Use: administrador, cocinero, repartidor, mozo, encargado_stock'
                });
            }
            const empleados = await this.empleadoModel.getByRol(rol); // Filtra en modelo
            res.json({ // Éxito con filtro
                success: true,
                data: empleados,
                rol: rol,
                total: empleados.length
            });
        } catch (error) {
            console.error('Error en getByRol:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al filtrar empleados por rol',
                error: error.message
            });
        }
    }

    async getByArea(req, res) { // Filtra por área: GET /area/:area
        try {
            const { area } = req.params; // Extrae área
            const areasValidas = ['cocina', 'reparto', 'salon', 'inventario', 'administracion']; // Lista permitida
            if (!areasValidas.includes(area)) { // Valida
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Área no válida. Use: cocina, reparto, salon, inventario, administracion'
                });
            }
            const empleados = await this.empleadoModel.getByArea(area); // Filtra
            res.json({ // Éxito
                success: true,
                data: empleados,
                area: area,
                total: empleados.length
            });
        } catch (error) {
            console.error('Error en getByArea empleados:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al filtrar empleados por área',
                error: error.message
            });
        }
    }

    async create(req, res) { // Crea nuevo empleado: POST /
        try {
            const datosEmpleado = req.body; // Datos del body
            if (!datosEmpleado.nombre || !datosEmpleado.apellido || !datosEmpleado.email) { // Valida obligatorios
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Nombre, apellido y email son obligatorios'
                });
            }
            const rolesValidos = ['administrador', 'cocinero', 'repartidor', 'mozo', 'encargado_stock']; // Valida rol
            if (!rolesValidos.includes(datosEmpleado.rol)) {
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Rol no válido'
                });
            }
            const areasValidas = ['cocina', 'reparto', 'salon', 'inventario', 'administracion']; // Valida área
            if (!areasValidas.includes(datosEmpleado.area)) {
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Área no válida'
                });
            }
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Regex para email
            if (!emailRegex.test(datosEmpleado.email)) { // Valida formato
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Formato de email no válido'
                });
            }
            const nuevoEmpleado = await this.empleadoModel.create(datosEmpleado); // Crea en modelo
            res.status(201).json({ // 201 éxito
                success: true,
                message: 'Empleado creado exitosamente',
                data: nuevoEmpleado
            });
        } catch (error) {
            console.error('Error en create empleado:', error); // Log
            if (error.message === 'El email ya está en uso') { // Error específico
                res.status(409).json({ // 409 conflicto
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({ // 500 general
                    success: false,
                    message: 'Error al crear el empleado',
                    error: error.message
                });
            }
        }
    }

    async update(req, res) { // Actualiza empleado: PUT /:id
        try {
            const { id } = req.params; // ID
            const datosActualizados = req.body; // Datos
            const empleadoExistente = await this.empleadoModel.getById(id); // Verifica existencia
            if (!empleadoExistente) {
                return res.status(404).json({ // 404
                    success: false,
                    message: 'Empleado no encontrado'
                });
            }
            if (datosActualizados.email) { // Si actualiza email
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Valida formato
                if (!emailRegex.test(datosActualizados.email)) {
                    return res.status(400).json({ // 400
                        success: false,
                        message: 'Formato de email no válido'
                    });
                }
            }
            const empleadoActualizado = await this.empleadoModel.update(id, datosActualizados); // Actualiza
            res.json({ // Éxito
                success: true,
                message: 'Empleado actualizado exitosamente',
                data: empleadoActualizado
            });
        } catch (error) {
            console.error('Error en update empleado:', error); // Log
            if (error.message === 'El email ya está en uso') { // Específico
                res.status(409).json({ // 409
                    success: false,
                    message: error.message
                });
            } else {
                res.status(500).json({ // 500
                    success: false,
                    message: 'Error al actualizar el empleado',
                    error: error.message
                });
            }
        }
    }

    async delete(req, res) { // Elimina empleado: DELETE /:id
    try {
      const { id } = req.params; // ID
      await this.empleadoModel.delete(id); // Llama a modelo (no retorna data en este caso)
      res.json({ // Éxito simple
        success: true,
        message: 'Empleado eliminado exitosamente',
      });
    } catch (error) {
      console.error('Error en delete empleado:', error); // Log
      if (error.message === 'Empleado no encontrado') { // 404
        res.status(404).json({
          success: false,
          message: 'Empleado no encontrado',
        });
      } else {
        res.status(500).json({ // 500
          success: false,
          message: 'Error al eliminar el empleado',
          error: error.message,
        });
      }
    }
  }

    async validarEmail(req, res) { // Valida email único: GET /validar-email
        try {
            const { email, id } = req.query; // Query params
            if (!email) { // Valida presencia
                return res.status(400).json({ // 400
                    success: false,
                    message: 'Email es requerido'
                });
            }
            const esUnico = await this.empleadoModel.validarEmailUnico(email, id); // Verifica en modelo
            res.json({ // Éxito
                success: true,
                disponible: esUnico,
                email: email
            });
        } catch (error) {
            console.error('Error en validarEmail:', error); // Log
            res.status(500).json({ // 500
                success: false,
                message: 'Error al validar email',
                error: error.message
            });
        }
    }
}

export default EmpleadosController; // Exporta clase