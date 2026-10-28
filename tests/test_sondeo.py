"""Sondeo de precios: lectura de JSON-LD y veredicto (sin red)."""

from safari.sondeo import Resultado, _jsonld, _tiene_precio, veredicto

HTML = """<html><head>
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Safari 7 días",
"offers":{"@type":"Offer","price":"2450","priceCurrency":"USD"}}</script>
<script type="application/ld+json">{"@type":"Organization","name":"X"}</script>
</head></html>"""


def test_jsonld_con_precio():
    objs = _jsonld(HTML)
    assert {o.get("@type") for o in objs} >= {"Product", "Offer", "Organization"}
    assert _tiene_precio(objs)


def test_veredicto():
    r = Resultado("X", "https://x", "operador", responde=True, robots_portada=True, robots_pagina=True)
    assert veredicto(r) == "sin datos"
    r.prohibe_automatico = True
    assert veredicto(r) == "no (condiciones)"
    r.prohibe_automatico = False
    r.jsonld_precio = True
    assert veredicto(r) == "sí (precio estructurado)"
    r.robots_pagina = False
    assert veredicto(r) == "no (robots.txt)"
