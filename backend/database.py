import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).parent.parent / "peluqueriaVirginia.bd"


def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def tabla_factura(seccion: str) -> str:
    return "facturaB" if seccion == "B" else "factura"


def tabla_servicio_realizado(seccion: str) -> str:
    return "servicioRealizadoB" if seccion == "B" else "servicioRealizado"


# Los meses en la BD están en base 0 (estilo Java Calendar)
def mes_a_db(mes: int) -> int:
    return mes - 1


def mes_de_db(mes: int) -> int:
    return mes + 1
