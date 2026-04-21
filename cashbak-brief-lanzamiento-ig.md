# Cashbak — Brief de diseño
## Lanzamiento en Instagram · Carrusel 8 slides

---

## 1. Resumen ejecutivo

- **Qué es**: lanzamiento del marketplace Cashbak en Instagram.
- **Formato**: carrusel de **8 slides**, 1080 × 1080 px cada uno.
- **Dirección visual**: *Color Pop* estilo Revolut / DoorDash / Cash App — color de marca dominante, tipografía hero blanca, logo como sello.
- **Tono**: directo, confiado, moderno. Nada de promesas vacías ni estética de "casa de apuestas".
- **Idioma**: español de Chile.

---

## 2. Sistema de diseño

### Paleta de colores (obtenida del código del sitio)

| Rol | HEX | Uso |
|---|---|---|
| Verde institucional (del logo) | `#0F6B3A` | Fondo dominante principal |
| Verde esmeralda (código `--primary`) | `#10B77F` | Slide "100%", acentos, highlights |
| Navy oscuro (dark mode del sitio) | `#0B1120` | Alternativa de fondo oscuro |
| Crema (fondo natural del logo) | `#F7F4EC` | Slides de contraste cálido |
| Off-white | `#F8FAFC` | Texto sobre oscuro |
| Gris UI | `#94A3B8` | Texto secundario / bajadas |

### Tipografía

- **Familia**: Inter (la misma que usa el sitio vía `next/font/google`).
- **Pesos**:
  - Black / 900 → hero (LLEGÓ CASHBAK, 100%)
  - Bold / 700 → títulos de slide
  - Regular / 400 → bajadas y subtextos

### Dimensiones y detalles

- **Canvas**: 1080 × 1080 px por slide.
- **Radios**: bordes redondeados 24 px en cualquier tarjeta/mockup ilustrado (para evocar la UI real del sitio).
- **Logo**: ubicado en `/public/img/logo.png` (con texto) o `/public/img/logo_no_text.png` (solo el ícono cuadrado).

---

## 3. Dirección visual — Color Pop (Dirección A)

**Referencias para inspiración visual:**
- Revolut — posts de lanzamiento de producto (morado dominante, tipografía blanca gigante).
- DoorDash — anuncios de rojo sólido con mensaje hero.
- Cash App — posts verdes con texto bold y tono irreverente.
- Linear — anuncios de producto con color de marca dominante.

**Reglas del sistema:**
- Fondo sólido (verde institucional, verde esmeralda o crema, según slide).
- Tipografía hero dominando la composición (ocupar 60–70% del canvas).
- Contraste brutal: blanco sobre verde, o negro sobre crema.
- **Cero** fotos, **cero** gradientes complejos, **cero** drop shadows. Solo color + tipografía + elementos gráficos planos.
- Mockups ilustrados en vector (no screenshots directos).

---

## 4. Storyboard — Slide por slide

### 🟢 Slide 1 · COVER

- **Fondo**: Verde institucional `#0F6B3A` sólido edge-to-edge.
- **Hero** (centro): **LLEGÓ CASHBAK** — Inter Black, blanco, uppercase, 70% del ancho.
- **Slogan** (debajo): *Compras. Eliges evento. Recuperas.* — Inter Medium, blanco.
- **Footer pequeño** (abajo): `cashbak.cl` — Inter Regular, blanco.
- **Logo**: esquina sup-izquierda como sello pequeño.
- **Chevron** sutil abajo-derecha (flecha → indicando "desliza").

---

### 🟡 Slide 2 · EL RECORRIDO (la compra de ejemplo)

- **Fondo**: Crema `#F7F4EC`.
- **Headline arriba**: **Donde tus compras pueden volver a tu bolsillo.** — Inter Bold 52pt, navy `#0B1120`.
- **Tres tarjetas en zigzag conectadas por flechas curvas verde esmeralda**:

  1. **COMPRA** (arriba-izquierda) · mini card con ilustración de zapatillas · *"Zapatillas Running · $49.990"*
  2. **EVENTO ASOCIADO** (centro-derecha) · card con bandera 🇫🇷 + icono trofeo · *"Francia gana el Mundial"* · badge grande verde: **70% CASHBAK**
  3. **TRANSFERENCIA RECIBIDA** (abajo) · banner verde arriba del ticket: *"¡Felicitaciones! Francia ganó el Mundial 🏆"* · ticket estilo bancario con check ✓ · monto hero: **+ $34.993** en verde esmeralda.

- **Logo** mini esquina sup-derecha.

---

### ⚫ Slide 3 · PASO 01 — Eliges producto

- **Fondo**: Verde institucional `#0F6B3A`.
- **Número gigante outline** arriba-izq: **01** (verde esmeralda, solo contorno).
- **Título**: **Eliges el producto que quieras** — Inter Bold 60pt, blanco.
- **Mockup ilustrado**: product card vectorial (placeholder de producto, título, precio, botón verde **"Agregar al carrito"**). Bordes 24 px.
- Pequeño cursor/flecha ilustrada apuntando al botón (sugiere click).
- Logo mini esquina sup-der.

---

### 🟡 Slide 4 · PASO 02 — Eliges evento deportivo

- **Fondo**: Crema con franja diagonal verde esmeralda sutil arriba.
- **02** outline grande verde institucional.
- **Título**: **Eliges el evento deportivo que acompaña tu compra** — Inter Bold 52pt, navy.
- **Mockup**: componente tipo BetSelector — dos tarjetas enfrentadas con escudos genéricos "Equipo A vs Equipo B", una seleccionada con borde verde y check ✓, cuota **x2.35** en monospace debajo.
- Decor: ícono trofeo/silbato minimalista (neutral, que no limite al fútbol).
- Logo mini esquina sup-der.

