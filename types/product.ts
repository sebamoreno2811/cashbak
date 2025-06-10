// types/index.ts o types/product.ts

export type Product = {
  id: number
  name: string
  price: number
  cost: number
  description: string | null
  image: string | null
  category: number
  category_name: string | null
  brand: string | null
  stock: Record<string, number> // suponiendo que stock es un JSON del tipo { "S": 5, "M": 2, "L": 0 }
  video_url: string | null
  hasPrint: boolean | null
  print_text: string | null
}
