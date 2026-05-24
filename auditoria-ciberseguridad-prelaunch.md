# Auditoría de Ciberseguridad — Pre-Launch Cashbak

**Fecha:** 2026-05-24
**Alcance:** App Next.js completa (`app/`, `lib/`, `utils/`, `middleware.ts`, `next.config.mjs`), endpoints `/api/*`, server actions, flujo Transbank, manejo de secrets, dependencias npm, headers HTTP.
**Modo de entrega:** Reporte + plan de fixes (sin tocar código). Cada fix incluye una nota de impacto sobre el flujo actual del usuario.

---

## 1. Resumen ejecutivo

Cashbak ya tiene una base de seguridad sólida (Transbank server-side, RLS en cuenta bancaria/dirección, rate limit en Redis, CSP, HSTS, escape de HTML en emails, validación de monto contra DB en `lib/order-creation.ts`). Antes de lanzar, hay **3 hallazgos críticos** y **5 altos** que recomiendo cerrar para no exponer datos sensibles ni dar herramientas de DoS gratis a un atacante.

| Severidad | Cantidad | Tipo principal |
|-----------|----------|-----------------|
| Crítico   | 3 | Server actions con admin client sin auth + dependencias con CVE crítica |
| Alto      | 5 | RLS no auditable desde el repo, fuga de mensajes de error, admin SQL, redirect, npm |
| Medio     | 7 | Headers, CSP con `unsafe-inline`/`unsafe-eval`, dead code con service-role, validación de inputs débil |
| Bajo      | 6 | Logs verbosos, faltan algunos `server-only`, etc. |

Ninguno de los fixes propuestos modifica lo que un comprador, vendedor o admin **puede hacer** en la app — solo cierran vectores que hoy permiten a un atacante no autenticado, o autenticado, hacer cosas que el flujo de negocio no contempla.

> **Acción crítica fuera del repo:** No tengo visibilidad de las políticas RLS de Supabase (la carpeta `supabase/` está vacía, las migraciones viven solo en el dashboard). El hallazgo `H-01` describe exactamente qué políticas validar antes de lanzar. Sin esta validación, **el resto de los fixes pueden quedar sin efecto**.

---

## 2. Hallazgos críticos

### C-01 — Server actions con `createSupabaseAdminClient` sin autenticación
**Archivos:**
- `app/actions/checkout-session.ts` → `getCheckoutSession`, `deleteCheckoutSession`
- `app/checkout/actions.ts` → `updateProductStock`
- `app/stores/actions.ts` → `notifyStoreSubmitted`

**Problema.** Una server action de Next.js es **invocable por cualquier visitante** que llegue a un endpoint del sitio (POST con header `Next-Action`), incluso sin sesión. Esas funciones usan el **service-role key** y no verifican `user` ni ownership.

- `getCheckoutSession(orderIdClient)`: cualquier persona puede pasar un `order_id_client` y obtener `user_id`, `cart_items`, `shipping_cost`, `cashbak_total` de la sesión de cualquier comprador.
- `deleteCheckoutSession(orderIdClient)`: borra la sesión de cualquiera → bloquea checkouts en curso.
- `updateProductStock(cartItems)` **en `app/checkout/actions.ts`** (no confundir con la del mismo nombre en `app/mi-tienda/actions.ts`, que sí valida ownership y debe quedar intacta): descuenta stock de cualquier producto sin crear orden → **DoS gratuito contra los vendedores** (basta enumerar IDs y enviar `quantity: 99999`).
- `notifyStoreSubmitted(storeId)`: dispara emails a admin/vendor por cualquier `storeId` → spam de Resend, posible incentivo a marcar el dominio como spammer.

**Plan de fix (no rompe el flujo).**
- `getCheckoutSession` y `deleteCheckoutSession`: **eliminarlas**. Hoy nadie las llama (verificado con grep). El único caller real es `saveCheckoutSession`, que sí valida auth y se queda como está.
- `updateProductStock` **en `app/checkout/actions.ts`**: **eliminarla**. La descontada de stock real ya vive en `lib/order-creation.ts` (paso "6. Descontar stock con optimistic locking") que corre **después** de `tx.commit()` de Transbank. Esa función ya está deprecada en la práctica. **No tocar** la función con el mismo nombre en `app/mi-tienda/actions.ts:138` — esa sí está protegida (verifica `user.id` y `store.id`) y se usa desde `StoreManager.tsx`.
- `notifyStoreSubmitted`: agregar `requireAdmin()` o, mejor, verificar que `user.id === store.owner_id` antes de mandar emails. Hoy se llama desde `app/sell/aplicar/page.tsx` justo después de un INSERT autenticado, así que añadir el check no cambia nada para el vendedor real.

