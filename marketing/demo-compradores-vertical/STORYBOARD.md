# STORYBOARD.md — Cashbak Buyer Demo (vertical, silencioso)

> Norte creativo beat-por-beat. Cada beat = una composition HTML referenciada desde `index.html`. Vertical 1080×1920, ~28s.

## Plan de proyecto

| # | File | Beat | Duración | Inicio |
|---|------|------|----------|--------|
| 1 | `compositions/01-hook.html` | Hook "Compra hoy. Recibe hasta 100%." | 4.0s | 0.0s |
| 2 | `compositions/02-elige-producto.html` | Elige producto | 5.0s | 4.0s |
| 3 | `compositions/03-elige-evento.html` | Elige evento deportivo | 7.0s | 9.0s |
| 4 | `compositions/04-resultado.html` | Pagas y recibes (siempre llega) | 7.0s | 16.0s |
| 5 | `compositions/05-cierre.html` | Cierre / CTA | 5.0s | 23.0s |
| **Total** | | | **28.0s** | |

## Auditoría de assets

| Asset | Tipo | Estado | Ubicación |
|---|---|---|---|
| `assets/logo.png` | PNG isotipo | ✓ copiado del demo vendedores | repo `public/img/logo_no_text.png` |
| `assets/logo-text.png` | PNG wordmark | ✓ copiado del demo vendedores | repo `public/img/logo.png` |
| `assets/zapatillas-2.png` | PNG producto | ✓ |
| `assets/audifonos-1.webp` | WebP producto | ✓ |
| `assets/reloj-3.png` | PNG producto | ✓ |
| `assets/pelota-basket-1.webp` | WebP producto | ✓ |
| Inter font | Web font | ✓ Google Fonts CDN |
| GSAP 3.14 | Animation lib | ✓ jsdelivr CDN |

## Reglas comunes

- **Viewport fijo**: 1080×1920. Body `width:1080px; height:1920px; overflow:hidden`.
- **Font stack**: Inter, fallback `system-ui`. Captions grandes (60–84px) en cada beat.
- **Timeline registrado** en `window.__timelines["<id>"] = gsap.timeline({ paused: true })`.
- **Cero clases Tailwind**, CSS vanilla con tokens del DESIGN.md.
- **Caption inferior** en beats 2–4: band con padding generoso, texto Inter 800.
- **Pill "Paso N/3"** opcional en beats 2–4: arriba-izquierda, fondo verde, texto blanco.
- **Sin exit tweens** (excepto beat 5 final). El corte de scene se gestiona por la transición/duración.

---

## Beat 1 — Hook (4s) `01-hook.html`

**Mood**: hero limpio y directo. Verde profundo. Promesa frontal.
**Cámara**: estática 1080×1920, ambient drift sutil (scale 1 → 1.025).
**Layers**:
- Fondo: gradiente `linear-gradient(160deg, #14532d 0%, #166534 60%, #059669 130%)` + radial atmosphere top-right.
- Logo CashBak isotipo (160×160) en card blanca redondeada con sombra esmeralda.
- Wordmark "CashBak" (Inter 800, 72px, blanco con "Bak" en mint).
- H1 hero: "Compra hoy." (línea 1, Inter 900, 140px, blanco) / "Recibe hasta 100% de vuelta." (línea 2, Inter 800, 80px, mint-200).
- Pill flotante "CashBak hasta 100%" arriba (color esmeralda con glow).
**Animaciones**:
- 0.0s: logo `scale 0.7→1`, opacity in, dur 0.9s, `power2.out`.
- 0.5s: wordmark `y:30→0`, dur 0.7s.
- 1.0s: línea 1 reveal `yPercent:110→0`, dur 0.9s, `power3.out`.
- 1.6s: línea 2 reveal `yPercent:110→0`, dur 0.9s.
- 2.6s: pill aparece `scale:0.6→1` con leve bounce (`back.out(1.4)`).
- Idle 1s.
- Drift continuo durante los 4s.

---

## Beat 2 — Elige producto (5s) `02-elige-producto.html`

