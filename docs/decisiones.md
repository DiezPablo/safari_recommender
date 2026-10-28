# Decisiones y problemas

Lo que se decide o se descubre. Las primeras entradas vienen de Rasante (photo_recommender), donde nació el
proyecto; las rutas de código citadas allí (`rasante/safaris/…`, `/safaris/…`) son hoy `safari/…` y `/…`.

## 2026-10-25 · Safaris por el mundo

- Petición del usuario (aficionado a los safaris): un sitio centralizado con parques de todo el mundo,
  especies, tarifas, rutas, organizadores, alojamientos, reseñas, precios y consejos, que cambie según lo que
  mejor se ve. Se pausa la revisión de mejoras gratuitas (anotada en `hoja-de-ruta.md`).
- **Qué se puede hacer gratis y sin IA, y qué no**:
  - Sí: catálogo curado (65 parques en `recursos/safaris.csv`: país, coordenadas de la zona de safari, radio,
    tipos de safari, mejores meses, especies estrella, tasa cuando es conocida con su año, consejo), Wikidata
    (foto, web oficial, Wikipedia), iNaturalist (especies, observaciones por mes y **lo visto en los últimos 30
    días**, con fotos Creative Commons y nombres en español), ERA5 (lluvia y temperatura por mes) y
    OpenStreetMap (lodges, campamentos y hoteles con web y teléfono).
  - No: reservas, precios de lodges y reseñas propias. No hay APIs abiertas de precios ni de reseñas
    (TripAdvisor o Google no permiten reutilizarlas) y gestionar reservas exige un backend, contratos y
    pagos, fuera de un proyecto personal sin servidor. Se enlaza a las webs oficiales y de cada lodge para
    reservar directamente (sin comisiones) y a Google Maps para las reseñas. La guía explica cómo elegir
    operador (licencia, asociaciones KATO/TATO/AUTO/SATSA, qué pedir por escrito).
- «Que cambie según lo que mejor se ve»: el orden de los parques pone primero los que están en temporada en el
  mes elegido y, dentro de ellos, los que más especies estrella han tenido en iNaturalist en los últimos 30
  días (`safaris_recientes.json`, en cada ejecución de *Datos*). La ficha pide además a iNaturalist en directo
  desde el navegador (su API admite CORS) y, si falla, enseña la última copia.
- Meses de mamíferos: observaciones brutas por mes. Dividir entre todas las observaciones (como en la fauna
  de España) daba el invierno como mejor época en Yellowstone solo porque en invierno no hay flores ni
  insectos que fotografiar.
- iNaturalist usa sinónimos (Bison bison es Bos bison): se acepta el `matched_term`. Las subespecies cuentan
  para su especie (`ancestor_ids`). Peticiones a ≤ 1 por segundo, como pide iNaturalist.
- Clima: dos años de ERA5 por parque (~52 llamadas a Open-Meteo cada uno) con pausa entre parques. Desde el
  contenedor Open-Meteo devuelve 429 por el límite horario: se prueba con `--sin-clima` y el clima se calcula
  en Actions.
- OSM: fuera los códigos de acampada de travesía de los parques de EE. UU. («4R1 - Ribbon Lake West»).
- Web: `/safaris` (mejor ahora, buscador por mes, continente, especie y tipo, mapa mundial), `/safaris/[id]`,
  `/safaris/especie` y `/safaris/especie/[slug]`, `/safaris/guia`. «Safaris» en la cabecera y en la barra
  inferior del móvil.

## 2026-10-25 · Safaris: todos los parques del mundo e información práctica real

- El usuario: 65 parques son pocos para todo el mundo, y la guía era genérica, sin información real de cada
  parque. Se hace un descubrimiento completo, caro la primera vez y luego incremental con caché.
