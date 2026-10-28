"""Sondeo de webs de operadores y lodges: ¿se pueden leer sus precios de forma legítima y automática?

Para cada web de la lista mira, con pocas peticiones y una pausa entre ellas:
- si su robots.txt deja leer la portada y las páginas de safaris a nuestro User-Agent;
- si sus condiciones de uso prohíben expresamente el acceso automatizado (busca las palabras en la página de
  condiciones, si la encuentra en las rutas habituales);
- si una página de safari de su sitemap lleva precios en datos estructurados (JSON-LD de schema.org con
  `offers`/`price`) o solo en el texto.

No guarda el contenido de las páginas: solo el resultado del sondeo (docs/sondeo-precios.md y .json).
Uso: python -m safari --sondeo-precios
"""

from __future__ import annotations

import json
import re
import time
import xml.etree.ElementTree as ET
from dataclasses import asdict, dataclass, field
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests

from safari.comun.red import USER_AGENT, sesion

PAUSA_S = 2.0
TIEMPO_S = 20

# (nombre, web, tipo) — agregadores, cadenas de lodges, operadores, oficiales y agencias españolas
WEBS: list[tuple[str, str, str]] = [
    ("SafariBookings", "https://www.safaribookings.com", "agregador"),
    ("TourRadar", "https://www.tourradar.com", "agregador"),
    ("Expert Africa", "https://www.expertafrica.com", "agregador"),
    ("Go2Africa", "https://www.go2africa.com", "agregador"),
    ("Rhino Africa", "https://www.rhinoafrica.com", "agregador"),
    ("Discover Africa", "https://www.discoverafrica.com", "agregador"),
    ("Africa Odyssey", "https://www.africaodyssey.com", "agregador"),
    ("Timbuktu", "https://www.timbuktutravel.com", "agregador"),
    ("Yellow Zebra", "https://www.yellowzebrasafaris.com", "agregador"),
    ("Aardvark Safaris", "https://www.aardvarksafaris.com", "agregador"),
    ("Wilderness", "https://www.wildernessdestinations.com", "lodges"),
    ("andBeyond", "https://www.andbeyond.com", "lodges"),
    ("Asilia", "https://www.asiliaafrica.com", "lodges"),
    ("Singita", "https://singita.com", "lodges"),
    ("Natural Selection", "https://naturalselection.travel", "lodges"),
    ("Great Plains", "https://greatplainsconservation.com", "lodges"),
    ("Kicheche", "https://www.kicheche.com", "lodges"),
    ("Nomad Tanzania", "https://www.nomad-tanzania.com", "lodges"),
    ("Elewana", "https://www.elewana.com", "lodges"),
    ("Sanctuary Retreats", "https://www.sanctuaryretreats.com", "lodges"),
    ("Angama", "https://angama.com", "lodges"),
    ("Governors' Camp", "https://www.governorscamp.com", "lodges"),
    ("Porini (Gamewatchers)", "https://www.porini.com", "lodges"),
    ("Desert & Delta", "https://www.desertdelta.com", "lodges"),
    ("Machaba", "https://www.machabasafaris.com", "lodges"),
    ("Ultimate Safaris", "https://www.ultimatesafaris.na", "lodges"),
    ("Gondwana Collection", "https://gondwana-collection.com", "lodges"),
    ("Sabi Sabi", "https://www.sabisabi.com", "lodges"),
    ("Londolozi", "https://www.londolozi.com", "lodges"),
    ("Chem Chem", "https://www.chemchemsafaris.com", "lodges"),
    ("Lemala", "https://www.lemalacamps.com", "lodges"),
    ("Tanzania Odyssey", "https://www.tanzaniaodyssey.com", "operador"),
    ("Thomson Safaris", "https://thomsonsafaris.com", "operador"),
    ("G Adventures", "https://www.gadventures.com", "operador"),
    ("Intrepid", "https://www.intrepidtravel.com", "operador"),
    ("Abercrombie & Kent", "https://www.abercrombiekent.com", "operador"),
    ("Easy Travel Tanzania", "https://www.easytravel.co.tz", "operador"),
    ("Shadows of Africa", "https://www.shadowsofafrica.com", "operador"),
    ("SANParks", "https://www.sanparks.org", "oficial"),
    ("Kenya Wildlife Service", "https://www.kws.go.ke", "oficial"),
    ("Catai", "https://www.catai.es", "agencia española"),
    ("Tuareg Viajes", "https://www.tuaregviajes.es", "agencia española"),
    ("Kananga", "https://www.kananga.com", "agencia española"),
    ("Nuba", "https://www.nuba.net", "agencia española"),
]

