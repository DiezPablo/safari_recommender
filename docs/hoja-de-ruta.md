# Mercado y hoja de ruta

## El mercado (26-10-2026)

| Tipo | Ejemplos | Qué resuelve | Qué no |
|---|---|---|---|
| Marketplace de operadores | SafariBookings (~1700 operadores, reseñas, presupuestos) | Comparar paquetes y operadores | No dice dónde ni cuándo ver cada animal; solo vende lo que publican |
| Agencias con contenido | Go2Africa, Audley, Discover Africa (HerdTracker), African Budget Safaris | Calendarios mes a mes, migración | Marketing de sus viajes; casi solo África oriental y austral; no neutral |
| Avistamientos en directo | Latest Sightings (10 $/año), Kruger Animal Tracker | Lo visto hoy en Kruger o Pilanesberg | Dos o tres parques; polémica por velocidad y atropellos |
| Planificadores e IA | ChatGPT, Wanderlog | Borradores rápidos | El 82 % llega con destino elegido (Go2Africa 2025) y los operadores corrigen planes poco realistas |

- Unos 38 000-39 000 M$ al año y +6-9 % anual; mucha reserva directa; la temporada intermedia ya es el 38 % de
  las consultas; suben los presupuestos medios y altos (Go2Africa, Grand View, Mordor).
- Lo que más duele: costes ocultos (hay quien aconseja sumar un 40-60 %; recargos como el 5 % del pago de
  parques de Kenia), fiarse del operador, comparar presupuestos que no son comparables, itinerarios con
  demasiados parques (las distancias engañan) y elegir dónde y cuándo para un animal concreto.
- Hueco: una herramienta **neutral, con datos reales y mundial** que responda «¿dónde y cuándo veo X, cómo llego
  y con quién lo organizo?», y además en español.

## Prioridades

1. ~~**Decidir**~~ (hecho, 26-10-2026): portada «¿Qué quieres ver y cuándo?» (`/`), comparador de hasta 4
   parques (`/comparar`) y migración (`/migracion`: calendario + ñus vistos en 30 días en iNaturalist).
2. ~~**Planificador de ruta**~~ (hecho, `/planificar`; sin vuelos reales ni precios todavía): región, días y especies → circuito con noches, traslados (coche o avioneta), época y
   avisos de itinerario poco realista.
3. **Presupuestos sin sorpresas**: calculadora transparente (tasas por día, alojamiento, vuelos internos,
   propinas, visado), solicitud estándar para pedir presupuesto a 3-4 operadores y comparador de las ofertas
   recibidas (en el navegador).
4. **Lista por país**: visado, vacunas y malaria (fuentes oficiales), moneda, equipaje de avioneta, enchufes.
5. **Volver**: favoritos y planes compartibles por URL; avisos («se ha visto X», «entra en temporada») por
   `.ics` o RSS, sin cuentas. Ética: nunca ubicaciones exactas ni recientes de especies amenazadas.

Pendiente de decidir: cómo se mantiene si lo usa mucha gente (afiliación choca con «sin comisiones»; donaciones;
plan para operadores). Todo lo anterior funciona con datos abiertos y sin servidor.
