import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

class Empleado {
    constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        this.filePath = join(__dirname, '../data/empleados.json');
    }

    async getAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            const json = JSON.parse(data);
            return json.empleados || [];
        } catch (error) {
            console.error('Error al leer empleados:', error);
            return [];
        }
    }

    async getRoles() {
        try {
            const rolesPath = join(dirname(this.filePath), 'roles.json');
            const data = await fs.readFile(rolesPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error al leer roles:', error);
            return [];
        }
    }

    async getAreas() {
        try {
            const areasPath = join(dirname(this.filePath), 'areas.json');
            const data = await fs.readFile(areasPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Error al leer áreas:', error);
            return [];
        }
    }
    
    async getById(id) {
        try {
            const empleados = await this.getAll();
            return empleados.find(empleado => empleado.id === parseInt(id));
        } catch (error) {
            console.error('Error al obtener empleado por ID:', error);
            return null;
        }
    }

    async getByRol(rol) {
        try {
            const empleados = await this.getAll();
            return empleados.filter(empleado => 
                empleado.rol === rol && empleado.activo
            );
        } catch (error) {
            console.error('Error al filtrar por rol:', error);
            return [];
        }
    }

    async getByArea(area) {
        try {
            const empleados = await this.getAll();
            return empleados.filter(empleado => 
                empleado.area === area && empleado.activo
            );
        } catch (error) {
            console.error('Error al filtrar por área:', error);
            return [];
        }
    }
    
    async create(nuevoEmpleado) {
        try {
            const emailUnico = await this.validarEmailUnico(nuevoEmpleado.email);
            if (!emailUnico) {
                throw new Error('El email ya está en uso');
            }
            const empleados = await this.getAll();
            const nuevoId = empleados.length > 0 ? Math.max(...empleados.map(e => e.id)) + 1 : 1;
            const empleado = {
                id: nuevoId,
                nombre: nuevoEmpleado.nombre,
                apellido: nuevoEmpleado.apellido,
                email: nuevoEmpleado.email,
                telefono: nuevoEmpleado.telefono,
                rol: nuevoEmpleado.rol,
                area: nuevoEmpleado.area,
                fechaIngreso: nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0]
            };
            empleados.push(empleado);
            await this.saveAll(empleados);
            return empleado;
        } catch (error) {
            console.error('Error al crear empleado:', error);
            throw error;
        }
    }

    async update(id, datosActualizados) {
        try {
            const empleados = await this.getAll();
            const index = empleados.findIndex(empleado => empleado.id === parseInt(id));
            if (index === -1) {
                throw new Error('Empleado no encontrado');
            }
            if (datosActualizados.email) {
                const emailUnico = await this.validarEmailUnico(datosActualizados.email, parseInt(id));
                if (!emailUnico) {
                    throw new Error('El email ya está en uso');
                }
            }
            empleados[index] = { ...empleados[index], ...datosActualizados };
            await this.saveAll(empleados);
            return empleados[index];
        } catch (error) {
            console.error('Error al actualizar empleado:', error);
            throw error;
        }
    }

    async delete(id) {
    try {
      // Leer el archivo JSON
      const data = await fs.readFile(this.filePath, 'utf-8');
      let empleados = JSON.parse(data).empleados;

      // Verificar si el empleado existe
      const empleadoIndex = empleados.findIndex(emp => emp.id === parseInt(id));
      if (empleadoIndex === -1) {
        throw new Error('Empleado no encontrado');
      }

      // Filtrar el empleado con el id proporcionado
      empleados = empleados.filter(emp => emp.id !== parseInt(id));

      // Guardar el archivo actualizado
      await fs.writeFile(this.filePath, JSON.stringify({ empleados }, null, 2));

      return { id: parseInt(id) }; // Retornar el id del empleado eliminado
    } catch (error) {
      console.error('Error al eliminar empleado:', error);
      throw error;
    }
  }


    async validarEmailUnico(email, idExcluir = null) {
        try {
            const empleados = await this.getAll();
            return !empleados.some(emp => 
                emp.email === email && 
                emp.id !== idExcluir && 
                emp.activo
            );
        } catch (error) {
            console.error('Error al validar email:', error);
            return false;
        }
    }

    
    async saveAll(empleados) {
        try {
            const data = JSON.stringify({ empleados }, null, 2);
            await fs.writeFile(this.filePath, data, 'utf8');
        } catch (error) {
            console.error('Error al guardar empleados:', error);
            throw error;
        }
    }
}

export default Empleado;