CONDICIONES = [
    "/terms",
    "/en/terms",
    "/terms-of-service",
    "/en/terms-and-conditions",
    "/website-terms",
    "/terms-and-conditions",
    "/terms-of-use",
    "/terms-conditions",
    "/legal",
    "/aviso-legal",
    "/condiciones-generales",
]
PROHIBE = re.compile(
    r"(scrap\w*|crawlers?|spiders?|data[- ]mining|automated (?:means|access|data|tools?)"
    r"|extracci[oó]n autom[aá]tica|medios automatizados)",
    re.I,
)
SAFARI = re.compile(r"safari|tour|itinerar|package|journey|trip|viaje|circuito|rates|tarif", re.I)
ARCHIVO = re.compile(r"\.(?:jpe?g|png|gif|webp|svg|pdf|mp4|zip)$", re.I)
PRECIO_TEXTO = re.compile(r"(?:US\$|USD|\$|€|EUR|ZAR|R)\s?\d[\d.,]{2,}|\d[\d.,]{2,}\s?(?:USD|€|EUR)", re.I)


@dataclass
class Resultado:
    nombre: str
    web: str
    tipo: str
    responde: bool = False
    robots: str = "sin robots.txt"
    robots_portada: bool | None = None
    robots_pagina: bool | None = None
    crawl_delay: float | None = None
    condiciones: str | None = None
    prohibe_automatico: bool | None = None
    fragmento: str | None = None
    pagina: str | None = None
    jsonld_tipos: list[str] = field(default_factory=list)
    jsonld_precio: bool = False
    precios_en_texto: int = 0
    nota: str = ""


def _get(s: requests.Session, url: str) -> requests.Response | None:
    time.sleep(PAUSA_S)
    try:
        return s.get(url, timeout=TIEMPO_S, allow_redirects=True)
    except requests.RequestException:
        return None


def _jsonld(html: str) -> list[dict]:
    res: list[dict] = []
    for m in re.finditer(r"<script[^>]+application/ld\+json[^>]*>(.*?)</script>", html, re.S | re.I):
        try:
            d = json.loads(m.group(1).strip())
        except ValueError:
            continue
        pila = d if isinstance(d, list) else [d]
        while pila:
            x = pila.pop()
            if isinstance(x, dict):
                res.append(x)
                pila.extend(v for v in x.values() if isinstance(v, (dict, list)))
            elif isinstance(x, list):
                pila.extend(x)
    return res


def _tiene_precio(objs: list[dict]) -> bool:
    return any("price" in o or "lowPrice" in o or "priceSpecification" in o for o in objs)


def _texto(html: str) -> str:
    html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.S | re.I)
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))


def _urls_sitemap(s: requests.Session, url: str, profundidad: int = 0) -> list[str]:
    r = _get(s, url)
    if r is None or r.status_code != 200 or "<" not in r.text[:200]:
        return []
    try:
        raiz = ET.fromstring(r.content)
    except ET.ParseError:
        return []
    locs = [e.text.strip() for e in raiz.iter() if e.tag.endswith("loc") and e.text]
    if raiz.tag.endswith("sitemapindex") and profundidad == 0:
        # el sitemap de safaris/tours, si lo hay; si no, el primero
        hijos = sorted(locs, key=lambda u: not SAFARI.search(u))[:2]
        return [u for h in hijos for u in _urls_sitemap(s, h, 1)]
    return locs


