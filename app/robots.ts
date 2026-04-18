import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/mi-tienda/", "/api/", "/checkout/"],
      },
    ],
    sitemap: "https://cashbak.cl/sitemap.xml",
    host: "https://cashbak.cl",
  }
}
