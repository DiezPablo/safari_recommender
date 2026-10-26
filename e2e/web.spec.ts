import { type APIRequestContext, expect, type Page, test } from "@playwright/test";

const CAPTURAS = process.env.CAPTURAS ?? "capturas";

/** Falla si hay errores de consola o peticiones que fallen (salvo teselas del mapa, que son externas). */
function vigilar(page: Page) {
  const errores: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errores.push(`consola: ${m.text()}`);
  });
  page.on("pageerror", (e) => errores.push(`excepción: ${e.message}`));
  page.on("response", (r) => {
    const u = r.url();
    if (r.status() >= 400 && !u.includes("tile.openstreetmap.org") && !u.includes("upload.wikimedia.org"))
      errores.push(`HTTP ${r.status()} ${u}`);
  });
  return errores;
}

/** Espera (sin fallar) a que el mapa tenga teselas, para que las capturas lo muestren. */
async function esperarTeselas(page: Page) {
  await page
    .waitForFunction(() => document.querySelectorAll(".leaflet-tile-loaded").length > 3, null, { timeout: 8000 })
    .catch(() => {});
}

/** Qué datos hay publicados (resumen que escribe scripts/descargar-datos.mjs: los datos ya no son estáticos). */
async function resumen(request: APIRequestContext): Promise<{ ficheros: string[] }> {
  const r = await request.get("/datos/resumen.json");
  return r.ok() ? r.json() : { ficheros: [] };
}
async function hay(request: APIRequestContext, fichero: string) {
  return (await resumen(request)).ficheros.includes(fichero);
}

test("los datos públicos responden y son JSON válido; los demás no se publican", async ({ request }) => {
  const { ficheros } = await resumen(request);
  test.skip(!ficheros.includes("safaris_indice.json"), "aún no hay datos");
  const r = await request.get("/datos/safaris_indice.json");
  expect(r.status()).toBe(200);
  const texto = await r.text();
  expect(texto).not.toMatch(/\bNaN\b|Infinity/);
  JSON.parse(texto);
  // los grandes van comprimidos fuera de public/ (solo los lee el servidor)
  expect((await request.get("/datos/safaris_mundo.json")).status()).toBe(404);
});

test("sin errores en las páginas principales", async ({ page }) => {
  const errores = vigilar(page);
  for (const ruta of ["/", "/especies", "/guia"]) {
    await page.goto(ruta);
    await expect(page.locator("h1")).toBeVisible();
  }
  expect(errores).toEqual([]);
});

