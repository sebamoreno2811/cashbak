export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina tildes
    .replace(/[^a-z0-9\s-]/g, "")   // solo letras, numeros, espacios y guiones
    .trim()
    .replace(/\s+/g, "-")            // espacios → guiones
    .replace(/-+/g, "-")             // guiones multiples → uno
}
