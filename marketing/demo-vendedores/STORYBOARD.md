# STORYBOARD.md — Cashbak Seller Demo

> Norte creativo para Step 6. Un beat = una composition HTML. Cada composition se referencia desde `index.html` con `data-composition-src` y un `data-start` calculado por suma. Los `data-duration` son la primera estimación; ajustar al transcript real en Step 5.

## Plan de proyecto

| # | File | Beat | Duración inicial | Inicio | Track |
|---|------|------|------|------|------|
| 1 | `compositions/01-hook.html` | Hook | 3.5s | 0.0s | root |
| 2 | `compositions/02-contexto.html` | Contexto | 5.0s | 3.5s | root |
| 3 | `compositions/03-idea.html` | Idea Cashbak | 7.0s | 8.5s | root |
| 4 | `compositions/04-paso1-postula.html` | Paso 1 | 7.0s | 15.5s | root |
| 5 | `compositions/05-paso2-publica.html` | Paso 2 | 9.0s | 22.5s | root |
| 6 | `compositions/06-paso3-comision.html` | Paso 3 | 10.0s | 31.5s | root |
| 7 | `compositions/07-paso4-vende.html` | Paso 4 | 6.0s | 41.5s | root |
| 8 | `compositions/08-cierre.html` | Cierre | 4.5s | 47.5s | root |
| **Total** | | | **52.0s** | | |

## Auditoría de assets

| Asset | Tipo | Estado | Ubicación |
|---|---|---|---|
| `assets/logo.png` | PNG isotipo | ✓ copiado del repo | `public/img/logo_no_text.png` |
| `assets/logo-text.png` | PNG wordmark | ✓ copiado del repo | `public/img/logo.png` |
| `assets/narration.wav` | Audio TTS | ⏳ generar localmente con `npx hyperframes tts` |
| `transcript.json` | Whisper word-level | ⏳ generar localmente con `npx hyperframes transcribe` |
| Inter font | Web font | ✓ vía Google Fonts CDN |
| GSAP 3.14 | Animation lib | ✓ vía cdn.jsdelivr.net |
| Mocks UI | Inline HTML | ✓ inline por composition |

## Reglas comunes a TODAS las compositions

- **Viewport fijo**: 1920×1080. Body con `width:1920px; height:1080px; overflow:hidden; background:#fff`.
- **Font stack**: Inter (Google Fonts), fallback `system-ui, sans-serif`.
- **Timeline registrado** en `window.__timelines["<composition-id>"] = gsap.timeline({ paused: true })`. Sin `Date.now()`, sin `Math.random()`, sin fetch.
- **Cero clases Tailwind** dentro de compositions (Tailwind no corre en HF). Usar CSS vanilla con tokens del DESIGN.md.
- **Pill "Paso N/4"** persistente arriba-izquierda en beats 4–7: `position:absolute; top:48px; left:48px; padding:10px 20px; background:#10b981; color:#fff; border-radius:999px; font:700 18px Inter; letter-spacing:0.06em;`.
- **Browser frame** (beats 4–7): `<div class="frame">` con barra superior 48px, dots, URL bar redondeada con dominio.
- **Easings preferidos**: `power2.out` para entradas, `power3.inOut` para zooms, `expo.out` para reveals dramáticos.

---

## Beat 1 — Hook (3.5s) `01-hook.html`

**Mood**: hero limpio y energético. Verde profundo de fondo.
**Cámara**: estática 1920×1080, no zoom.
**Layers**:
- (track 0) Fondo: gradiente `linear-gradient(135deg, #14532d 0%, #166534 70%, #059669 140%)`. Atmósfera `radial-gradient` arriba-derecha con `rgba(16,185,129,0.18)`.
- (track 1) Logo CashBak isotipo (96×96) centrado horizontalmente, y=120px.
- (track 2) Wordmark "CashBak" (Inter 800, 56px, letter-spacing -0.02em, blanco) bajo el logo.
- (track 3) Hero H1 centrado vertical: "Un beneficio extra en cada compra." (Inter 900, 96px, color blanco, line-height 1.05). Sub: "Más clientes para tu tienda." (Inter 500, 40px, `#a7f3d0`).
**Animaciones**:
- 0.0s: logo `scale 0.8 → 1`, opacity 0→1, easing `power2.out`, dur 0.6s.
- 0.3s: wordmark `y:30 → 0`, opacity 0→1, dur 0.5s.
- 0.7s: H1 reveal por línea (split en 2 líneas, `clip-path: inset(0 100% 0 0)` → `inset(0 0 0 0)`), dur 0.8s, stagger 0.15s.
- 1.6s: subtítulo opacity 0→1, dur 0.4s.
- Idle 1.5s.
**SFX (opcional)**: subtle "whoosh" al revelar H1 (sin asset; hint para futuro).
**Transición a Beat 2**: fade-out global 0.3s al final.