- **Candidatos (Wikidata, ~9250)**: parques nacionales y sus subclases (3456), reservas de caza, refugios y
  reservas de fauna, áreas de gestión de fauna, áreas de conservación, reservas de la biosfera y, si miden
  ≥ 100 km², «área protegida» y «reserva natural» genéricas (ahí están las conservancies de Kenia, Ol Pejeta,
  Lewa…; sin el umbral entrarían 57 000 reservas pequeñas). La WDPA (Protected Planet) tiene más, pero su
  descarga exige cuenta y aceptar condiciones: se enlaza su ficha (P809) en lugar de usarla.
- **Cribado (GBIF, una petición por candidato)**: mamíferos observados desde 2010 en el círculo de la superficie
  del parque (4-80 km). Entra con ≥ 10 especies y ≥ 50 observaciones. La misma respuesta da las especies y los
  meses. Se usa GBIF y no iNaturalist porque iNaturalist pide no pasar de ~10 000 peticiones al día.
- **Información práctica de cada parque** (la «información real» que faltaba):
  - Cómo llegar: aeropuerto con vuelos regulares más cercano y gran aeropuerto internacional más cercano
    (OurAirports, dominio público), y pistas de aterrizaje en el parque (safari en avioneta).
  - OpenStreetMap: alojamientos con web/teléfono/correo, operadores y agencias de la zona, puertas de entrada
    con enlace para llegar, y pueblos cercanos. Overpass es lento: por tandas (`--osm-max`), de los más
    importantes a los menos, con la caché guardada entre ejecuciones del workflow `safaris.yml` (semanal).
  - Lluvia mensual de la NASA (POWER, una petición por punto) y meses secos (< 50 mm): en los trópicos, la
    estación seca es la mejor para ver fauna. La temperatura de POWER se descarta: en el Masái Mara daba 34 °C
    de máxima (la real ronda 28 °C).
  - País (Wikidata): moneda e idiomas; visado, salud y seguridad, en Exteriores.
  - Enlaces: web oficial, Protected Planet, Wikipedia, iNaturalist.
- **Web**: el buscador carga `safaris_indice.json` (una fila ligera por parque) y ordena por buena época del mes
  elegido (temporada escrita a mano en los destacados; meses secos en los trópicos), destacados y fauna. Las
  fichas de los 65 destacados y de los 150 parques con más fauna se generan al compilar; el resto, al
  visitarlas (ISR, con `safaris_mundo.json` en la función). Las páginas de especie suman los parques del mundo
  donde GBIF la registra.
- El catálogo curado y el mundial se calculan en `safaris.yml`; los avistamientos de 30 días siguen en *Datos*.
- Primera ejecución en Actions: el cribado de GBIF (consultas con facetas, ~5 s cada una) se comió las 4 h
  del paso (694 fallos por saturación). Se reparte: `--minutos` fija hasta cuándo se hacen peticiones nuevas;
  después solo se lee la caché y se publica lo que haya. `safaris_mundo.yml` corre a diario con la caché
  guardada y en pocos días está completo; luego tarda minutos y solo pide a Overpass una tanda nueva.

## 2026-10-26 · Safaris: empresas, épocas para todos, nombres y tamaño en Vercel

- Empresas para organizarlo: los directorios de las asociaciones (KATO, TATO, SATSA…) están tras inicios de
  sesión o páginas dinámicas, sin datos abiertos. Se combina: operadores y agencias de OSM en la **ciudad del
  aeropuerto de acceso** (Arusha, Nairobi, Kasane…; una consulta por ciudad, compartida) y de la zona del parque,
  solo con alguna forma de contacto; enlace a la asociación oficial del país; y qué pedir por escrito antes de pagar.
- Enlaces rotos: las webs de OSM sin «https://» eran enlaces relativos (se normalizan en el pipeline y en la web);
  la búsqueda de Google Maps con «nombre lat,lon» no encontraba nada (ahora, el nombre centrado en el sitio).
- Época para todos los parques (`practico.epoca`): temporada escrita a mano; en los trópicos, estación seca o,
  en la selva, los 4 meses menos lluviosos; fuera de los trópicos, los meses con más mamíferos observados.
