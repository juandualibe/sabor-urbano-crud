import { promises as fs } from 'fs'; // Importa promesas de fs para I/O asíncrono
import { join, dirname } from 'path'; // Para manejar rutas
import { fileURLToPath } from 'url'; // Para ruta actual en ES6

class Insumo {
    constructor() { // Constructor inicializa la ruta al archivo JSON de insumos
        const __filename = fileURLToPath(import.meta.url); // Archivo actual
        const __dirname = dirname(__filename); // Directorio actual
        this.filePath = join(__dirname, '../data/insumos.json'); // Ruta completa al JSON
    }

    async getAll() { // Obtiene todos los insumos del JSON
        try {
            const data = await fs.readFile(this.filePath, 'utf8'); // Lee archivo
            const json = JSON.parse(data); // Parsea JSON
            return json.insumos || []; // Retorna array o vacío
        } catch (error) {
            console.error('Error al leer insumos:', error); // Log error
            return []; // Vacío en error
        }
    }

    async getById(id) { // Busca insumo por ID
        try {
            const insumos = await this.getAll(); // Todos los insumos
            return insumos.find(insumo => insumo.id === parseInt(id)); // Encuentra y retorna, null si no
        } catch (error) {
            console.error('Error al obtener insumo por ID:', error); // Log
            return null; // Null en error
        }
    }

    async getBajoStock() { // Obtiene insumos con stock bajo o cero
        try {
            const insumos = await this.getAll(); // Todos
            return insumos.filter(insumo => insumo.stock <= insumo.stockMinimo); // Filtra por stock <= mínimo
        } catch (error) {
            console.error('Error al obtener insumos con stock bajo:', error); // Log
            return []; // Vacío
        }
    }

    async getByCategoria(categoria) { // Filtra insumos por categoría
        try {
            const insumos = await this.getAll(); // Todos
            return insumos.filter(insumo => insumo.categoria === categoria); // Coincide categoría
        } catch (error) {
            console.error('Error al filtrar por categoría:', error); // Log
            return []; // Vacío
        }
    }

    async create(nuevoInsumo) { // Crea nuevo insumo
        try {
            const insumos = await this.getAll(); // Todos existentes
            const nuevoId = insumos.length > 0 ? Math.max(...insumos.map(i => i.id)) + 1 : 1; // Nuevo ID
            const insumo = { // Objeto nuevo
                id: nuevoId,
                nombre: nuevoInsumo.nombre,
                categoria: nuevoInsumo.categoria,
                stock: parseInt(nuevoInsumo.stock) || 0, // Stock como entero, 0 por defecto
                stockMinimo: parseInt(nuevoInsumo.stockMinimo) || 5, // Mínimo, 5 por defecto
                unidadMedida: nuevoInsumo.unidadMedida,
                proveedor: nuevoInsumo.proveedor,
                ultimaActualizacion: new Date().toISOString(), // Fecha actual ISO
                estado: this.determinarEstado(nuevoInsumo.stock, nuevoInsumo.stockMinimo) // Estado basado en stock
            };
            insumos.push(insumo); // Agrega
            await this.saveAll(insumos); // Guarda
            return insumo; // Retorna
        } catch (error) {
            console.error('Error al crear insumo:', error); // Log
            throw error; // Relanza
        }
    }

    async actualizarStock(id, nuevoStock) { // Actualiza stock de un insumo a un valor absoluto
        try {
            const insumos = await this.getAll(); // Todos
            const index = insumos.findIndex(insumo => insumo.id === parseInt(id)); // Índice
            if (index === -1) { // No encontrado
                throw new Error('Insumo no encontrado');
            }
            const stockActualizado = parseInt(nuevoStock); // Nuevo stock entero
            const estado = this.determinarEstado(stockActualizado, insumos[index].stockMinimo); // Nuevo estado
            insumos[index] = { // Actualiza objeto
                ...insumos[index],
                stock: stockActualizado,
                estado: estado,
                ultimaActualizacion: new Date().toISOString()
            };
            await this.saveAll(insumos); // Guarda
            return insumos[index]; // Retorna actualizado
        } catch (error) {
            console.error('Error al actualizar stock:', error); // Log
            throw error;
        }
    }

