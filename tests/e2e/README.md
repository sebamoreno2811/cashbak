# Tests e2e (Playwright) — Cashbak

Smoke tests del flujo público y del onboarding de vendedores. La idea es tener
una red de seguridad que corras antes de cada deploy y, sobre todo, la semana
del lanzamiento.

## Instalación (una sola vez)

```bash
npm install                       # instala @playwright/test (ya está en devDependencies)
npx playwright install chromium   # descarga el navegador de prueba
```

## Correr los tests

```bash
npm run test:e2e         # corre toda la suite (levanta el dev server solo)
npm run test:e2e:ui      # modo interactivo, para ver los tests paso a paso
npm run test:e2e:report  # abre el último reporte HTML
```

Por defecto Playwright **levanta `npm run dev` con el gate de pre-lanzamiento
apagado** (`NEXT_PUBLIC_PRELAUNCH_ENABLED=false`), así puede navegar las páginas
públicas reales. Necesitas tu `.env.local` con las credenciales de Supabase para
que el server arranque.

Para correr contra un deploy (ej. un preview de Vercel) en vez de local:

```bash
BASE_URL=https://tu-preview.vercel.app npm run test:e2e
```

## Probar el gate de pre-lanzamiento

Esas pruebas viven en `gate.spec.ts` y están apagadas por defecto (necesitan el
gate encendido). Para correrlas:

```bash
npm run dev                                              # gate encendido (default)
BASE_URL=http://localhost:3000 TEST_GATE=1 npx playwright test gate
```

## Qué cubre hoy

- **`smoke.public.spec.ts`** — home, productos, tiendas, cómo funciona,
  términos, privacidad, contacto y 404.
- **`seller.spec.ts`** — landing `/sell`, el simulador y el formulario
  `/sell/aplicar`.
- **`gate.spec.ts`** — redirección a `/proximamente` y rutas de vendedor
  abiertas durante el pre-lanzamiento (opt-in).

## Qué falta (próximos pasos sugeridos)

- Flujo de carrito → checkout (hasta llegar a WebPay, sin ejecutar el pago).
- Flujo autenticado de comprador y de vendedor (requiere sembrar un usuario de
  prueba en Supabase).
- Flujo de admin (aprobar tienda, marcar evento).
- Pago con las tarjetas de prueba de Transbank en ambiente de integración.

> Nota: estos smoke tests asumen selectores y textos actuales de la app. Si
> cambias un título o heading, ajusta la aserción correspondiente.
