# Instagram Carousels · Cashbak

Sistema de carruseles semanales para Instagram de Cashbak. Foco en **crecer audiencia**: contenido interactivo orientado al nicho deportivo + chileno, con el marketplace solo como firma.

## Estructura

```
marketing/instagram-carousels/
├── README.md              ← este archivo
├── state.json             ← estado rotativo + config del schedule
├── template/
│   ├── carousel.html      ← plantilla visual (7 slides, 1080×1080)
│   ├── render.py          ← renderiza HTML → PNGs con Playwright
│   └── assets/
│       ├── logo.png
│       └── logo_no_text.png
└── outputs/
    └── YYYY-MM-DD-{formato}/
        ├── slide-1.png ... slide-7.png
        └── caption.md
```

## Formatos activos

1. **La Tincada de la Semana** · 3–4 partidos destacados con cuotas + pronóstico argumentado. Apunta a generar debate en comentarios ("¿con cuál te la jugarías?"). *Implementado — ver `outputs/2026-04-22-tincada/`.*
2. **Calendario Deportivo** · fixture visual de la semana (Liga Chilena + Champions + Libertadores). Contenido útil → alta tasa de guardado. *Pendiente de implementar.*

Rotación: 1 post / semana. Semanas impares → Tincada. Semanas pares → Calendario.

## Sistema visual

Basado en `cashbak-brief-lanzamiento-ig.md` (en la raíz del repo). Paleta:

| Rol                         | HEX       |
|-----------------------------|-----------|
| Verde institucional (marca) | `#0F6B3A` |
| Verde esmeralda (acento)    | `#10B77F` |
| Navy (fondo oscuro)         | `#0B1120` |
| Crema (contraste cálido)    | `#F7F4EC` |

Tipografía: **Inter** (pesos 400/700/900) con fallback a sans-serif del sistema. Monospace para cuotas.

Orden visual de slides: verde · crema · navy · crema · navy · esmeralda · verde (cierre CTA).

## Cómo regenerar el carrusel

### Prerequisitos (una sola vez)

```bash
pip install playwright --break-system-packages
python -m playwright install chromium
```

### Ejecutar

```bash
cd marketing/instagram-carousels/template
python render.py
# output: ../outputs/YYYY-MM-DD-tincada/slide-1..7.png
```

O con rutas custom:

```bash
python render.py carousel.html ../outputs/2026-05-01-calendario
```

## Cómo actualizar los datos semanales

Actualmente el contenido (partidos, cuotas, pronósticos) vive directo en `template/carousel.html`. Para cambiarlo cada semana:

1. Editar los 7 `<section class="slide">` del HTML con los nuevos datos.
2. Re-ejecutar `render.py`.
3. Actualizar `outputs/YYYY-MM-DD-{formato}/caption.md` con el nuevo texto.
4. Actualizar `state.json` (`last_run`, alternar `next_format`).

**Mejora pendiente**: parametrizar vía `data.json` para no tener que editar el HTML a mano. Queda como follow-up cuando se quiera automatizar de verdad.

## Fuente de datos deportivos

1. **Primaria**: tabla `public.bets` en Supabase (proyecto `cashbak-database`, id `zabvosjuoeieiljltiad`).
   ```sql
   SELECT id, name, odd, end_date, sport, category
   FROM public.bets
   WHERE active = true AND end_date >= NOW() AND end_date <= NOW() + INTERVAL '14 days'
   ORDER BY end_date ASC;
   ```
2. **Fallback**: búsquedas web para fixture de la semana (Liga de Primera Chile, Champions, Libertadores).

**Importante**: para que la tarea semanal tenga data real, es necesario mantener las `bets` activas actualizadas con eventos futuros. Sin eso, el contenido cae al fallback y pierde coherencia con el marketplace.

## Schedule (tarea programada)

Configurada para ejecutarse cada **jueves 16:00 hora Chile (America/Santiago)**. Ver `state.json` → `schedule`.

La ejecución semanal:
1. Lee `state.json` → determina `next_format`.
2. Trae eventos deportivos (Supabase con fallback WebSearch).
3. Genera el HTML actualizado.
4. Renderiza a PNGs en `outputs/YYYY-MM-DD-{formato}/`.
5. Escribe `caption.md`.
6. Actualiza `state.json` (alterna `next_format`, setea `last_run`).

## Publicación en Instagram

Flujo manual: Cashbak revisa los PNGs + caption, y los sube a @cashbak.cl. Si en el futuro se conecta un MCP de Instagram/Meta, se puede automatizar completo.

## Piloto inicial

Primer carrusel generado: `outputs/2026-04-22-tincada/` · *La Tincada de la Semana* para el 22–29 de abril de 2026. Incluye Clásico Universitario, U de Concepción vs Colo-Colo, y las semifinales de la Champions League (PSG vs Bayern, Atlético vs Arsenal).
