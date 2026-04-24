# Brand Discovery Report — CashBak

> Reporte crudo del descubrimiento de marca realizado el **2026-04-24**.
> Fuentes: código del repo, flyer de vendedores (HTML/PDF), system prompt de Baki, componente `ChatWidget`, páginas `/`, `/howto`, `/sell`, post de Instagram en Canva, `CLAUDE.md`.
> Este es el archivo **de referencia**. La guía canónica resultante vive en `.claude/brand-voice-guidelines.md`.

---

## 1. Resumen ejecutivo

CashBak es un marketplace chileno con una mecánica única: el cliente compra un producto y elige un evento deportivo; si el evento se cumple, recupera hasta el 100% en CashBak. La marca que emerge del material existente es **cercana, clara y pragmática**, con una fuerte preocupación explícita por **no ser confundida con una casa de apuestas**.

La identidad visual es **consistente** (verde profundo + esmeralda + ámbar, bordes redondeados, tipografía de sistema), pero la identidad verbal tiene **contradicciones puntuales** — especialmente alrededor del léxico "juega" / "pronóstico".

Hay suficiente material para declarar voz, tono, léxico, paleta y pilares. Faltan: manual visual formal, guía de redes, templates de email y un tagline oficial.

---

## 2. Fuentes analizadas

| Fuente | Tipo | Peso como evidencia |
|---|---|---|
| `cashbak-flyer-vendedores.html` / `.pdf` | Marketing físico | **Alto** — pieza pulida, define tono vendedor |
| `CLAUDE.md` | Documentación interna | **Alto** — define modelo de negocio |
| `app/api/chat/route.ts` (system prompt de Baki) | Prompt de IA | **Muy alto** — es la regla operativa actual de voz |
| `components/ChatWidget.tsx` | UI + copy chat | Alto — define cómo Baki se presenta |
| `app/howto/page.tsx` | Landing explicativa | Medio — copy corto, algunas inconsistencias |
| `components/how-it-works.tsx` | Storytelling de mecánica | Alto — define narrativa para compradores |
| `app/sell/page.tsx` + `app/sell/aplicar/page.tsx` | Onboarding vendedor | Alto — define tono vendedor |
| `app/page.tsx` (landing) | Home | Medio — más estructura que copy |
| `app/contact/page.tsx` | Contacto | Bajo — boilerplate |
| Canva design `DAHHN0wwcRU` | Post Instagram | Medio — única pieza social disponible |
| `config/site.ts` | Metadata | Bajo |

**Fuentes no encontradas** (gaps): no existe manual de marca, no hay guía de voz formal, no hay templates de email documentados, no hay guía de redes sociales, no hay identidad visual escrita.

---

## 3. Identidad de marca (inferida)

**Qué es CashBak**
Marketplace chileno donde comprar = producto + evento deportivo + posible cashback hasta 100%.

**Qué no es**
No es casa de apuestas. No es juego de azar. No es sorteo. No es programa de fidelidad pasivo. No es cashback genérico sobre consumo.

**Propuesta al comprador**
"Compra normal, elige un evento y puedes recuperar hasta el 100%. Si no se cumple, igual recibes tu producto."

**Propuesta al vendedor**
"Tú cobras exactamente lo mismo siempre. Nosotros hacemos que tus productos se vean más atractivos sin tocar tu margen." — textual del flyer.

**Personalidad en una frase**
Cercana, clara, pragmática. Confía en que la mecánica habla sola.

**Arquetipo dominante**
*Everyman* (habla como la gente) con toques de *Sage* (explica bien). No es *Magician* ni *Outlaw*.

---

## 4. Voz — cinco atributos

Inferidos por frecuencia y consistencia en las fuentes:

1. **Cercana** — tuteo universal, chilenismos suaves ("al toque", "bacán"), saludos informales en Baki.
2. **Clara** — frases cortas, numeración de pasos, ejemplos concretos, traducción de tecnicismos.
3. **Pragmática** — cifras específicas ("hasta 100%", "20% del fondo bruto", "margen fijo"), ejemplos numéricos en flyer.
4. **Honesta** — "sin letra chica", explicación de qué pasa si el evento no se cumple, transparencia sobre qué cobra la plataforma.
5. **Optimista sin gritar** — positiva pero sin histeria. El entusiasmo sale de los datos, no de los signos de exclamación.

---

## 5. Tono — variaciones por canal

Observado en las fuentes:

| Canal | Tono real detectado | Emojis observados | Largo típico |
|---|---|---|---|
| Landing / `/howto` | Claro + pragmático | 0 | Frases cortas |
| UI (botones, labels) | Directo | 0 | 1–4 palabras |
| Baki | Cercano + resolutivo | 1–3 por mensaje (👋 💰 🏆 ⚽) | 2–6 frases |
| Flyer vendedor | Pragmático + honesto | 0–1 | Datos + ejemplos |
| `/sell` | Pragmático + motivacional | 0–1 | Párrafos medianos |
| Instagram (Canva) | Optimista + llamativo | 2–5 | 1–2 frases |
| Email de contacto / footer | Sobrio | 0 | Una línea |

