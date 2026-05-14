import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Serializa un valor a JSON seguro para inyectar dentro de un `<script>` inline.
 *
 * `JSON.stringify` por sí solo no escapa `</script>` ni los separadores de línea Unicode
 * (U+2028, U+2029) que sí cierran un bloque de script en algunos parsers HTML. Sin esto,
 * cualquier campo controlado por usuario (nombre/descripción de producto, etc.) que llegue
 * a un JSON-LD via `dangerouslySetInnerHTML` permite XSS.
 *
 * Usar siempre que se inyecte JSON dentro de un script tag.
 */
export function safeJsonForScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029")
}