test("safaris: buscar por mes y especie, ficha de parque y especie", async ({ page, request }, info) => {
  test.skip(
    !(await hay(request, "safaris.json")) || !(await hay(request, "safaris_indice.json")),
    "aún no se han publicado los safaris",
  );
  const errores = vigilar(page);
  await page.goto("/");
  await expect(page.locator("h1")).toHaveText("Safaris por el mundo");
  await expect(page.locator(".rejilla-safaris li").first()).toBeVisible();
  // en agosto, el Masái Mara (la migración) está en temporada
  await page.getByLabel("Cuándo vas").selectOption("7");
  await page.getByLabel("Continente").selectOption("África");
  const mara = page.locator(".rejilla-safaris li", { hasText: "Masái Mara" });
  await expect(mara).toContainText("Buena época en agosto");
  await page.screenshot({ path: `${CAPTURAS}/safaris-${info.project.name}.png` });
  await mara.getByRole("link").click();
  await expect(page).toHaveURL(/\/parque\/masai-mara$/);
  await expect(page.locator(".ano-safari")).toBeVisible();
  await expect(page.locator(".visto-ahora")).toBeVisible();
  await expect(page.locator(".mapa-caja[data-listo=si]").first()).toBeVisible();
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/safari-parque-${info.project.name}.png`, fullPage: true });
  // de una especie estrella a su página con los parques donde se ve
  await page.locator(".tarjeta-especie h3 a", { hasText: "León" }).first().click();
  await expect(page).toHaveURL(/\/especie\/panthera-leo$/);
  await expect(page.locator(".zonas-especie li").first()).toBeVisible();
  await page.goto("/guia");
  await expect(page.locator("#operador")).toBeVisible();
  expect(errores).toEqual([]);
});

test("safaris del mundo: ficha de un parque fuera del catálogo con cómo llegar", async ({ page, request }, info) => {
  const r = await request.get("/datos/safaris_indice.json");
  test.skip(!r.ok(), "aún no se ha publicado el índice mundial");
  const { parques } = await r.json();
  const otro = parques.find((p: { d: boolean }) => !p.d);
  const errores = vigilar(page);
  await page.goto(`/parque/${otro.id}`);
  await expect(page.locator("h1")).toHaveText(otro.n);
  await expect(page.locator("#organiza")).toContainText("Cómo llegar");
  await expect(page.locator("#organiza")).toContainText(/km en línea recta/);
  await expect(page.locator("#empresas")).toContainText("Antes de pagar");
  // los enlaces de reseñas abren la búsqueda de Google Maps centrada en el sitio
  for (const a of await page.locator("#organiza a", { hasText: "Reseñas" }).all())
    expect(await a.getAttribute("href")).toMatch(/^https:\/\/www\.google\.com\/maps\/search\/.+\/@-?\d/);
  // y ninguna web de la lista es un enlace relativo
  for (const a of await page.locator("#organiza a", { hasText: "Web" }).all())
    expect(await a.getAttribute("href")).toMatch(/^https?:\/\//);
  await expect(page.locator(".ano-safari")).toBeVisible();
  await page.screenshot({ path: `${CAPTURAS}/safari-mundo-${info.project.name}.png`, fullPage: true });
  // y el buscador encuentra parques fuera del catálogo
  await page.goto(`/?q=${encodeURIComponent(otro.n.slice(0, 12))}`);
  await expect(page.locator(".rejilla-safaris li").first()).toBeVisible();
  expect(errores).toEqual([]);
});

test("qué ver y cuándo: elegir especies y mes da parques con esas especies", async ({ page }, info) => {
  const errores = vigilar(page);
  await page.goto("/");
  const grupo = page.getByRole("group", { name: "Animales" });
  const visible = await grupo
    .waitFor({ timeout: 10000 })
    .then(() => true)
    .catch(() => false);
  test.skip(!visible, "sin datos de safaris");
  await grupo.getByRole("button", { name: "León", exact: true }).click();
  await grupo.getByRole("button", { name: "Guepardo", exact: true }).click();
  await page.locator(".campo-mes select").selectOption("7");
  await expect(page).toHaveURL(/ver=.*mes=7|mes=7.*ver=/);
  const primero = page.locator(".resultados-que-ver li").first();
  await expect(primero).toContainText("✓ León");
  await expect(primero).toContainText("✓ Guepardo");
  await primero.screenshot({ path: `${CAPTURAS}/${info.project.name}-que-ver.png` });
  // el enlace lleva a la ficha del parque
  await primero.getByRole("link").click();
  await expect(page.locator("h1")).toBeVisible();
  expect(errores).toEqual([]);
});

test("comparador: dos parques lado a lado, añadir otro desde el buscador y quitarlo", async ({ page }, info) => {
  const errores = vigilar(page);
  await page.goto("/comparar?p=serengeti,kruger");
  const cabeceras = page.locator(".tabla-comparar thead th");
  test.skip(!(await cabeceras.count()), "sin datos de safaris");
  await expect(cabeceras).toHaveCount(2);
  await expect(page.locator(".tabla-comparar tbody th", { hasText: "León" })).toBeVisible();
  await page.getByLabel("Añadir un parque").fill("masai");
  await page.locator(".opciones-comparar button", { hasText: "Masái Mara" }).first().click();
  await expect(cabeceras).toHaveCount(3);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-comparar.png`, fullPage: true });
  await cabeceras.nth(0).getByRole("link", { name: "Quitar" }).click();
  await expect(cabeceras).toHaveCount(2);
  // desde la ficha, «+ Comparar» lo guarda
  await page.goto("/parque/etosha");
  await page.getByRole("button", { name: "+ Comparar" }).click();
  await expect(page.getByRole("button", { name: "✓ En el comparador" })).toBeVisible();
  expect(errores).toEqual([]);
});

test("migración: zona del mes, cambiar de mes y lo visto en iNaturalist", async ({ page }, info) => {
  await page.goto("/migracion");
  await expect(page.locator("h1")).toHaveText("La gran migración, mes a mes");
  await page.getByRole("group", { name: "Mes" }).getByRole("button", { name: /^ago/ }).click();
  await expect(page.locator(".tarjeta-mes h2")).toContainText("Río Mara");
  await expect(page.locator(".mapa-caja[data-listo=si]")).toBeVisible();
  // la consulta en directo termina (con datos o con el aviso de error), nunca se queda cargando
  await expect(page.locator(".visto-migracion")).not.toContainText("Cargando", { timeout: 20000 });
  await esperarTeselas(page);
  await page.screenshot({ path: `${CAPTURAS}/${info.project.name}-migracion.png`, fullPage: true });
});
