import express from 'express'; // Importa Express, el framework para crear el servidor web y manejar rutas/middlewares
import path from 'path'; // Módulo nativo de Node.js para manejar rutas de archivos y directorios
import { fileURLToPath } from 'url'; // Función para obtener la ruta del archivo actual en módulos ES6 (import/export)
import methodOverride from 'method-override'; // Middleware para simular métodos HTTP como PUT/DELETE en formularios HTML (usando _method)
import empleadosRouter from './routes/empleados.js'; // Importa el router específico para rutas de empleados (API y vistas)
import tareasRouter from './routes/tareas.js'; // Router para tareas
import pedidosRouter from './routes/pedidos.js'; // Router para pedidos
import insumosRouter from './routes/insumos.js'; // Router para insumos
import Empleado from './models/Empleado.js'; // Modelo de Empleado para interactuar con datos JSON de empleados
import Tarea from './models/Tarea.js'; // Modelo de Tarea
import Pedido from './models/Pedido.js'; // Modelo de Pedido
import Insumo from './models/Insumo.js'; // Modelo de Insumo
import PedidosController from './controllers/pedidosController.js'; // Controlador de Pedidos para lógica específica (ej: renderizar vistas)
import clientesRoutes from './routes/clientes.js'; // Router para clientes (nota: nombre 'clientesRoutes' en lugar de clientesRouter)

const app = express(); // Crea la instancia principal de la aplicación Express
const empleadoModel = new Empleado(); // Instancia del modelo Empleado para usar en rutas de vistas (getAll, create, etc.)
const tareaModel = new Tarea(); // Instancia del modelo Tarea
const pedidoModel = new Pedido(); // Instancia del modelo Pedido (no usada directamente aquí, pero disponible)
const insumoModel = new Insumo(); // Instancia del modelo Insumo
const pedidosController = new PedidosController(); // Instancia del controlador de Pedidos para métodos como renderIndex

// Configuración de Pug
const __filename = fileURLToPath(import.meta.url); // Obtiene la ruta del archivo actual (app.js)
const __dirname = path.dirname(__filename); // Obtiene el directorio del archivo actual
app.set('view engine', 'pug'); // Configura Pug como motor de plantillas para renderizar vistas HTML dinámicas
app.set('views', path.join(__dirname, 'views')); // Establece el directorio 'views' como ubicación de las plantillas Pug

// Middleware
app.use(express.json()); // Middleware para parsear cuerpos de request en JSON (para APIs)
app.use(express.urlencoded({ extended: true })); // Middleware para parsear datos de formularios URL-encoded (para POST desde HTML)
app.use(methodOverride('_method')); // Middleware para override de métodos HTTP (ej: simular PUT/DELETE en forms con input _method)

// Rutas API
app.use('/api/empleados', empleadosRouter); // Monta el router de empleados en /api/empleados (todas las rutas dentro se prefijan)
app.use('/api/tareas', tareasRouter); // Monta router de tareas en /api/tareas
app.use('/api/pedidos', pedidosRouter); // Monta router de pedidos en /api/pedidos
app.use('/api/insumos', insumosRouter); // Monta router de insumos en /api/insumos
app.use('/api/clientes', clientesRoutes); // Monta router de clientes en /api/clientes

// Rutas para vistas Pug
app.get('/', (req, res) => res.redirect('/tareas')); // Ruta raíz: redirige a /tareas (página principal de tareas)

app.get('/empleados', async (req, res) => { // Vista lista de empleados: GET /empleados
    try { // Bloque try-catch para manejar errores
        const empleados = await empleadoModel.getAll(); // Obtiene todos los empleados del modelo (lee JSON)
        res.render('empleados/index', { page: 'empleados', empleados }); // Renderiza plantilla Pug 'empleados/index' pasando datos (page para navbar, empleados para tabla)
    } catch (error) { // Si error (ej: archivo no legible)
        res.render('error', { error: 'Error al cargar empleados', code: 500 }); // Renderiza página de error con mensaje y código 500
    }
});

app.get('/empleados/nuevo', (req, res) => { // Vista formulario nuevo empleado: GET /empleados/nuevo
    res.render('empleados/nuevo', { page: 'empleados' }); // Renderiza formulario vacío, pasando 'page' para navegación
});

app.post('/empleados/nuevo', async (req, res) => { // Crea empleado desde form: POST /empleados/nuevo
    try {
        await empleadoModel.create(req.body); // Crea el empleado usando datos del body (valida y guarda en JSON)
        res.redirect('/empleados'); // Redirige a lista de empleados si éxito
    } catch (error) { // Si error (ej: validación falla)
        res.render('error', { error: 'Error al crear empleado', code: 500 }); // Muestra error
    }
});

app.get('/empleados/editar/:id', async (req, res) => { // Vista editar empleado: GET /empleados/editar/:id
    try {
        const { id } = req.params; // Extrae ID de parámetros de URL
        const empleado = await empleadoModel.getById(id); // Busca empleado por ID
        if (!empleado) { // Si no existe
            return res.render('error', { error: 'Empleado no encontrado', code: 404 }); // Error 404
        }
        res.render('empleados/editar', { page: 'empleados', empleado }); // Renderiza form con datos prellenados
    } catch (error) {
        res.render('error', { error: 'Error al cargar empleado', code: 500 }); // Error general
    }
});

