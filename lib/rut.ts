export function formatRut(value: string): string {
  const clean = value.replace(/[^0-9kK]/g, "").toUpperCase()
  if (clean.length <= 1) return clean
  const body = clean.slice(0, -1)
  const dv = clean.slice(-1)
  return `${body}-${dv}`
}