- «Especie 5219461»: los nombres comunes se pedían al final y se quedaban sin tiempo; ahora van justo después
  del cribado y sin límite de tiempo (son peticiones rápidas).
- Del análisis (foros y guías): «Los cinco grandes» por parque, «Combínalo con» (parques cercanos con la época
  en común y horas aproximadas por pista: las distancias engañan) y cifras orientativas de presupuesto,
  avioneta, equipaje y propinas en la guía.
- Vercel avisaba de exceso de almacenamiento: solo se generan al compilar los 65 destacados (los otros 150
  sumaban ~45 MB) y `/viaje` lleva solo los JSON que usa (con `*.json` arrastraba los de safaris).

## 2026-10-26 · Almacenamiento de despliegues en Vercel (30 GB)

- «Deployment storage» suma todos los despliegues que Vercel guarda (30 días en Hobby). Cada commit de
  `version.json` es un despliegue (Datos dos veces al día, clima, safaris, rutas…) y cada uno ocupaba ~650 MB:
  70 MB de JSON estáticos en `public/datos` (el navegador solo pide dos) y cada función ISR con su copia de los
  JSON sin comprimir (~75 MB × 6).
- Cambios:
  - Los datos se descargan comprimidos a `datos/*.gz`, fuera de `public/`; `leerDatos` los descomprime. Solo
    `fauna.json` y `safaris_indice.json` siguen en `public/datos`, más un `resumen.json` para las pruebas (que
    también corren contra producción). Cada función pasa de ~75 MB a ~21 MB.
  - Las 382 fichas de observatorios de fauna y los 150 parques de safari con más fauna se generan al visitarlos
    (ISR) en lugar de en el build. Páginas generadas: de 217 a 139 MB.
  - `publicar_release.sh` no hace commit (ni despliegue) si ningún fichero cambió.
- Despliegue estimado: de ~650 MB a ~270 MB. Además, en Vercel (*Settings → Security → Deployment Retention
  Policy*) conviene bajar la retención al mínimo; se conservan siempre los 3 últimos despliegues de producción.

## 2026-10-26 · Separación de Rasante

- El usuario: Rasante tiene demasiadas cosas; los safaris, tal como están planteados, no los ha visto en ningún
  sitio y pueden ser muy útiles. Se separan en un repositorio y una web propios (DiezPablo/safari_recommender).
- Se trae solo lo que usan los safaris: paquete `safari/` (antes `rasante/safaris` más caché, red, Commons y GBIF),
  web con rutas en la raíz (`/parque/[id]`, `/especies`, `/especie/[slug]`, `/guia`) y los mismos estilos.
- Datos: la release de este repo empieza vacía y la caché de Actions también (el cribado mundial tarda días
  otra vez). Mientras tanto, el prebuild descarga los datos de la release de Rasante.

## 26-10-2026 · «Qué ver y cuándo», comparador y migración

- **Portada por especies y mes.** `/especies.json` (ruta estática generada en el build desde
  `safaris_mundo.json`) da, por especie estrella, sus 80 parques con más observaciones; el navegador lo cruza con
  `safaris_indice.json`. Orden: cuántas de las especies elegidas tiene, luego si el mes es buena época y luego la
  facilidad media (√(obs / obs del mejor parque), para que los parques muy visitados no lo tapen todo). Primero
  van los animales más buscados (lista fija); el resto, en el orden del catálogo.
- **Comparador** (`/comparar?p=…`, dinámico, lee los `.gz` en la función): hasta 4 parques; la lista se guarda
  en el navegador («+ Comparar» en las fichas). Ojo: una constante exportada desde un módulo `"use client"` no es
  un valor en el servidor (es una referencia de cliente); las compartidas van en `modelo.ts`.
- **Nombres de las especies estrella**: `mundo.especies` no siempre las trae; `nombreEstrella` usa el del
  catálogo.
- **Aeropuertos del mismo país**: el Serengeti salía con Mara Serena (Kenia) como aeropuerto más cercano. Ahora
  `llegar` recibe el ISO del país (P297 de Wikidata) y usa los aeropuertos de ese país si hay alguno a menos de
  800 km. Se nota tras la próxima ejecución de `safaris_mundo`.