app.post('/empleados/editar/:id', async (req, res) => { // Actualiza empleado: POST /empleados/editar/:id (simulado como PUT)
    try {
        const { id } = req.params; // ID
        const empleado = await empleadoModel.getById(id); // Verifica existencia
        if (!empleado) { // No existe
            return res.render('error', { error: 'Empleado no encontrado', code: 404 });
        }
        await empleadoModel.update(id, req.body); // Actualiza con datos del form
        res.redirect('/empleados'); // Redirige a lista
    } catch (error) {
        res.render('error', { error: 'Error al actualizar empleado', code: 500 });
    }
});

app.post('/empleados/eliminar/:id', async (req, res) => { // Elimina empleado: POST /empleados/eliminar/:id (simulado DELETE)
    try {
        const { id } = req.params; // ID
        const resultado = await empleadoModel.delete(id); // Elimina y obtiene resultado (objeto con ID)
        if (!resultado) { // Si no se eliminó (no encontrado)
            return res.render('error', { error: 'Empleado no encontrado', code: 404 });
        }
        res.redirect('/empleados'); // Redirige
    } catch (error) {
        res.render('error', { error: 'Error al eliminar empleado', code: 500 });
    }
});

app.get('/tareas', async (req, res) => { // Vista lista de tareas: GET /tareas
    try {
        const tareas = await tareaModel.getAll(); // Obtiene todas las tareas (sin filtros aquí)
        const empleados = await empleadoModel.getAll(); // Obtiene empleados (para asignaciones en vista)
        res.render('tareas/index', { page: 'tareas', tareas, empleados }); // Renderiza con datos
    } catch (error) {
        res.render('error', { error: 'Error al cargar tareas', code: 500 });
    }
});

app.get('/tareas/nueva', async (req, res) => { // Vista nuevo tarea: GET /tareas/nueva
    try {
        const empleados = await empleadoModel.getAll(); // Empleados para select de asignación
        res.render('tareas/nueva', { page: 'tareas', empleados }); // Renderiza form
    } catch (error) {
        res.render('error', { error: 'Error al cargar formulario', code: 500 });
    }
});

app.post('/tareas/nueva', async (req, res) => { // Crea tarea: POST /tareas/nueva
    try {
        await tareaModel.create(req.body); // Crea con datos del form
        res.redirect('/tareas'); // Redirige
    } catch (error) {
        res.render('error', { error: 'Error al crear tarea', code: 500 });
    }
});

app.get('/tareas/editar/:id', async (req, res) => { // Editar tarea: GET /tareas/editar/:id
    try {
        const { id } = req.params; // ID
        const tarea = await tareaModel.getById(id); // Busca tarea
        const empleados = await empleadoModel.getAll(); // Empleados para form
        if (!tarea) { // No encontrada
            return res.render('error', { error: 'Tarea no encontrada', code: 404 });
        }
        res.render('tareas/editar', { page: 'tareas', tarea, empleados }); // Renderiza con datos
    } catch (error) {
        res.render('error', { error: 'Error al cargar tarea', code: 500 });
    }
});

app.post('/tareas/editar/:id', async (req, res) => { // Actualiza tarea: POST /tareas/editar/:id
    try {
        const { id } = req.params; // ID
        const tarea = await tareaModel.getById(id); // Verifica
        if (!tarea) {
            return res.render('error', { error: 'Tarea no encontrada', code: 404 });
        }
        await tareaModel.update(id, req.body); // Actualiza
        res.redirect('/tareas');
    } catch (error) {
        res.render('error', { error: 'Error al actualizar tarea', code: 500 });
    }
});

app.post('/tareas/eliminar/:id', async (req, res) => { // Elimina tarea: POST /tareas/eliminar/:id
    try {
        const { id } = req.params; // ID
        const resultado = await tareaModel.delete(id); // Elimina y obtiene eliminada
        if (!resultado) { // No encontrada
            return res.render('error', { error: 'Tarea no encontrada', code: 404 });
        }
        res.redirect('/tareas');
    } catch (error) {
        res.render('error', { error: 'Error al eliminar tarea', code: 500 });
    }
});

app.get('/pedidos', pedidosController.renderIndex.bind(pedidosController)); // Vista pedidos: GET /pedidos - usa método del controlador (bind para contexto)

app.get('/pedidos/nuevo', pedidosController.renderNuevo.bind(pedidosController)); // Nuevo pedido: GET /pedidos/nuevo - renderiza form con clientes

app.post('/pedidos/nuevo', async (req, res) => { // Crea pedido: POST /pedidos/nuevo
    try {
        await pedidosController.create(req, res); // Llama directamente al método create del controlador (maneja validaciones complejas)
    } catch (error) { // Si error
        res.render('error', { error: 'Error al crear pedido', code: 500 });
    }
});

