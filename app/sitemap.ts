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

  // Fetch all vendor stores
  const { data: vendors } = await supabase
    .from("vendor_profiles")
    .select("user_id, store_name, updated_at")

  const productUrls: MetadataRoute.Sitemap = (products ?? []).map((p: { id: string; name: string; updated_at: string | null }) => ({
    url: `${BASE_URL}/product/${p.id}/${slugify(p.name)}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const vendorUrls: MetadataRoute.Sitemap = (vendors ?? []).map((v: { user_id: string; updated_at: string | null }) => ({
    url: `${BASE_URL}/tiendas/${v.user_id}`,
    lastModified: v.updated_at ? new Date(v.updated_at) : new Date(),
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
