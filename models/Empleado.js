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

    async validarRol(rol) {
        const roles = await this.getRoles();
        return roles.some(r => r.nombre === rol && r.activo);
    }

    async validarArea(area) {
        const areas = await this.getAreas();
        return areas.some(a => a.nombre === area && a.activa);
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

    async getActivos() {
        try {
            const empleados = await this.getAll();
            return empleados.filter(empleado => empleado.activo);
        } catch (error) {
            console.error('Error al obtener empleados activos:', error);
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
                fechaIngreso: nuevoEmpleado.fechaIngreso || new Date().toISOString().split('T')[0],
                activo: true
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
            return await this.update(id, { activo: false });
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

    async getEstadisticas() {
        try {
            const empleados = await this.getActivos();
            return {
                total: empleados.length,
                porRol: {
                    administrador: empleados.filter(e => e.rol === 'administrador').length,
                    cocinero: empleados.filter(e => e.rol === 'cocinero').length,
                    repartidor: empleados.filter(e => e.rol === 'repartidor').length,
                    mozo: empleados.filter(e => e.rol === 'mozo').length,
                    encargado_stock: empleados.filter(e => e.rol === 'encargado_stock').length
                },
                porArea: {
                    cocina: empleados.filter(e => e.area === 'cocina').length,
                    reparto: empleados.filter(e => e.area === 'reparto').length,
                    salon: empleados.filter(e => e.area === 'salon').length,
                    inventario: empleados.filter(e => e.area === 'inventario').length,
                    administracion: empleados.filter(e => e.area === 'administracion').length
                }
            };
        } catch (error) {
            console.error('Error al obtener estadísticas de empleados:', error);
            return {};
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