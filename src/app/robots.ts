import type { MetadataRoute } from "next";
import { SITIO } from "@/lib/sitio";

export default function robots(): MetadataRoute.Robots {
  // /viaje y /comparar dependen de lo que elige cada uno: no tienen nada que indexar
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/viaje", "/comparar"] },
    sitemap: `${SITIO}/sitemap.xml`,
  };
}
