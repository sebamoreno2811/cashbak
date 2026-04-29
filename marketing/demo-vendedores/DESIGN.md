# DESIGN.md — Cashbak Seller Demo

> Cheat sheet visual extraído del repo real (`app/globals.css`, `tailwind.config.ts`, `app/layout.tsx`, `cashbak-flyer-vendedores.html`). NO inventar colores ni fuentes nuevas. Todas las compositions deben usar este token set.

## 1. Brand identity

**Nombre**: CashBak (siempre con "B" mayúscula en el medio).
**Vibe en una frase**: marketplace chileno cálido, profesional, con identidad emerald/forest. Ni casino, ni fintech fría: mercado moderno con un beneficio extra.
**Audiencia del demo**: vendedor PyME chileno, 25–55 años, vendiendo en redes o tienda propia, evaluando si abre tienda en Cashbak.

## 2. Paleta (HSL del repo + flyer)

| Token | Valor | Uso en demo |
|---|---|---|
| `--primary` | `hsl(160 84% 39%)` → `#10b981` | CTAs, highlights, badge CashBak, líneas de progreso |
| `--primary-dark` | `#059669` (emerald-600) | Hover, focus ring (`outline: 2px solid #059669`) |
| `--primary-darker` | `#15803d` (green-700) | Header gradient stop intermedio |
| `--brand-deep` | `#14532d` (green-900) | Header/footer gradient deep, theme-color, fondos sólidos hero |
| `--accent` | `#f59e0b` (amber-500) | Tag "Elegido por el cliente", acentos puntuales |
| `--mint-50` | `#ecfdf5` | Tarjetas de beneficio, fondos suaves de paso |
| `--mint-100` | `#d1fae5` | Texto sobre verde profundo (legibilidad) |
| `--mint-200` | `#a7f3d0` | Highlight inline en H1, bordes |
| `--ink-900` | `#111827` (gray-900) | Texto principal sobre fondo claro |
| `--ink-700` | `#374151` | Texto secundario |
| `--ink-500` | `#6b7280` | Captions, micro-copy |
| `--ink-200` | `#e5e7eb` | Bordes, divisores |
| `--ink-50` | `#f9fafb` | Fondo dashboard / canvas neutro |
| `--white` | `#ffffff` | Fondo de cards, breakdown |

**Gradientes recurrentes**:
- `linear-gradient(135deg, #14532d 0%, #166534 70%, #059669 140%)` — hero header (flyer original).
- `radial-gradient(circle at top right, rgba(16,185,129,0.18), transparent 60%)` — atmósfera para escenas verde-sobre-verde.

## 3. Tipografía

- **Familia**: `Inter` (Next.js fuente del proyecto, `next/font/google`). Cargar en compositions con:
  ```html
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  ```
- **Display (titulares 1920×1080)**: Inter 800/900, `letter-spacing: -0.02em`, `line-height: 1.05`.
- **Body**: Inter 400/500, `line-height: 1.45`.
- **Eyebrow / tag**: Inter 700/800 uppercase, `letter-spacing: 0.14em`.
- **Numerales** (cifras de precio/comisión): `font-variant-numeric: tabular-nums; font-weight: 800`.

**Escala recomendada (1920×1080, 100%)**:
| Rol | Tamaño |
|---|---|
| Hero H1 | 96–120 px |
| Subhead | 56 px |
| Body destacado | 36 px |
| Body | 28 px |
| Caption / pasos | 22 px |
| Eyebrow | 18 px |

## 4. Componentes UI (referencia repo)

Todas las pantallas mock deben respetar estos componentes — son los que el vendedor verá al loguearse de verdad.

- **Card** (`components/ui/card.tsx`): `border-radius: 12px`, `border: 1px solid #e5e7eb`, `background: #fff`, `padding: 24px`.
- **Botón primary**: fondo `#10b981`, texto blanco, `border-radius: 8px`, `padding: 12px 24px`, `font-weight: 600`. Hover sutil `#059669`.
- **Input**: `border: 1px solid #d1d5db`, `border-radius: 8px`, `height: 40px`, focus `outline: 2px solid #059669`.
- **Slider** (rango "ganancia"): track `#e5e7eb`, fill `#10b981`, thumb blanco con borde verde.
- **Badge CashBak %** (en producto): pill verde `#10b981`, texto blanco, `border-radius: 999px`, `padding: 4px 12px`, `font-weight: 700`.
- **Selector de evento** (BetSelector): card con icono trofeo a la izquierda, nombre del evento, % cashback grande a la derecha. Estado seleccionado: fondo `#10b981`, texto blanco, sombra `0 6mm 12mm rgba(5,150,105,0.35)`.

## 5. Assets a usar

| Asset | Origen | Ubicación en proyecto |
|---|---|---|
| Logo isotipo | `public/img/logo_no_text.png` | `assets/logo.png` |
| Logo wordmark | `public/img/logo.png` | `assets/logo-text.png` |
| Voz narración | TTS local (Kokoro `ef_dora`, español) | `assets/narration.wav` (lo genera el usuario en su Mac) |
| Mocks de UI | Recreados en HTML/CSS dentro de cada composition (no capturas) | inline |

**Nota**: `/mi-tienda` y `/sell/aplicar` con sesión activa NO se capturaron por restricciones de sandbox. Los mocks reproducen 1:1 la jerarquía Radix/Tailwind del repo, con datos dummy seguros.

## 6. Reglas de marca (no violar)

- **Léxico vetado**: "apuesta", "apostar", "jugar", "pronóstico", "casino", "azar", "suerte", "lotería", "ganar dinero fácil". Sustitutos: "evento deportivo", "elegir un evento", "acertar el evento", "CashBak".
- **Información reservada**: NO mostrar ni narrar cómo Cashbak se cubre/financia el cashback (no mencionar reservas, hedging, fondos, matemáticas internas). El cliente y el vendedor solo ven el "qué", no el "cómo".
- **Anti-framing prohibido**: nada de "protege tu margen", "sin bajar tu margen", "no pierdes plata". Reemplazar por valor agregado: "tus productos se vuelven más atractivos", "vendes más sin cambiar tu modelo", "ingreso fijo y predecible".
- **Mecánica oficial (frase pivote)**: "El cliente elige un evento deportivo y, si acierta, recibe CashBak de hasta 100%. Tú recibes tu ingreso siempre."
- **Tono**: cercano, claro, motivador. Tuteo chileno. Sin tecnicismos. Sin "lol", sin emojis en pantalla salvo ⏳/✓ funcionales.
- **Estética**: product tour limpio, transiciones suaves. NADA de ruletas, dados, fichas, neón, cartas — cero estética casino/azar.

## 7. Layout y composición

- **Resolución**: 1920×1080 landscape para todas las compositions.
- **Safe area**: márgenes mínimos de 96 px (5%) por lado.
- **Track plan** (data-track-index):
  - 0: fondo / atmósfera
  - 1: UI mock (browser frame, dashboard, formulario)
  - 2: highlights y zooms (rectángulos pulsantes, flechas)
  - 3: overlays de paso (pill "Paso 1/4" arriba a la izquierda)
  - 4: subtítulos de narración (parte inferior)
- **Browser frame estándar**: barra superior gris con tres dots (`#ef4444`/`#fbbf24`/`#10b981`), URL bar redondeada con dominio `cashbak.cl`. Permite anclar visualmente que estamos dentro del producto.