- **Migración**: calendario mes a mes escrito a mano (`src/features/safaris/migracion.ts`, ciclo de TANAPA y
  Mara Triangle) y ñus de los últimos 30 días pedidos en directo a iNaturalist desde el navegador (CORS
  abierto). Los del cráter del Ngorongoro (residentes) se pintan aparte. No hay datos abiertos de collares GPS
  en tiempo real.

## 26-10-2026 · Primeras ejecuciones en el repo nuevo

- La caché de Actions de Rasante no se comparte con este repo: `safaris_mundo` vuelve a empezar de cero y tarda
  varios días en cubrir los ~3500 parques. Mientras, la web usa los datos de la release de Rasante (fallback de
  `scripts/descargar-datos.mjs`). Para no sustituirlos por un resultado a medias,
  `.github/scripts/no_empeora.py` solo deja publicar si el nuevo `safaris_mundo.json` tiene al menos el 95 % de
  los parques del publicado (este repo o, si aún no hay, Rasante).

## 26-10-2026 · Planificador de ruta

- `/planificar` (en el navegador, estado en la URL): país, días, mes, ritmo (2-4 noches por parque) y especies.
  Elección voraz: interés del parque (log de su puntuación, ×0,6 fuera de época, ×1,15 si es destacado) + 2 ×
  facilidad de cada especie aún no cubierta, dividido por (1 + distancia al circuito / 800 km) para que salgan
  circuitos compactos. Se descartan los parques solapados (< 40 km o uno dentro del otro) y los contenedores
  (reservas de la biosfera que engloban parques), salvo los destacados: el Masái Mara o Kruger contienen
  reservas privadas pequeñas y son el destino.
- Orden por vecino más próximo probando cada inicio; traslados en línea recta ×1,3 a 50 km/h; más de 6 h →
  avioneta o vuelo interno. Avisos: paradas de una noche, demasiada carretera, fuera de época, especies sin cubrir.
- Probado con el índice real: Tanzania 10 días → Tarangire, Ngorongoro, Serengeti; Kenia 7 → Masái Mara y
  Amboseli; Botsuana 9 → Makgadikgadi, Moremi, Chobe.

## 26-10-2026 · Zonas que no son parques (Ndutu)

- Buscar «Ndutu» no daba nada: es una zona del área de conservación del Ngorongoro, no un espacio protegido en
  Wikidata. Igual Seronera, Grumeti, Kogatende, Mara Triangle, Sabi Sands, Savuti, Khwai, Mfuwe, los campamentos
  de Kruger y Etosha o Porto Jofre. `src/features/safaris/zonas.ts` las lista a mano con su parque y una nota; el
  buscador de la portada y el del comparador las encuentran y muestran a qué parque pertenecen. Ampliarla cuando
  falte alguna.

## 26-10-2026 · Presupuesto sin sorpresas

- `/presupuesto?p=parque:noches,…&personas=&mes=&vuelos=` (el planificador enlaza con su plan). Las tasas de
  ~20 destacados están en `src/features/safaris/tasas.ts` con fuente y vigencia (revisadas el 26-10-2026: TANAPA
  vía Roadtrip Africa, KWS oct. 2025, Narok 2026, SANParks nov. 2026, MEFT abr. 2026, Zambia 2025, ZimParks 2023,
  UWA 2024-26, Akagera 2025, permisos de gorilas y Galápagos). Ruaha no: las fuentes no coinciden. Rand, dólar
  namibio y pula se convierten a 18, 18 y 13,5 por dólar. Se cobran por periodo de 24 h (un día por noche).
- El resto (alojamiento, vehículo, vuelos, propinas, visado, seguro, imprevistos) son valores de partida que el
  usuario cambia; se guardan en su navegador y la tabla distingue «tarifa oficial» de «tu estimación».
