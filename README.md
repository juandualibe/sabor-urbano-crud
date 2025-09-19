# Sabor Urbano – Sistema de Gestión (1° Entrega)

Aplicación backend (y mini frontend administrativo con Pug) para la gestión operativa de un restaurante con foco en:
- Tareas (Gestión de pedidos e Inventario)
- Pedidos (presencial / delivery + plataformas)
- Empleados (roles / áreas)
- Insumos (stock, bajo stock, alertas)

Esta es la 1° entrega del Trabajo Integrador: Node.js + Express + JSON como “base de datos”.
(No incluye estadísticas avanzadas ni persistencia MongoDB todavía; eso se reserva para la 2° entrega.)

---

## 1. Objetivos de la Consigna y Cómo se Cumplen

| Objetivo | Estado | Implementación |
|----------|--------|----------------|
| Node.js + Express | ✅ | Servidor en `app.js`, routers por recurso |
| Modularización (MVC simplificado) | ✅ | `/models`, `/controllers`, `/routes`, `/views`, `middleware` |
| Persistencia en JSON | ✅ | Archivos en `/data/*.json` |
| POO (clases) | ✅ | Clases: `Empleado`, `Tarea`, `Pedido`, `Insumo`, `Cliente` |
| Asincronía (promesas / async/await) | ✅ | Operaciones de lectura/escritura con `fs.promises` |
| Middleware personalizado | ✅ | `ValidationMiddleware` + validaciones por recurso |
| Rutas dinámicas | ✅ | Ej: `/api/tareas/:id`, `/api/empleados/rol/:rol`, `/api/pedidos/plataforma/:plataforma` |
| Vistas con Pug (CRUD simple) | ✅ | Formularios y listados para las 4 entidades |
| CRUD de tareas con 2 áreas mínimo | ✅ | Áreas: `gestion_pedidos`, `control_inventario` (datos deben reflejarlo) |
| Filtros de búsqueda de tareas | ✅ | Query params múltiples en `GET /api/tareas` |
| Relación entre entidades | ✅ | Tarea ⇄ Pedido, Tarea ⇄ Empleado, Pedido ⇄ Cliente |
| Pruebas (Thunder/Postman) | ⚠️ | Preparar colección + capturas (pendiente de adjuntar) |
| Documentación + roles + bibliografía | ⚠️ | Este README + completar secciones de equipo/video |

---

## 2. Arquitectura de Carpetas

```
/app.js
/routes
  empleados.js
  tareas.js
  pedidos.js
  insumos.js
/controllers
  empleadosController.js
  tareasController.js
  pedidosController.js
  insumosController.js
/models
  Empleado.js
  Tarea.js
  Pedido.js
  Insumo.js
  Cliente.js
/middleware
  validation.js
/views
  empleados/*.pug
  tareas/*.pug
  pedidos/*.pug
  insumos/*.pug
  filters.pug
  layout.pug
  error.pug
/data
  empleados.json
  tareas.json
  pedidos.json
  insumos.json
  roles.json
  areas.json
  clientes.json
/package.json
```

Patrón:  
Request → Router → Controller → Model → JSON (persistencia) → Respuesta JSON / Render Pug (si es vista web)

---

## 3. Modelos y Relaciones

| Entidad | Campos Principales | Observaciones |
|---------|--------------------|---------------|
| Empleado | id, nombre, apellido, email, rol, área, fechaIngreso | Validación de email único |
| Tarea | id, título, descripción, area, estado, prioridad, empleadoAsignado, pedidoAsociado, observaciones, fechaCreacion, fechaInicio, fechaFinalizacion | Tiene transiciones (iniciar / finalizar) |
| Pedido | id, numeroOrden, clienteId, items, total, tipo, plataforma, estado, fechaCreacion, tiempoEstimado, observaciones | Enriquecido con nombre de cliente |
| Insumo | id, nombre, categoria, stock, stockMinimo, unidadMedida, proveedor, estado, ultimaActualizacion | Estado deriva del stock |
| Cliente | id, nombre, apellido, email, telefono | Usada para enriquecer pedidos (composición) |

### Relaciones (para la rúbrica del docente)
1. Pedido → Cliente: Composición (Pedido resuelve `clienteId` y genera un campo `cliente` legible).  
2. Tarea → Pedido: Asociación opcional (`pedidoAsociado`). Se usa para filtrar por `tipoPedido` o `plataforma`.  
3. Tarea → Empleado: Asociación (responsable de la tarea).  
4. Catálogos configurables (`roles.json`, `areas.json`) → usados como fuentes externas editables sin tocar código (justificación de flexibilidad).

---

## 4. Enumeraciones y Reglas de Validación

