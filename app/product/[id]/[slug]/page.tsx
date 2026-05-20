import { cache } from "react"
import type { Metadata } from "next"
import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"
import { safeJsonForScript } from "@/lib/utils"
import ProductClient from "./ProductClient"

type Props = { params: Promise<{ id: string; slug: string }> }

const getProduct = cache(async (id: string) => {
  const supabase = createSupabaseClientWithoutCookies()
  const { data: product } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single()
  if (!product) return null
  if (!product.store_id) return product
  const { data: store } = await supabase
    .from("stores")
    .select("status")
    .eq("id", product.store_id)
    .single()
  if (!store || store.status !== "approved") return null
  return product
})

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const p = await getProduct(id)
  if (!p) return { title: "Producto | CashBak" }

  const img = p.images?.[0] ?? p.image ?? null
  const descBase = p.description
    ? p.description.slice(0, 110)
    : `Compra ${p.name} en CashBak`
  const priceFormatted = p.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })

  return {
    title: p.name,
    description: `${descBase} — Recupera hasta el 100% con cashback deportivo.`,
    openGraph: {
      title: `${p.name} | CashBak`,
      description: `${p.name} a $${priceFormatted} CLP. Recupera hasta el 100% si se cumple tu evento deportivo.`,
      ...(img ? { images: [{ url: img }] } : {}),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id, slug } = await params
  const p = await getProduct(id)

  const schema = p
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: p.name,
        ...(p.images?.length ? { image: p.images } : p.image ? { image: [p.image] } : {}),
        ...(p.description ? { description: p.description } : {}),
        ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
        offers: {
          "@type": "Offer",
          url: `https://cashbak.cl/product/${id}/${slug}`,
          priceCurrency: "CLP",
          price: String(p.price),
          availability: "https://schema.org/InStock",
          seller: { "@type": "Organization", name: "CashBak" },
        },
      }
    : null

  return (
    <>
      {schema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonForScript(schema) }}
        />
      )}
      <ProductClient initialProduct={p as any} />
    </>
  )
}
