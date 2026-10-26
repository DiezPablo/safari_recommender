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