**Sugerencia adicional:** mover `lib/order-creation.ts`, `lib/push.ts` y `utils/supabase/server.ts` a archivos con `import "server-only"` al tope, para que un import accidental desde un Client Component falle en build en vez de bundlear el service-role key al browser.

---

### C-02 — Dependencias con CVEs (1 crítica, 3 altas, 8 moderadas)
**Origen:** `npm audit --omit=dev` sobre el lockfile actual.

| Paquete | Severidad | Detalle |
|---------|-----------|---------|
| `protobufjs` (transitivo) | **Crítico** | Code injection vía bytes field defaults + 7 CVEs más |
| `next@16.1.6` (directo) | Alto | CVE en Next, fix disponible sin breaking change |
| `axios` (transitivo) | Alto | Prototype pollution + SSRF NO_PROXY bypass |
| `picomatch` | Alto | Patrón malicioso → ReDoS |
| `@anthropic-ai/sdk@^0.82` (directo) | Moderado | Permisos de archivo inseguros en tool de memoria local — solo afecta uso con filesystem tool, no nuestro caso (chat API) |
| `dompurify`, `follow-redirects`, `postcss`, `ws`, `yaml`, `brace-expansion`, `@protobufjs/utf8` | Moderado | Varios |

**Plan de fix (no rompe el flujo).**
1. `npm audit fix` (no `--force`). Esto resuelve `protobufjs`, `next`, `axios`, `picomatch` y la mayoría de moderadas porque son transitivas o subupgrades semver-safe.
2. **No correr `--force` para `@anthropic-ai/sdk`** todavía: el upgrade a 0.98.0 es semver-major y rompe la API del chat (`anthropic.messages.create` cambia tipos). El CVE solo afecta el `LocalFileSystemMemoryTool`, que no estás usando — quedará como ítem de seguimiento post-launch para upgradar con calma.
3. Después de `npm audit fix`, correr `npm run build` y un smoke test del checkout + chat + admin chat para confirmar que nada se rompió.

**Impacto en flujo:** ninguno si `audit fix` no toca semver-major. Los fixes son patches/minors de paquetes transitivos.

---

### C-03 — `admin_safe_query` RPC: el contrato vive solo en Supabase
**Archivo:** `app/api/admin-chat/route.ts:127`

**Problema.** El admin chat le pasa SQL generado por Claude a una RPC `admin_safe_query(query_text)`. El comentario del código y el system prompt dicen "solo SELECT", pero **la barrera real** es lo que esa función de Postgres haga internamente. Si la función ejecuta el SQL con `EXECUTE query_text` y `SECURITY DEFINER` y no valida con un parser que sea SELECT puro, un admin comprometido (o un prompt injection particularmente bueno) puede ejecutar `UPDATE`/`DELETE`/`DROP` con permisos elevados.

**Plan de fix (no rompe el flujo).** En el dashboard de Supabase (SQL editor), validar que la función `admin_safe_query` cumpla **al menos uno** de estos:

```sql
-- (a) Detección estricta de SELECT por prefijo del primer token significativo
CREATE OR REPLACE FUNCTION admin_safe_query(query_text text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY INVOKER  -- NO usar DEFINER si la cuenta del caller ya es admin
AS $$
DECLARE
  trimmed text;
  result jsonb;
BEGIN
  trimmed := lower(regexp_replace(query_text, '^[\s;]+', ''));
  IF position('select ' in trimmed) <> 1 AND position('with ' in trimmed) <> 1 THEN
    RAISE EXCEPTION 'Solo SELECT/WITH permitido';
  END IF;
  IF query_text ~* '\\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|comment|copy)\\b' THEN
    RAISE EXCEPTION 'Sentencia no permitida';
  END IF;
  -- Forzar LIMIT máximo a 200 si el cliente no lo trae
  EXECUTE 'SELECT to_jsonb(array_agg(t)) FROM (' || query_text || ' LIMIT 200) t' INTO result;
  RETURN coalesce(result, '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION admin_safe_query(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_safe_query(text) TO service_role;
```