---

## Beat 2 — Contexto (5s) `02-contexto.html`

**Mood**: tensión competitiva. Fondo neutro `#f9fafb`.
**Cámara**: dolly leve hacia atrás (scale 1.05 → 1) sobre el grid.
**Layers**:
- (track 0) Fondo `#f9fafb` con vignette sutil.
- (track 1) Tres mock-cards de productos genéricos en fila (`Tienda A`, `Tienda B`, `Tienda C`) con precios visibles. Cards 320×400px, gap 32px.
- (track 2) "Lupa" SVG flotando que hace highlight en cada precio uno tras otro (badge rojo "$29.990 → $27.990 → $26.990") simulando comparación.
- (track 3) Caption inferior centrado: "Llamar la atención cuesta caro." (Inter 700, 40px, `#111827`).
**Animaciones**:
- 0.0s: cards entran de abajo, stagger 0.1s, dur 0.5s, easing `power2.out`.
- 0.8s: lupa aparece y se mueve A→B→C (motionPath o keyframes x/y), dur 2.5s.
- 0.8s, 1.6s, 2.4s: cada card vibra ligeramente (rotation ±2deg) cuando la lupa la toca.
- 3.0s: caption fade-in `y:20 → 0`, dur 0.4s.
- Hold 1.5s.
**Transición a Beat 3**: scale-up del producto central que se transformará en el producto Cashbak (continuity edit).

---

## Beat 3 — Idea Cashbak (7s) `03-idea.html`

**Mood**: revelación. Verde + blanco. La solución llega.
**Cámara**: zoom-in suave sobre la card de producto (1 → 1.08).
**Layers**:
- (track 0) Fondo split: izquierda `#ecfdf5` (mint), derecha `#ffffff`.
- (track 1) Card de producto centrada (480×640px): foto placeholder zapatillas, nombre "Zapatillas Running Pro", precio "$39.990", badge verde animado "CashBak hasta 100%".
- (track 2) Debajo de la card: BetSelector mock con 3 opciones, una seleccionada (estado verde sólido): "Francia gana el Mundial · 70%". Las otras dos en gris: "Chile vs Brasil — empate · 35%", "Real Madrid gana · 50%".
- (track 3) Frase pivote a la derecha de la card: "El cliente elige un evento." (Inter 800, 56px) / "Tú recibes tu ingreso siempre." (Inter 700, 40px verde `#10b981`).
**Animaciones**:
- 0.0s: card aparece con scale 0.95→1 + opacity, dur 0.5s.
- 0.4s: badge "CashBak hasta 100%" pulsa (scale 1→1.08→1, repeat 2, dur 0.4s).
- 0.8s: BetSelector entra desde abajo, opciones stagger 0.15s.
- 1.6s: la opción "Francia" se "selecciona" (cambio de fondo a verde sólido), dur 0.3s, easing `power2.out`.
- 2.2s: frase pivote reveal con clip-path por línea, stagger 0.4s.
- Hold 2s.
**Transición a Beat 4**: la card y el BetSelector se desvanecen y aparece browser frame.

---

## Beat 4 — Paso 1: Postula tu tienda (7s) `04-paso1-postula.html`

**Mood**: onboarding amable. Browser frame abierto en `cashbak.cl/sell/aplicar`.
**Cámara**: zoom-in al formulario (scale 1 → 1.15) hacia los últimos 2s.
**Layers**:
- (track 0) Fondo `#f3f4f6`.
- (track 1) Browser frame: barra macOS con dots, URL bar mostrando `cashbak.cl/sell/aplicar`. Dentro: hero "Postula tu tienda en CashBak", form con 4 inputs (Nombre tienda, RUT, Categoría, Email), botón verde "Enviar solicitud".
- (track 2) Cursor SVG que se mueve y "escribe" valores dummy:
  - "Nombre tienda" → "Deportes Andes"
  - "RUT" → "76.123.456-7"
  - "Categoría" → dropdown abre y selecciona "Deportes"
  - "Email" → "contacto@deportesandes.cl"