**Hallazgo**: el tono es coherente dentro de cada canal, pero nadie ha declarado explícitamente la matriz. Esta guía lo formaliza.

---

## 6. Léxico — política acordada

### 6.1 Palabras **vetadas**

Inferido del system prompt de Baki + decisión explícita de Seba (2026-04-24):

- "apuesta", "apostar", "apuestas deportivas"
- "jugar", "jugada", "juego de azar", "jugador"
- **"pronóstico", "pronosticar", "pronóstico deportivo"** ← agregado por Seba el 2026-04-24, **más restrictivo** que el system prompt actual
- "tip", "tipster", "picks"
- "suerte", "azar"

**Razón estratégica**: CashBak no quiere ser confundido con una casa de apuestas. El producto es un marketplace, no un juego de azar.

### 6.2 Vocabulario canónico

| Concepto | Forma correcta | Formas incorrectas |
|---|---|---|
| El mecanismo | "evento deportivo" o "evento" | apuesta, pronóstico, juego |
| El beneficio | "CashBak" (producto) | reembolso, devolución, premio |
| El % recuperable | "hasta 100% de tu compra en CashBak" | "te devolvemos plata" |
| Acción del cliente | "elegir un evento" | "apostar", "pronosticar" |
| Evento se cumple | "se cumple el evento" | "aciertas", "ganas" |
| Evento no se cumple | "no se cumple el evento" | "pierdes", "fallas" |
| Vendedor | "vendedor" / "tienda" | "seller" en público |
| Comprador | "cliente" / "comprador" | — |
| Baki | "Baki", "asistente virtual de CashBak" | "el bot", "la IA" |

### 6.3 Expresiones que sí son on-brand (aparecen o funcionan bien)

- "Compra, elige tu evento y recupera hasta el 100%."
- "Siempre recibes tu producto, se cumpla o no el evento."
- "Tú cobras exactamente lo mismo, gane o pierda el evento del cliente." (flyer vendedor)
- "Sin letra chica."
- "Al toque."

---

## 7. Pilares de mensaje

### Para compradores (inferido de landing, `/howto`, `how-it-works`, Baki)

1. **Recuperas hasta 100%** si se cumple el evento que elegiste.
2. **Nunca pierdes el producto** — lo recibes igual.
3. **Eliges tú el evento** (Copa América, partido, fecha de liga).
4. **Pagas una sola vez** con WebPay, como en cualquier tienda.

### Para vendedores (inferido de flyer y `/sell`)

1. **Tu ingreso es fijo** — defines margen y precio, cobras lo mismo siempre.
2. **Tus productos se vuelven más atractivos** sin bajar el precio.
3. **Sin riesgo** — el fondo CashBak sale del diferencial, no de tu margen.
4. **Onboarding simple** — subes catálogo, defines márgenes, listo.

---

## 8. Identidad visual observada

### Paleta (consistente en todo el producto)

| Uso | Color | Hex | Tailwind |
|---|---|---|---|
| Chrome / superficies oscuras | Verde profundo | `#14532d` | `green-900` |
| Acciones / precios / acento positivo | Esmeralda | `#059669` | `emerald-600` |
| Highlights puntuales / pulso Baki | Ámbar | `#f59e0b` | `amber-500` |
| Fondo | Blanco | `#ffffff` | `white` |
| Texto base | Gris oscuro | `#1f2937` | `gray-800` |
| Alertas | Rojo | `#dc2626` | `red-600` |

Dark mode soportado vía `next-themes`.

### Tipografía

Fuente del sistema / Inter (heredado de Next/Tailwind). No hay fuente custom documentada. Pesos: `font-bold` para títulos, `font-normal` para cuerpo.

### Forma

- Bordes redondeados generosos (`rounded-lg`, `rounded-xl`).
- Sombras suaves (`shadow-sm`, `shadow-md`).
- Aire entre secciones.

### Iconografía

- Lucide icons (stack convention).
- Emoji usado como acento: 👋 💰 🏆 ⚽ 🎯 ✅ (observados en Baki y flyer).
- No se observaron emojis off-brand en el producto actual.

---

## 9. Conflictos detectados

Puntos donde el producto actual **no respeta** la guía que estamos definiendo:

1. **`app/howto/page.tsx:43`** contiene **"¡Compra, juega y gana con Cashbak!"** — la palabra "juega" está vetada. Debe reescribirse a, por ejemplo: *"Compra, elige tu evento y recupera con CashBak."*

2. **`app/api/chat/route.ts`** (system prompt de Baki) actualmente permite **"pronóstico deportivo"** como vocabulario válido. La guía ahora lo veta. Hay que sacarlo la próxima vez que se actualice el prompt de Baki.

3. **Capitalización inconsistente** — aparece "Cashbak" (minúsculas) y "CashBak" (mixto) en distintas zonas del producto. La forma canónica elegida es **CashBak**. Auditar y alinear.