Adicionalmente, el route handler **ya verifica `customer.role === 'admin'`**, mantener ese check y asegurar que `service_role` sea el único que puede ejecutar la RPC. Sin esto, alguien con un usuario `authenticated` puede llamar la RPC directamente vía `/rest/v1/rpc/admin_safe_query` saltándose el route handler.

**Impacto en flujo:** ninguno para el admin real — sigue pudiendo consultar datos. El cambio es endurecimiento del contrato de la función.

---

## 3. Hallazgos altos

### H-01 — RLS no auditable desde el repo
**Contexto.** `supabase/` no tiene migraciones versionadas. Múltiples flujos críticos confían en que RLS está bien configurado en producción:

| Operación | Archivo | Asume que RLS hace cumplir |
|-----------|---------|----------------------------|
| `bank_accounts.insert` desde browser | `components/bank-form.tsx:64` | `customer_id = auth.uid()` |
| `stores.insert` desde browser | `app/sell/aplicar/page.tsx:201` | `owner_id = auth.uid()` |
| `customer_shipping_details` lectura | `app/perfil/page.tsx` (varias) | `customer_id = auth.uid()` |
| `orders.select` desde browser | `app/orders/...` | `customer_id = auth.uid()` |
| `products.update/delete` desde server action | `app/mi-tienda/actions.ts` | check de ownership con `.eq("store_id", ...)`, pero RLS debe complementar |

**Acción requerida pre-launch.** Antes de lanzar, ejecutá en el SQL editor de Supabase:

```sql
-- 1. Verificar que TODAS las tablas con datos sensibles tengan RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'customers','orders','order_items','order_tokens','stores',
    'products','bank_accounts','customer_shipping_details',
    'checkout_sessions','push_subscriptions','bets','comments'
  );
-- rowsecurity debe ser true en TODAS

-- 2. Listar policies
SELECT schemaname, tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd;
```

**Políticas mínimas que deben existir** (basado en cómo el código consume cada tabla):

```sql
-- bank_accounts
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ba_select_own ON bank_accounts FOR SELECT TO authenticated
  USING (customer_id = auth.uid());
CREATE POLICY ba_insert_own ON bank_accounts FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY ba_update_own ON bank_accounts FOR UPDATE TO authenticated
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

-- stores
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY stores_select_public ON stores FOR SELECT
  USING (status = 'approved' OR owner_id = auth.uid());
CREATE POLICY stores_insert_self ON stores FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() AND status IS NULL);  -- evita auto-aprobarse
CREATE POLICY stores_update_own ON stores FOR UPDATE TO authenticated
  USING (owner_id = auth.uid())
  WITH CHECK (owner_id = auth.uid() AND status = (SELECT status FROM stores WHERE id = stores.id));
  -- impide que el vendedor cambie su propio status a 'approved'

-- orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY orders_select_own ON orders FOR SELECT TO authenticated
  USING (customer_id = auth.uid());
-- Inserts y updates SOLO via service_role (lib/order-creation.ts y server actions con admin)
-- NO crear policy de INSERT/UPDATE para authenticated

-- order_items: misma lógica que orders, join contra orders.customer_id
CREATE POLICY oi_select_own ON order_items FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.customer_id = auth.uid()));

-- customers: cada usuario lee su propio registro; admin lee todos
CREATE POLICY c_select_own ON customers FOR SELECT TO authenticated
  USING (id = auth.uid() OR EXISTS(SELECT 1 FROM customers c2 WHERE c2.id = auth.uid() AND c2.role = 'admin'));

-- products: lectura pública, escritura sólo vendedor dueño de la tienda
CREATE POLICY p_select_public ON products FOR SELECT USING (true);
CREATE POLICY p_modify_own ON products FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()))
  WITH CHECK (EXISTS(SELECT 1 FROM stores WHERE stores.id = products.store_id AND stores.owner_id = auth.uid()));

-- checkout_sessions: cada usuario sus propias sesiones (ya solo el service-role escribe)
CREATE POLICY cs_select_own ON checkout_sessions FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- bets: lectura pública (sin policy de write para authenticated)
CREATE POLICY bets_select_public ON bets FOR SELECT USING (true);

-- push_subscriptions: dueño y service_role
CREATE POLICY push_own ON push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- order_tokens: NO crear policy para authenticated. Solo service_role.

-- customer_shipping_details
ALTER TABLE customer_shipping_details ENABLE ROW LEVEL SECURITY;
CREATE POLICY csd_own ON customer_shipping_details FOR ALL TO authenticated
  USING (customer_id = auth.uid()) WITH CHECK (customer_id = auth.uid());

-- comments (reviews de productos): lectura pública, escritura del propio user
CREATE POLICY comments_select_public ON comments FOR SELECT USING (true);
CREATE POLICY comments_insert_self ON comments FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
```

