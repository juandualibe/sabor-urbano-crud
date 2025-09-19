import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

class Insumo {
    constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        this.filePath = join(__dirname, '../data/insumos.json');
    }

    async getAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            const json = JSON.parse(data);
            return json.insumos || [];
        } catch (error) {
            console.error('Error al leer insumos:', error);
            return [];
        }
    }

    async getById(id) {
        try {
            const insumos = await this.getAll();
            return insumos.find(insumo => insumo.id === parseInt(id));
        } catch (error) {
            console.error('Error al obtener insumo por ID:', error);
            return null;
        }
    }

    async getBajoStock() {
        try {
            const insumos = await this.getAll();
            return insumos.filter(insumo => insumo.stock <= insumo.stockMinimo);
        } catch (error) {
            console.error('Error al obtener insumos con stock bajo:', error);
            return [];
        }
    }

    async getByCategoria(categoria) {
        try {
            const insumos = await this.getAll();
            return insumos.filter(insumo => insumo.categoria === categoria);
        } catch (error) {
            console.error('Error al filtrar por categoría:', error);
            return [];
        }
    }

    async create(nuevoInsumo) {
        try {
            const insumos = await this.getAll();
            const nuevoId = insumos.length > 0 ? Math.max(...insumos.map(i => i.id)) + 1 : 1;
            const insumo = {
                id: nuevoId,
                nombre: nuevoInsumo.nombre,
                categoria: nuevoInsumo.categoria,
                stock: parseInt(nuevoInsumo.stock) || 0,
                stockMinimo: parseInt(nuevoInsumo.stockMinimo) || 5,
                unidadMedida: nuevoInsumo.unidadMedida,
                proveedor: nuevoInsumo.proveedor,
                ultimaActualizacion: new Date().toISOString(),
                estado: this.determinarEstado(nuevoInsumo.stock, nuevoInsumo.stockMinimo)
            };
            insumos.push(insumo);
            await this.saveAll(insumos);
            return insumo;
        } catch (error) {
            console.error('Error al crear insumo:', error);
            throw error;
        }
    }

    async actualizarStock(id, nuevoStock) {
        try {
            const insumos = await this.getAll();
            const index = insumos.findIndex(insumo => insumo.id === parseInt(id));
            if (index === -1) {
                throw new Error('Insumo no encontrado');
            }
            const stockActualizado = parseInt(nuevoStock);
            const estado = this.determinarEstado(stockActualizado, insumos[index].stockMinimo);
            insumos[index] = {
                ...insumos[index],
                stock: stockActualizado,
                estado: estado,
                ultimaActualizacion: new Date().toISOString()
            };
            await this.saveAll(insumos);
            return insumos[index];
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            throw error;
        }
    }

    async descontarStock(id, cantidad) {
        try {
            const insumo = await this.getById(id);
            if (!insumo) {
                throw new Error('Insumo no encontrado');
            }
            const nuevoStock = insumo.stock - parseInt(cantidad);
            if (nuevoStock < 0) {
                throw new Error('Stock insuficiente');
            }
            return await this.actualizarStock(id, nuevoStock);
        } catch (error) {
            console.error('Error al descontar stock:', error);
            throw error;
        }
    }

    determinarEstado(stock, stockMinimo) {
        if (stock <= stockMinimo) {
            return 'bajo_stock';
        } else if (stock === 0) {
            return 'sin_stock';
        } else {
            return 'disponible';
        }
    }

    async getAlertas() {
        try {
            const insumosConBajoStock = await this.getBajoStock();
            return insumosConBajoStock.map(insumo => ({
                id: insumo.id,
                nombre: insumo.nombre,
                stockActual: insumo.stock,
                stockMinimo: insumo.stockMinimo,
                estado: insumo.estado,
                proveedor: insumo.proveedor
            }));
        } catch (error) {
            console.error('Error al obtener alertas:', error);
            return [];
        }
    }

    async update(id, datosActualizados) {
        try {
            const insumos = await this.getAll();
            const index = insumos.findIndex(insumo => insumo.id === parseInt(id));
            if (index === -1) {
                throw new Error('Insumo no encontrado');
            }
            if (datosActualizados.stock !== undefined) {
                datosActualizados.estado = this.determinarEstado(
                    parseInt(datosActualizados.stock),
                    datosActualizados.stockMinimo || insumos[index].stockMinimo
                );
                datosActualizados.ultimaActualizacion = new Date().toISOString();
            }
            insumos[index] = { ...insumos[index], ...datosActualizados };
            await this.saveAll(insumos);
            return insumos[index];
        } catch (error) {
            console.error('Error al actualizar insumo:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const insumos = await this.getAll();
            const insumosFiltrados = insumos.filter(insumo => insumo.id !== parseInt(id));
            if (insumos.length === insumosFiltrados.length) {
                throw new Error('Insumo no encontrado');
            }
            await this.saveAll(insumosFiltrados);
            return true;
        } catch (error) {
            console.error('Error al eliminar insumo:', error);
            throw error;
        }
    }

    async saveAll(insumos) {
        try {
            const data = JSON.stringify({ insumos }, null, 2);
            await fs.writeFile(this.filePath, data, 'utf8');
        } catch (error) {
            console.error('Error al guardar insumos:', error);
            throw error;
        }
    }
}

export default Insumo;