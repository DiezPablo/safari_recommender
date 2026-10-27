"""Calidad del catálogo mundial: especies estrella en su área natural, zoos fuera y niveles."""

import copy

from safari.refinar import nivel, refinar

CURADOS = [
    {"estrella": ["Panthera leo", "Cervus canadensis"], "continente": "África"},
    {"estrella": ["Cervus canadensis"], "continente": "América"},
]
DATOS = {
    "paises": {"Q39": {"continente": "Europa"}, "Q114": {"continente": "África"}},
    "estrella": {"1": "Panthera leo", "2": "Cervus canadensis", "3": "Canis lupus"},
    "parques": [
        {
            "nombre": "Parque Nacional Suizo",
            "pais": "Q39",
            "estrella": {"2": 9815, "3": 273},
            "n_mamiferos": 40,
            "obs": 20000,
        },
        {"nombre": "Pilat", "pais": "Q39", "estrella": {"1": 10}, "n_mamiferos": 10, "obs": 500},
        {"nombre": "Kenya Safari Park", "pais": "Q114", "estrella": {"1": 80}, "n_mamiferos": 5, "obs": 300},
        {
            "nombre": "Masái Mara",
            "pais": "Q114",
            "destacado": True,
            "estrella": {"1": 1796},
            "n_mamiferos": 88,
            "obs": 1,
        },
        {"nombre": "Reserva pequeña", "pais": "Q114", "estrella": {"1": 6}, "n_mamiferos": 20, "obs": 100},
    ],
}


def test_especies_solo_en_su_area_natural():
    d = refinar(copy.deepcopy(DATOS), CURADOS)
    suizo, pilat = d["parques"][0], d["parques"][1]
    assert suizo["estrella"] == {"3": 273}  # el «wapití» de Europa era ciervo común; el lobo sí es europeo
    assert pilat["estrella"] == {}  # leones en Francia: cautividad


def test_zoos_y_niveles():
    d = refinar(copy.deepcopy(DATOS), CURADOS)
    niveles = [p["nivel"] for p in d["parques"]]
    assert niveles == ["B", "C", "C", "A", "C"]
    assert d["parques"][2]["estrella"] == {}  # «Safari Park»: animales en cautividad
    assert nivel({"nombre": "X", "estrella": {"1": 5, "2": 5, "3": 5}}) == "B"


def test_es_idempotente():
    una = refinar(copy.deepcopy(DATOS), CURADOS)
    assert refinar(copy.deepcopy(una), CURADOS) == una


def test_operadores_desde_la_ciudad_de_acceso(monkeypatch):
    from safari import mundo_cli, practico

    pedidas = []

    def falso(lat, lon, ciudad):
        pedidas.append(ciudad)
        return [{"nombre": f"Safaris {ciudad}", "safari": True}] if ciudad == "Arusha" else None

    monkeypatch.setattr(practico, "operadores_ciudad", falso)
    lejos = {"ciudad": "Mwanza", "nombre": "Mwanza Airport", "lat": -2.4, "lon": 32.9}
    parques = [
        {"id": "serengeti", "llegar": {"aeropuertos": [lejos]}},  # destacado: Arusha, no el aeropuerto más cercano
        {"id": "ngorongoro", "llegar": {"aeropuertos": []}},
        {"id": "otro", "llegar": {"aeropuertos": [lejos]}},
    ]
    mundo_cli.operadores(parques)
    assert sorted(pedidas) == ["Arusha", "Mwanza"]  # una consulta por ciudad
    assert parques[0]["operadores_ciudad"]["ciudad"] == "Arusha"
    assert parques[1]["operadores_ciudad"]["lista"][0]["nombre"] == "Safaris Arusha"
    assert "operadores_ciudad" not in parques[2]
    assert parques[2]["acceso"]["ciudad"] == "Mwanza"