**Impacto en flujo:** ninguno si tus políticas actuales son al menos tan permisivas como estas. Si hoy estás más permisivo (por ejemplo, RLS off en alguna tabla), endurecerlas evita exfiltración pero **debes probar el smoke test del checkout, vista de pedidos, alta de producto, alta de tienda y registro de cuenta bancaria** después.

---

### H-02 — `app/api/chat/route.ts` filtra detalle de error de Anthropic al cliente
**Línea 330.** En el `catch` de la llamada a Anthropic se devuelve:

```ts
return new Response(
  JSON.stringify({ error: `Anthropic error: ${err?.status} — ${err?.message}` }),
  { status: 500, ... }
)
```

El mensaje crudo de Anthropic puede incluir info útil para un atacante (rate-limit por org, modelo no disponible, etc.) y eventualmente fragmentos de payload. No es leak directo de API key, pero es ruido innecesario expuesto.

**Plan de fix.** Loguear server-side y devolver mensaje genérico:

```ts
} catch (err: any) {
  console.error("[/api/chat] Anthropic error:", err?.status, err?.message, err?.error)
  return new Response(
    JSON.stringify({ error: "El asistente no está disponible en este momento. Intenta de nuevo en un momento." }),
    { status: 500, headers: { "Content-Type": "application/json; charset=utf-8" } }
  )
}
```

**Impacto en flujo:** ninguno — el usuario seguía sin poder hacer nada útil con el mensaje técnico.

---

### H-03 — `app/auth/callback/route.ts`: validación débil de `next` permite open-redirect parcial
**Línea 9-10.** `nextPath` solo valida `startsWith("/")`. Strings como `//evil.com/foo` o `/\\evil.com` pasan, y en algunos browsers/proxies se interpretan como protocol-relative.

En la práctica, `${origin}${nextPath}` queda como `https://cashbak.cl//evil.com/foo`, que la mayoría de browsers tratan como relativo a cashbak.cl, así que el riesgo real es **bajo**. Pero el patrón es frágil y conviene cerrarlo.

**Plan de fix.**

```ts
let nextPath = decodeURIComponent(nextParam)
// Rechazar protocol-relative y schemes
if (!nextPath.startsWith("/") || nextPath.startsWith("//") || nextPath.startsWith("/\\")) {
  nextPath = "/"
}
// Reusar URL para normalizar y verificar same-origin
const target = new URL(nextPath, origin)
if (target.origin !== origin) nextPath = "/"
```

**Impacto en flujo:** ninguno — todos los `next` legítimos (`/orders`, `/checkout`, `/mi-tienda`) siguen funcionando.

---

### H-04 — `lib/supabase.ts` y `utils/supabase/server.ts#createSupabaseClientWithoutCookies` hacen fallback a anon key cuando falta el service-role
**Líneas:**
- `lib/supabase.ts:6`: `const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `utils/supabase/server.ts:40`: mismo patrón

**Problema.** Si por error el deploy se hace sin `SUPABASE_SERVICE_ROLE_KEY` (rotación, typo en env de Vercel), el código sigue funcionando con **anon key** y todas las inserciones, updates y borrados del backoffice **fallan silenciosamente** porque RLS bloquea — pero peor: si alguna tabla quedó sin RLS, escribiría con permisos de anon. Y `lib/supabase.ts` está sin uso en el código actual: es dead code que invita a errores futuros.

**Plan de fix.**
1. `lib/supabase.ts`: **eliminar el archivo**. Verificado por grep que no se importa desde ningún lado.
2. `utils/supabase/server.ts#createSupabaseClientWithoutCookies`: cambiar a:

```ts
export const createSupabaseClientWithoutCookies = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY — admin client requerido para esta operación")
  }
  return createServerClient(supabaseUrl, supabaseKey, { ... })
}
```

**Impacto en flujo:** ninguno en producción correctamente configurada. En staging con env incompleto, el error es ahora ruidoso en vez de silencioso, que es lo que querés.

---

### H-05 — `app/api/push/subscribe/route.ts`: hijack y borrado de suscripciones push ajenas
**Líneas 13-16 (POST) y 26-28 (DELETE).** Dos bugs relacionados en el mismo endpoint:

