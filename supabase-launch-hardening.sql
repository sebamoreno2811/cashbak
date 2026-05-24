-- ─────────────────────────────────────────────────────────────────────────────
-- Cashbak — Supabase Launch Hardening
-- ─────────────────────────────────────────────────────────────────────────────
-- Fecha: 2026-05-24
-- Contexto: auditoría de ciberseguridad pre-launch. Ver
-- `auditoria-ciberseguridad-prelaunch.md` para el detalle de cada hallazgo.
--
-- Este script consolida todos los cambios de Supabase necesarios antes del
-- lanzamiento. Es idempotente (DROP IF EXISTS + CREATE OR REPLACE) — se puede
-- correr varias veces sin romper estado.
--
-- Ejecutar en el SQL editor de Supabase, con un usuario que sea owner del schema
-- public (o postgres).
--
-- Resumen de cambios:
--  1. customers_update_own: bloquea escalación a admin vía cambio del campo `role`
--  2. stores_owner_update + trigger: bloquea auto-aprobación de tienda
--  3. orders: elimina UPDATE/INSERT desde cliente (todo pasa por service_role)
--  4. order_items: elimina INSERT desde cliente
--  5. checkout_sessions: agrega with_check correcto
--  6. push_subscriptions: agrega with_check correcto
--  7. admin_safe_query: SECURITY INVOKER + restringida a service_role + filtros ampliados
-- ─────────────────────────────────────────────────────────────────────────────


-- ═════════════════════════════════════════════════════════════════════════════
-- 1. CUSTOMERS — bloquear escalación a admin
-- ═════════════════════════════════════════════════════════════════════════════
-- Problema previo: customers_update_own permitía a un usuario cambiar
-- cualquier columna de su propia fila, incluyendo `role`. Un user autenticado
-- podía ejecutar `update({ role: 'admin' })` desde el browser y obtener
-- privilegios de admin completos.
--
-- Fix: with_check bloquea el cambio comparando con el role actual en disco.

DROP POLICY IF EXISTS customers_update_own ON customers;
CREATE POLICY customers_update_own ON customers
  FOR UPDATE TO public
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role IS NOT DISTINCT FROM (SELECT role FROM customers WHERE id = auth.uid())
  );


-- ═════════════════════════════════════════════════════════════════════════════
-- 2. STORES — bloquear auto-aprobación de tienda
-- ═════════════════════════════════════════════════════════════════════════════
-- Problema previo: stores_owner_update permitía al dueño cambiar cualquier
-- columna de su tienda, incluyendo `status`. Un vendedor pending podía
-- ejecutar `update({ status: 'approved' })` y publicarse sin revisión.
--
-- Fix: policy simple + trigger BEFORE UPDATE que revierte cambios al campo
-- `status` si el caller no es admin. Más robusto que una subquery en
-- with_check (la versión anterior usaba `stores.id = stores.id` que devolvía
-- todas las filas y fallaba con múltiples tiendas en DB).

DROP POLICY IF EXISTS stores_owner_update ON stores;
CREATE POLICY stores_owner_update ON stores
  FOR UPDATE TO public
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE OR REPLACE FUNCTION enforce_store_status_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Solo admins pueden cambiar el status (aprobar/rechazar/pausar tiendas).
  -- Para el resto, cualquier intento de cambiar status se revierte silenciosamente.
  IF OLD.status IS DISTINCT FROM NEW.status AND NOT is_admin() THEN
    NEW.status := OLD.status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS stores_status_immutable ON stores;
CREATE TRIGGER stores_status_immutable
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION enforce_store_status_immutable();


-- ═════════════════════════════════════════════════════════════════════════════
-- 3. ORDERS — eliminar UPDATE/INSERT desde cliente
-- ═════════════════════════════════════════════════════════════════════════════
-- Problema previo:
--   - orders_update_own con with_check=null permitía al comprador cambiar
--     customer_confirmed, shipping_status, vendor_paid, cashback_status, etc.
--     Esto habilitaba: liberar pago al vendedor sin haber recibido el producto,
--     marcar cashback como transferido, etc.
--   - orders_insert_own permitía crear órdenes "fantasma" con payment_status=paid
--     desde el browser.
--
-- Fix: el comprador solo puede SELECT sus órdenes. Todo INSERT/UPDATE pasa por
-- service_role (`lib/order-creation.ts` después del commit de Transbank, y
-- `app/orders/actions.ts#confirmOrderReceived` con admin client validando
-- ownership server-side).

DROP POLICY IF EXISTS orders_update_own ON orders;
DROP POLICY IF EXISTS orders_insert_own ON orders;
-- Se mantienen: orders_select_own (lectura propia) y admins_all_orders.


-- ═════════════════════════════════════════════════════════════════════════════
-- 4. ORDER_ITEMS — eliminar INSERT desde cliente
-- ═════════════════════════════════════════════════════════════════════════════
-- Problema previo: order_items_insert_own permitía al cliente insertar items
-- con cashback_percentage, bet_amount, vendor_net_amount arbitrarios.
--
-- Fix: items solo se insertan vía service_role en lib/order-creation.ts después
-- del commit de Transbank, donde todos los valores financieros se recalculan
-- contra la DB.

DROP POLICY IF EXISTS order_items_insert_own ON order_items;
-- Se mantienen: order_items_select_own, vendors_read_order_items, admins_all_order_items.