| Recurso | Validaciones Clave |
|---------|--------------------|
| Empleados | Roles: `administrador, cocinero, repartidor, mozo, encargado_stock` — Áreas: `cocina, reparto, salon, inventario, administracion` — Email formato y único |
| Tareas | Áreas: `gestion_pedidos, control_inventario` — Estados: `pendiente, en_proceso, finalizada` — Prioridades: `alta, media, baja` |
| Pedidos | Tipo: `presencial, delivery` — Plataforma: `rappi, pedidosya, propia, local` — Estados: `pendiente, en_preparacion, listo, en_camino, entregado, finalizado` |
| Insumos | Categorías: `alimentos, bebidas, limpieza, utensilios, otros` (ver Nota de datos) |
| Filtros de Tareas | `estado, prioridad, area, empleadoAsignado, fechaDesde/fechaHasta (creación), fechaInicioDesde/Hasta, fechaFinDesde/Hasta, tipoPedido, plataforma` |
| Stock Insumos | Estado calculado: `sin_stock` (stock=0), `bajo_stock` (stock ≤ stockMinimo), `disponible` (resto) |

---

## 5. Endpoints API (CRUD y Filtros)

### Empleados (`/api/empleados`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | / | Listar todos |
| GET | /:id | Obtener por id |
| GET | /rol/:rol | Filtrar por rol |
| GET | /area/:area | Filtrar por área |
| GET | /validar-email?email= | Verificar disponibilidad |
| POST | / | Crear |
| PUT | /:id | Actualizar |
| DELETE | /:id | Eliminar |

Ejemplo creación:
```json
POST /api/empleados
{
  "nombre": "Lucía",
  "apellido": "Fernández",
  "email": "lucia@saborurbano.com",
  "telefono": "11223344",
  "rol": "cocinero",
  "area": "cocina",
  "fechaIngreso": "2025-09-01"
}
```

---

### Tareas (`/api/tareas`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | / | Listar + filtros query |
| GET | /area/:area | Filtrar por área |
| GET | /:id | Detalle |
| POST | / | Crear |
| PUT | /:id | Actualizar campos |
| PATCH | /:id/iniciar | Marca `fechaInicio` + estado en_proceso |
| PATCH | /:id/finalizar | Marca `fechaFinalizacion` + estado finalizada |
| DELETE | /:id | Eliminar |

Ejemplo creación:
```json
POST /api/tareas
{
  "titulo": "Confirmar pedido RAPPI-789",
  "area": "gestion_pedidos",
  "prioridad": "alta",
  "empleadoAsignado": 4,
  "pedidoAsociado": 3,
  "observaciones": "Cliente pidió extra queso"
}
```

Ejemplo filtros:
```
GET /api/tareas?estado=pendiente&prioridad=alta&tipoPedido=delivery&plataforma=rappi&fechaDesde=2025-09-01
```

---

### Pedidos (`/api/pedidos`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | / | Listar todos |
| GET | /:id | Detalle |
| GET | /tipo/:tipo | Filtrar por tipo (`delivery/presencial`) |
| GET | /plataforma/:plataforma | Filtrar por plataforma |
| POST | / | Crear |
| PUT | /:id | Actualizar |
| DELETE | /:id | Eliminar |

Ejemplo creación:
```json
POST /api/pedidos
{
  "clienteId": 2,
  "items": [
    { "producto": "Hamburguesa Veggie", "cantidad": 1, "precio": 4500 },
    { "producto": "Agua saborizada", "cantidad": 1, "precio": 1200 }
  ],
  "total": 5700,
  "tipo": "delivery",
  "plataforma": "rappi",
  "estado": "pendiente",
  "observaciones": "Sin pepino"
}
```

---

### Insumos (`/api/insumos`)
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | / | Listar |
| GET | /:id | Detalle |
| GET | /categoria/:categoria | Filtrar por categoría |
| GET | /bajo-stock | Insumos stock <= mínimo |
| GET | /alertas | Resumen alertas (bajo_stock) |
| POST | / | Crear |
| PUT | /:id | Actualizar |
| PUT | /:id/stock | Reemplazar stock |
| PUT | /:id/descontar | Descontar cantidad |
| DELETE | /:id | Eliminar |

Ejemplo descontar stock:
```json
PUT /api/insumos/4/descontar
{ "cantidad": 3 }
```

---

## 6. Filtros de Tareas (Detalle)

| Query Param | Tipo | Ejemplo | Descripción |
|-------------|------|---------|-------------|
| estado | string | en_proceso | Filtra estado |
| prioridad | string | alta | Filtra prioridad |
| area | string | gestion_pedidos | Filtra área |
| empleadoAsignado | number | 4 | ID empleado |
| fechaDesde / fechaHasta | ISO/Date | 2025-09-01 | Rango fechaCreacion |
| fechaInicioDesde / fechaInicioHasta | Date | 2025-09-19 | Rango fechaInicio |
| fechaFinDesde / fechaFinHasta | Date | 2025-09-20 | Rango fechaFinalizacion |
| tipoPedido | string | delivery | Deriva de Pedido asociado |
| plataforma | string | rappi | Deriva de Pedido asociado |