1. **DELETE**: recibe `endpoint` del cliente y borra de `push_subscriptions` sin verificar `user_id`. Un atacante con un endpoint conocido corta las notificaciones de otro.
2. **POST**: hace `upsert` con `onConflict: "endpoint"`. Si un atacante conoce el `endpoint` de otra suscripción existente (por ejemplo el suyo previo cuando hizo signout), puede re-postearlo desde su sesión y **reasignar la fila a su propio `user_id`** → secuestro de notificaciones (recibe las pushes que iban dirigidas al user original).

**Riesgo.** Endpoints push son URLs largas pseudo-aleatorias, así que no es trivial enumerarlas. Pero quien las haya visto alguna vez (logs, devtools de un dispositivo prestado, captura de red) puede usarlas.

**Plan de fix.**

```ts
// POST: validar que el endpoint, si ya existe, no apunte a otro user
const { data: existing } = await admin
  .from("push_subscriptions")
  .select("user_id")
  .eq("endpoint", subscription.endpoint)
  .maybeSingle()
if (existing && existing.user_id !== user.id) {
  return NextResponse.json({ error: "Endpoint en uso" }, { status: 409 })
}
await admin.from("push_subscriptions").upsert(
  { user_id: user.id, endpoint: subscription.endpoint, subscription },
  { onConflict: "endpoint" }
)

// DELETE: filtrar también por user_id
await admin.from("push_subscriptions").delete()
  .eq("endpoint", endpoint)
  .eq("user_id", user.id)
```

**Impacto en flujo:** ninguno — el browser solo intenta operar sobre su propio endpoint.

---

## 4. Hallazgos medios

### M-01 — CSP con `unsafe-inline` y `unsafe-eval` en `script-src`
**Archivo:** `next.config.mjs`.

El propio comentario admite que es deliberado. Migrar a nonces es un proyecto aparte; por ahora, **mantener** (cambiarlo rompe PostHog y Vercel Analytics). Solo dejarlo en la lista de mejoras post-launch.

**Plan:** crear un issue para migrar a nonces de Next.js (`headers()` + middleware), no bloquear el launch.

---

### M-02 — `frame-src` y `form-action` incluyen `webpay3gint.transbank.cl` (sandbox de pruebas) en producción
**Archivo:** `next.config.mjs`, CSP.

`webpay3gint` es el ambiente de **integración** de Transbank. En producción no debería listarse — solo `webpay3g.transbank.cl`.

**Plan de fix.** Quitar `https://webpay3gint.transbank.cl` de `form-action` y `frame-src` en builds de producción, o dejar ambos por simplicidad (no es vulnerabilidad real, es solo ruido y un dominio extra de confianza). Si querés ser estricto:

```js
const isProd = process.env.NODE_ENV === "production"
const webpayHosts = isProd
  ? "https://webpay3g.transbank.cl"
  : "https://webpay3gint.transbank.cl https://webpay3g.transbank.cl"
// ... usar webpayHosts en form-action y frame-src
```

**Impacto en flujo:** ninguno — pagos reales pasan por `webpay3g.transbank.cl`.

---

### M-03 — `Permissions-Policy` no cubre `payment`, `usb`, `magnetometer`, `accelerometer`, `gyroscope`, `fullscreen`
**Archivo:** `next.config.mjs`.

Hoy permite `camera=(), microphone=(), geolocation=(), interest-cohort=()`. Es razonable, pero hay APIs que conviene desactivar explícitamente.

**Plan de fix.**

```
"Permissions-Policy",
"camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), browsing-topics=()"
```

Nota: `payment=(self)` permite Payment Request API solo same-origin (Webpay no la usa, pero no estorba).

**Impacto en flujo:** ninguno.

---

### M-04 — Validación de input en `/api/webpay/initiate` confía en estructura del cliente
**Archivo:** `app/api/webpay/initiate/route.ts`.

`items` se acepta como array sin validar tipos individuales más allá de `i.productId`. Si el cliente manda `[{productId: 1, quantity: -10}]`, la línea `product.price * item.quantity` devuelve negativo y la suma puede llegar a 0 o positivo dependiendo del mix. Hoy se mitiga con `if (amount <= 0) reject`, pero el patrón es frágil.

**Plan de fix.** Validar con un schema (no necesitás Zod, basta validación manual):