-- ═════════════════════════════════════════════════════════════════════════════
-- 5. CHECKOUT_SESSIONS — with_check correcto
-- ═════════════════════════════════════════════════════════════════════════════
-- Problema previo: la policy ALL tenía qual = auth.uid() = user_id pero
-- with_check = null. Eso permitía a un usuario autenticado insertar/upsertear
-- sesiones con user_id ajeno, pisando el carrito de otro comprador.
--
-- Fix: with_check espejo del qual.

DROP POLICY IF EXISTS "Users manage own sessions" ON checkout_sessions;
DROP POLICY IF EXISTS checkout_sessions_own ON checkout_sessions;
CREATE POLICY checkout_sessions_own ON checkout_sessions
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ═════════════════════════════════════════════════════════════════════════════
-- 6. PUSH_SUBSCRIPTIONS — with_check correcto
-- ═════════════════════════════════════════════════════════════════════════════
-- Mismo bug que checkout_sessions: with_check = null permitía hijack de
-- suscripciones a nivel DB. Aunque ya cerramos el flujo de hijack a nivel
-- route handler (app/api/push/subscribe/route.ts), esto es defensa en
-- profundidad.

DROP POLICY IF EXISTS "Users manage own push subscriptions" ON push_subscriptions;
DROP POLICY IF EXISTS push_subscriptions_own ON push_subscriptions;
CREATE POLICY push_subscriptions_own ON push_subscriptions
  FOR ALL TO public
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);


-- ═════════════════════════════════════════════════════════════════════════════
-- 7. ADMIN_SAFE_QUERY — endurecer el RPC del admin chat (Baki admin)
-- ═════════════════════════════════════════════════════════════════════════════
-- Problemas previos:
--   - EXECUTE concedido a anon y authenticated → cualquier visitante podía
--     llamar la RPC vía PostgREST sin pasar por el route handler de Next.js,
--     saltándose el check de admin role.
--   - SECURITY DEFINER + concatenación de strings en EXECUTE = SQL injection
--     ejecutándose como postgres (superuser en Supabase).
--   - Sin LIMIT forzado → dumps masivos posibles.
--   - Blocklist incompleta (no detectaba `;` para múltiples statements ni
--     funciones peligrosas como pg_terminate_backend, lo_export, set_config).
--
-- Fix: SECURITY INVOKER + solo service_role puede ejecutar + blocklist
-- ampliada + rechazo de múltiples statements + LIMIT 500 forzado.

CREATE OR REPLACE FUNCTION public.admin_safe_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY INVOKER          -- ya no corre como postgres
AS $function$
DECLARE
  result      json;
  normalized  text;
  trimmed     text;
BEGIN
  trimmed := trim(trailing ';' FROM trim(query_text));

  -- Rechazar múltiples statements (no permitimos `;` interior)
  IF position(';' IN trimmed) > 0 THEN
    RAISE EXCEPTION 'Múltiples statements no permitidos';
  END IF;

  normalized := upper(regexp_replace(trimmed, '\s+', ' ', 'g'));

  -- Debe empezar con SELECT o WITH
  IF NOT (normalized LIKE 'SELECT %' OR normalized LIKE 'WITH %') THEN
    RAISE EXCEPTION 'Solo se permiten consultas SELECT';
  END IF;

  -- Blocklist ampliada
  IF normalized ~* '\b(INSERT|UPDATE|DELETE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|EXECUTE|PERFORM|DO|COPY|VACUUM|ANALYZE|REINDEX|CLUSTER|LOCK|NOTIFY|LISTEN|UNLISTEN|SECURITY DEFINER|pg_read_file|pg_write_file|pg_terminate_backend|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile|pg_sleep|lo_export|lo_import|lo_get|lo_put|set_config|setval|reset_role|set_role)\b' THEN
    RAISE EXCEPTION 'Operación no permitida';
  END IF;

  -- Forzar LIMIT 500 al wrap externo (defensa en profundidad contra dumps masivos)
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || trimmed || ' LIMIT 500) t' INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_safe_query(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_safe_query(text) TO service_role;


-- ═════════════════════════════════════════════════════════════════════════════
-- VERIFICACIONES FINALES
-- ═════════════════════════════════════════════════════════════════════════════
-- Correr estas queries después del bloque anterior y revisar manualmente.

-- 1. Todas las tablas críticas tienen RLS encendido
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('customers','orders','order_items','order_tokens','stores',
                    'products','bank_accounts','customer_shipping_details',
                    'checkout_sessions','push_subscriptions','bets','comments')
ORDER BY tablename;
-- Esperado: rowsecurity = true en todas.

-- 2. Policies finales
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('customers','orders','order_items','stores',
                    'checkout_sessions','push_subscriptions')
ORDER BY tablename, cmd;
-- Verificar manualmente:
--   - customers_update_own: with_check incluye `role IS NOT DISTINCT FROM ...`
--   - stores_owner_update: qual y with_check ambos = `(auth.uid() = owner_id)`
--   - orders: NO existen orders_update_own ni orders_insert_own
--   - order_items: NO existe order_items_insert_own
--   - checkout_sessions_own: qual y with_check ambos = `(auth.uid() = user_id)`
--   - push_subscriptions_own: qual y with_check ambos = `(auth.uid() = user_id)`

-- 3. admin_safe_query bloqueado a anon y authenticated
SELECT proname, prosecdef, proacl
FROM pg_proc
WHERE proname = 'admin_safe_query';
-- Esperado:
--   prosecdef: false
--   proacl: "{postgres=X/postgres,service_role=X/postgres}"

-- 4. Trigger de stores instalado
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname = 'stores_status_immutable';
-- Esperado: una fila, tgenabled = 'O' (origin) o 'A' (always).
