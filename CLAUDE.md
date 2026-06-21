# GestorPeluqueria — "Peluquería Virginia"

App de escritorio (web local) para la gestión de una peluquería: facturación diaria,
compras/gastos, catálogo de servicios con precios, estadísticas y exportación a Excel.
Uso real: el ordenador de la peluquera (la madre de Asier). Idioma de la UI y del código: español.

## Stack y arquitectura

- **Backend:** Python + FastAPI + SQLite (sin ORM, SQL a mano con `sqlite3`). Carpeta `backend/`.
- **Frontend:** React 18 + Vite + Tailwind CSS. Recharts para gráficas. Carpeta `frontend/`.
- **Cómo se sirve en producción:** FastAPI **sirve el build estático de `frontend/dist`**
  (ver `backend/main.py`: monta `/assets` y un catch-all que devuelve `index.html`).
  No se usa el dev server de Vite en producción.
- **BD:** un único fichero SQLite `peluqueriaVirginia.bd` en la raíz del proyecto.
  `database.init_db()` crea las tablas si no existen (se llama al importar `main`).

## Arrancar / construir

| Acción | Comando |
|---|---|
| Producción (lo que usa la peluquera) | `run.bat` → uvicorn en `localhost:8000`, abre el navegador |
| Instalación inicial / en otro PC | `setup.bat` (re-crea venv limpio, instala deps Python y npm, build) |
| Recompilar solo el frontend | `npm --prefix frontend run build` |
| Dev frontend con recarga | `npm --prefix frontend run dev` (Vite en :5173, proxy `/api`→:8000) |
| Arrancar backend a mano | `backend\.venv\Scripts\python.exe -m uvicorn main:app --port 8000` (cwd = `backend/`) |

> ⚠️ **Tras cualquier cambio en el frontend hay que recompilar** (`npm run build`) para que
> `run.bat` lo muestre, porque sirve `dist/`. En la UI, **Ctrl+F5** para evitar caché.

### Gotchas de entorno (Windows de Asier) — IMPORTANTE
- **Llamar siempre al Python del venv por ruta** (`.venv\Scripts\python.exe`), nunca `python`
  "pelado". En este PC, `python` en el PATH resuelve primero al **stub de la Microsoft Store**
  (`%LOCALAPPDATA%\Microsoft\WindowsApps\python.exe`), que no es Python real.
- **Un venv no es reubicable:** `activate.bat` graba la ruta absoluta. El workspace se renombró
  `PredictorBolsa` → `ProyectosAsier`, lo que dejó el `activate` apuntando a una ruta inexistente
  y rompió `run.bat` (jun-2026). Por eso `run.bat`/`setup.bat` ya **no usan `activate`**: invocan
  el `python.exe` del venv por ruta (se autolocaliza vía `pyvenv.cfg`, cuyo `home` es el Python base).
- `setup.bat` es **portable y autoreparable**: detecta Python con el lanzador `py` (la versión más
  reciente instalada; `python` como fallback) y Node por PATH; **no fija ninguna versión** ni tiene rutas
  con el usuario de Windows. **Borra y recrea `backend\.venv` desde cero** en cada ejecución, para que el
  binario case con el Python del equipo. `requirements.txt` usa límites mínimos (`>=`, no `==`) para que
  pip baje una versión con *wheel* para CUALQUIER Python (probado con la última estable, 3.14). Requisitos
  previos en el PC destino: **Python (cualquier versión reciente, "Add to PATH") y Node.js LTS** (setup NO los instala).
- **`ModuleNotFoundError: No module named 'pydantic_core._pydantic_core'`** = **venv incoherente**, NO
  incompatibilidad de versión (la app funciona con la última Python). Pasa si el `.venv` se copió de otro
  equipo, o se creó con una Python y se ejecuta con otra (el binario `.pyd` queda atado a una versión).
  Arreglo: borrar `backend\.venv` y volver a ejecutar `setup.bat` (ya lo recrea limpio).

## Modelo de datos (SQLite) y CONVENCIONES CRÍTICAS

Definido en `backend/database.py`. Tablas:

- `factura` / `facturaB` — facturas. Campos: `dia, mes, anyo, numFactura, nombre, importe, cobrado`.
- `servicioRealizado` / `servicioRealizadoB` — líneas de servicio de cada factura
  (`dia, mes, anyo, numFactura, tipoServicio, precioServicio`).
- `servicio` — catálogo de servicios con su precio (`tipoServicio, precioServicio`).
- `compra` — gastos/compras (`dia, mes, anyo, numCompra, descripcion, importe`).
- `producto` — declarada pero sin uso relevante actual.

