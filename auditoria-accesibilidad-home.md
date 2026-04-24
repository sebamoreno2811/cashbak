# Auditoría de accesibilidad — Home de Cashbak

**Estándar:** WCAG 2.1 AA
**Fecha:** 2026-04-21
**Alcance:** `/` (archivos `app/page.tsx`, `components/how-it-works.tsx`, `components/bet-selector.tsx`, `components/product-selection.tsx`, `components/ClientLayout.tsx`, `app/layout.tsx`)

> **Actualización 2026-04-21 (post-fix):** se aplicaron los fixes en `page.tsx`, `how-it-works.tsx`, `bet-selector.tsx`, `product-selection.tsx`, `ClientLayout.tsx` y `globals.css`. Quedan pendientes solo:
> - **Crítico #5 / #8**: pausa explícita + `prefers-reduced-motion` en las animaciones de `HowItWorks` (el usuario pidió excluirlo).
> - **Menor #20**: touch targets de los chips de categoría (>=40px).
> - **Menor #23**: terminar de migrar otros botones del stack a Radix DropdownMenu (migración mayor, fuera de alcance de esta auditoría).
>
> El carrusel de destacados ya respeta `prefers-reduced-motion`, pausa con foco y tiene botón de pausa. El `ClientLayout` ya tiene skip-link, mega-menú con ARIA + Escape, email como `mailto:`, headings semánticos en el footer e Instagram con `aria-label` que indica nueva pestaña.

---

## Resumen

- **Total hallazgos:** 23
- 🔴 **Críticos:** 6 — bloquean a usuarios de teclado/lector de pantalla
- 🟡 **Mayores:** 11 — degradan seriamente la experiencia
- 🟢 **Menores:** 6 — pulido / legibilidad

**Lo más urgente:** `ProductCard` no es navegable por teclado, el selector de eventos no expone estado ARIA, la página no tiene `<h1>`, varios textos (text-gray-400 sobre fondos claros) no cumplen contraste 4.5:1, y los carruseles/animaciones auto-reproducidos no se pueden pausar.

---

## Perceivable

