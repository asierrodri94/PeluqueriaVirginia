from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_conn

router = APIRouter(prefix="/api/servicios", tags=["servicios"])


class Servicio(BaseModel):
    tipoServicio: str
    precioServicio: float


@router.get("")
def listar_servicios():
    with get_conn() as conn:
        rows = conn.execute("SELECT tipoServicio, precioServicio FROM servicio ORDER BY tipoServicio").fetchall()
    return [dict(r) for r in rows]


@router.post("", status_code=201)
def crear_servicio(s: Servicio):
    with get_conn() as conn:
        exists = conn.execute(
            "SELECT 1 FROM servicio WHERE tipoServicio = ?", (s.tipoServicio,)
        ).fetchone()
        if exists:
            raise HTTPException(400, "Ya existe un servicio con ese nombre")
        conn.execute(
            "INSERT INTO servicio (tipoServicio, precioServicio) VALUES (?, ?)",
            (s.tipoServicio.upper(), s.precioServicio),
        )
        conn.commit()
    return {"ok": True}


@router.put("/{tipo}")
def actualizar_servicio(tipo: str, s: Servicio):
    with get_conn() as conn:
        cur = conn.execute(
            "UPDATE servicio SET tipoServicio = ?, precioServicio = ? WHERE tipoServicio = ?",
            (s.tipoServicio.upper(), s.precioServicio, tipo),
        )
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Servicio no encontrado")
    return {"ok": True}


@router.delete("/{tipo}")
def eliminar_servicio(tipo: str):
    with get_conn() as conn:
        cur = conn.execute("DELETE FROM servicio WHERE tipoServicio = ?", (tipo,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Servicio no encontrado")
    return {"ok": True}
