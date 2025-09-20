// models/Cliente.js
import { promises as fs } from 'fs'; // Importamos las promesas de fs para operaciones asíncronas de lectura/escritura de archivos
import { join, dirname } from 'path'; // Módulos para manejar rutas de archivos
import { fileURLToPath } from 'url'; // Para obtener la ruta del archivo actual en módulos ES6

class Cliente {
  constructor() { // Constructor: se ejecuta al crear una instancia de Cliente, inicializa la ruta al archivo JSON
    const __filename = fileURLToPath(import.meta.url); // Obtiene la ruta del archivo actual
    const __dirname = dirname(__filename); // Obtiene el directorio del archivo actual
    this.filePath = join(__dirname, '../data/clientes.json'); // Construye la ruta completa al archivo de datos JSON
  }

  // Interno: leer archivo y devolver array
  async _leerArchivo() { // Método privado (con _ ) para leer el archivo JSON y retornar el array de clientes
    try { // Bloque try-catch para manejar errores
      const data = await fs.readFile(this.filePath, 'utf8'); // Lee el archivo de forma asíncrona, codificado en UTF-8
      const json = JSON.parse(data); // Parsea el JSON a un objeto JavaScript
      return Array.isArray(json.clientes) ? json.clientes : []; // Retorna el array de clientes si existe, sino un array vacío
    } catch (error) { // Captura cualquier error durante la lectura o parseo
      if (error.code === 'ENOENT') { // Si el archivo no existe (código ENOENT)
        // Si no existe, lo creamos vacío
        await this._guardarArchivo([]); // Llama al método para guardar un array vacío y crear el archivo
        return []; // Retorna array vacío
      }
      console.error('Error al leer clientes:', error); // Imprime el error en consola
      throw error; // Relanza el error para que quien llame al método lo maneje
    }
  }

  // Interno: guardar array
  async _guardarArchivo(clientes) { // Método privado para guardar el array de clientes en el archivo JSON
    const data = { clientes }; // Crea un objeto con la propiedad 'clientes' conteniendo el array
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf8'); // Escribe el JSON formateado (con indentación de 2 espacios) en el archivo
  }

  async getAll() { // Método público para obtener todos los clientes
    return await this._leerArchivo(); // Simplemente lee y retorna el array de todos los clientes
  }

  async getById(id) { // Método para obtener un cliente por su ID
    const clientes = await this._leerArchivo(); // Lee todos los clientes
    return clientes.find(c => c.id === parseInt(id)) || null; // Busca el primero que coincida con el ID (convertido a entero), retorna null si no existe
  }

  async validarEmailUnico(email, excluirId = null) { // Valida si un email es único, opcionalmente excluyendo un ID específico (para updates)
    const clientes = await this._leerArchivo(); // Lee todos los clientes
    const existe = clientes.find(c => // Busca si hay un cliente con el email (insensible a mayúsculas)
      c.email.toLowerCase() === email.toLowerCase() && // Compara emails en minúsculas
      (excluirId ? c.id !== parseInt(excluirId) : true) // Si se excluye ID, ignora ese cliente
    );
    return !existe; // Retorna true si no existe (es único), false si ya existe
  }