Ejemplo complejo:
```
GET /api/tareas?estado=en_proceso&empleadoAsignado=4&plataforma=pedidosya&tipoPedido=delivery&fechaDesde=2025-09-01
```

---

## 7. Vistas Pug (Front Admin)

| Ruta | Descripción |
|------|-------------|
| /tareas | Listado y acciones |
| /tareas/nueva | Form alta |
| /tareas/editar/:id | Edición |
| /empleados | Listado |
| /empleados/nuevo | Form alta |
| /empleados/editar/:id | Edición |
| /pedidos | Listado |
| /pedidos/nuevo | Form alta |
| /pedidos/editar/:id | Edición |
| /insumos | Listado |
| /insumos/nuevo | Form alta |
| /insumos/editar/:id | Edición |
| /filtros | Form de filtros de tareas |
| (API) /api/... | Endpoints JSON |

---

## 8. Cómo Ejecutar

Requisitos: Node >= 18

```bash
git clone <repo>
cd sabor-urbano-crud
npm install
npm run dev   # con nodemon
# o
npm start
# Abrir: http://localhost:3000/tareas
```

Variables de entorno (opcional):
- `PORT=3000` (por defecto 3000)

---

## 9. Pruebas (Thunder Client / Postman)

Sugerencia de colección (pendiente de adjuntar en /docs):

1. Crear empleado válido
2. Validar email existente → 409
3. Crear pedido delivery plataforma rappi
4. Crear insumo (stock < stockMinimo) → luego ver en /bajo-stock
5. Crear tarea asociada a pedido
6. PATCH iniciar tarea → verificar fechaInicio
7. PATCH finalizar tarea → verificar fechaFinalizacion
8. GET /api/tareas con filtros (plataforma=rappi)
9. Descontar stock insumo existente
10. Eliminar tarea / empleado / insumo (control de cascada visual)

Adjuntar:
- Export JSON colección
- Capturas de respuestas (200, 201, 400, 404, 409)

---

## 10. Notas Sobre Consistencia de Datos (Recomendado Ajustar)

| Tema | Mejora |
|------|--------|
| Empleados referenciados en tareas | Asegurar que IDs existen en `empleados.json` |
| `pedidoAsociado` inválido | Evitar apuntar a IDs inexistentes |
| Categorías insumos | Unificar (cambiar `verduras` y `lacteos` → `alimentos`) o ampliar validación |
| Tipos numéricos | Convertir `total`, `stock`, `tiempoEstimado` a number (2° entrega o script de normalización) |

---

## 11. Posibles Mejoras para 2° Entrega (MongoDB)

| Mejora | Descripción |
|--------|-------------|
| Migrar a MongoDB | Colecciones: empleados, tareas, pedidos, insumos, clientes |
| Índices | Búsqueda por estado/prioridad/fecha rápidamente |
| Relación / populate | `tareas` → `empleados` / `pedidos` |
| Descuento automático stock | Al finalizar tarea de cocina / confirmar pedido |
| Métricas | Tiempos promedio (preparación / entrega) |
| Autenticación | JWT + roles |
| Websocket | Actualizaciones en vivo de pedidos / stock |

---

## 12. Equipo y Roles (Completar)

| Integrante | Rol / Responsabilidad | Aportes Clave |
|------------|-----------------------|---------------|
| Juan Dualibe | (Ej: Coordinación / Backend) | ... |
| Nicolás Weibel | (Ej: Modelo Pedidos + Vistas) | ... |
| Rocío Gómez | (Ej: Vistas Pug / Validaciones) | ... |
| Juan Manuel Gasbarro | (Ej: Modelo Tareas + Filtros) | ... |
| Germán Rodríguez | (Ej: Inventario / Insumos) | ... |

Video explicativo (link): `POR AGREGAR`  
Colección Thunder (ruta): `docs/pruebas/thunder_collection.json`  
Capturas (ruta): `docs/pruebas/capturas/`

---

## 13. Bibliografía / Referencias

| Recurso | URL | Uso |
|---------|-----|-----|
| Express Docs | https://expressjs.com/ | Rutas / middleware |
| Node.js fs/promises | https://nodejs.org/api/fs.html | Persistencia JSON |
| MDN Promises / async | https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function | Flujo asíncrono |
| Pug Template Engine | https://pugjs.org/api/getting-started.html | Vistas |
| HTTP Status Codes | https://developer.mozilla.org/en-US/docs/Web/HTTP/Status | Respuestas API |

