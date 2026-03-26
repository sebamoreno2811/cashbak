// types/index.ts o types/product.ts

export type Product = {
  id: number
  name: string
  price: number
  cost: number
  description: string | null
  image: string | null
  images?: string[] | null
  category: number
  category_name: string | null
  brand: string | null
  stock: Record<string, number>
  video_url: string | null
  hasPrint: boolean | null
  print_text: string | null
  margin_pct?: number | null  // margen neto del vendedor como fracción (ej: 0.40 = 40%)
  net_margin?: number | null  // margen neto en CLP
  store_id?: string | null
}
