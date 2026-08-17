import { cache } from "react"
import { redirect, notFound } from "next/navigation"
import type { Metadata } from "next"
import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"
import { safeJsonForScript } from "@/lib/utils"
import { toSlug } from "@/lib/slug"
import ProductClient from "./ProductClient"

type Props = { params: Promise<{ id: string }> }

export function toHandle(name: string, numericId: number) {
  return `${toSlug(name)}-${numericId.toString(36)}`
}

function parseHandle(handle: string): { numericId: number; isOld: boolean } | null {
  // Formato nuevo: slug-base36id  (e.g. "camiseta-u-catolica-retro-j")
  const parts = handle.split("-")
  if (parts.length >= 2) {
    const last = parts[parts.length - 1]
    const n = parseInt(last, 36)
    if (!isNaN(n) && n > 0 && n.toString(36) === last) {
      return { numericId: n, isOld: false }
    }
  }
  // Formato antiguo: número decimal puro (e.g. "19")
  const n = parseInt(handle, 10)
  if (!isNaN(n) && n > 0 && n.toString() === handle) {
    return { numericId: n, isOld: true }
  }
  return null
}

const getProduct = cache(async (id: number) => {
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
  const { id: handle } = await params
  const parsed = parseHandle(handle)
  if (!parsed) return { title: "Producto | CashBak" }
  const p = await getProduct(parsed.numericId)
  if (!p) return { title: "Producto | CashBak" }

  const img = p.images?.[0] ?? p.image ?? null
  const descBase = p.description ? p.description.slice(0, 110) : `Compra ${p.name} en CashBak`
  const priceFormatted = p.price.toLocaleString("es-CL", { maximumFractionDigits: 0 })
  const canonicalHandle = toHandle(p.name, p.id)

  return {
    title: p.name,
    description: `${descBase} — Recupera hasta el 100% con cashback deportivo.`,
    keywords: [p.name, "cashback Chile", "cashbak", "comprar con cashback", "recuperar dinero Chile"],
    alternates: { canonical: `https://cashbak.cl/producto/${canonicalHandle}` },
    openGraph: {
      title: `${p.name} | CashBak`,
      description: `${p.name} a $${priceFormatted} CLP. Recupera hasta el 100% si se cumple tu evento deportivo.`,
      url: `https://cashbak.cl/producto/${canonicalHandle}`,
      ...(img ? { images: [{ url: img, alt: p.name }] } : {}),
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { id: handle } = await params
  const parsed = parseHandle(handle)
  if (!parsed) notFound()

  const p = await getProduct(parsed.numericId)
  if (!p) notFound()

  const canonicalHandle = toHandle(p.name, p.id)

  // Redirige a URL canónica si viene de formato antiguo o slug desactualizado
  if (handle !== canonicalHandle) {
    redirect(`/producto/${canonicalHandle}`)
  }

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    ...(p.images?.length ? { image: p.images } : p.image ? { image: [p.image] } : {}),
    ...(p.description ? { description: p.description } : {}),
    ...(p.brand ? { brand: { "@type": "Brand", name: p.brand } } : {}),
    offers: {
      "@type": "Offer",
      url: `https://cashbak.cl/producto/${canonicalHandle}`,
      priceCurrency: "CLP",
      price: String(p.price),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "CashBak" },
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: safeJsonForScript(schema) }}
      />
      <ProductClient initialProduct={p as any} />
    </>
  )
}
