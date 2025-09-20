import { promises as fs } from 'fs'; // Importamos promesas de fs para operaciones asíncronas con archivos
import { join, dirname } from 'path'; // Módulos para construir y manejar rutas de archivos
import { fileURLToPath } from 'url'; // Para obtener la ruta del archivo actual en ES6 modules

class Empleado {
    constructor() { // Constructor: se llama al instanciar la clase, configura la ruta al archivo JSON
        const __filename = fileURLToPath(import.meta.url); // Obtiene el nombre del archivo actual
        const __dirname = dirname(__filename); // Obtiene el directorio del archivo actual
        this.filePath = join(__dirname, '../data/empleados.json'); // Construye la ruta al archivo de empleados
    }

    async getAll() { // Obtiene todos los empleados del archivo JSON
        try { // Bloque para manejar errores
            const data = await fs.readFile(this.filePath, 'utf8'); // Lee el archivo de forma asíncrona
            const json = JSON.parse(data); // Convierte el JSON a objeto JavaScript
            return json.empleados || []; // Retorna el array de empleados o vacío si no existe
        } catch (error) { // Captura errores de lectura o parseo
            console.error('Error al leer empleados:', error); // Imprime el error
            return []; // Retorna array vacío en caso de error
        }
    }

    async getRoles() { // Obtiene la lista de roles desde un archivo separado
        try {
            const rolesPath = join(dirname(this.filePath), 'roles.json'); // Construye ruta al archivo de roles
            const data = await fs.readFile(rolesPath, 'utf8'); // Lee el archivo
            return JSON.parse(data); // Parsea y retorna el JSON
        } catch (error) { // Maneja errores
            console.error('Error al leer roles:', error); // Imprime error
            return []; // Retorna vacío
        }
    }

    async getAreas() { // Obtiene la lista de áreas desde un archivo separado
        try {
            const areasPath = join(dirname(this.filePath), 'areas.json'); // Ruta al archivo de áreas
            const data = await fs.readFile(areasPath, 'utf8'); // Lee el archivo
            return JSON.parse(data); // Parsea y retorna
        } catch (error) { // Maneja errores
            console.error('Error al leer áreas:', error); // Imprime error
            return []; // Retorna vacío
        }
    }
    
    async getById(id) { // Obtiene un empleado por su ID
        try {
            const empleados = await this.getAll(); // Obtiene todos los empleados
            return empleados.find(empleado => empleado.id === parseInt(id)); // Busca y retorna el que coincida, null si no
        } catch (error) { // Maneja errores
            console.error('Error al obtener empleado por ID:', error); // Imprime error
            return null; // Retorna null en error
        }
    }

    async getByRol(rol) { // Filtra empleados por rol y solo los activos
        try {
            const empleados = await this.getAll(); // Obtiene todos
            return empleados.filter(empleado =>  // Filtra por rol y activo
                empleado.rol === rol && empleado.activo // Solo si rol coincide y está activo
            );
        } catch (error) {
            console.error('Error al filtrar por rol:', error); // Imprime error
            return []; // Retorna vacío
        }
    }

    async getByArea(area) { // Filtra empleados por área y solo los activos
        try {
            const empleados = await this.getAll(); // Obtiene todos
            return empleados.filter(empleado =>  // Filtra por área y activo
                empleado.area === area && empleado.activo // Coincide área y activo
            );
        } catch (error) {
            console.error('Error al filtrar por área:', error); // Imprime error
            return []; // Retorna vacío
        }
    }
    
