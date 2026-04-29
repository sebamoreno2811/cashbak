# DESIGN.md — Onboarding Vendedores (CashBak)

Identidad visual para esta composición. Hereda de `.claude/brand-voice-guidelines.md` (§7) y la concentra para HyperFrames.

## Style Prompt

Explainer corporativo cálido pero pragmático. Canvas oscuro verde profundo con un orb de glow esmeralda al centro como base. Tipografía sans-serif moderna (Inter), titulares grandes con kerning ajustado, números en tabular-nums. Acentos selectivos en ámbar para el mecanismo CashBak y en esmeralda para acciones/precios. Cero hype: el ritmo es claro, la entrada de cada elemento se siente intencional, no histriónica. Transiciones entre escenas con un wipe verde-900 inclinado que cubre el cambio.

## Colors

| Rol | Hex | Notas |
|---|---|---|
| Canvas / chrome | `#14532d` (verde-900) | Fondo principal, color del wipe de transición |
| Canvas profundo (radial) | `#0a2f19` | Centro hacia bordes oscurecidos |
| Acción / precio | `#059669` (esmeralda-600) | CTA, precio venta, glow base |
| Acento positivo claro | `#10b981` (esmeralda-500) | Highlights en titulares |
| Acento CashBak / margen | `#f59e0b` (ámbar-500) | Margen vendedor, badge "CashBak hasta 100%" |
| Texto base | `#ffffff` | Sobre canvas oscuro |
| Texto secundario | `#d1fae5` (verde-100) | Sublines, descripciones |
| Tarjeta producto | `#ffffff` con texto `#1f2937` | Una sola card en escena 3 |

Regla heredada de la guía: ámbar nunca compite con esmeralda en el mismo componente. Aquí se respeta — esmeralda en cell de "precio venta", ámbar en cell de "tu margen", separados.

## Typography

- **Inter** (system fallback). Compilador embebe.
- Headlines: 130px / weight 800 / letter-spacing -2.5px
- Sublines: 38px / weight 400 / line-height 1.35
- Labels (kicker): 22px / weight 600 / uppercase / letter-spacing 4px
- Precios: tabular-nums, weight 800, 56-72px

## Motion

- Easings predominantes: `power3.out`, `expo.out` (entradas), `back.out(1.4-2.2)` (cards y badges), `power3.inOut` (wipes).
- Cada escena varía ≥3 easings distintos.
- Entrada del primer elemento: 0.2-0.3s después de inicio de escena.
- Stagger entre elementos hermanos: 100-200ms.
- Sin animaciones de salida en elementos individuales — el wipe se encarga.
- Transición entre escenas: 0.7s, wipe verde-900 inclinado -10°.

## What NOT to Do

1. **Cero gradientes lineales full-screen** sobre canvas oscuro — banding en H.264. Solo radial gradient o sólido + glow localizado.
2. **No usar palabras vetadas** en ningún caption: "apuesta", "pronóstico", "jugar", "tip", "azar", "suerte", "cuota". Usar "evento deportivo", "se cumple", "no se cumple". Esta regla es no-discutible.
3. **No exponer el modelo financiero** — nada de "comisión X%", "fondo bruto", "hedge", "diferencial", "cómo nos cubrimos". El vendedor solo escucha: "tu ingreso es fijo".
4. **No emojis decorativos**. El video sigue tono UI/marketing serio. Sin 🔥💸💵🤑.
5. **No CTAs de urgencia artificial** ("solo hoy", "última oportunidad"). El CTA es funcional: "cashbak.cl/sell".
6. **No usar "Cashbak" en minúsculas en pantalla**. Forma canónica: **CashBak**.