    async descontarStock(id, cantidad) { // Resta cantidad al stock de un insumo
        try {
            const insumo = await this.getById(id); // Obtiene el insumo
            if (!insumo) { // No existe
                throw new Error('Insumo no encontrado');
            }
            const nuevoStock = insumo.stock - parseInt(cantidad); // Calcula nuevo stock
            if (nuevoStock < 0) { // Si negativo
                throw new Error('Stock insuficiente');
            }
            return await this.actualizarStock(id, nuevoStock); // Actualiza y retorna
        } catch (error) {
            console.error('Error al descontar stock:', error); // Log
            throw error;
        }
    }

    determinarEstado(stock, stockMinimo) { // Método privado: determina el estado basado en stock vs mínimo
        if (stock <= stockMinimo) { // Bajo o igual al mínimo
            return 'bajo_stock';
        } else if (stock === 0) { // Exactamente cero
            return 'sin_stock';
        } else { // Mayor al mínimo
            return 'disponible';
        }
    }

    async getAlertas() { // Obtiene alertas para insumos con stock bajo
        try {
            const insumosConBajoStock = await this.getBajoStock(); // Obtiene bajos stock
            return insumosConBajoStock.map(insumo => ({ // Mapea a objeto simplificado para alerta
                id: insumo.id,
                nombre: insumo.nombre,
                stockActual: insumo.stock,
                stockMinimo: insumo.stockMinimo,
                estado: insumo.estado,
                proveedor: insumo.proveedor
            }));
        } catch (error) {
            console.error('Error al obtener alertas:', error); // Log
            return []; // Vacío
        }
    }

    async update(id, datosActualizados) { // Actualiza campos de un insumo
        try {
            const insumos = await this.getAll(); // Todos
            const index = insumos.findIndex(insumo => insumo.id === parseInt(id)); // Índice
            if (index === -1) { // No encontrado
                throw new Error('Insumo no encontrado');
            }
            if (datosActualizados.stock !== undefined) { // Si se actualiza stock
                datosActualizados.estado = this.determinarEstado( // Calcula nuevo estado
                    parseInt(datosActualizados.stock),
                    datosActualizados.stockMinimo || insumos[index].stockMinimo // Usa nuevo mínimo o actual
                );
                datosActualizados.ultimaActualizacion = new Date().toISOString(); // Actualiza fecha
            }
            insumos[index] = { ...insumos[index], ...datosActualizados }; // Fusiona
            await this.saveAll(insumos); // Guarda
            return insumos[index]; // Retorna
        } catch (error) {
            console.error('Error al actualizar insumo:', error); // Log
            throw error;
        }
    }

    async delete(id) { // Elimina un insumo por ID
        try {
            const insumos = await this.getAll(); // Todos
            const insumosFiltrados = insumos.filter(insumo => insumo.id !== parseInt(id)); // Filtra sin el ID
            if (insumos.length === insumosFiltrados.length) { // Si no se eliminó nada
                throw new Error('Insumo no encontrado');
            }
            await this.saveAll(insumosFiltrados); // Guarda filtrados
            return true; // Confirma eliminación
        } catch (error) {
            console.error('Error al eliminar insumo:', error); // Log
            throw error;
        }
    }

    async saveAll(insumos) { // Guarda array completo en JSON
        try {
            const data = JSON.stringify({ insumos }, null, 2); // Formatea JSON
            await fs.writeFile(this.filePath, data, 'utf8'); // Escribe
        } catch (error) {
            console.error('Error al guardar insumos:', error); // Log
            throw error;
        }
    }
}

export default Insumo; // Exporta clase