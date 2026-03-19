/**
 * Script de migración de imágenes locales → Supabase Storage
 * Uso: node scripts/migrate-images.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, readdirSync, statSync } from "fs"
import { join, extname, basename } from "path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ Faltan variables de entorno. Asegúrate de tener NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY")
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Mapeo: ruta local → ruta en Storage
const IMAGE_MAP = {
  "/img/img-retro-corta/coloclo-1991.jpeg":       "retro-corta/coloclo-1991.jpeg",
  "/img/img-retro-corta/uchile-1998.jpeg":         "retro-corta/uchile-1998.jpeg",
  "/img/img-retro-corta/ucatolica-retro1.jpeg":    "retro-corta/ucatolica-retro1.jpeg",
  "/img/img-retro-corta/uchile-2011.jpeg":         "retro-corta/uchile-2011.jpeg",
  "/img/img-retro-corta/santos-neymar.jpeg":       "retro-corta/santos-neymar.jpeg",
  "/img/img-retro-corta/atleti-spiderman.jpeg":    "retro-corta/atleti-spiderman.jpeg",
  "/img/img-retro-larga/colocolo-2006.jpeg":       "retro-larga/colocolo-2006.jpeg",
  "/img/img-retro-larga/real-2017.jpeg":           "retro-larga/real-2017.jpeg",
  "/img/img-retro-larga/united-2008.jpeg":         "retro-larga/united-2008.jpeg",
  "/img/img-actual/colocolo-25.26.jpeg":           "actual/colocolo-25.26.jpeg",
  "/img/img-actual/colocolo-centenario.jpeg":      "actual/colocolo-centenario.jpeg",
  "/img/img-actual/uchile-25-26.jpeg":             "actual/uchile-25-26.jpeg",
  "/img/img-retro-corta/barca-2008.jpeg":          "retro-corta/barca-2008.jpeg",
  "/img/img-retro-corta/boca-medel.jpeg":          "retro-corta/boca-medel.jpeg",
  "/img/img-retro-corta/fiorentina-nintendo.jpeg": "retro-corta/fiorentina-nintendo.jpeg",
  "/img/img-retro-corta/juventus-2016.jpeg":       "retro-corta/juventus-2016.jpeg",
  "/img/img-retro-corta/real-2009.jpeg":           "retro-corta/real-2009.jpeg",
  "/img/img-retro-corta/river-salas.jpeg":         "retro-corta/river-salas.jpeg",
  "/img/img-retro-corta/ucatolica-retro2.jpeg":    "retro-corta/ucatolica-retro2.jpeg",
}

const PUBLIC_DIR = join(__dirname, "../public")
const BUCKET = "product-images"

async function uploadImage(localPath, storagePath) {
  const fullPath = join(PUBLIC_DIR, localPath)
  const file = readFileSync(fullPath)
  const contentType = "image/jpeg"

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType, upsert: true })

  if (error) {
    console.error(`  ❌ Error subiendo ${storagePath}:`, error.message)
    return null
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

async function main() {
  console.log("🚀 Iniciando migración de imágenes...\n")

  // 1. Obtener productos actuales
  const { data: products, error } = await supabase.from("products").select("id, image")
  if (error) { console.error("❌ Error obteniendo productos:", error.message); process.exit(1) }

  let ok = 0
  let fail = 0

  for (const product of products) {
    const storagePath = IMAGE_MAP[product.image]

    if (!storagePath) {
      console.log(`⚠️  Producto ${product.id}: ruta no mapeada (${product.image})`)
      fail++
      continue
    }

    process.stdout.write(`  Subiendo ${storagePath}... `)
    const publicUrl = await uploadImage(product.image, storagePath)

    if (!publicUrl) { fail++; continue }

    // 2. Actualizar URL en la tabla
    const { error: updateError } = await supabase
      .from("products")
      .update({ image: publicUrl })
      .eq("id", product.id)

    if (updateError) {
      console.error(`❌ Error actualizando producto ${product.id}:`, updateError.message)
      fail++
    } else {
      console.log("✅")
      ok++
    }
  }

  console.log(`\n✅ ${ok} imágenes migradas correctamente`)
  if (fail > 0) console.log(`❌ ${fail} fallaron`)
  console.log("\n🎉 Migración completada. Las URLs en Supabase ya apuntan a Storage.")
}

main()