**Mood**: explora el catálogo. Fondo blanco / mint suave. Mobile-first.
**Cámara**: dolly leve hacia abajo (productos entran). Phone-like feel sin literal phone frame.
**Layers**:
- Fondo `linear-gradient(180deg, #f9fafb 0% 22%, #ffffff 22% 100%)`.
- Pill paso "1 / 3" arriba-izquierda.
- Eyebrow "CASHBAK · CATÁLOGO" arriba.
- Grid 2-cols con 4 cards de producto pequeñas (zapatillas, audífonos, reloj, pelota), cada una con badge mint "CashBak X%" y precio.
- Card "zapatillas" la se destaca: scale up + sombra fuerte + outline verde después de 2.5s.
- Caption inferior (band sólido verde `#059669` con padding 64px): "Elige cualquier producto." (Inter 900, 80px, blanco) y subcaption "Lo que tú quieras." (Inter 500, 38px, mint-100).
**Animaciones**:
- 0.0s: pill paso desliza desde izq, dur 0.4s.
- 0.0–0.6s: stagger entry de cards `y:40→0`, opacity in, dur 0.5s c/u, gap 0.1s.
- 1.4s: cursor SVG aparece y se mueve hacia card "zapatillas" (motion path), dur 1.0s.
- 2.4s: card "zapatillas" hace pulse (`scale:1→1.05→1`) y borde se vuelve esmeralda.
- 0.4s: caption band entra desde abajo `y:80→0`, dur 0.5s.
- 1.0s: subcaption fade-in.

---

## Beat 3 — Elige evento (7s) `03-elige-evento.html`

**Mood**: revelación, decisión informada.
**Cámara**: foco en card de zapatillas (hero center) + BetSelector debajo.
**Layers**:
- Fondo blanco con leve gradient hacia mint abajo.
- Pill paso "2 / 3".
- Card producto centrada arriba (480×620): foto zapatillas, nombre, precio, badge "CashBak hasta 100%" pulsando.
- BetSelector con 3 eventos abajo:
  - "Chile le gana a Brasil — 100%" (se selecciona en verde sólido)
  - "Francia gana el Mundial — 70%" (gris)
  - "Bayern gana la Champions — 50%" (gris)
- Caption verde inferior: "Elige un evento deportivo." (Inter 900, 76px) / "Mientras más difícil, más CashBak." (Inter 500, 38px).
**Animaciones**:
- 0.0s: pill desliza, card aparece `scale 0.95→1`, dur 0.55s.
- 0.4s: badge pop `scale:0→1`, `back.out(1.6)`, dur 0.45s. Pulse 2x.
- 0.9–1.5s: bets stagger entry `y:20→0`, opacity in, gap 0.2s.
- 2.4s: el bet de "Chile" cambia a estado seleccionado (clase `.selected`, fondo verde, sombra emerald), pulse breve.
- 3.2s: cursor SVG se mueve y "toca" el bet seleccionado (refuerzo).
- 0.4s: caption band entra.
- 1.6s: subcaption fade-in.

---

## Beat 4 — Pagas y recibes (7s) `04-resultado.html`

**Mood**: la promesa cumplida. Resultado positivo + garantía de producto.
**Cámara**: split horizontal (top y bottom en vertical). Confeti contenido en la zona top.
**Layers**:
- Fondo: top `#ecfdf5` (mint), bottom `#ffffff`.
- Pill paso "3 / 3".
- Eyebrow arriba: "DESPUÉS DE TU COMPRA".
- Card transferencia (top): icono check verde grande, "CashBak transferido", monto "$39.990", "a tu cuenta bancaria". Con confeti SVG (5–6 partículas) cayendo brevemente.
- Card pedido (bottom): icono caja, "Tu pedido en camino", subtítulo "Despacho confirmado".
- Conector visual (línea vertical animada con 2 dots) entre las dos cards: "+ siempre".
- Caption verde inferior: "Si acierta → CashBak." / "Si no → igual recibes tu producto."
**Animaciones**:
- 0.0s: pill, eyebrow desliza desde top.
- 0.3s: card transferencia entra `y:40→0`, opacity in.
- 0.7s: check verde pop `scale:0→1.15→1`, `back.out(1.8)`.
- 1.0–1.8s: confeti cae (8 elementos, motion path simple x/y, opacity fade).
- 1.5s: card pedido entra `y:40→0`.
- 2.0s: caption band entra. Subcaption pulsa una vez después.
- 4.0s: el caption swap a "Tu compra siempre llega." con `y` cross-fade.

---

## Beat 5 — Cierre / CTA (5s) `05-cierre.html`

**Mood**: hero como Beat 1 pero con CTA URL claro.
**Cámara**: estática + ambient scale.
**Layers**:
- Mismo gradiente verde profundo.
- Logo CashBak grande centrado.
- H1: "Compra en" (Inter 600, 64px, mint-200) / "cashbak.cl" (Inter 900, 156px, blanco).
- Subcaption: "Tu producto + tu CashBak." (Inter 500, 44px, mint-100).
- Botón pill grande pulsante: "Ver productos →".
**Animaciones**:
- 0.0s: logo scale-in.
- 0.3s: H1 línea 1 fade.
- 0.6s: H1 cashbak.cl reveal `yPercent:110→0`.
- 1.4s: subcaption fade.
- 2.0s: botón aparece con leve bounce. Pulse continuo (yoyo, repeat:Math.ceil((dur-2)/0.8)-1) hasta el final.
- 4.5s: fade-out final permitido (esta es la última escena).
