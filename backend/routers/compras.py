from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import get_conn, mes_a_db, mes_de_db

router = APIRouter(prefix="/api/compras", tags=["compras"])


class CompraIn(BaseModel):
    dia: int
    mes: int  # 1-indexed
    anyo: int
    descripcion: str
    importe: float


def _row_to_dict(row) -> dict:
    d = dict(row)
    d["mes"] = mes_de_db(d["mes"])
    return d


@router.get("")
def listar_compras(mes: int, anyo: int):
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        rows = conn.execute(
            "SELECT * FROM compra WHERE mes=? AND anyo=? ORDER BY dia, numCompra",
            (mes_db, anyo),
        ).fetchall()
    return [_row_to_dict(r) for r in rows]


@router.get("/resumen")
def resumen_compras(mes: int, anyo: int):
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        row = conn.execute(
            "SELECT COUNT(*) as total_compras, SUM(importe) as total_importe "
            "FROM compra WHERE mes=? AND anyo=?",
            (mes_db, anyo),
        ).fetchone()
    return {
        "total_compras": row["total_compras"] or 0,
        "total_importe": round(row["total_importe"] or 0, 2),
    }


@router.post("", status_code=201)
def crear_compra(c: CompraIn):
    mes_db = mes_a_db(c.mes)
    with get_conn() as conn:
        row = conn.execute(
            "SELECT MAX(numCompra) as max_num FROM compra WHERE mes=? AND anyo=?",
            (mes_db, c.anyo),
        ).fetchone()
        num = (row["max_num"] or 0) + 1
        conn.execute(
            "INSERT INTO compra (dia, mes, anyo, numCompra, descripcion, importe) VALUES (?,?,?,?,?,?)",
            (c.dia, mes_db, c.anyo, num, c.descripcion, round(c.importe, 2)),
        )
        conn.commit()
    return {"numCompra": num}


@router.put("/{num_compra}")
def actualizar_compra(num_compra: int, c: CompraIn, dia_original: int, mes_original: int, anyo_original: int):
    mes_orig_db = mes_a_db(mes_original)
    mes_nuevo_db = mes_a_db(c.mes)

    with get_conn() as conn:
        # Si cambia el mes/año, reasignar numCompra en el destino
        if mes_nuevo_db != mes_orig_db or c.anyo != anyo_original:
            row = conn.execute(
                "SELECT MAX(numCompra) as max_num FROM compra WHERE mes=? AND anyo=?",
                (mes_nuevo_db, c.anyo),
            ).fetchone()
            nuevo_num = (row["max_num"] or 0) + 1
        else:
            nuevo_num = num_compra

        cur = conn.execute(
            "UPDATE compra SET dia=?, mes=?, anyo=?, numCompra=?, descripcion=?, importe=? "
            "WHERE numCompra=? AND dia=? AND mes=? AND anyo=?",
            (c.dia, mes_nuevo_db, c.anyo, nuevo_num, c.descripcion, round(c.importe, 2),
             num_compra, dia_original, mes_orig_db, anyo_original),
        )
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(404, "Compra no encontrada")
    return {"ok": True}


@router.delete("/{num_compra}")
def eliminar_compra(num_compra: int, dia: int, mes: int, anyo: int):
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        cur = conn.execute(
            "DELETE FROM compra WHERE numCompra=? AND dia=? AND mes=? AND anyo=?",
            (num_compra, dia, mes_db, anyo),
        )
        if cur.rowcount == 0:
            raise HTTPException(404, "Compra no encontrada")
        conn.execute(
            "UPDATE compra SET numCompra = numCompra - 1 WHERE numCompra > ? AND mes=? AND anyo=?",
            (num_compra, mes_db, anyo),
        )
        conn.commit()
    return {"ok": True}
