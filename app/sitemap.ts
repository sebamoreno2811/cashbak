import type { MetadataRoute } from "next"
import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"

const BASE_URL = "https://cashbak.cl"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createSupabaseClientWithoutCookies()

  // Fetch all active products
  const { data: products } = await supabase
    .from("products")
    .select("id, name, updated_at")
    .eq("status", "active")

  // Fetch all approved stores
  const { data: stores } = await supabase
    .from("stores")
    .select("id, slug, updated_at")
    .eq("status", "approved")

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p: { id: string; name: string; updated_at: string | null }) => ({
    url: `${BASE_URL}/producto/${slugify(p.name)}-${Number(p.id).toString(36)}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const vendorUrls: MetadataRoute.Sitemap = (stores ?? []).map((s: { id: string; slug: string | null; updated_at: string | null }) => ({
    url: `${BASE_URL}/tienda/${s.slug ?? s.id}`,
    lastModified: s.updated_at ? new Date(s.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tiendas`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/sell`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/howto`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ]

  return [...staticUrls, ...productUrls, ...vendorUrls]
}