- Solicitud estándar para mandar a 3-4 operadores (mismas preguntas: qué incluye, vehículo privado, alojamientos
  concretos, pagos y recargos, licencia) y comparador de ofertas que suma lo que cada una no incluye.
- Revisar `tasas.ts` cada año (SANParks cambia en noviembre; UWA publicó tarifas hasta junio de 2026).

## 26-10-2026 · «Especie sin nombre común» y campos numéricos en el móvil

- El `safaris_mundo.json` publicado el 26-10-2026 (ejecución de Rasante con el código anterior) salió con
  `especies` vacío: los nombres se pedían al final y se agotó el tiempo. El código actual los pide justo después
  de las aves y sin límite; además `no_empeora.py` ya no deja publicar si falta el nombre de más del 5 % de las
  especies usadas.
- En el móvil, al vaciar un campo numérico (días del planificador, personas o noches del presupuesto) el valor
  saltaba a otro y no dejaba escribir. Los días son ahora un desplegable y el resto usa `src/ui/CampoNumero.tsx`,
  que solo aplica el número cuando es válido.

## 27-10-2026 · Operadores, ruido del catálogo y resumen de la ficha

- **Operadores: 0 de 1105 ciudades.** La fase de OSM se comía las 4,5 h (cada parque podía gastar ~11 min en
  reintentos: 2 vueltas × 3 espejos × 100 s + pausas, y los fallos se repetían cada día) y los operadores iban
  después, ya sin tiempo. Ahora: `practico.overpass` prueba cada espejo una vez, aparta los que fallan en la
  ejecución, recuerda 5 días las consultas fallidas (`cache/fallo_*`) y registra cuántas respuestas da cada
  espejo; los operadores van antes que el resto de OSM; OSM solo para parques A y B. Ciudad de acceso escrita a
  mano para los 65 destacados (`practico.ACCESO`: Arusha para el norte de Tanzania, Maun para el Okavango…);
  en el resto, la del aeropuerto regular más cercano. Si OSM no tiene operadores, la ficha enlaza el directorio
  de la asociación del país y una búsqueda de operadores de safari en la ciudad de acceso (Google Maps).
- **Ruido**: 1363 de 3502 parques eran europeos y especies estrella aparecían fuera de su área (wapitís en
  Suiza que eran ciervos comunes, leones en un parque de animales de Francia, búfalos domésticos en Grecia).
  `safari/refinar.py` deja cada especie estrella solo en sus continentes nativos (los del catálogo +
  `NATIVOS_EXTRA`), quita zoos y parques de fauna en cautividad y pone un nivel: A destacados (65), B destinos
  de fauna (≥ 3 especies estrella con ≥ 5 observaciones o una con ≥ 50; 884) y C el resto (2553). La web
  muestra por defecto A y B (buscador, planificador, «qué ver»); los C salen buscándolos por nombre o con la
  casilla.
- `python -m safari --refinar ENTRADA` aplica todo eso (y los operadores, con `--minutos`) a un
  `safaris_mundo.json` ya calculado. Mientras la caché de este repo se llena, `safaris_mundo.yml` publica el de
  Rasante refinado; se puede lanzar a mano con `solo_refinar` (150 min para operadores).
- **Resumen arriba en cada ficha** (`ResumenParque`): cuándo ir, qué verás, entrada (de `tasas.ts`), cómo
  llegar y con quién, con enlace a cada detalle.

## 27-10-2026 · Frecuencia de avistamientos por mes

- Para cada destacado y especie estrella, el histograma mensual de iNaturalist frente al de su grupo
  (mamíferos, aves, reptiles), en ‰ y sumando los meses vecinos (`safari/frecuencia.py`; sin cifra si el grupo
  tiene < 30 observaciones en esos tres meses). Corrige que en temporada alta vaya más gente. Calibrado con
  datos reales: león en el Mara ~100 ‰ todo el año, leopardo 20-50 ‰, rinoceronte negro ~10 ‰, licaón ~1 ‰; el
  ñu del Mara se triplica de julio a septiembre, los osos de Yellowstone caen a ~0 en invierno (hibernan), las
  belugas de Churchill solo de junio a agosto.
