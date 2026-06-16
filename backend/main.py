from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from pathlib import Path
from routers import facturas, servicios, export, compras, estadisticas
from database import init_db
import threading
import os

init_db()

app = FastAPI(title="Gestor Peluquería Virginia")

app.include_router(facturas.router)
app.include_router(servicios.router)
app.include_router(export.router)
app.include_router(compras.router)
app.include_router(estadisticas.router)


@app.post("/api/shutdown")
def shutdown():
    # Salida limpia con codigo 0 para que run.bat NO muestre el "pause" de error.
    threading.Timer(0.5, lambda: os._exit(0)).start()
    return HTMLResponse("<html><body style='font-family:sans-serif;text-align:center;padding-top:80px'><h2>✅ Programa cerrado</h2><p>Puedes cerrar esta pestaña.</p></body></html>")


STATIC_DIR = Path(__file__).parent.parent / "frontend" / "dist"

if STATIC_DIR.exists():
    app.mount("/assets", StaticFiles(directory=STATIC_DIR / "assets"), name="assets")

    @app.get("/{full_path:path}")
    def serve_frontend(full_path: str):
        return FileResponse(STATIC_DIR / "index.html")
