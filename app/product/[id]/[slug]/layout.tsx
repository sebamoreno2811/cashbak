import type { Metadata } from "next"
import { createSupabaseClientWithoutCookies } from "@/utils/supabase/server"

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = createSupabaseClientWithoutCookies()
  const { data: product } = await supabase
    .from("products")
    .select("name, description, image, price")
    .eq("id", id)
    .single()

  if (!product) {
    return { title: "Producto no encontrado" }
  }

  const title = `${product.name} con CashBak`
  const description = product.description
    ?? `Compra ${product.name} en CashBak y recupera hasta el 100% de tu dinero si se cumple tu evento deportivo.`

  return {
    title,
    description,
    keywords: [product.name, "cashback Chile", "cashbak", "comprar con cashback", "recuperar dinero Chile"],
    alternates: {
      canonical: `https://cashbak.cl/product/${id}/${slugify(product.name)}`,
    },
    openGraph: {
      title,
      description,
      url: `https://cashbak.cl/product/${id}/${slugify(product.name)}`,
      images: product.image ? [{ url: product.image, alt: product.name }] : [],
      type: "website",
    },
  }
}

export default async function ProductLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ id: string; slug: string }>
}) {
  const { id, slug } = await params
  const supabase = createSupabaseClientWithoutCookies()
  const { data: product } = await supabase
    .from("products")
    .select("name, description, image, price")
    .eq("id", id)
    .single()

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description ?? undefined,
        image: product.image ?? undefined,
        url: `https://cashbak.cl/product/${id}/${slug}`,
        offers: {
          "@type": "Offer",
          priceCurrency: "CLP",
          price: product.price,
          availability: "https://schema.org/InStock",
          seller: {
            "@type": "Organization",
            name: "CashBak",
          },
        },
      }
    : null

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  )
}
