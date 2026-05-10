# DESIGN.md — Cashbak Buyer Demo (vertical)

> Cheat sheet visual reutilizando los tokens del demo de vendedores. Mismo brand kit, audiencia distinta. NO inventar colores ni fuentes.

## 1. Brand identity

**Nombre**: CashBak (siempre con "B" mayúscula en el medio).
**Vibe en una frase**: marketplace chileno cálido y profesional. Ni casino, ni fintech fría: comprar online con un beneficio extra cuando aciertas el evento deportivo.
**Audiencia**: comprador chileno 18–45, scrolleando reels/stories en mobile. Curioso, racional pero también motivado por la posibilidad de recuperar plata.

## 2. Paleta (HSL del repo)

| Token | Valor | Uso en demo |
|---|---|---|
| `--primary` | `#10b981` | CTA, badge CashBak, evento seleccionado, confeti |
| `--primary-dark` | `#059669` | Hover/focus, sombras |
| `--primary-darker` | `#15803d` | Header gradient stop intermedio |
| `--brand-deep` | `#14532d` | Hero hook, fondo de cierre |
| `--accent` | `#f59e0b` | Detalles puntuales (estrella rating, no protagonista) |
| `--mint-50` | `#ecfdf5` | Fondos suaves |
| `--mint-100` | `#d1fae5` | Texto sobre verde profundo |
| `--mint-200` | `#a7f3d0` | Subtítulo sobre hero |
| `--ink-900` | `#111827` | Texto principal |
| `--ink-700` | `#374151` | Texto secundario |
| `--ink-500` | `#6b7280` | Captions, micro-copy |
| `--ink-200` | `#e5e7eb` | Bordes |
| `--ink-50` | `#f9fafb` | Fondo neutro |
| `--white` | `#ffffff` | Cards |

**Gradientes recurrentes**:
- `linear-gradient(160deg, #14532d 0%, #166534 60%, #059669 130%)` — hero hook y cierre.
- `radial-gradient(circle, rgba(16,185,129,0.28), transparent 60%)` — atmósfera para escenas verde-sobre-verde.
- `linear-gradient(180deg, #f9fafb 0% 28%, #ffffff 28% 100%)` — escenas de producto.

## 3. Tipografía

- **Familia**: Inter (Google Fonts).
- **Display (1080×1920)**: Inter 800/900, `letter-spacing: -0.02em`, `line-height: 1.05`.
- **Body**: Inter 500.
- **Caption (subtítulo en pantalla, MUY importante para video silencioso)**: Inter 800, 56–72px, alto contraste, sobre band semi-transparente o sobre verde sólido.

**Escala vertical (1080×1920)**:
| Rol | Tamaño |
|---|---|
| Hero H1 | 120–140 px |
| Caption silencioso (línea principal) | 64–84 px |
| Subtítulo / soporte | 38–46 px |
| Body destacado | 28–36 px |
| Eyebrow / pill paso | 24–28 px |
| Badge CashBak | 22–28 px |

## 4. Componentes UI (referencia repo)

Replicar fielmente lo que el comprador ve en producción:

- **Card producto**: `border-radius: 22px`, `border: 1px solid #e5e7eb`, `background: #fff`, `padding: 24–28px`, sombra `0 24px 56px rgba(17,24,39,0.10)`.
- **Badge CashBak %**: pill verde `#10b981`, texto blanco, `border-radius: 999px`, `padding: 10px 22px`, `font-weight: 800`. Con sombra esmeralda.
- **BetSelector**: card rectangular con icono trofeo a la izquierda, nombre del evento al medio, % a la derecha. Estado seleccionado: fondo `#10b981`, texto blanco, sombra esmeralda.
- **Botón primary**: fondo `#10b981`, texto blanco, `border-radius: 10–12px`, `padding: 16–20px`.
- **Phone frame** (opcional para mostrar app): rectángulo con `border-radius: 56px`, marco sutil, notch arriba.

## 5. Assets disponibles

| Asset | Origen |
|---|---|
| `assets/logo.png` | `public/img/logo_no_text.png` (isotipo) |
| `assets/logo-text.png` | `public/img/logo.png` (wordmark) |
| `assets/zapatillas-2.png` | producto principal (running) |
| `assets/audifonos-1.webp` | producto secundario |
| `assets/reloj-3.png` | producto secundario |
| `assets/pelota-basket-1.webp` | apoyo deportivo |

Sin narración: video silencioso pensado para feed mute-by-default. Captions grandes en pantalla son obligatorios.

## 6. Reglas de marca (no violar)

- **Léxico vetado**: "apuesta", "apostar", "jugar", "pronóstico", "casino", "azar", "suerte", "lotería", "ganar dinero fácil". Sustitutos: "evento deportivo", "elegir un evento", "acertar el evento", "CashBak".
- **Información reservada**: NO mostrar ni narrar cómo Cashbak se cubre/financia el cashback.
- **Mecánica oficial (frase pivote)**: "Compras lo que quieras, eliges un evento deportivo, y si acierta recibes hasta 100% de CashBak."
- **Garantía implícita**: el producto SIEMPRE llega. El cashback es el premio extra.
- **Tono**: cercano, claro, motivador. Tuteo chileno. Sin emojis salvo ✓ funcional.
- **Estética**: product tour limpio. NADA de ruletas, dados, fichas, neón, cartas — cero estética casino/azar.

## 7. Layout y composición

- **Resolución**: 1080×1920 portrait.
- **Safe area**: márgenes mínimos de 60 px laterales, 100 px arriba/abajo.
- **Caption inferior**: SIEMPRE en el tercio inferior, font-weight 800, line-height 1.1, sobre fondo de alto contraste (verde sólido o blanco con sombra). Es lo que reemplaza al voice-over.
- **Track plan** (data-track-index):
  - 0: fondo / atmósfera
  - 1: UI mock (card producto, BetSelector, transferencia)
  - 2: highlights (zoom, pulses, cursor)
  - 3: pill "Paso N/4" arriba-izquierda
  - 4: caption inferior grande (la "voz")
