# Cashbak — Contexto del Proyecto

## Modelo de negocio

**Cashbak** es un marketplace chileno que combina e-commerce tradicional con pronósticos deportivos como mecanismo de incentivo.

**Mecánica core**: cuando un cliente compra un producto, selecciona también un evento deportivo (partido, Copa América, etc.). Si el pronóstico acierta, recibe un **CashBak de hasta 100%** del valor de su compra. Si no, recibe normalmente su producto.

**Propuesta para vendedores**: el vendedor define precio de venta y margen neto. La diferencia financia el fondo de CashBak. El ingreso del vendedor es **fijo y predecible**, gane o pierda el pronóstico del cliente. Sus productos se vuelven mucho más atractivos sin afectar su revenue.

**Actores**:
- **Compradores**: eligen productos + evento deportivo.
- **Vendedores**: publican productos, definen margen, tienen dashboard propio.
- **Admin**: gestiona eventos deportivos, validaciones, payouts y distribución de cashbacks.

## Stack técnico

- **Framework**: Next.js 16 (App Router, SSR + Client components)
- **Lenguaje**: TypeScript (strict)
- **DB + Auth**: Supabase (PostgreSQL + Supabase Auth via SSR cookies)
- **Pagos**: Transbank WebPay (SDK 6, Chile)
- **Email**: Resend (transaccional)
- **Analytics**: PostHog
- **Rate limiting**: Upstash Redis (100 req/min global, 5 req/10min en endpoints críticos)
- **AI chat**: Anthropic Claude SDK (chat widget "Baki")
- **UI**: Radix UI + Tailwind CSS (dark mode con next-themes)
- **Hosting**: Vercel (+ Vercel Analytics)

## Estructura de rutas (`app/`)

| Ruta | Propósito |
|------|-----------|
| `/` | Landing, carrusel de productos destacados, filtros por categoría |
| `/products` | Grid de todos los productos |
| `/product/[id]/[slug]` | Detalle de producto, selector de evento, reviews |
| `/tienda/[slug]` | Tienda de un vendedor |
| `/tiendas` | Directorio de tiendas |
| `/cart` | Carrito |
| `/checkout` | Datos de envío + pago |
| `/orders` | Mis órdenes (comprador) |
| `/mi-tienda` | Dashboard vendedor |
| `/sell`, `/sell/aplicar` | Onboarding y solicitud de tienda |
| `/admin` | Panel admin |
| `/auth/*` | Login, signup, reset password |
| `/complete-profile` | Completar perfil post-auth |
| `/howto` | Guía "cómo funciona" |
| `/api/webpay`, `/api/chat`, `/api/cron`, `/api/order-action` | Endpoints backend |

## Entidades principales

- **Product** — producto: precio, margen vendedor, stock, imágenes
- **Store** — tienda: nombre, slug, logo, categorías, estado (approved/pending)
- **Order** — orden: items, total, estado (payment → shipping → cashback → delivered)
- **OrderItem** — línea de orden con cashback % + evento seleccionado
- **Bet / BetOption** — evento deportivo con cuota (odd), fecha, resultado
- **Customer** — datos comprador (email, nombre, teléfono)
- **User** — usuario Supabase con rol (buyer/seller/admin)
- **ShippingAddress** — domicilio (ciudad, región, código postal)
- **Comment** — review de producto (estrellas + contenido)
- **BankAccount** — datos bancarios del vendedor para payout

## Carpetas clave

| Carpeta | Contenido |
|---------|-----------|
| `components/` | Componentes React: BetSelector, ProductSlider, HowItWorks, ChatWidget, ShippingModal, BankForm |
| `components/auth/` | Login / signup |
| `components/ui/` | Primitivos Radix (botones, diálogos, inputs) |
| `context/` | React Context: Product, Bet, Orders, Customer, Shipping, Comment |
| `hooks/` | useBetOption, useCart, useSupabaseUser, useMobile, useBankAccounts |
| `lib/` | Lógica de negocio: `cashbak-calculator` (matemáticas de margen/cashback), `bets.ts`, `supabase.ts`, slug utils |
| `utils/supabase/` | Clientes Supabase (server / client) |
| `config/` | `site.ts` — config general |
| `types/` | Tipos TS: Product, Cart, Checkout, Delivery |
| `scripts/` | Utilitarios (ej. `migrate-images.mjs`) |
| `supabase/` | Migraciones y config Supabase |

## Convenciones de código

- **Path alias**: `@/*` → raíz (`baseUrl: "."`)
- **Prettier**: `semi: false`, trailing commas es5, imports ordenados custom (React → Next → 3rd party → local)
- **TypeScript strict** + `resolveJsonModule` + `jsx: react-jsx`
- **Tailwind**: variants + colores HSL, dark mode por clase
- **Middleware** (`middleware.ts`): rate limiting Upstash + refresh de sesión Supabase en cada request
- **Auth**: SSR cookies con `createServerClient`, cliente con `createClient`

## Integraciones externas

| Servicio | Uso |
|----------|-----|
| Supabase | PostgreSQL, Auth, Realtime |
| Transbank | WebPay (iniciación + webhook) |
| Resend | Email transaccional |
| PostHog | Analytics + feature flags |
| Upstash Redis | Rate limiting distribuido |
| Vercel | Hosting + analytics |
| Anthropic Claude | Chat widget "Baki" |

## Lógica destacada

- **`lib/cashbak-calculator`**: balancea margen vendedor, comisión plataforma (20% del fondo bruto, cap 1–3.5% del precio) y monto asegurable para el cliente.
- **Rate limiting agresivo** en checkout y auth (5/10min) para prevenir abuso.
- **Estados multi-paso de orden**: payment → shipping → cashback → delivered.
- **Carrito persistente** via React Context.

## Notas operativas

- El `README.md` es la plantilla genérica de Next.js (no refleja el proyecto real).
- `cashbak-flyer-vendedores.html/pdf` es material de marketing para onboarding de vendedores con ejemplos numéricos.
- Idioma principal del producto: **español (Chile)**. Las respuestas del asistente deberían ser en español salvo que se pida lo contrario.
