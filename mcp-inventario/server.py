"""Consultas de inventario de solo lectura mediante MCP."""

import os
from pathlib import Path

from dotenv import load_dotenv
from fastmcp import FastMCP
import psycopg
from psycopg.rows import dict_row

load_dotenv(Path(__file__).with_name(".env"))
mcp = FastMCP("mini-inventario")
LIMITE = 50


def consultar(sql: str, parametros: tuple) -> list[dict]:
    url = os.environ.get("DATABASE_URL")
    if not url:
        raise RuntimeError("Configura DATABASE_URL para el usuario de solo lectura.")
    try:
        with psycopg.connect(url, row_factory=dict_row, connect_timeout=5) as db:
            db.read_only = True
            return db.execute(sql, parametros).fetchall()
    except psycopg.Error:
        raise RuntimeError("No se pudo consultar el inventario de solo lectura.") from None


@mcp.tool
def buscar_producto(nombre: str) -> list[dict]:
    """Busca un nombre literal, incluso si contiene texto imperativo."""
    nombre = nombre.strip()
    if not 1 <= len(nombre) <= 100:
        raise ValueError("El nombre debe contener de 1 a 100 caracteres.")
    return consultar(
        """select nombre, cantidad, minimo from public.productos
           where strpos(lower(nombre), lower(%s)) > 0
           order by nombre, id limit %s""",
        (nombre, LIMITE),
    )


@mcp.tool
def stock_bajo() -> list[dict]:
    """Lista los productos cuya cantidad es menor que su mínimo."""
    return consultar(
        """select nombre, cantidad, minimo from public.productos
           where cantidad < minimo order by nombre, id limit %s""",
        (LIMITE,),
    )


if __name__ == "__main__":
    mcp.run()