def sondear(nombre: str, web: str, tipo: str, s: requests.Session) -> Resultado:
    r = Resultado(nombre, web, tipo)
    rp = RobotFileParser()
    rr = _get(s, urljoin(web, "/robots.txt"))
    sitemaps: list[str] = []
    if rr is not None:
        r.responde = True
        if rr.status_code == 200 and "user-agent" in rr.text.lower():
            rp.parse(rr.text.splitlines())
            r.robots = "sí"
            r.robots_portada = rp.can_fetch(USER_AGENT, web + "/")
            cd = rp.crawl_delay(USER_AGENT)
            r.crawl_delay = float(cd) if cd else None
            sitemaps = [ln.split(":", 1)[1].strip() for ln in rr.text.splitlines() if ln.lower().startswith("sitemap:")]
        else:
            rp.parse([])
            r.robots_portada = True
    else:
        r.nota = "no responde (o el proxy lo corta)"
        return r

    for ruta in CONDICIONES:
        rc = _get(s, urljoin(web, ruta))
        if rc is not None and rc.status_code == 200 and len(rc.text) > 2000:
            r.condiciones = rc.url
            m = PROHIBE.search(_texto(rc.text))
            r.prohibe_automatico = bool(m)
            if m:
                t = _texto(rc.text)
                r.fragmento = t[max(0, m.start() - 120) : m.end() + 120].strip()
            break

    urls = []
    for sm in sitemaps or [urljoin(web, "/sitemap.xml")]:
        urls = _urls_sitemap(s, sm)
        if urls:
            break
    dominio = urlparse(web).netloc.removeprefix("www.")
    candidatas = [
        u for u in urls if dominio in u and SAFARI.search(urlparse(u).path) and not ARCHIVO.search(urlparse(u).path)
    ]
    # mejor una página de un safari concreto (ruta con dos o más tramos) que un listado
    candidatas.sort(key=lambda u: -min(3, urlparse(u).path.strip("/").count("/")))
    if not candidatas:
        r.nota = r.nota or "sin páginas de safari en el sitemap"
        return r
    r.pagina = candidatas[0]
    r.robots_pagina = rp.can_fetch(USER_AGENT, r.pagina)
    if not r.robots_pagina:
        r.nota = "robots.txt no deja leer las páginas de safari"
        return r
    rp_ = _get(s, r.pagina)
    if rp_ is None or rp_.status_code != 200:
        r.nota = f"la página de muestra da {rp_.status_code if rp_ is not None else 'error'}"
        return r
    objs = _jsonld(rp_.text)
    r.jsonld_tipos = sorted({str(o.get("@type")) for o in objs if o.get("@type")})[:8]
    r.jsonld_precio = _tiene_precio(objs)
    r.precios_en_texto = len(PRECIO_TEXTO.findall(_texto(rp_.text)))
    return r


def veredicto(r: Resultado) -> str:
    if not r.responde:
        return "no responde"
    if r.robots_portada is False or r.robots_pagina is False:
        return "no (robots.txt)"
    if r.prohibe_automatico:
        return "no (condiciones)"
    if r.jsonld_precio:
        return "sí (precio estructurado)"
    if r.precios_en_texto:
        return "dudoso (precio solo en texto)"
    if r.pagina:
        return "sin precios publicados"
    return "sin datos"


def informe(res: list[Resultado], ruta_md: Path) -> None:
    filas = [
        "| Web | Tipo | robots.txt | Condiciones | Página de muestra | JSON-LD | Precios en texto | Veredicto |",
        "|---|---|---|---|---|---|---|---|",
    ]
    for r in res:
        cond = "–" if r.prohibe_automatico is None else ("prohíbe" if r.prohibe_automatico else "no lo menciona")
        filas.append(
            f"| [{r.nombre}]({r.web}) | {r.tipo} | {r.robots}"
            f"{'' if r.robots_portada in (None, True) else ' (portada vetada)'}"
            f"{' (safaris vetados)' if r.robots_pagina is False else ''} | {cond} | "
            f"{f'[muestra]({r.pagina})' if r.pagina else '–'} | "
            f"{', '.join(r.jsonld_tipos) or '–'}{' + precio' if r.jsonld_precio else ''} | "
            f"{r.precios_en_texto} | {veredicto(r)} |"
        )
    cuenta: dict[str, int] = {}
    for r in res:
        v = veredicto(r).split(" (")[0]
        cuenta[v] = cuenta.get(v, 0) + 1
    texto = [
        "# Sondeo de precios en webs de operadores y lodges",
        "",
        f"Hecho el {time.strftime('%d-%m-%Y')} con `python -m safari --sondeo-precios` (User-Agent `{USER_AGENT}`).",
        "Por cada web: su robots.txt, si sus condiciones mencionan el acceso automatizado (búsqueda de palabras en la",
        "página de condiciones, a revisar a mano) y una página de safari del sitemap: si lleva precio en JSON-LD de",
        "schema.org o solo en el texto. No se guarda contenido de las páginas.",
        "",
        "Resumen: " + ", ".join(f"{v}: {n}" for v, n in sorted(cuenta.items(), key=lambda x: -x[1])) + ".",
        "",
        *filas,
        "",
        "## Fragmentos de condiciones que mencionan el acceso automatizado",
        "",
        *[f"- **{r.nombre}** ({r.condiciones}): «…{r.fragmento}…»" for r in res if r.fragmento],
        "",
    ]
    ruta_md.write_text("\n".join(texto), encoding="utf-8")
    ruta_md.with_suffix(".json").write_text(
        json.dumps([asdict(r) for r in res], ensure_ascii=False, indent=1), encoding="utf-8"
    )


def main(ruta: Path = Path("docs/sondeo-precios.md")) -> None:
    s = sesion()
    res = []
    for nombre, web, tipo in WEBS:
        r = sondear(nombre, web, tipo, s)
        print(f"{nombre}: {veredicto(r)}", flush=True)
        res.append(r)
    informe(res, ruta)
