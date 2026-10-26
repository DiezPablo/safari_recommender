import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import Link from "next/link";
import { IconoPrismaticos } from "@/ui/Iconos";
import SelectorTema from "@/ui/SelectorTema";
import "./globals.css";

// Tipografías autoalojadas en el build (sin peticiones a Google desde el navegador)
const ui = Archivo({ subsets: ["latin"], variable: "--f-ui", display: "swap", axes: ["wdth"] });
const mono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--f-mono", display: "swap", weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "Safaris · dónde y cuándo ver cada animal", template: "%s · Safaris" },
  description:
    "Parques nacionales y reservas de todo el mundo: qué fauna se ve y cuándo, lo visto en el último mes, cómo llegar, alojamientos y operadores. Datos abiertos, sin comisiones.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2f1ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f11" },
  ],
};

// Aplica el tema guardado antes de pintar (sin destello blanco en modo oscuro)
const scriptTema = `(function(){var d=document.documentElement;try{var t=localStorage.getItem("tema");if(t)d.dataset.tema=t}catch(e){}
document.addEventListener("click",function(e){var b=e.target&&e.target.closest&&e.target.closest("[data-tema-boton]");if(!b)return;
var t=b.getAttribute("data-tema-boton");d.dataset.tema=t;try{localStorage.setItem("tema",t)}catch(e){}
window.dispatchEvent(new CustomEvent("tema",{detail:t}))})})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${ui.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: scriptTema }} />
      </head>
      <body>
        <header className="cabecera">
          <div className="cabecera-in">
            <Link href="/" className="marca" aria-label="Safaris, inicio">
              <IconoPrismaticos size={26} />
              <b>Safaris</b>
              <small className="solo-ancho">Dónde y cuándo ver cada animal, en todo el mundo</small>
            </Link>
            <nav>
              <Link href="/" className="nav-inicio">
                Parques
              </Link>
              <Link href="/planificar">Planificar</Link>
              <Link href="/migracion">Migración</Link>
              <Link href="/comparar">Comparar</Link>
              <Link href="/especies" className="nav-ancho">
                Especies
              </Link>
              <Link href="/guia" className="nav-ancho">
                Guía
              </Link>
              <SelectorTema />
            </nav>
          </div>
        </header>
        {children}
        <footer className="pie">
          <div>
            <span>
              <b>Safaris</b> · Datos abiertos:{" "}
              <a href="https://www.gbif.org/" rel="noopener">
                GBIF
              </a>
              ,{" "}
              <a href="https://www.inaturalist.org/" rel="noopener">
                iNaturalist
              </a>
              ,{" "}
              <a href="https://www.wikidata.org/" rel="noopener">
                Wikidata
              </a>{" "}
              (fotos de Wikimedia Commons, con autor y licencia), lluvia de{" "}
              <a href="https://power.larc.nasa.gov/" rel="noopener">
                NASA POWER
              </a>{" "}
              y ERA5 (Open-Meteo), aeropuertos de{" "}
              <a href="https://ourairports.com/" rel="noopener">
                OurAirports
              </a>{" "}
              y mapa y servicios de ©{" "}
              <a href="https://www.openstreetmap.org/copyright" rel="noopener">
                colaboradores de OpenStreetMap
              </a>
              .
            </span>
            <span>
              Sin comisiones ni alojamientos patrocinados: reservas directamente con el parque, el lodge o el operador.
            </span>
          </div>
        </footer>
      </body>
    </html>
  );
}
