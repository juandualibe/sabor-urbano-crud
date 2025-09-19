import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import empleadosRouter from './routes/empleados.js';
import tareasRouter from './routes/tareas.js';
import pedidosRouter from './routes/pedidos.js';
import insumosRouter from './routes/insumos.js';
import Empleado from './models/Empleado.js';
import Tarea from './models/Tarea.js';
import Pedido from './models/Pedido.js';
import Insumo from './models/Insumo.js';

const app = express();
const empleadoModel = new Empleado();
const tareaModel = new Tarea();
const pedidoModel = new Pedido();
const insumoModel = new Insumo();

// Configuración de Pug
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas API
app.use('/api/empleados', empleadosRouter);
app.use('/api/tareas', tareasRouter);
app.use('/api/pedidos', pedidosRouter);
app.use('/api/insumos', insumosRouter);

// Rutas para vistas Pug
app.get('/', (req, res) => res.redirect('/tareas'));

app.get('/empleados', async (req, res) => {
    try {
        const empleados = await empleadoModel.getAll();
        res.render('empleados/index', { page: 'empleados', empleados });
    } catch (error) {
        res.render('error', { error: 'Error al cargar empleados', code: 500 });
    }
});

app.get('/empleados/nuevo', (req, res) => {
    res.render('empleados/nuevo', { page: 'empleados' });
});

app.post('/empleados/nuevo', async (req, res) => {
    try {
        await empleadoModel.create(req.body);
        res.redirect('/empleados');
    } catch (error) {
        res.render('error', { error: 'Error al crear empleado', code: 500 });
    }
});

app.get('/empleados/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await empleadoModel.getById(id);
        if (!empleado) {
            return res.render('error', { error: 'Empleado no encontrado', code: 404 });
        }
        res.render('empleados/editar', { page: 'empleados', empleado });
    } catch (error) {
        res.render('error', { error: 'Error al cargar empleado', code: 500 });
    }
});

app.post('/empleados/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const empleado = await empleadoModel.getById(id);
        if (!empleado) {
            return res.render('error', { error: 'Empleado no encontrado', code: 404 });
        }
        await empleadoModel.update(id, req.body);
        res.redirect('/empleados');
    } catch (error) {
        res.render('error', { error: 'Error al actualizar empleado', code: 500 });
    }
});

app.post('/empleados/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await empleadoModel.delete(id);
        if (!resultado) {
            return res.render('error', { error: 'Empleado no encontrado', code: 404 });
        }
        res.redirect('/empleados');
    } catch (error) {
        res.render('error', { error: 'Error al eliminar empleado', code: 500 });
    }
});

app.get('/tareas', async (req, res) => {
    try {
        const tareas = await tareaModel.getAll();
        const empleados = await empleadoModel.getAll();
        res.render('tareas/index', { page: 'tareas', tareas, empleados });
    } catch (error) {
        res.render('error', { error: 'Error al cargar tareas', code: 500 });
    }
});

app.get('/tareas/nueva', async (req, res) => {
    try {
        const empleados = await empleadoModel.getAll();
        res.render('tareas/nueva', { page: 'tareas', empleados });
    } catch (error) {
        res.render('error', { error: 'Error al cargar formulario', code: 500 });
    }
});

app.post('/tareas/nueva', async (req, res) => {
    try {
        await tareaModel.create(req.body);
        res.redirect('/tareas');
    } catch (error) {
        res.render('error', { error: 'Error al crear tarea', code: 500 });
    }
});

app.get('/tareas/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tarea = await tareaModel.getById(id);
        const empleados = await empleadoModel.getAll();
        if (!tarea) {
            return res.render('error', { error: 'Tarea no encontrada', code: 404 });
        }
        res.render('tareas/editar', { page: 'tareas', tarea, empleados });
    } catch (error) {
        res.render('error', { error: 'Error al cargar tarea', code: 500 });
    }
});

app.post('/tareas/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const tarea = await tareaModel.getById(id);
        if (!tarea) {
            return res.render('error', { error: 'Tarea no encontrada', code: 404 });
        }
        await tareaModel.update(id, req.body);
        res.redirect('/tareas');
    } catch (error) {
        res.render('error', { error: 'Error al actualizar tarea', code: 500 });
    }
});