```ts
function validateItems(items: unknown): { ok: true; items: { productId: number; quantity: number }[] } | { ok: false } {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) return { ok: false }
  const out = []
  for (const i of items) {
    if (typeof i !== "object" || i === null) return { ok: false }
    const productId = Number((i as any).productId)
    const quantity = Number((i as any).quantity)
    if (!Number.isInteger(productId) || productId <= 0) return { ok: false }
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 100) return { ok: false }
    out.push({ productId, quantity })
  }
  return { ok: true, items: out }
}
```

Mismo principio en `lib/order-creation.ts` para `cartItems` cargados desde `checkout_sessions` (defensa en profundidad — un atacante con acceso a la tabla podría haber metido cantidades inválidas).

**Impacto en flujo:** ninguno para compras legítimas (1-10 items, cantidades 1-10).

---

### M-05 — Falta `cache-control: no-store` en respuestas con datos sensibles
**Archivos:** todas las páginas que sirven datos de usuario (`/orders`, `/perfil`, `/mi-tienda/*`, `/admin/*`).

Next 16 con App Router en modo `dynamic = "force-dynamic"` ya manda `cache-control: private, no-cache, no-store`, pero conviene confirmar que estas rutas no tengan caché habilitado por error.

**Plan de fix.** En cada `page.tsx` server component sensible:

```ts
export const dynamic = "force-dynamic"
export const revalidate = 0
```

**Impacto en flujo:** ninguno — solo asegura que un proxy compartido (Vercel edge, CDN, ISP) no cachee datos personales.

---

### M-06 — `app/api/order-action/[token]/route.ts`: token no expira en `mark_shipped` y el filtro `expires_at` solo se chequea al inicio
**Línea 26.** Se valida `expires_at < now`. Bien. Pero el `mark_shipped` no marca `used = true` antes de update (solo después en línea 39), dejando una **ventana muy pequeña** donde dos requests paralelos podrían disparar el update dos veces. La acción es idempotente (`shipping_status = "Enviado"` queda igual), así que no hay daño concreto.

**Plan de fix (opcional).** Aplicar el mismo patrón atómico que ya tiene `confirm_received`:

```ts
const { data: claimed } = await supabase
  .from("order_tokens")
  .update({ used: true })
  .eq("id", tokenRow.id)
  .eq("used", false)
  .select("id")
if (!claimed || claimed.length === 0) return ... already_used
// luego el update de orders
```

**Impacto en flujo:** ninguno.

---

### M-07b — `saveCheckoutSession` permite sobrescribir sesión de otro user si se conoce el `order_id_client`
**Archivo:** `app/actions/checkout-session.ts:16-24`.

`upsert({ user_id, order_id_client, ... }, { onConflict: "order_id_client" })` no chequea, en caso de conflicto, que el `user_id` existente en la fila coincida con el caller. Un atacante autenticado que adivine/enumere un `order_id_client` (UUID, difícil pero no imposible si se filtra en logs/email/url) puede pisar la sesión de checkout de otro usuario con sus propios items justo antes del commit de Webpay. El daño práctico es limitado porque el monto se re-valida contra DB en `lib/order-creation.ts`, pero el carrito y `cashbak_total` mostrado al admin/usuario quedan corruptos.

**Plan de fix.** Antes del upsert, validar:

```ts
const { data: existing } = await supabase
  .from("checkout_sessions")
  .select("user_id")
  .eq("order_id_client", data.orderIdClient)
  .maybeSingle()
if (existing && existing.user_id !== user.id) {
  return { error: "Sesión ya existe para otro usuario" }
}
```

Defense-in-depth con RLS: el policy de UPDATE sobre `checkout_sessions` debe tener `USING (user_id = auth.uid())`, así un upsert de otro user falla a nivel DB. (Ya cubierto en H-01.)

**Impacto en flujo:** ninguno — un usuario legítimo solo escribe su propia sesión.

---

### M-07 — Logs con `authorization_code` de Transbank en stdout
**Archivo:** `lib/order-creation.ts:131`.

`console.log` con `webpay_auth=...`. Los logs de Vercel se conservan y se reenvían a quien tenga acceso al dashboard del proyecto. El `authorization_code` no permite cobrar otra vez, pero es un dato sensible que figura en boletas. Conviene tratarlo como sensible y no loguear el valor completo.

**Plan de fix.**