**Convenciones que hay que respetar SIEMPRE:**
1. **Meses en base 0** en la BD (estilo Java Calendar). Convertir con `mes_a_db(mes)=mes-1`
   y `mes_de_db(mes)=mes+1`. La API y el frontend trabajan en base 1 (1=Enero).
2. **Secciones A/B** = dos peluqueras/espacios con numeración independiente. `seccion="A"` usa
   `factura`/`servicioRealizado`; `"B"` usa `facturaB`/`servicioRealizadoB` (ver `tabla_factura()`
   y `tabla_servicio_realizado()`). **`compra` y `servicio` (catálogo) NO tienen sección.**
3. **`cobrado` se guarda como texto** `"true"`/`"false"`, no como booleano. Al leer: `== "true"`.
4. **`importe` de la factura lo calcula el backend** sumando `precioServicio` de sus servicios
   (no se confía en un importe enviado por el cliente).
5. **`numFactura` es secuencial por (mes, anyo, seccion)**: al crear = `MAX(numFactura)+1`; al borrar,
   las posteriores bajan 1; reordenar usa un offset temporal para evitar colisiones.
6. Una factura se identifica por la **clave compuesta** `(numFactura, dia, mes, anyo)`, no por un id.

## API (prefijo `/api`)

- **`/facturas`** — `GET` lista (por mes/anyo/seccion), `GET /resumen` (personas/importe/cobrado),
  `POST` crear, `PUT /{num}` editar, `PATCH /{num}/cobrado` toggle, `DELETE /{num}`,
  `POST /reordenar`, `GET /{num}/servicios`.
- **`/compras`** — `GET`, `GET /resumen`, `POST`, `PUT /{num}`, `DELETE /{num}` (sin sección).
- **`/servicios`** — CRUD del catálogo (`GET`, `POST`, `PUT /{tipo}`, `DELETE /{tipo}`).
- **`/estadisticas`** — `GET /mes` (agregado por día y tipo de servicio), `GET /anyo` (por mes y tipo).
- **`/export`** — `GET /trimestre` y `GET /trimestre/compras` → descargan Excel (openpyxl).
- **`/shutdown`** (`POST`) — apaga el servidor; lo usa el botón "⏻ Cerrar" de la cabecera.

## Frontend

- **Estado global en `src/App.jsx`:** `page` (Facturas/Compras/Estadísticas/Servicios, persistido en
  localStorage), `seccion` "A"/"B" (persistida), y `mes`/`anyo` con `cambiarMes(delta)`.
  Esos valores se pasan como props a las páginas.
- **`src/api.js`** — wrapper `fetch` sobre `/api`. Toda llamada a backend pasa por aquí.
- **Páginas (`src/pages/`):**
  - `Inicio.jsx` — pantalla principal de **facturas** del mes. Cabecera con navegador de mes,
    **selector de día** y resumen del **mes** + del **día** (los del día se calculan en cliente
    filtrando las facturas ya cargadas por `dia`, sin endpoint nuevo). Tabla editable, toggle de
    cobrado, edición de nº de factura por doble clic en la cabecera "#".
  - `Compras.jsx` — gastos/compras del mes.
  - `Estadisticas.jsx` — gráficas (Recharts) a partir de `/estadisticas`.
  - `Servicios.jsx` — CRUD del catálogo de servicios y precios.
- **Componentes (`src/components/`):** `FacturaModal.jsx` (crear/editar factura con sus líneas de
  servicio), `CompraModal.jsx`.
- **Convenciones de UI:** color primario `rose` (clases `rose-600` etc.); clases reutilizables en
  `src/index.css` (`.card`, `.btn-primary/secondary/ghost/danger`, `.input`, `.table-row-hover`).
  Importes formateados con coma decimal y " €" (helper `fmt` en las páginas). Avisos con
  `react-hot-toast`.

## Despliegue en el PC de la peluquera

1. Instalar requisitos en el PC destino: **Python** (cualquier versión reciente; marcar *Add to PATH*) y **Node.js LTS**.
2. Copiar la carpeta del proyecto. Para conservar datos, copiar también `peluqueriaVirginia.bd`
   (si no, arranca vacía). **No copies `.venv`, `node_modules` ni `dist`** (no son portables; `setup.bat`
   los regenera, y copiarlos es justo lo que provoca el `ModuleNotFoundError: pydantic_core._pydantic_core`).
3. Ejecutar `setup.bat` y luego `run.bat`.