---

### 💚 Slide 5 · PASO 03 — Si aciertas, hasta 100%

- **Fondo**: Verde esmeralda sólido `#10B77F` (el slide-hero, el más llamativo del feed).
- **03** outline blanco arriba-izq.
- **Título**: **Si aciertas, recibes hasta** — Inter Bold 54pt, blanco.
- **Protagonista**: **100%** — Inter Black, 340pt, blanco.
- **Subtítulo**: **DE CASHBAK** — Inter Bold 48pt, navy.
- Decor: billete/moneda estilizado en esquina.

---

### ⚫ Slide 6 · PASO 04 — Si no, recibes tu compra igual

- **Fondo**: Navy `#0B1120`.
- **04** outline verde esmeralda.
- **Título**: **Si no aciertas, recibes tu compra igual.** — Inter Bold 56pt, blanco.
- **Mockup**: caja de delivery con check verde, badge **ENTREGA GARANTIZADA**.
- **Subtexto**: *Sin letra chica. Sin costo extra. Sin trampa.* — gris claro.
- Logo mini esquina sup-der.

---

### 🟡 Slide 7 · VALOR / Diferenciadores

- **Fondo**: Crema.
- **Tres badges horizontales**:
  - ✅ Tiendas chilenas
  - ⚡ Promos nuevas cada semana
  - 🔒 100% transparente
- **Headline abajo**: **Tu compra, con un retorno real.** — Inter Bold 56pt, navy.

---

### 🟢 Slide 8 · CTA FINAL

- **Fondo**: Verde institucional `#0F6B3A`.
- **Top**: logo Cashbak grande centrado.
- **Hero**: **Entra ya.** — Inter Black 140pt, blanco.
- **URL**: **cashbak.cl** — Inter Bold 64pt, blanco.
- **Footer**: *@cashbak.cl · Síguenos para no perderte ninguna promo* — Inter Regular 28pt.
- **Chevron** decorativo → arriba-derecha (eco del `$↗` del logo).

---

## 5. Consistencia visual entre slides

- **Logo mini** en esquina sup-derecha en slides 2–7 (marca de agua sutil).
- **Paleta alternada** para ritmo al deslizar: Verde (1, 3, 8) · Crema (2, 4, 7) · Esmeralda hero (5) · Navy (6).
- **Numeración de paso** solo en slides 3–6.
- **Número de página** discreto abajo-centro en todos (`1/8`, `2/8`…).

---

## 6. Cómo ejecutarlo en Canva (paso a paso)

### Flujo recomendado

1. **Crear diseño**: Canva → *Create a design* → *Instagram Post* (1080 × 1080).
2. **Partir de un template**, no desde blanco. Buscar en la galería de Canva con estos términos:
   - `bold product launch instagram`
   - `green announcement carousel`
   - `sale announcement bold typography`
   - `minimal launch post`
   - `revolut style post`
3. **Adaptar el template**:
   - Cambiar colores al sistema definido arriba (usa la herramienta *Styles* de Canva para aplicar la paleta a todo el diseño de una).
   - Reemplazar todas las fuentes por **Inter** (disponible en Canva gratis).
   - Subir el logo desde `/public/img/logo.png`.
4. **Armar los 8 slides**: crear una página por slide siguiendo el storyboard textual arriba.
5. **Revisar consistencia**: que el logo aparezca siempre en el mismo lugar, numeración de página uniforme, color transitions legibles.
6. **Exportar**: PNG 1080 × 1080 individual por slide (IG acepta hasta 10 en un carrusel).

### Activos ya disponibles

- **Logo con texto**: `/public/img/logo.png`
- **Logo sin texto (solo ícono)**: `/public/img/logo_no_text.png`
- **Favicon**: `/public/favicon.png`

### Elementos visuales a conseguir en Canva

- Ícono trofeo / silbato (gratis en biblioteca).
- Ilustración vectorial de zapatillas running.
- Bandera de Francia.
- Íconos: check, lock, rayo, carrito.
- Formas de cuadros redondeados para mockups.

---

## 7. Copy de la publicación (caption + hashtags)

**Caption sugerido:**

> 🚀 Nace CashBak: el marketplace donde cada compra viene con una oportunidad extra.
>
> Una nueva forma de comprar en Chile 🇨🇱
>
> 🛒 Eliges lo que quieras, de la tienda que quieras.
> ⚽ Sumas un pronóstico deportivo a tu compra.
> 💸 Si aciertas, te devolvemos hasta el 100% de lo que pagaste.
> 📦 Si no, recibes tu producto con total normalidad y garantía.
>
> Sin letra chica. Sin costo extra. Sin trampa.
> Solo compras más inteligentes, con un beneficio directo a tu bolsillo.
>
> 🛍️ Tiendas chilenas, productos reales, promos nuevas cada semana.
>
> 👉 Entra a cashbak.cl y vive la nueva forma de comprar.
>
> #CashBak #MarketplaceChile #CompraInteligente #Lanzamiento

---

## 8. Checklist final antes de publicar

- [ ] Los 8 slides exportados en PNG 1080×1080.
- [ ] Todos los textos revisados (sin typos, monto $34.993 correcto).
- [ ] Paleta consistente en todos los slides.
- [ ] Logo en misma posición en slides 2–7.
- [ ] Numeración de página en todos.
- [ ] Caption + hashtags copiados y listos.
- [ ] Orden del carrusel: 1 → 8.

---

*Brief generado para @cashbak.cl · Abril 2026*