    async create(nuevoEmpleado) { // Crea un nuevo empleado con los datos dados
        try {
            const emailUnico = await this.validarEmailUnico(nuevoEmpleado.email); // Verifica si el email es único
            if (!emailUnico) { // Si no lo es
                throw new Error('El email ya está en uso'); // Lanza error
            }
            const empleados = await this.getAll(); // Obtiene todos los existentes
            const nuevoId = empleados.length > 0 ? Math.max(...empleados.map(e => e.id)) + 1 : 1; // Genera nuevo ID
            const empleado = { // Crea el objeto del nuevo empleado
                id: nuevoId, // ID generado
                nombre: nuevoEmpleado.nombre, // Nombre proporcionado
                apellido: nuevoEmpleado.apellido, // Apellido
                email: nuevoEmpleado.email, // Email
                telefono: nuevoEmpleado.telefono, // Teléfono
                rol: nuevoEmpleado.rol, // Rol
                area: nuevoEmpleado.area, // Área
                fechaIngreso: nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0] // Fecha de ingreso, hoy si no se da
            };
            empleados.push(empleado); // Agrega al array
            await this.saveAll(empleados); // Guarda en archivo
            return empleado; // Retorna el creado
        } catch (error) { // Maneja errores
            console.error('Error al crear empleado:', error); // Imprime
            throw error; // Relanza
        }
    }

    async update(id, datosActualizados) { // Actualiza un empleado por ID con nuevos datos
        try {
            const empleados = await this.getAll(); // Obtiene todos
            const index = empleados.findIndex(empleado => empleado.id === parseInt(id)); // Encuentra índice
            if (index === -1) { // Si no existe
                throw new Error('Empleado no encontrado'); // Lanza error
            }
            if (datosActualizados.email) { // Si se actualiza email
                const emailUnico = await this.validarEmailUnico(datosActualizados.email, parseInt(id)); // Verifica unicidad excluyendo actual
                if (!emailUnico) { // Si no es único
                    throw new Error('El email ya está en uso'); // Error
                }
            }
            empleados[index] = { ...empleados[index], ...datosActualizados }; // Fusiona datos nuevos con el existente
            await this.saveAll(empleados); // Guarda
            return empleados[index]; // Retorna actualizado
        } catch (error) {
            console.error('Error al actualizar empleado:', error); // Imprime
            throw error; // Relanza
        }
    }

    async delete(id) { // Elimina un empleado por ID
    try {
      // Leer el archivo JSON
      const data = await fs.readFile(this.filePath, 'utf-8'); // Lee el archivo
      let empleados = JSON.parse(data).empleados; // Parsea y obtiene array de empleados

      // Verificar si el empleado existe
      const empleadoIndex = empleados.findIndex(emp => emp.id === parseInt(id)); // Encuentra índice
      if (empleadoIndex === -1) { // Si no existe
        throw new Error('Empleado no encontrado'); // Error
      }

      // Filtrar el empleado con el id proporcionado
      empleados = empleados.filter(emp => emp.id !== parseInt(id)); // Crea nuevo array sin el ID

      // Guardar el archivo actualizado
      await fs.writeFile(this.filePath, JSON.stringify({ empleados }, null, 2)); // Guarda JSON formateado

      return { id: parseInt(id) }; // Retorna ID eliminado para confirmar
    } catch (error) {
      console.error('Error al eliminar empleado:', error); // Imprime
      throw error; // Relanza
    }
  }


    async validarEmailUnico(email, idExcluir = null) { // Valida si email es único, excluyendo opcional un ID
        try {
            const empleados = await this.getAll(); // Obtiene todos
            return !empleados.some(emp =>  // Retorna true si NO hay coincidencia
                emp.email === email &&  // Email coincide
                emp.id !== idExcluir &&  // No es el ID excluido
                emp.activo // Y está activo
            );
        } catch (error) {
            console.error('Error al validar email:', error); // Imprime
            return false; // En error, asume no único
        }
    }

    
    async saveAll(empleados) { // Guarda el array completo de empleados en el archivo
        try {
            const data = JSON.stringify({ empleados }, null, 2); // Convierte a JSON formateado
            await fs.writeFile(this.filePath, data, 'utf8'); // Escribe en archivo
        } catch (error) {
            console.error('Error al guardar empleados:', error); // Imprime
            throw error; // Relanza
        }
    }
}

export default Empleado; // Exporta la clase