4. **Densidad de emojis disímil** — Baki usa 1–3 por respuesta, el flyer 0–1, Instagram 2–5. La matriz de tono ahora documenta esto como regla, pero conviene auditar que cada canal respete su rango.

5. **Email de contacto `cashbak.ops@gmail.com`** no usa dominio propio (`cashbak.cl`). Oportunidad: migrar a `hola@cashbak.cl` o similar cuando haya tiempo.

6. **Post de Instagram (Canva `DAHHN0wwcRU`)** — el contenido extraído muestra "LLEG CASHBAK" (sin tilde, sin "Ó"). Puede ser artefacto de extracción, pero conviene verificar que en el post real diga "LLEGÓ CASHBAK".

7. **Nomenclatura "Seguro CashBak"** — en `/sell/page.tsx` aparece el término "Seguro CashBak". No es un seguro regulado bajo legislación chilena. Revisar con legal antes de comunicarlo más ampliamente.

---

## 10. Gaps (material que no existe y convendría crear)

- **Manual visual formal** — paleta completa con variantes, tipografía con jerarquía explícita, grid, uso del logo, zonas de respeto, versiones b/n.
- **Guía de redes sociales** — formatos por plataforma, calendario de contenido, plantillas reutilizables.
- **Templates de email** — header/footer, tono por tipo (transaccional vs marketing), firma oficial.
- **Tagline oficial** — candidatos: "Compra y recupera hasta el 100%", "El marketplace que te devuelve", "Compra, elige evento, recupera".
- **Glosario público** — publicar el vocabulario canónico en `/howto` o `/faq` para educar al usuario.
- **Guía de uso de Baki** — cuándo sí/cuándo no usar emojis, largos máximos, cómo manejar temas sensibles (reclamos, reembolsos).

---

## 11. Preguntas abiertas

Decisiones pendientes, para priorizar en siguientes iteraciones:

1. **¿Cuál es el tagline oficial?**
2. **¿El tono para vendedor y comprador es el mismo con distinto enfoque, o queremos dos voces diferenciadas?**
3. **¿Política exacta de emoji en Baki? (¿0–2 o 1–3 por respuesta?)**
4. **¿Formalidad del email transaccional — siempre tú, o vos/usted según región?**
5. **¿Qué hacer con "Seguro CashBak" — renombrar o regular?**
6. **¿En qué momento migramos el email a dominio propio?**

---

## 12. Hallazgos interesantes (evidencia recolectada)

### Del flyer de vendedores

> "Vende más ofreciendo CashBak — un beneficio extra en cada compra."
> "Tú cobras exactamente lo mismo siempre."
> "Sin letra chica y sin más vueltas."

Esas tres frases son **la síntesis más limpia del tono vendedor**: pragmático, honesto, sin hype.

### Del system prompt de Baki

Ya define regla operativa explícita:
> "NUNCA uses las palabras 'apuesta', 'apostar', 'apuestas deportivas', 'jugar', 'jugada' ni ningún término relacionado con juegos de azar."

Esto demuestra que la preocupación por no parecer casa de apuestas es **preexistente y consciente** — no la estamos inventando, la estamos formalizando y extendiendo (agregando "pronóstico").

### Del componente `how-it-works`

Narrativa de 3 pasos limpia:
> "Elige un producto y un evento deportivo. Pagas y recibes tu compra siempre — sin importar el resultado."

Esta es la fórmula más clara de la propuesta y debería ser la base del hero de landing y del onboarding.

### Del post de Canva

> "Marketplace chileno con cashback."

Uso de "cashback" genérico acá funciona como categoría al público general. En comunicación propia de producto, mantenemos **CashBak** como nombre del mecanismo.

---

## 13. Entregables

Como resultado de este descubrimiento se generó:

1. **`.claude/brand-voice-guidelines.md`** — guía canónica de voz y marca. Es el archivo que debe consultar Claude (y cualquier skill de brand voice) antes de generar copy.
2. **`brand-discovery-report.md`** (este archivo) — referencia cruda del descubrimiento.
3. Memorias persistentes en el sistema de memoria de Claude:
   - `feedback_lexico_cashbak.md` — léxico vetado
   - `reference_brand_guidelines.md` — puntero a los dos archivos anteriores
   - `project_cashbak.md` — actualizado para alinearse con léxico vetado

---

## 14. Próximos pasos sugeridos

En orden de prioridad práctica:

1. **Corregir `/howto/page.tsx`** para sacar "juega".
2. **Actualizar system prompt de Baki** en `app/api/chat/route.ts` para sacar "pronóstico deportivo".
3. **Auditar capitalización** y normalizar a "CashBak".
4. **Elegir tagline oficial** y publicarlo en hero de landing + meta tags.
5. **Generar un post Instagram nuevo** con la copy ya corregida.
6. **Migrar email a dominio propio** (`hola@cashbak.cl`).
7. **Revisar "Seguro CashBak"** con legal.
8. **Crear templates de email** usando la guía.
9. **Publicar glosario público** en `/howto` o `/faq`.

---

*Fin del reporte.*