- Niveles en la web (`nivelFrecuencia`): ≥ 50 ‰ muy probable, ≥ 20 probable, ≥ 5 posible, ≥ 1 difícil, si no
  muy raro. Se presenta como frecuencia en las fotos de los visitantes, no como probabilidad exacta (los
  animales vistosos se fotografían más).
- Dónde: tabla especie × mes en la ficha de los destacados, nivel de este mes en el resumen y nivel del mes
  elegido en «¿Qué quieres ver y cuándo?». ~450 peticiones más a iNaturalist por ejecución semanal (≤ 1/s).

## 27-10-2026 · Mi viaje

- `/viaje`: el plan en una página (itinerario con traslados, qué verás en cada parque el mes del viaje con el
  nivel de frecuencia, presupuesto con tus precios y lista «antes de ir» con casillas). Se guarda en el
  navegador (`safaris.viaje`, `safaris.lista`), se comparte por URL (`/viaje?p=parque:noches,…&mes=&personas=
  &ver=`; quien lo abre puede guardarlo como suyo) y se imprime (CSS de impresión sin menús ni botones).
- Planificador y presupuesto tienen «Guardar en Mi viaje». Claves y utilidades compartidas en
  `src/features/safaris/viaje.ts`. En el menú del móvil, «Mi viaje» sustituye a «Presupuesto» (se llega desde
  el plan).

## 27-10-2026 · Lo práctico por país y safari por tu cuenta

- `src/features/safaris/paises.ts`: para pasaporte español en Kenia, Tanzania, Uganda, Ruanda, Sudáfrica,
  Botsuana, Namibia, Zambia y Zimbabue: visado (con su web oficial), fiebre amarilla, malaria, enchufes (IEC),
  dinero, conducción, zona horaria y propinas. Solo lo que coincidía en varias fuentes; donde no (Namibia y
  Zambia para pasaporte español), se dice que hay que comprobarlo. Fuentes consultadas el 27-10-2026: eTA de
  Kenia (etakenya.go.ke y guías que coinciden en ~30 USD), cambio de visados de Namibia de abril de 2025 (avisos
  de las embajadas en Suecia y Finlandia, 1600 NAD), tasas de visado de Zambia de 2026 (zambiatourism.com:
  50 USD, KAZA UniVisa 50 USD), certificado de fiebre amarilla obligatorio en Uganda desde 2024 (citizen.digital),
  malaria estacional en el sur (SANParks, wanda.be), programa «La salud también viaja» de Sanidad. Revisar al
  menos una vez al año.
- Se ve en «Antes de ir» de cada ficha, en la lista de Mi viaje (visado y salud de cada país del plan, adaptador
  solo si hace falta) y en la guía («País a país»).
- Safari por tu cuenta (`POR_TU_CUENTA`, 20 destacados): coche normal (Kruger, Etosha, Addo, Pilanesberg,
  Hluhluwe-iMfolozi, Kgalagadi), 4×4 con experiencia (Chobe, Moremi, Makgadikgadi, Kalahari Central, Hwange, Mana
  Pools, Akagera, Murchison, Reina Isabel) o con guía (reservas privadas y África oriental). Con las horas de
  amanecer y anochecer del mes en la hora local del parque (las puertas abren y cierran con la luz). Filtro
  «Cómo quieres ir» en el buscador.

## 27-10-2026 · El planificador, como un operador

- Fallo: con 4 noches en Tanzania proponía 4 noches en el Ngorongoro (dividía las noches entre «noches por
  parque» del ritmo y cogía el parque de más puntuación). No sabía cuántas noches merece cada parque, ni que el
  cráter se ve en un día, ni el coste de cambiar de parque, ni por dónde se entra al país.
