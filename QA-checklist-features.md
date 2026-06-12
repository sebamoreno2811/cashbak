# Cashbak — Checklist de QA (features por rol)

Listado completo de funcionalidades de la plataforma, basado en el código real. Marca cada una al probarla.

---

## 🛒 CLIENTE (Comprador)

### Cuenta y autenticación
- [ ] Iniciar sesión con Google (OAuth) — `/login`
- [ ] Callback de autenticación funciona (redirige bien) — `/auth/callback`
- [ ] Cerrar sesión — `/auth/signout`
- [ ] Recuperar / resetear contraseña — `/reset-password`
- [ ] Menú de usuario (avatar, accesos) — `user-menu`

### Descubrimiento de productos
- [ ] Landing carga con carrusel de destacados — `/`
- [ ] Filtros por categoría en la landing
- [ ] Grid de todos los productos — `/products`
- [ ] Detalle de producto — `/product/[id]/[slug]`
- [ ] Tienda de un vendedor — `/tienda/[slug]`
- [ ] Directorio de tiendas — `/tiendas`
- [ ] Página "Cómo funciona" — `/howto`
- [ ] Contacto — `/contact`
- [ ] Términos y Política de privacidad — `/terminos`, `/privacy-policy`

### Producto (detalle)
- [ ] Selector de evento deportivo (BetSelector) carga eventos activos
- [ ] Cálculo de CashBak visible / barra de fondo (cashbak-fund-bar)
- [ ] Selección de cantidad respeta el stock
- [ ] Agregar al carrito
- [ ] Ver reseñas (estrellas + contenido)
- [ ] Dejar una reseña / comentario

### Carrito y checkout
- [ ] Carrito persiste entre sesiones — `/cart`
- [ ] Modificar cantidades / eliminar items en el carrito
- [ ] Elegir tipo de entrega: despacho vs retiro — `/checkout`
- [ ] Ingresar / cargar dirección de envío (ShippingModal)
- [ ] Costo de envío se calcula correctamente
- [ ] Pago con WebPay — flujo exitoso (`/api/webpay/initiate` → `commit`)
- [ ] Pago cancelado/abortado muestra mensaje correcto
- [ ] Pago rechazado por banco muestra mensaje correcto
- [ ] Detección de stock expirado antes de pagar
- [ ] Orden se crea correctamente tras pago exitoso

### Órdenes
- [ ] Ver mis órdenes — `/orders`
- [ ] Estados de orden se muestran bien (pago → envío → cashback → entregado)
- [ ] Confirmar recepción del pedido (botón)
- [ ] Estado de CashBak: evento pendiente
- [ ] Estado de CashBak: ¡Ganaste! / en camino
- [ ] Estado de CashBak: transferido ✓
- [ ] Estado de CashBak: evento perdido
- [ ] Acciones desde email (marcar enviado / confirmar recibido) — `/api/order-action/[token]` → `/order-action-result`

### Perfil
- [ ] Editar dirección de envío — `/perfil`
- [ ] Editar datos de transferencia (banco para recibir CashBak)
- [ ] Activar / desactivar notificaciones push (NotificationToggle)
- [ ] Recibir notificación push cuando llega el CashBak o se envía el pedido

### Asistente
- [ ] Chat widget "Baki" abre y responde — `/api/chat`
- [ ] Chips de preguntas sugeridas funcionan

---

## 🏪 VENDEDOR

### Onboarding
- [ ] Landing de venta — `/sell`
- [ ] Solicitud de tienda — `/sell/aplicar`
- [ ] Validación de RUT (formato chileno)
- [ ] Subida de logo (límite 2 MB)
- [ ] Selección de categorías
- [ ] Estado "pendiente" tras aplicar (pantalla de espera)
- [ ] Estado "rechazada" muestra pantalla correcta
- [ ] Estado "eliminada" muestra pantalla correcta

