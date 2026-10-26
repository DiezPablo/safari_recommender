"""Wikimedia Commons: consulta a la API con caché, maxlag y reintentos amables, y texto plano de los metadatos."""

from __future__ import annotations

import html as htmlmod
import json
import re
import time

import requests

from safari.comun.cache import CacheJson
from safari.comun.red import sesion

CACHE = CacheJson()
SESION = sesion()
COMMONS_API = "https://commons.wikimedia.org/w/api.php"
COMMONS_REINTENTOS = 15
COMMONS_PAUSA_S = 1.0  # entre peticiones: la API pública limita por IP


def consultar(params: dict) -> dict:
    """Llamada a la API de Commons con caché, maxlag y reintentos amables."""
    params = {"action": "query", "format": "json", "formatversion": 2, "maxlag": 5, **params}
    clave = "commons:" + json.dumps(params, sort_keys=True)
    datos = CACHE.leer(clave)
    if datos is not None:
        return datos
    for intento in range(COMMONS_REINTENTOS):
        try:
            r = SESION.get(COMMONS_API, params=params, timeout=60)
        except requests.RequestException as e:
            print(f"      Commons: {e.__class__.__name__}, reintento", flush=True)
            time.sleep(10 * (intento + 1))
            continue
        if r.status_code == 429 or r.status_code >= 500 or '"maxlag"' in r.text[:300]:
            # Respetamos lo que pide el servidor (Retry-After) y si no, espera creciente
            espera = int(r.headers.get("Retry-After", 0) or 0) or 10 * (intento + 1)
            print(f"      Commons pide esperar ({r.status_code}): {espera} s", flush=True)
            time.sleep(min(espera, 120) + 1)
            continue
        r.raise_for_status()
        datos = r.json()
        if "error" in datos:
            info = datos["error"].get("info", "")
            if "busy" in info or datos["error"].get("code") in ("maxlag", "ratelimited"):
                print(f"      Commons ocupado ({info}); espero", flush=True)
                time.sleep(15 * (intento + 1))
                continue
            raise RuntimeError(f"Commons: {info}")
        CACHE.guardar(clave, datos)
        time.sleep(COMMONS_PAUSA_S)
        return datos
    raise RuntimeError("Commons no responde (demasiados reintentos)")


def texto_plano(v: str | None) -> str:
    return re.sub(r"\s+", " ", htmlmod.unescape(re.sub(r"<[^>]+>", "", v or ""))).strip()
