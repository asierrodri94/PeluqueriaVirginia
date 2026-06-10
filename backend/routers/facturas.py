from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List
from database import get_conn, tabla_factura, tabla_servicio_realizado, mes_a_db, mes_de_db

router = APIRouter(prefix="/api/facturas", tags=["facturas"])


class ServicioLinea(BaseModel):
    tipoServicio: str
    precioServicio: float


class FacturaIn(BaseModel):
    dia: int
    mes: int  # 1-indexed
    anyo: int
    nombre: str
    servicios: List[ServicioLinea]
    cobrado: bool = False


class FacturaUpdate(BaseModel):
    dia: int
    mes: int
    anyo: int
    nombre: str
    servicios: List[ServicioLinea]
    cobrado: bool


def _row_to_dict(row) -> dict:
    d = dict(row)
    d["mes"] = mes_de_db(d["mes"])
    d["cobrado"] = d["cobrado"] == "true"
    return d


@router.get("")
def listar_facturas(mes: int, anyo: int, seccion: str = "A"):
    tf = tabla_factura(seccion)
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT * FROM {tf} WHERE mes = ? AND anyo = ? ORDER BY dia, numFactura",
            (mes_db, anyo),
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/resumen")
def resumen_mes(mes: int, anyo: int, seccion: str = "A"):
    tf = tabla_factura(seccion)
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        row = conn.execute(
            f"SELECT COUNT(*) as total_personas, SUM(importe) as total_importe, "
            f"SUM(CASE WHEN cobrado='true' THEN importe ELSE 0 END) as total_cobrado "
            f"FROM {tf} WHERE mes = ? AND anyo = ?",
            (mes_db, anyo),
        ).fetchone()
    return {
        "total_personas": row["total_personas"] or 0,
        "total_importe": round(row["total_importe"] or 0, 2),
        "total_cobrado": round(row["total_cobrado"] or 0, 2),
    }


@router.post("", status_code=201)
def crear_factura(f: FacturaIn, seccion: str = "A"):
    tf = tabla_factura(seccion)
    tsr = tabla_servicio_realizado(seccion)
    mes_db = mes_a_db(f.mes)
    importe = round(sum(s.precioServicio for s in f.servicios), 2)

    with get_conn() as conn:
        row = conn.execute(
            f"SELECT MAX(numFactura) as max_num FROM {tf} WHERE mes = ? AND anyo = ?",
            (mes_db, f.anyo),
        ).fetchone()
        num = (row["max_num"] or 0) + 1

        conn.execute(
            f"INSERT INTO {tf} (dia, mes, anyo, numFactura, nombre, importe, cobrado) VALUES (?,?,?,?,?,?,?)",
            (f.dia, mes_db, f.anyo, num, f.nombre.upper(), importe, "true" if f.cobrado else "false"),
        )
        for s in f.servicios:
            conn.execute(
                f"INSERT INTO {tsr} (dia, mes, anyo, numFactura, tipoServicio, precioServicio) VALUES (?,?,?,?,?,?)",
                (f.dia, mes_db, f.anyo, num, s.tipoServicio, s.precioServicio),
            )
        conn.commit()
    return {"numFactura": num}


@router.put("/{num_factura}")
def actualizar_factura(num_factura: int, f: FacturaUpdate, mes_original: int, anyo_original: int, seccion: str = "A"):
    tf = tabla_factura(seccion)
    tsr = tabla_servicio_realizado(seccion)
    mes_orig_db = mes_a_db(mes_original)
    mes_nuevo_db = mes_a_db(f.mes)
    importe = round(sum(s.precioServicio for s in f.servicios), 2)

    with get_conn() as conn:
        cur = conn.execute(
            f"UPDATE {tf} SET dia=?, mes=?, anyo=?, nombre=?, importe=?, cobrado=? "
            f"WHERE numFactura=? AND mes=? AND anyo=?",
            (f.dia, mes_nuevo_db, f.anyo, f.nombre.upper(), importe,
             "true" if f.cobrado else "false",
             num_factura, mes_orig_db, anyo_original),
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Factura no encontrada")

        conn.execute(
            f"DELETE FROM {tsr} WHERE numFactura=? AND mes=? AND anyo=?",
            (num_factura, mes_orig_db, anyo_original),
        )
        for s in f.servicios:
            conn.execute(
                f"INSERT INTO {tsr} (dia, mes, anyo, numFactura, tipoServicio, precioServicio) VALUES (?,?,?,?,?,?)",
                (f.dia, mes_nuevo_db, f.anyo, num_factura, s.tipoServicio, s.precioServicio),
            )
        conn.commit()
    return {"ok": True}


@router.patch("/{num_factura}/cobrado")
def toggle_cobrado(num_factura: int, mes: int, anyo: int, cobrado: bool, seccion: str = "A"):
    tf = tabla_factura(seccion)
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        cur = conn.execute(
            f"UPDATE {tf} SET cobrado=? WHERE numFactura=? AND mes=? AND anyo=?",
            ("true" if cobrado else "false", num_factura, mes_db, anyo),
        )
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Factura no encontrada")
    return {"ok": True}


@router.delete("/{num_factura}")
def eliminar_factura(num_factura: int, mes: int, anyo: int, seccion: str = "A"):
    tf = tabla_factura(seccion)
    tsr = tabla_servicio_realizado(seccion)
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        cur = conn.execute(
            f"DELETE FROM {tf} WHERE numFactura=? AND mes=? AND anyo=?",
            (num_factura, mes_db, anyo),
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Factura no encontrada")
        conn.execute(
            f"DELETE FROM {tsr} WHERE numFactura=? AND mes=? AND anyo=?",
            (num_factura, mes_db, anyo),
        )
        conn.commit()
    return {"ok": True}


@router.get("/{num_factura}/servicios")
def servicios_de_factura(num_factura: int, mes: int, anyo: int, seccion: str = "A"):
    tsr = tabla_servicio_realizado(seccion)
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        rows = conn.execute(
            f"SELECT tipoServicio, precioServicio FROM {tsr} WHERE numFactura=? AND mes=? AND anyo=?",
            (num_factura, mes_db, anyo),
        ).fetchall()
    return [dict(r) for r in rows]