```ts
if (authorizationCode) {
  const masked = authorizationCode.slice(0, 2) + "***" + authorizationCode.slice(-2)
  console.log(`[createOrderFromWebpayCommit] webpay_auth=${masked} buyOrder=${buyOrder}`)
}
```

**Impacto en flujo:** ninguno.

---

## 5. Hallazgos bajos

### B-01 — `console.error` con `error.message` crudo en server actions
Múltiples server actions devuelven `return { error: error.message }` al cliente. Para errores de Supabase, el mensaje puede revelar nombres de columnas, constraints, etc.

**Plan:** mapear errores conocidos a strings de UI y loguear el original solo server-side. Bajo impacto, mejora UX y reduce information disclosure.

---

### B-02 — Comparación de `CRON_SECRET` con `!==` (timing-sensitive)
**Archivos:** `app/api/cron/auto-confirm/route.ts:14`, `app/api/cron/pending-bets/route.ts:11`.

La comparación con `!==` es teóricamente vulnerable a timing attacks. En la práctica, sobre HTTPS con un token de 32+ bytes generado aleatoriamente, el riesgo es despreciable. Si querés ser estricto:

```ts
import { timingSafeEqual } from "crypto"
const provided = (authHeader || "").replace(/^Bearer /, "")
const expected = process.env.CRON_SECRET || ""
const ok = provided.length === expected.length &&
  timingSafeEqual(Buffer.from(provided), Buffer.from(expected))
if (!ok) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
```

**Impacto:** ninguno.

---

### B-03 — `app/api/chat/route.ts` no requiere usuario autenticado
Cualquier visitante (anónimo) puede consumir el chat → costo en Anthropic. Hoy mitigado con `15 req/min por IP`, pero un atacante con 100 IPs puede consumir 1500/min. Tope práctico de tu factura.

**Plan:** considerar requerir login para usar el chat (cierra el flujo a usuarios con cuenta), o bajar el rate-limit a 5/min para anónimos. Riesgo financiero, no de datos.

---

### B-04 — `app/login/page.tsx`: `redirect` no se valida del lado del cliente
Mismo issue que H-03, replicado en el query param `redirect`. La URL termina pasando a `signInWithOAuth` y luego al callback que ya tiene la validación. Cerrar H-03 cubre esto.

---

### B-05 — `app/api/chat/route.ts` ratelimit usa `ip = "unknown"` como fallback
Si todos los visitantes caen como "unknown" detrás de un proxy mal configurado, comparten el bucket. Vercel siempre setea `x-forwarded-for` correctamente, pero conviene ser explícito que detrás de un proxy raro un atacante puede falsificarlo.

**Plan:** confiar solo en el primer hop si llegan múltiples (ya se hace) y considerar usar `request.ip` del runtime de Vercel si está disponible.

---

### B-06 — `next.config.mjs` `images.remotePatterns` permite `**` en cualquier `*.supabase.co`
Hoy: `pathname: "/storage/v1/object/public/**"` — esto está bien, **no es un hallazgo de hecho**, solo recordatorio para no cambiarlo a wildcards más amplios.

---

## 6. Plan de fixes ordenado por prioridad