app.get('/pedidos/editar/:id', pedidosController.renderEditar.bind(pedidosController)); // Editar pedido: GET /pedidos/editar/:id - renderiza con datos

app.post('/pedidos/editar/:id', async (req, res) => { // Actualiza pedido: POST /pedidos/editar/:id
    try {
        const { id } = req.params; // ID
        req.params.id = id; // Asegura param en req (para controlador)
        await pedidosController.update(req, res); // Llama update (complejo, parsea itemsText)
    } catch (error) {
        console.error('Error en POST /pedidos/editar/:id:', error); // Log específico
        res.render('error', { error: 'Error al actualizar pedido', code: 500 });
    }
});

app.post('/pedidos/eliminar/:id', async (req, res) => { // Elimina pedido: POST /pedidos/eliminar/:id
    try {
        const { id } = req.params; // ID
        req.params.id = id; // Set param
        await pedidosController.delete(req, res); // Llama delete
    } catch (error) {
        res.render('error', { error: 'Error al eliminar pedido', code: 500 });
    }
});

app.get('/insumos', async (req, res) => { // Vista insumos: GET /insumos
    try {
        const insumos = await insumoModel.getAll(); // Obtiene todos
        res.render('insumos/index', { page: 'insumos', insumos }); // Renderiza tabla
    } catch (error) {
        res.render('error', { error: 'Error al cargar insumos', code: 500 });
    }
});

app.get('/insumos/nuevo', (req, res) => { // Nuevo insumo: GET /insumos/nuevo
    res.render('insumos/nuevo', { page: 'insumos' }); // Form vacío
});

app.post('/insumos/nuevo', async (req, res) => { // Crea insumo: POST /insumos/nuevo
    try {
        await insumoModel.create(req.body); // Crea
        res.redirect('/insumos');
    } catch (error) {
        res.render('error', { error: 'Error al crear insumo', code: 500 });
    }
});

app.get('/insumos/editar/:id', async (req, res) => { // Editar insumo: GET /insumos/editar/:id
    try {
        const { id } = req.params; // ID
        const insumo = await insumoModel.getById(id); // Busca
        if (!insumo) {
            return res.render('error', { error: 'Insumo no encontrado', code: 404 });
        }
        res.render('insumos/editar', { page: 'insumos', insumo }); // Form prellenado
    } catch (error) {
        res.render('error', { error: 'Error al cargar insumo', code: 500 });
    }
});

app.post('/insumos/editar/:id', async (req, res) => { // Actualiza insumo: POST /insumos/editar/:id
    try {
        const { id } = req.params; // ID
        const insumo = await insumoModel.getById(id); // Verifica
        if (!insumo) {
            return res.render('error', { error: 'Insumo no encontrado', code: 404 });
        }
        await insumoModel.update(id, req.body); // Actualiza
        res.redirect('/insumos');
    } catch (error) {
        res.render('error', { error: 'Error al actualizar insumo', code: 500 });
    }
});

app.post('/insumos/eliminar/:id', async (req, res) => { // Elimina insumo: POST /insumos/eliminar/:id
    try {
        const { id } = req.params; // ID
        const resultado = await insumoModel.delete(id); // Elimina (retorna true si éxito)
        if (!resultado) { // No eliminado
            return res.render('error', { error: 'Insumo no encontrado', code: 404 });
        }
        res.redirect('/insumos');
    } catch (error) {
        res.render('error', { error: 'Error al eliminar insumo', code: 500 });
    }
});

app.get('/filtros', async (req, res) => { // Vista filtros (probablemente para tareas): GET /filtros
    try {
        const empleados = await empleadoModel.getAll(); // Empleados para filtros
        res.render('filters', { page: 'filtros', empleados }); // Renderiza página de filtros
    } catch (error) {
        res.render('error', { error: 'Error al cargar filtros', code: 500 });
    }
});

app.get('/tareas/filtrar', async (req, res) => { // Aplica filtros a tareas: GET /tareas/filtrar?query=params
    try {
        const tareas = await tareaModel.filtrar(req.query); // Filtra tareas usando params de query (ej: estado=pendiente)
        const empleados = await empleadoModel.getAll(); // Empleados para vista
        res.render('tareas/index', { page: 'tareas', tareas, empleados, filtros: req.query }); // Renderiza con filtros aplicados y params para mantener estado
    } catch (error) {
        res.render('error', { error: 'Error al filtrar tareas', code: 500 });
    }
});

// Manejo de errores
app.use((req, res) => { // Middleware 404: si ninguna ruta coincide
    res.status(404).render('error', { error: 'Página no encontrada', code: 404 }); // Renderiza error 404
});

app.use((err, req, res, next) => { // Middleware global de errores: captura errores no manejados
    console.error(err.stack); // Log del stack trace
    res.status(500).render('error', { error: 'Error del servidor', code: 500 }); // Renderiza error 500 genérico
});

// Iniciar servidor
const PORT = process.env.PORT || 3000; // Puerto: usa variable de entorno o 3000 por defecto
app.listen(PORT, () => { // Inicia el servidor en el puerto
    console.log(`Servidor corriendo en http://localhost:${PORT}`); // Mensaje de confirmación en consola
});