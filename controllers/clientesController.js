import ClienteModel from '../models/Cliente.js'; // Importa el modelo de Cliente para interactuar con los datos

class ClientesController { // Clase principal del controlador: maneja la lógica de negocio para las rutas de clientes
  constructor() { // Constructor: se ejecuta al crear una instancia, inicializa el modelo de cliente
    this.clienteModel = new ClienteModel(); // Crea una instancia del modelo para acceder a métodos como getAll, create, etc.
  }

  async getAll(req, res) { // Método para obtener todos los clientes: responde a una petición GET
    try { // Bloque try-catch para manejar errores de forma controlada
      const clientes = await this.clienteModel.getAll(); // Llama al modelo para obtener el array de todos los clientes
      res.json({ success: true, data: clientes, total: clientes.length }); // Envía respuesta JSON exitosa con datos y conteo total
    } catch (error) { // Si ocurre un error (ej: problema al leer archivo JSON)
      res.status(500).json({ success: false, message: 'Error al obtener clientes', error: error.message }); // Respuesta de error 500 con mensaje y detalle del error
    }
  }

  async getById(req, res) { // Método para obtener un cliente específico por su ID: responde a GET /:id
    try {
      const cliente = await this.clienteModel.getById(req.params.id); // Extrae ID de params y llama al modelo para buscarlo
      if (!cliente) return res.status(404).json({ success: false, message: 'Cliente no encontrado' }); // Si no existe, responde 404
      res.json({ success: true, data: cliente }); // Envía el cliente encontrado en JSON
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener cliente', error: error.message }); // Error 500 si falla la búsqueda
    }
  }

  async buscar(req, res) { // Método para buscar clientes por nombre y/o apellido: responde a GET /buscar con query params
    try {
      const { nombre, apellido } = req.query; // Extrae parámetros de query (opcionales)
      if (!nombre && !apellido) { // Valida que al menos uno esté presente
        return res.status(400).json({ success: false, message: 'Proporcione nombre y/o apellido para buscar' }); // Error 400 si faltan
      }
      const resultados = await this.clienteModel.buscar({ nombre, apellido }); // Llama al modelo con los filtros
      res.json({ success: true, data: resultados, total: resultados.length }); // Envía resultados y conteo
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al buscar clientes', error: error.message }); // Error 500
    }
  }

  async validarEmail(req, res) { // Método para validar si un email está disponible: responde a GET /validar-email con query
    try {
      const { email, id } = req.query; // Extrae email y opcional ID (para updates, excluir el actual)
      if (!email) return res.status(400).json({ success: false, message: 'Email es requerido' }); // Valida presencia de email
      const esUnico = await this.clienteModel.validarEmailUnico(email, id); // Llama al modelo para verificar unicidad
      res.json({ success: true, email, disponible: esUnico }); // Responde con booleano de disponibilidad
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al validar email', error: error.message }); // Error 500
    }
  }

  async create(req, res) { // Método para crear un nuevo cliente: responde a POST con body de datos
    try {
      const { nombre, apellido, email, telefono } = req.body; // Extrae datos del body
      if (!nombre || !apellido || !email) { // Valida campos obligatorios
        return res.status(400).json({ success: false, message: 'Campos requeridos faltantes: nombre, apellido, email' }); // Error 400 si faltan
      }
      const nuevo = await this.clienteModel.create({ nombre, apellido, email, telefono }); // Llama al modelo para crear
      res.status(201).json({ success: true, message: 'Cliente creado', data: nuevo }); // Respuesta 201 con el nuevo cliente
    } catch (error) {
      if (['El email ya está en uso', 'Formato de email no válido', 'Faltan campos requeridos: nombre, apellido, email'].includes(error.message)) { // Maneja errores específicos del modelo
        return res.status(400).json({ success: false, message: error.message }); // Error 400 para validaciones
      }
      res.status(500).json({ success: false, message: 'Error al crear cliente', error: error.message }); // Error 500 general
    }
  }

  async update(req, res) { // Método para actualizar un cliente: responde a PUT /:id con body parcial
    try {
      const { id } = req.params; // Extrae ID de params
      if (Object.keys(req.body).length === 0) { // Valida que body no esté vacío
        return res.status(400).json({ success: false, message: 'El body no puede estar vacío' }); // Error 400
      }
      const actualizado = await this.clienteModel.update(id, req.body); // Llama al modelo para actualizar
      res.json({ success: true, message: 'Cliente actualizado', data: actualizado }); // Envía actualizado
    } catch (error) {
      if (['Cliente no encontrado', 'El email ya está en uso', 'Formato de email no válido'].includes(error.message)) { // Errores específicos
        return res.status(error.message === 'Cliente no encontrado' ? 404 : 400) // 404 si no encontrado, 400 para otros
          .json({ success: false, message: error.message });
      }
      res.status(500).json({ success: false, message: 'Error al actualizar cliente', error: error.message }); // 500 general
    }
  }

  async delete(req, res) { // Método para eliminar un cliente: responde a DELETE /:id
    try {
      const eliminado = await this.clienteModel.delete(req.params.id); // Llama al modelo para eliminar y obtener el eliminado
      res.json({ success: true, message: 'Cliente eliminado', data: eliminado }); // Envía confirmación con datos eliminados
    } catch (error) {
      if (error.message === 'Cliente no encontrado') { // Si no existe
        return res.status(404).json({ success: false, message: error.message }); // 404
      }
      res.status(500).json({ success: false, message: 'Error al eliminar cliente', error: error.message }); // 500 general
    }
  }
}

export default ClientesController; // Exporta la clase para usarla en las rutas