- (track 3) Pill "Paso 1 / 4" arriba izquierda. Highlight pulse sobre el botón "Enviar solicitud" en los últimos 1.5s.
**Animaciones**:
- 0.0s: pill desliza desde izquierda, dur 0.4s.
- 0.0s: browser frame entra desde abajo con `y:60 → 0`, dur 0.5s.
- 0.5–4.5s: cursor recorre y completa los 4 campos (texto auto-typed con `gsap.to({}, { duration: ..., onUpdate })`).
- 5.0s: zoom-in al botón verde, scale 1→1.15.
- 5.2s: botón pulse (sombra emerald, scale 1→1.05→1, repeat 3).
**Transición a Beat 5**: cross-fade al dashboard `mi-tienda`.

---

## Beat 5 — Paso 2: Publica un producto (9s) `05-paso2-publica.html`

**Mood**: control y simplicidad. Dashboard fiel a `StoreManager`.
**Cámara**: pan derecha de la sidebar al formulario, luego zoom al input "Precio".
**Layers**:
- (track 0) Fondo `#f9fafb`.
- (track 1) Browser frame en `cashbak.cl/mi-tienda`. Dentro:
  - Sidebar izquierda: lista "Mis productos" con 2 productos existentes + botón verde "+ Nuevo producto".
  - Panel derecho: form "Nuevo producto" con campos Nombre, Descripción (textarea), Imagen (upload box), Stock, Precio.
- (track 2) Cursor click "+ Nuevo producto" al inicio. Luego completa:
  - Nombre → "Zapatillas Running Pro"
  - Descripción auto-type → "Zapatillas livianas, ideales para correr en trail."
  - Imagen → fade-in de placeholder (rectángulo gris → foto)
  - Stock → "25"
  - Precio → "$39.990" (digit-by-digit)
- (track 3) Pill "Paso 2 / 4". Highlight verde pulse sobre el campo "Precio" en los últimos 2s.
**Animaciones**:
- 0.0s: pill desliza, dashboard fade-in.
- 0.5s: cursor click en "+ Nuevo producto", form aparece desde la derecha (slide-in 0.4s).
- 1.0–6.0s: secuencia de auto-fill (cada campo recibe foco visible — borde verde — luego texto).
- 6.5s: zoom al input "Precio", scale 1→1.2, dur 0.6s.
- 7.5s: highlight pulsante (box-shadow `0 0 0 0 → 0 0 0 8px rgba(16,185,129,0.4)`).
**Transición a Beat 6**: el campo "Precio" se queda en foco y el resto del dashboard se desvanece dejando solo la calculadora.

---

## Beat 6 — Paso 3: Define tu comisión (10s) `06-paso3-comision.html`

**Mood**: AHA del modelo. Calculadora `/sell` recreada 1:1.
**Cámara**: estática centrada, zoom suave al breakdown al final.
**Layers**:
- (track 0) Fondo `#ffffff` con borde sutil.
- (track 1) Calculadora a la izquierda (640px ancho):
  - Input "Precio venta" `$39.990` (fijo).
  - Input "Costo (opcional)" `$22.000` (fijo).
  - Slider grande "Tu ingreso final" — track gris, fill verde, thumb blanco. Animado de `$36.991 (7.5%)` → `$34.991 (12.5%)` → `$31.991 (20%)`.
  - Etiqueta debajo del slider: "Fondo CashBak: 7,5% / 12,5% / 20%" cambiando con el slider.
- (track 2) Card de producto a la derecha (320×400):
  - Imagen + nombre.
  - Badge CashBak% sincronizado al slider: 50% → 70% → 100% (números crecen con `gsap.to({})` onUpdate).
- (track 3) Breakdown numérico debajo de la card (aparece al final, 320×220):
  - Precio venta · $39.990
  - Fondo CashBak (12,5%) · −$5.000
  - Procesamiento (2%) · −$800
  - **Tu ingreso final · $34.190**