  async create(data) { // Crea un nuevo cliente con los datos proporcionados
    const clientes = await this._leerArchivo(); // Lee todos los clientes existentes

    // Validaciones mínimas
    if (!data.nombre || !data.apellido || !data.email) { // Verifica que los campos obligatorios estén presentes
      throw new Error('Faltan campos requeridos: nombre, apellido, email'); // Lanza error si faltan
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión regular para validar formato de email
    if (!emailRegex.test(data.email)) { // Verifica si el email coincide con el patrón
      throw new Error('Formato de email no válido'); // Lanza error si no es válido
    }
    const esUnico = await this.validarEmailUnico(data.email); // Verifica unicidad del email
    if (!esUnico) { // Si no es único
      throw new Error('El email ya está en uso'); // Lanza error
    }

    const nuevoId = clientes.length > 0 ? Math.max(...clientes.map(c => c.id)) + 1 : 1; // Genera nuevo ID: máximo actual +1, o 1 si es el primero
    const nuevo = { // Crea el objeto del nuevo cliente
      id: nuevoId, // ID generado
      nombre: data.nombre.trim(), // Nombre sin espacios extras al inicio/fin
      apellido: data.apellido.trim(), // Apellido sin espacios extras
      email: data.email.trim(), // Email sin espacios extras
      telefono: data.telefono ? data.telefono.trim() : '' // Teléfono opcional, vacío si no se proporciona
    };
    clientes.push(nuevo); // Agrega el nuevo cliente al array
    await this._guardarArchivo(clientes); // Guarda el array actualizado en el archivo
    return nuevo; // Retorna el nuevo cliente creado
  }

  async update(id, data) { // Actualiza un cliente existente por ID con los nuevos datos
    const clientes = await this._leerArchivo(); // Lee todos los clientes
    const idx = clientes.findIndex(c => c.id === parseInt(id)); // Encuentra el índice del cliente por ID
    if (idx === -1) throw new Error('Cliente no encontrado'); // Lanza error si no existe

    // Validar email si viene
    if (data.email !== undefined) { // Si se proporciona un nuevo email
      const email = data.email.trim(); // Lo limpia de espacios
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Expresión regular para email
      if (!emailRegex.test(email)) throw new Error('Formato de email no válido'); // Valida formato
      const esUnico = await this.validarEmailUnico(email, id); // Verifica unicidad excluyendo el ID actual
      if (!esUnico) throw new Error('El email ya está en uso'); // Lanza error si no es único
    }

    const anterior = clientes[idx]; // Guarda referencia al cliente anterior
    const actualizado = { // Crea el objeto actualizado combinando el anterior con los nuevos datos
      ...anterior, // Copia todas las propiedades del anterior
      ...(data.nombre !== undefined ? { nombre: data.nombre.trim() } : {}), // Actualiza nombre si se proporciona
      ...(data.apellido !== undefined ? { apellido: data.apellido.trim() } : {}), // Actualiza apellido si se proporciona
      ...(data.email !== undefined ? { email: data.email.trim() } : {}), // Actualiza email si se proporciona
      ...(data.telefono !== undefined ? { telefono: data.telefono.trim() } : {}) // Actualiza teléfono si se proporciona
    };

    clientes[idx] = actualizado; // Reemplaza en el array
    await this._guardarArchivo(clientes); // Guarda el array actualizado
    return actualizado; // Retorna el cliente actualizado
  }

  async delete(id) { // Elimina un cliente por ID
    const clientes = await this._leerArchivo(); // Lee todos los clientes
    const idx = clientes.findIndex(c => c.id === parseInt(id)); // Encuentra el índice
    if (idx === -1) throw new Error('Cliente no encontrado'); // Lanza error si no existe
    const eliminado = clientes.splice(idx, 1)[0]; // Elimina del array y guarda el eliminado
    await this._guardarArchivo(clientes); // Guarda el array actualizado
    return eliminado; // Retorna el cliente eliminado
  }

  async buscar({ nombre, apellido }) { // Busca clientes por nombre y/o apellido (parámetros opcionales)
    const clientes = await this._leerArchivo(); // Lee todos los clientes
    return clientes.filter(c => { // Filtra los que coincidan
      let ok = true; // Bandera para el filtro
      if (nombre) ok = ok && c.nombre.toLowerCase().includes(nombre.toLowerCase()); // Si se busca nombre, verifica si incluye (insensible a mayúsculas)
      if (apellido) ok = ok && c.apellido.toLowerCase().includes(apellido.toLowerCase()); // Lo mismo para apellido
      return ok; // Retorna solo si todas las condiciones son verdaderas
    });
  }
}

export default Cliente; // Exporta la clase para usarla en otros archivos