app.post('/tareas/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await tareaModel.delete(id);
        if (!resultado) {
            return res.render('error', { error: 'Tarea no encontrada', code: 404 });
        }
        res.redirect('/tareas');
    } catch (error) {
        res.render('error', { error: 'Error al eliminar tarea', code: 500 });
    }
});

app.get('/pedidos', async (req, res) => {
    try {
        const pedidos = await pedidoModel.getAll();
        res.render('pedidos/index', { page: 'pedidos', pedidos });
    } catch (error) {
        res.render('error', { error: 'Error al cargar pedidos', code: 500 });
    }
});

app.get('/pedidos/nuevo', (req, res) => {
    res.render('pedidos/nuevo', { page: 'pedidos' });
});

app.post('/pedidos/nuevo', async (req, res) => {
    try {
        await pedidoModel.create(req.body);
        res.redirect('/pedidos');
    } catch (error) {
        res.render('error', { error: 'Error al crear pedido', code: 500 });
    }
});

app.get('/pedidos/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await pedidoModel.getById(id);
        if (!pedido) {
            return res.render('error', { error: 'Pedido no encontrado', code: 404 });
        }
        res.render('pedidos/editar', { page: 'pedidos', pedido });
    } catch (error) {
        res.render('error', { error: 'Error al cargar pedido', code: 500 });
    }
});

app.post('/pedidos/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const pedido = await pedidoModel.getById(id);
        if (!pedido) {
            return res.render('error', { error: 'Pedido no encontrado', code: 404 });
        }
        await pedidoModel.update(id, req.body);
        res.redirect('/pedidos');
    } catch (error) {
        res.render('error', { error: 'Error al actualizar pedido', code: 500 });
    }
});

app.post('/pedidos/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await pedidoModel.delete(id);
        if (!resultado) {
            return res.render('error', { error: 'Pedido no encontrado', code: 404 });
        }
        res.redirect('/pedidos');
    } catch (error) {
        res.render('error', { error: 'Error al eliminar pedido', code: 500 });
    }
});

app.get('/insumos', async (req, res) => {
    try {
        const insumos = await insumoModel.getAll();
        res.render('insumos/index', { page: 'insumos', insumos });
    } catch (error) {
        res.render('error', { error: 'Error al cargar insumos', code: 500 });
    }
});

app.get('/insumos/nuevo', (req, res) => {
    res.render('insumos/nuevo', { page: 'insumos' });
});

app.post('/insumos/nuevo', async (req, res) => {
    try {
        await insumoModel.create(req.body);
        res.redirect('/insumos');
    } catch (error) {
        res.render('error', { error: 'Error al crear insumo', code: 500 });
    }
});

app.get('/insumos/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await insumoModel.getById(id);
        if (!insumo) {
            return res.render('error', { error: 'Insumo no encontrado', code: 404 });
        }
        res.render('insumos/editar', { page: 'insumos', insumo });
    } catch (error) {
        res.render('error', { error: 'Error al cargar insumo', code: 500 });
    }
});

app.post('/insumos/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const insumo = await insumoModel.getById(id);
        if (!insumo) {
            return res.render('error', { error: 'Insumo no encontrado', code: 404 });
        }
        await insumoModel.update(id, req.body);
        res.redirect('/insumos');
    } catch (error) {
        res.render('error', { error: 'Error al actualizar insumo', code: 500 });
    }
});

app.post('/insumos/eliminar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await insumoModel.delete(id);
        if (!resultado) {
            return res.render('error', { error: 'Insumo no encontrado', code: 404 });
        }
        res.redirect('/insumos');
    } catch (error) {
        res.render('error', { error: 'Error al eliminar insumo', code: 500 });
    }
});

app.get('/filtros', async (req, res) => {
    try {
        const empleados = await empleadoModel.getAll();
        res.render('filters', { page: 'filtros', empleados });
    } catch (error) {
        res.render('error', { error: 'Error al cargar filtros', code: 500 });
    }
});

app.get('/tareas/filtrar', async (req, res) => {
    try {
        const tareas = await tareaModel.filtrar(req.query);
        const empleados = await empleadoModel.getAll();
        res.render('tareas/index', { page: 'tareas', tareas, empleados, filtros: req.query });
    } catch (error) {
        res.render('error', { error: 'Error al filtrar tareas', code: 500 });
    }
});

// Manejo de errores
app.use((req, res) => {
    res.status(404).render('error', { error: 'Página no encontrada', code: 404 });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('error', { error: 'Error del servidor', code: 500 });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});