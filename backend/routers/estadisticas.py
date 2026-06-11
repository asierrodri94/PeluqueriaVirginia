from fastapi import APIRouter
from database import get_conn, tabla_factura, tabla_servicio_realizado, mes_a_db

router = APIRouter(prefix="/api/estadisticas", tags=["estadisticas"])


@router.get("/mes")
def stats_mes(mes: int, anyo: int, seccion: str = "A"):
    tf = tabla_factura(seccion)
    tsr = tabla_servicio_realizado(seccion)
    mes_db = mes_a_db(mes)
    with get_conn() as conn:
        rows = conn.execute(
            f"""
            SELECT f.dia, sr.tipoServicio as tipo,
                   COUNT(*) as conteo, SUM(sr.precioServicio) as importe
            FROM {tsr} sr
            JOIN {tf} f ON sr.numFactura = f.numFactura
                        AND sr.mes = f.mes
                        AND sr.anyo = f.anyo
                        AND sr.dia = f.dia
            WHERE f.mes = ? AND f.anyo = ?
            GROUP BY f.dia, sr.tipoServicio
            ORDER BY f.dia, sr.tipoServicio
            """,
            (mes_db, anyo),
        ).fetchall()
    return [{"dia": r["dia"], "tipo": r["tipo"], "conteo": r["conteo"], "importe": round(r["importe"], 2)} for r in rows]


@router.get("/anyo")
def stats_anyo(anyo: int, seccion: str = "A"):
    tf = tabla_factura(seccion)
    tsr = tabla_servicio_realizado(seccion)
    with get_conn() as conn:
        rows = conn.execute(
            f"""
            SELECT f.mes, sr.tipoServicio as tipo,
                   COUNT(*) as conteo, SUM(sr.precioServicio) as importe
            FROM {tsr} sr
            JOIN {tf} f ON sr.numFactura = f.numFactura
                        AND sr.mes = f.mes
                        AND sr.anyo = f.anyo
                        AND sr.dia = f.dia
            WHERE f.anyo = ?
            GROUP BY f.mes, sr.tipoServicio
            ORDER BY f.mes, sr.tipoServicio
            """,
            (anyo,),
        ).fetchall()
    return [{"mes": r["mes"] + 1, "tipo": r["tipo"], "conteo": r["conteo"], "importe": round(r["importe"], 2)} for r in rows]