- Ahora (`planificar.ts` + `estancias.ts`):
  - Estancia de los 65 destacados escrita a mano (mínimo, ideal y máximo de noches, nota, ciudad de entrada y
    valor por noche para un primer safari: Serengeti y Mara 1, Ngorongoro 0,9, Tarangire 0,75, Pilanesberg 0,6;
    gorilas 1,6). Los no destacados valen como mucho la mitad (los de al lado de la capital tienen muchas
    observaciones por la gente que va, no por su fauna) y piden al menos 2 noches si son grandes.
  - Interés de una noche = valor × temporada × frecuencia de avistamientos de ese mes frente a la media del año
    (0,7-1,3). Hasta la estancia ideal vale entera, hasta el máximo un 25-60 % según el ritmo y por encima casi
    nada.
  - Voraz: en cada paso, alargar un parque o añadir otro (valorado con sus noches ideales, para repartir el coste
    del cambio). Coste de añadir = lo que encarece la ruta (insertándolo en su mejor hueco, saliendo y volviendo a
    la ciudad de entrada del país: Arusha, Nairobi, Johannesburgo, Maun…) + medio día de cambio según el ritmo +
    otro circuito (Ruaha entra por Dar es Salaam). Tramos: horas por encima de las libres (5 h en la llegada y la
    salida, 2 h entre parques porque el camino también es safari); más de 6,5 h, en avioneta (3 h + precio; menos
    en Botsuana, Zambia y Zimbabue, donde es lo normal). Velocidad: 90 km/h en Sudáfrica, 85 en Namibia, 70 en
    Botsuana y 50 en el resto.
  - En pantalla: noches de safari (no días), ciudad de entrada y vuelta, «lo normal» de cada parque y su nota,
    dónde está la migración ese mes y dónde alojarse (Serengeti y Mara), especies muy probables ese mes y qué
    cambia con 2 noches más.
- Comprobado con los datos de producción (agosto salvo indicación): Tanzania 4 noches → Serengeti 3 + Ngorongoro
  1; 5 → + Tarangire 1; 7 → Serengeti 4, Ngorongoro 1, Tarangire 2; Kenia 7 (septiembre) → Mara 5 + Amboseli 2;
  Sudáfrica 6 → Sabi Sand 3 + Kruger 3; Botsuana 8 (septiembre) → Makgadikgadi 2, Moremi 4, Chobe 2; Uganda 6
  (julio) → Bwindi 3, Reina Isabel 2, Kibale 1; Ruanda 4 → Volcanes 3 + Akagera 1; Zambia 7 → Bajo Zambeze 3 +
  Luangwa Sur 4.

## 27-10-2026 · Nuevo aspecto y navegación

- El aspecto venía de Rasante y tenía los tics de una web generada: tarjetas blancas con sombra en cada bloque,
  rótulos en mayúsculas espaciadas encima de cada sección, botones en píldora, emojis como iconos, menú y
  pestañas duplicados, tres temas (uno rojo para astrofotografía) y las fotos casi sin protagonismo.
- Dirección: una guía de campo editorial. Titulares en serif (Newsreader) y texto en Archivo; papel arena, tinta
  casi negra, verde acacia de acento y ocre para lo activo y los avisos; claro u oscuro según el sistema (fuera el
  selector y el tema rojo). Las secciones se separan con una línea fina y aire; solo son tarjetas las cosas que se
  «cogen» (un parque, una etapa, un resultado). Botón principal rectangular en tinta y el resto, enlaces.
  Iconos SVG propios en vez de emojis.
- Fotografía: portada con foto a sangre (la de un destacado en buena época ese mes) y el titular encima; ficha
  de parque con la foto a sangre y el título encima. Las miniaturas de Commons se piden a 1280 px y, si el
  original es más pequeño, se vuelve a la de 960 (`src/ui/FotoGrande.tsx`; a 1920 px Commons no responde).
- Navegación (`src/ui/Navegacion.tsx`): un menú (Descubrir, Especies, Migración, Planificar, Guía) con la
  sección activa subrayada en ocre y «Mi viaje» a la derecha con el número de parques guardados; en el móvil,
  barra inferior con iconos (Descubrir, Especies, Planificar, Mi viaje). Comparar y Presupuesto se abren desde
  donde se usan y desde el pie, que es ahora un mapa del sitio.