- (track 4) Pill "Paso 3 / 4". Caption inferior: "Tu ingreso queda fijo. Lo recibes siempre." (Inter 700, 32px) que aparece al final.
**Animaciones**:
- 0.0s: calculadora fade-in desde izquierda, dur 0.6s.
- 0.6s: card de producto fade-in desde derecha.
- 1.2s: slider thumb se mueve a 7,5% — badge → 50%.
- 3.0s: thumb a 12,5% — badge → 70%, badge pulse.
- 5.0s: thumb a 20% — badge → 100%, badge pulse fuerte (scale 1→1.15→1).
- 6.5s: thumb vuelve a 12,5% (anclando ejemplo "estándar").
- 7.0s: breakdown aparece desde abajo de la card.
- 8.5s: caption inferior reveal.
- Hold 1s.
**Importante**: NO mostrar texto que insinúe cómo se cubre el cashback (nada de "Cashbak cubre", "fondo de reserva", etc.). El framing es solo "tu ingreso queda fijo".
**Transición a Beat 7**: zoom-out de la card de producto que se "multiplica" en el grid del beat 7.

---

## Beat 7 — Paso 4: Vende (6s) `07-paso4-vende.html`

**Mood**: distribución y resultado. Tres pantallas a la vez.
**Cámara**: triple split inicial → zoom a la 3ra pantalla (tienda del vendedor).
**Layers**:
- (track 0) Fondo `#f9fafb`.
- (track 1) Triple split horizontal (3 mini-browsers, 600×420 cada uno):
  - Izq: home `cashbak.cl/` con grid de 6 productos, el del vendedor en la primera fila.
  - Centro: search results en `cashbak.cl/products?q=zapatillas`.
  - Der: `cashbak.cl/tienda/deportes-andes` con el producto destacado.
- (track 2) Cursor del cliente en la 3ra pantalla: hover sobre el producto → click → mini-toast verde "Añadido al carrito".
- (track 3) Pill "Paso 4 / 4".
**Animaciones**:
- 0.0s: tres mini-browsers entran simultáneo desde abajo con stagger 0.1s.
- 1.0s: en la 3ra pantalla, cursor aparece y hover sobre el producto, badge CashBak% pulsa.
- 2.5s: cursor click en "Añadir al carrito", botón cambia a verde sólido, mini-toast aparece arriba.
- 4.0s: zoom-in a la 3ra pantalla (scale 1→1.2).
- Hold 1s.
**Transición a Beat 8**: white-flash 0.2s + fade al cierre.

---

## Beat 8 — Cierre (4.5s) `08-cierre.html`

**Mood**: cierre de marca, simple y confiado.
**Cámara**: estática.
**Layers**:
- (track 0) Fondo gradient `#14532d → #059669` (mismo que hook, para "rima visual").
- (track 1) Logo wordmark CashBak (text + isotipo) centrado, 480px ancho.
- (track 2) CTA H1: "Abre tu tienda en cashbak.cl/sell" (Inter 900, 80px, blanco).
- (track 3) Línea fina debajo: "Sin costos fijos · Soporte 24/7 con Baki" (Inter 500, 28px, `#a7f3d0`).
- (track 4) Botón verde brillante "Postular ahora →" (decorativo, 320×64, fondo `#10b981`, sombra emerald).
**Animaciones**:
- 0.0s: logo aparece con scale 0.9→1, opacity 0→1, dur 0.5s.
- 0.4s: H1 reveal por palabras (stagger 0.08s).
- 1.4s: subtítulo fade-in.
- 1.8s: botón scale-in con bounce sutil.
- 2.5s: botón pulse infinito hasta el final (loop scale 1→1.04→1, dur 1.2s).
- 3.0s: idle hold 1.5s.

---

## Subtítulos (track 4 global)

Para accesibilidad y silencio (autoplay sin sonido en social), cada beat puede llevar subtítulo del fragmento de narración correspondiente, sincronizado con el transcript Whisper. Estilo: `position: absolute; bottom: 80px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.65); color: #fff; padding: 12px 24px; border-radius: 8px; font: 600 28px Inter; max-width: 1400px; text-align: center;`. La activación queda como toggle `data-captions="on"` en el root del index.html (off por defecto en esta versión).