### Mi Tienda — gestión (`/mi-tienda`)
- [ ] Tab Productos: lista de productos del vendedor
- [ ] Agregar producto (nombre, precio, costo, margen, categoría, imagen, stock)
- [ ] Editar producto
- [ ] Eliminar producto
- [ ] Buscar producto por nombre
- [ ] Filtrar productos por categoría
- [ ] Gestionar stock por producto
- [ ] Tab Mi tienda: editar nombre y descripción de la tienda
- [ ] Tab Entregas: configurar opciones de delivery
- [ ] Tab Datos bancarios: cargar/editar cuenta para payout (banco, tipo, número, titular, RUT)
- [ ] Recordatorio de datos bancarios incompletos (modal/badge)
- [ ] Funciones bloqueadas mientras la tienda está "pending"

### Mi Tienda — pedidos (`/mi-tienda/pedidos`)
- [ ] Ver pedidos de la tienda
- [ ] Buscar pedido por ID
- [ ] Filtrar pedidos por estado
- [ ] Actualizar estado de envío de un pedido

### Mi Tienda — resumen (`/mi-tienda/resumen`)
- [ ] Dashboard con métricas del vendedor carga correctamente

---

## 🛠️ ADMIN

### Dashboard (`/admin/dashboard`)
- [ ] Métricas generales (MetricCards) cargan
- [ ] "Apuestas por colocar" lista eventos activos sin cubrir
- [ ] Marcar apuestas como colocadas (markBetsPlaced)
- [ ] "Cashback pendiente" agrupado por cliente
- [ ] Navegación a detalle de cashback por cliente

### Eventos (`/admin/eventos`)
- [ ] Lista de eventos con cuota y fecha
- [ ] Filtros (pendientes / resueltos / en curso)
- [ ] Marcar evento como ganador (markBetWinner)
- [ ] Marcar evento como perdedor (markBetLost)
- [ ] Reactivar evento (reactivateBet)
- [ ] **Verificar cómo se crean eventos nuevos** (no encontré UI de creación — confirmar si es por DB/otro flujo)

### Pedidos (`/admin/pedidos`)
- [ ] Panel de todas las órdenes
- [ ] Actualizar estados de una orden (updateOrderStatuses)
- [ ] Actualización masiva de órdenes (bulkUpdateOrders)

### Tiendas (`/admin/tiendas`)
- [ ] Lista agrupada por estado (pendientes/aprobadas/rechazadas/eliminadas)
- [ ] Aprobar tienda (approveStore)
- [ ] Rechazar tienda con motivo (rejectStore)
- [ ] Eliminar tienda + sus productos (adminDeleteStore)
- [ ] Eliminar producto individual de una tienda (adminDeleteProduct)
- [ ] Ver productos de una tienda

### Detalle de vendedor (`/admin/vendedor/[storeId]`)
- [ ] Ver detalle del vendedor y sus pedidos
- [ ] Marcar pedido como pagado al vendedor (markOrderVendorPaid)
- [ ] Marcar todos los pedidos como pagados (markAllVendorPaid)

### Cashback por cliente (`/admin/cashback/[customerId]`)
- [ ] Ver detalle de cashback de un cliente
- [ ] Marcar cashback transferido (markCashbackTransferred)
- [ ] Marcar todos los cashbacks transferidos (markAllCashbackTransferred)

### Chat admin (`/admin/chat`)
- [ ] Chat con consultas SQL responde (solo SELECT, read-only)

---

## ⚙️ SISTEMA / TRANSVERSAL (pruebas técnicas)

- [ ] Rate limiting global (100 req/min) y crítico (5/10min en checkout/auth)
- [ ] Refresh de sesión Supabase en cada request (middleware)
- [ ] Webhook de WebPay recibe y procesa — `/api/webpay-webhook`
- [ ] Cron auto-confirmación de pedidos — `/api/cron/auto-confirm`
- [ ] Cron de eventos pendientes — `/api/cron/pending-bets`
- [ ] Suscripción push se guarda — `/api/push/subscribe`
- [ ] Emails transaccionales (Resend) se envían (confirmación, envío, cashback)
- [ ] Tokens de acción de orden expiran y no se reutilizan (used/expired)
- [ ] Analytics PostHog registra eventos (ej. pago_fallido)
- [ ] Dark mode / theming funciona