| # | Problema | Criterio | Severidad | Recomendación |
|---|----------|----------|-----------|---------------|
| 1 | Texto `text-gray-400` (#9ca3af) sobre `bg-white` / `bg-gray-50` (ratio ~2.8:1) en varios lugares: "Mayor CashBak disponible" (`page.tsx:156`), "CB = CashBak — el rango varía…" (`bet-selector.tsx:352`), "Ropa deportiva" y "Selecciona tu evento:" (`how-it-works.tsx:127,135`), "N productos disponibles en CashBak" (`ClientLayout.tsx:140`). | 1.4.3 Contrast | 🔴 Crítico | Subir a `text-gray-500` (#6b7280, ratio 4.63:1) o `text-gray-600`. Para el caption del carrusel del step del evento usar `text-gray-500` como mínimo. |
| 2 | `text-[10px]` en varios lugares (badges "20% CB", "hasta 75% CB", "CB = CashBak...", nombre de tienda en la card, badges del dropdown). 10px queda bajo el mínimo legible y suma el problema de contraste. | 1.4.4 Resize Text / 1.4.3 | 🟡 Mayor | Subir tipografía mínima a 12px (`text-xs`) y revisar contraste en cada combinación. |
| 3 | `text-emerald-100` sobre `bg-emerald-600` en "El CashBak de cada producto varía según el evento que elijas" (`page.tsx:136`) ≈ 2.4:1. | 1.4.3 Contrast | 🔴 Crítico | Usar `text-white` o un tono más claro sobre el emerald-600, o un bg-emerald-700 para darle más contraste. |
| 4 | Badge `bg-emerald-500/90 text-white` con `text-[10px] font-bold` en `page.tsx:352` ("X% seleccionado"). Emerald-500 + blanco ≈ 2.6:1 y texto semi-transparente (`/90`) empeora. | 1.4.3 Contrast | 🟡 Mayor | Cambiar a `bg-emerald-700` (o más oscuro) + `text-white` sólido. Subir a `text-xs`. |
| 5 | Emojis decorativos dispersos (🏆, ⭐, 📦, 👕, ⏳, 💸, ⚽, 🥊, 🇨🇱, 🇮🇹, 🇦🇷) se anuncian a lectores de pantalla como "trofeo/estrella/paquete…". Se agrega ruido semántico al flujo. | 1.3.1 Info & Relationships | 🟡 Mayor | Para emojis puramente decorativos, envolver en `<span aria-hidden="true">🏆</span>`. Si el emoji **aporta** información (p.ej. banderas del país del evento), darle `role="img" aria-label="Chile"`. |
| 6 | No hay `<h1>` en el home. El logo (imagen) cumple como marca pero el título principal de la página no existe. `"¿Cómo funciona?"`, `"⭐ Destacados"`, `"Elige tu evento deportivo"` son `<p>`/`<span>`, no headings. | 1.3.1 / 2.4.6 | 🔴 Crítico | Añadir un `<h1>` visible o con `sr-only` (ej. "CashBak — Marketplace con CashBak deportivo"). Convertir las cabeceras de sección en `<h2>` reales. |
| 7 | Heading jerárquico roto en HowItWorks: hay `<h3>` ("Elige un producto y tu evento") sin `<h2>` padre. | 1.3.1 Info & Relationships | 🟡 Mayor | Añadir un `<h2 class="sr-only">¿Cómo funciona?</h2>` o convertir el párrafo actual a `<h2>`. |
| 8 | Animaciones auto-reproducidas en `HowItWorks` (cursor, partido, cashback) duran >5s y ciclan indefinidamente sin pause/stop. | 2.2.2 Pause, Stop, Hide | 🔴 Crítico | Respetar `prefers-reduced-motion` en los `useEffect` (saltar al estado final si reduce motion) **y** añadir un botón "Pausar animación". |
| 9 | Carrusel auto-scroll (`CarouselRow`, `page.tsx:255-271`) solo pausa en `onMouseEnter`. Un usuario de teclado o tablet no puede detenerlo. | 2.2.2 Pause, Stop, Hide / 2.1.1 | 🔴 Crítico | Pausar también en `onFocus`/`onBlur`, añadir botón visible "Pausar" y respetar `prefers-reduced-motion`. |
| 10 | `text-white/30` en "vs" de la card del partido (`how-it-works.tsx:227`) — texto con 30% de opacidad sobre fondo oscuro, ratio pobre. | 1.4.3 Contrast | 🟢 Menor | Subir a `text-white/60` o `text-gray-400` con contraste medido. |
| 11 | Los bordes `border-gray-200` (#e5e7eb) sobre `bg-white` tienen ratio 1.24:1. Los chips de categoría no seleccionados, el trigger del selector, y las cards dependen de ese borde para su estado no-activo. | 1.4.11 Non-text Contrast | 🟡 Mayor | Usar `border-gray-300` (#d1d5db, ratio 1.56:1) o mejor `border-gray-400` (1.94:1) — idealmente combinado con sombra sutil para llegar a 3:1 efectivo. |

---

## Operable

| # | Problema | Criterio | Severidad | Recomendación |
|---|----------|----------|-----------|---------------|
| 12 | **`ProductCard` usa `<div onClick>` en `page.tsx:336` sin `role`, sin `tabIndex`, sin `onKeyDown`.** Todo el grid de productos y el carrusel son **inaccesibles por teclado**. | 2.1.1 Keyboard / 4.1.2 | 🔴 Crítico | Reemplazar el `<div onClick>` por un `<Link href={productHref}>` envolviendo la card. El link interno de la tienda requiere entonces anidación: o sacarlo de la card, o usar `<Link>` anidado con `stopPropagation` + `preventDefault` en teclado (anti-patrón — mejor sacar el enlace de la tienda). |
| 13 | El mismo patrón: enlace de la tienda **anidado** dentro del div clicable (`page.tsx:359-371`). HTML inválido (`<a>` dentro de un elemento interactivo). Los lectores de pantalla pueden confundirse. | 1.3.1 / 4.1.1 | 🟡 Mayor | Reestructurar: card = link externo a producto; badge de tienda se convierte en un botón visual que solo propaga click al link del padre (o se mueve fuera de la zona clicable). |
| 14 | `BetSelector` (`bet-selector.tsx:216`) abre un dropdown custom sin: `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls`, y las opciones no son `role="option"` ni el contenedor `role="listbox"`. Además, no responde a flechas arriba/abajo, Home/End, Escape ni Enter/Space en las opciones. | 4.1.2 Name/Role/Value / 2.1.1 Keyboard | 🔴 Crítico | Migrar a Radix `Select`/`Combobox` (ya está en el stack por Radix UI) o implementar el patrón [ARIA Listbox](https://www.w3.org/WAI/ARIA/apg/patterns/listbox/). Mínimo: agregar teclas flecha, Escape y mover foco al abrir. |
| 15 | El mega-menú "Productos" en `ClientLayout.tsx:102-143`: botón sin `aria-expanded`, sin `aria-haspopup`, sin `aria-controls`. Solo se cierra con click fuera — no con Escape ni flechas. | 4.1.2 / 2.1.1 | 🟡 Mayor | Agregar ARIA y soporte de teclado. Radix `DropdownMenu` es la vía natural. |
| 16 | Chips de filtro de categoría (`page.tsx:172-186`) se comportan como toggles pero no tienen `aria-pressed`. Un usuario con lector de pantalla no sabe cuál está seleccionado — solo lo diferencia el color. | 4.1.2 / 1.4.1 Use of Color | 🟡 Mayor | Agregar `aria-pressed={categoryFilter === cat}`. También añadir un ícono de check o underline para no depender solo del color. |
| 17 | Botón del carrito (`ClientLayout.tsx:155`) en mobile cuando no hay items: solo ícono `ShoppingCart`, texto "Carrito" está oculto con `hidden sm:inline`. Sin `aria-label`. | 1.1.1 / 4.1.2 | 🟡 Mayor | Agregar `aria-label="Carrito"` al `Link`. |
| 18 | No hay **skip-link** "Saltar al contenido". Un usuario de teclado tiene que tabular por todo el header + megamenu antes de llegar a los productos. | 2.4.1 Bypass Blocks | 🟡 Mayor | Añadir al inicio de `<body>`: `<a href="#main" className="sr-only focus:not-sr-only …">Saltar al contenido</a>` y dar `id="main"` al `<main>`. |
| 19 | No hay estilos explícitos de `:focus-visible` en botones y links — se confía en el default del browser, que Tailwind a veces neutraliza. | 2.4.7 Focus Visible | 🟡 Mayor | Añadir en `globals.css` un estilo base: `*:focus-visible { outline: 2px solid #059669; outline-offset: 2px; }`, o `focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2` en las clases de cada botón. |
| 20 | Touch targets pequeños: botón "atrás" del dropdown (`bet-selector.tsx:243-248`) es `w-7 h-7` = 28×28 CSS px. Cumple WCAG 2.2 AA (24×24) por poco, pero falla el "antiguo" 2.5.5 AAA de 44×44. Los step dots (1.5–4×1.5px) son puramente visuales (OK), pero chips `py-1.5` dan altura ~30px. | 2.5.5 / 2.5.8 | 🟢 Menor | Subir el back button a `w-9 h-9` (36px) y los chips a `py-2` (>=40px). |
| 21 | Cursor `cursor-grab` sobre el carrusel sugiere drag, pero no hay forma equivalente por teclado — ni botones "prev/next" visibles ni focusables. | 2.1.1 Keyboard | 🟡 Mayor | Añadir flechas prev/next `<button aria-label="Anterior">` / `"Siguiente"` visibles o al menos con `sr-only`. |

---

## Understandable

| # | Problema | Criterio | Severidad | Recomendación |
|---|----------|----------|-----------|---------------|
| 22 | El texto `"Selecciona un evento"` del trigger (`bet-selector.tsx:226`) es placeholder, no label formal. No hay `<label htmlFor>` asociado ni `aria-labelledby` apuntando al `"¿Qué evento eliges hoy?"` del contenedor (`page.tsx:139`). | 3.3.2 Labels or Instructions / 1.3.1 | 🟡 Mayor | Dar `id="bet-selector-label"` al `<p>` del título y añadir `aria-labelledby="bet-selector-label"` al `<button>` del trigger. |

---

## Robust

| # | Problema | Criterio | Severidad | Recomendación |
|---|----------|----------|-----------|---------------|
| 23 | Botón hamburguesa (`ClientLayout.tsx:164`) tiene `aria-label="Menú"` pero no `aria-expanded`, y el drawer no tiene `id` referenciado por `aria-controls`. | 4.1.2 Name/Role/Value | 🟢 Menor | Añadir `aria-expanded={mobileOpen}` y `aria-controls="mobile-drawer"` con `id="mobile-drawer"` en el `<div>` del drawer. Ídem botón X cuando está abierto (aria-label="Cerrar menú"). |

---

## Chequeo de contraste (muestras clave)

| Elemento | Foreground | Background | Ratio | Requerido | ¿Pasa? |
|----------|-----------|------------|-------|-----------|--------|
| "Mayor CashBak disponible" | text-gray-400 #9ca3af | bg-white #ffffff | 2.85:1 | 4.5:1 | ❌ |
| "Ropa deportiva" (card mini) | text-gray-400 | bg-white | 2.85:1 | 4.5:1 | ❌ |
| "CB = CashBak — el rango varía…" (10px) | text-gray-400 | bg-gray-50 | 2.76:1 | 4.5:1 | ❌ |
| "El CashBak de cada producto varía…" | text-emerald-100 #d1fae5 | bg-emerald-600 #059669 | 2.40:1 | 4.5:1 | ❌ |
| Texto del cuerpo verde claro | text-green-200 #bbf7d0 | bg-green-900 #14532d | 9.8:1 | 4.5:1 | ✅ |
| Badge "Primer paso" | text-emerald-300 #6ee7b7 | bg-green-900 | 7.3:1 | 4.5:1 | ✅ |
| "vs" card partido | text-white/30 | bg-gray-900 | ~2.0:1 | 4.5:1 | ❌ |
| Link "Ver todos los productos" | text-white | bg-green-900 | 12.6:1 | 4.5:1 | ✅ |
| Chip categoría no activo | text-gray-600 #4b5563 | bg-white | 7.56:1 | 4.5:1 | ✅ |
| Borde gris chip | border-gray-200 #e5e7eb | bg-white | 1.24:1 | 3:1 (UI) | ❌ |

---

## Navegación por teclado (check rápido)

| Elemento | Tab | Enter/Space | Escape | Flechas |
|----------|-----|-------------|--------|---------|
| Logo / links header | ✅ | ✅ | — | — |
| Mega-menú "Productos" | ✅ abre, pero no atrapa foco | ✅ abre | ❌ no cierra | ❌ no navega |
| Selector de evento (BetSelector) | ✅ abre | ✅ abre | ❌ no cierra | ❌ no navega opciones |
| Chips de categoría | ✅ | ✅ | — | — |
| **ProductCard del grid** | ❌ **no focuseable** | ❌ no activable | — | — |
| Carrusel destacados | ❌ cards no focuseables | ❌ | — | ❌ |
| Botón "Ver todos los productos" | ✅ | ✅ | — | — |
| Drawer mobile (hamburguesa) | ✅ | ✅ | ❌ no cierra | — |

---

## Prioridades para arreglar

1. **🔴 Hacer la `ProductCard` un `<Link>` real** (#12, #13) — hoy el grid completo es invisible al teclado y lectores de pantalla. Bloqueante.
2. **🔴 Migrar `BetSelector` a Radix `Select` o implementar ARIA Listbox** (#14) — el selector de evento es el eje central de tu producto; debe ser accesible.
3. **🔴 Agregar `<h1>` al home + jerarquía de headings** (#6, #7) — SEO + lectores de pantalla.
4. **🔴 Arreglar contrastes de texto gris claro** (#1, #3, #4) — un cambio global de `text-gray-400` → `text-gray-500` en el home soluciona la mayoría.
5. **🔴 Respetar `prefers-reduced-motion` y añadir pause** a carrusel + HowItWorks (#8, #9) — afecta a usuarios con trastornos vestibulares.
6. **🟡 Skip link + focus ring global** (#18, #19) — son 10 líneas de código y mejoran todo el sitio.
7. **🟡 `aria-expanded` / `aria-pressed` / `aria-label` donde falta** (#15, #16, #17, #23).
8. **🟡 Eliminar `<a>` anidado** dentro del card (#13).

---

## Notas adicionales

- **Idioma:** `<html lang="es">` ✅ correcto en `app/layout.tsx:76`.
- **Radix UI ya está en el stack** — conviene apoyarse en sus primitivos (`Select`, `DropdownMenu`, `Dialog`) en vez de componentes custom, ya vienen con ARIA y teclado correctos.
- **Tailwind:** sugiero declarar utilidades `focus-visible` en el config o en `globals.css` una sola vez. Evita tener que agregarlas elemento por elemento.
- **Testing recomendado:** pasar [axe DevTools](https://www.deque.com/axe/devtools/) en un build local + prueba manual con VoiceOver (Mac) / NVDA (Windows). Automatizado captura ~30% de los problemas; los más graves de esta auditoría (#12, #14) solo se detectan manualmente.

---

## Fix rápido en el CSS global

```css
/* globals.css */
*:focus-visible {
  outline: 2px solid #059669;
  outline-offset: 2px;
  border-radius: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

.sr-only:not(:focus):not(:active) {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

Con esto y el fix de `ProductCard` como `<Link>` ya recuperás la mayoría del cumplimiento.
