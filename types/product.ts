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
  category_names: string[] | null
  brand: string | null
  stock: Record<string, number>
  margin_pct?: number | null  // ingreso bruto del vendedor como fracción del precio (ej: 0.85 = comisión 15% a CashBak)
  net_margin?: number | null  // ingreso neto del vendedor en CLP (ya descontado 2% Transbank)
  store_id?: string | null
}
