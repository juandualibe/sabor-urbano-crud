// models/Cliente.js
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

class Cliente {
    constructor() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        this.filePath = join(__dirname, '../data/clientes.json');
    }

    async getAll() {
        try {
            const data = await fs.readFile(this.filePath, 'utf8');
            const json = JSON.parse(data);
            return json.clientes || [];
        } catch (error) {
            console.error('Error al leer clientes:', error);
            return [];
        }
    }

    async getById(id) {
        try {
            const clientes = await this.getAll();
            return clientes.find(cliente => cliente.id === parseInt(id)) || null;
        } catch (error) {
            console.error('Error al obtener cliente por ID:', error);
            return null;
        }
    }
}

export default Cliente;