| # | Severidad | Archivo / Lugar | Cambio | Riesgo de romper flujo |
|---|-----------|------------------|--------|------------------------|
| 1 | Crítico | `app/actions/checkout-session.ts` | Eliminar `getCheckoutSession` y `deleteCheckoutSession` | Nulo — sin callers |
| 2 | Crítico | `app/checkout/actions.ts` | Eliminar `updateProductStock` | Nulo — superseded por `lib/order-creation.ts` |
| 3 | Crítico | `app/stores/actions.ts` | `notifyStoreSubmitted` valida que `user.id === store.owner_id` | Nulo — el caller real ya está autenticado |
| 4 | Crítico | Supabase dashboard | Endurecer `admin_safe_query` (ver C-03) | Nulo si los admins no estaban abusando |
| 5 | Crítico | Lockfile | `npm audit fix` (sin `--force`) + `npm run build` + smoke test | Bajo — solo patches |
| 6 | Alto | Supabase dashboard | Verificar/crear políticas RLS (ver H-01) | **Requiere smoke test obligatorio** |
| 7 | Alto | `app/api/chat/route.ts` línea 330 | Mensaje genérico en `catch` | Nulo |
| 8 | Alto | `app/auth/callback/route.ts` | Validación robusta de `nextPath` | Nulo |
| 9 | Alto | `lib/supabase.ts` | Eliminar archivo | Nulo — dead code |
| 10 | Alto | `utils/supabase/server.ts` | Quitar fallback a anon key en `createSupabaseClientWithoutCookies` | Nulo en prod bien configurada |
| 11 | Alto | `app/api/push/subscribe/route.ts` POST y DELETE | Validar `user_id` antes de upsert + `.eq("user_id", user.id)` en delete | Nulo |
| 11b | Medio | `app/actions/checkout-session.ts` | `saveCheckoutSession` chequea user_id de fila existente antes de upsert (M-07b) | Nulo |
| 12 | Medio | `next.config.mjs` | Quitar `webpay3gint` de CSP en prod (opcional) | Nulo |
| 13 | Medio | `next.config.mjs` | Permissions-Policy más estricto | Nulo |
| 14 | Medio | `app/api/webpay/initiate/route.ts` | Validar `items` con schema | Nulo |
| 15 | Medio | `lib/order-creation.ts` línea 131 | Enmascarar `authorization_code` en logs | Nulo |
| 16 | Medio | `app/api/order-action/[token]/route.ts` | Aplicar claim atómico también a `mark_shipped` | Nulo |
| 17 | Bajo | Crons | `timingSafeEqual` para `CRON_SECRET` | Nulo |
| 18 | Bajo | Server actions varias | Mapear errores en lugar de devolver `error.message` | Nulo |
| 19 | Bajo | `app/api/chat/route.ts` | Considerar requerir login | Cambia experiencia anónima — discutir antes |

> **Item 19 es el único que toca el flujo de usuario** (requiere decidir si chat anónimo sigue permitido). Todos los demás son endurecimientos invisibles para el usuario final.

---

## 7. Checklist pre-launch

- [ ] `npm audit fix` y `npm run build` ok
- [ ] Política RLS verificada para las 11 tablas listadas en H-01
- [ ] `admin_safe_query` confirmado como SELECT-only y solo `service_role`
- [ ] Server actions críticos (item 1-3) eliminados o protegidos
- [ ] Smoke test end-to-end:
  - [ ] Compra anónima → login → checkout → Webpay sandbox → orden creada
  - [ ] Vendedor crea producto, actualiza stock, marca pedido como enviado
  - [ ] Admin aprueba tienda, marca evento como ganado/perdido
  - [ ] Comprador confirma recepción desde email (token) y desde `/orders`
  - [ ] Auth callback Google → redirige correctamente a `/orders`, `/checkout`, `/mi-tienda`
  - [ ] Chat (Baki) responde y aplica rate limit a los 15 mensajes
- [ ] `.env.production` en Vercel tiene: `SUPABASE_SERVICE_ROLE_KEY`, `API_KEY`, `COMMERCE_CODE`, `CRON_SECRET`, `RESEND_API_KEY`, `ANTHROPIC_API_KEY`, `UPSTASH_REDIS_*`, `VAPID_*`
- [ ] Confirmar que `NEXT_PUBLIC_*` no contiene secrets (los actuales son ok: solo Supabase URL/anon, PostHog key, APP_URL, VAPID public)
- [ ] Confirmar que el bucket de Supabase Storage `store-logos` es público de lectura pero no permite uploads anónimos
- [ ] HSTS preload solo si estás listo para 2 años de TLS continuo en `cashbak.cl`

---

## 8. Lo que está bien hecho (no tocar)

- Validación server-side del monto contra DB en `webpay/initiate` y re-validación en `lib/order-creation.ts`.
- Idempotencia del commit (chequeo de `order_items.order_id_client` antes de crear).
- Optimistic locking en descuento de stock con `.gte("stock->>size", quantity)`.
- Webhook viejo de Webpay deshabilitado (retorna 410).
- `escapeHtml` aplicado consistentemente en plantillas de email.
- `safeJsonForScript` para JSON-LD.
- Token de confirmación con claim atómico (`used=false → used=true`) para `confirm_received`.
- Auth con Google OAuth (PKCE manejado por Supabase) y rate limit en `signin`/`signup` server actions.
- CSP con `frame-ancestors 'none'` + `X-Frame-Options: DENY` cierra clickjacking.
- Service role solo en server (`utils/supabase/server.ts`, no expuesto al cliente).
- Cron protegido por `Bearer CRON_SECRET`.

---

*Reporte generado en modo "plan de fixes para revisar". Ningún archivo del repo fue modificado. Cuando decidas avanzar, indicame qué items aplicar y los hago uno por uno con verificación.*