- Implementación: los tokens nuevos están en `01-tokens.css` (mismos nombres, así que lo heredado cambia solo) y
  `12-diseno.css`, cargado el último, redefine las piezas base. Se quitaron las reglas viejas de cabecera y móvil.
- Retoques (27-10-2026): índice fijo bajo la cabecera en las fichas (Resumen, Qué se ve, Cuándo ir, Mapa,
  Organizar, Dónde dormir; anclas, sin JavaScript), «Dónde dormir» con 6 a la vista y el resto plegado, tarjetas
  de parque y especie enteras como enlace con foto 3:2 (o un rayado discreto si no hay foto), temporada como punto
  de color, guía con índice lateral fijo y texto a 72 caracteres. Modo oscuro revisado en portada, ficha,
  planificador y guía.

## 27-10-2026 · Safari con niños

- `src/features/safaris/familias.ts`: destacados sin malaria (sur de Sudáfrica —Addo, Pilanesberg, Madikwe,
  Kgalagadi— y los de fuera de los trópicos) y edades mínimas (gorilas 15 años en Uganda y Ruanda, coinciden
  todas las fuentes; chimpancés de Kibale 12-13 según la fuente, se dice así). Fuentes consultadas el
  27-10-2026: Duma Explorer, Roadtrip Africa y Trek Africa Tours.
- En la ficha (resumen «Con niños»), en el buscador («Con niños pequeños», solo sin malaria y sin edad mínima) y
  en el planificador («Viajo con niños»: fuera los parques con edad mínima, ×1,5 a los sin malaria y un aviso
  con los que sí tienen riesgo y las edades de los lodges). Sudáfrica 6 noches con niños → Madikwe 4 +
  Pilanesberg 2 (sin niños, Sabi Sand + Kruger); Uganda → Murchison + Kidepo, sin gorilas.

## 28-10-2026 · Avisos sin cuenta, animales vistos y páginas de respuesta

- Calendarios `.ics` (`src/features/safaris/calendario.ts`): `/parque/<id>/calendario.ics` con la buena época
  como evento de varios meses que se repite cada año (`RRULE:FREQ=YEARLY`) y un recordatorio de un día dos meses
  antes («Reserva ya…»); `/migracion.ics` con la zona de cada mes. Se suscriben con `webcal://` (Apple, Outlook,
  móviles) o Google Calendar (`calendar.google.com/calendar/r?cid=`); `REFRESH-INTERVAL` de 7 días. Los de los
  destacados se generan en el build y el resto al pedirlos (con los `.gz` en la función). Sin alarmas (`VALARM`):
  los calendarios suscritos suelen ignorarlas, por eso el aviso es un evento.
- RSS `/recientes.xml`: las especies estrella vistas en 30 días en cada destacado (solo el parque, nunca dónde).
  El `guid` es parque + semana: los datos cambian dos veces al día y no queremos 65 entradas nuevas cada vez.
- Animales vistos (`ListaVistos.tsx`, en Mi viaje): todas las especies estrella de los parques del viaje, para ir
  marcándolas; se guardan en el navegador (`safaris.vistos`, clave de GBIF → fecha), de todos los viajes, y se
  cuenta el total.
- Páginas de respuesta con plantillas (`/safari-en/[clave]`): 12 meses («Safari en agosto: dónde ir»: destacados
  en su mejor época por continente, lo probable ese mes según la frecuencia, la migración y los de África fuera de
  temporada) y un país por cada uno con destacados (temporadas de sus parques, especies, otros destinos de nivel
  B, lo práctico). Índice en `/safari-en`. `sitemap.xml` (destacados, especies, respuestas y parques A/B; los C
  no) y `robots.txt` (fuera `/viaje` y `/comparar`, que dependen de cada uno). `SITIO` en `src/lib/sitio.ts`
  (se puede cambiar con `NEXT_PUBLIC_SITIO`).
