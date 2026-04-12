import Anthropic from "@anthropic-ai/sdk"
import { NextRequest, NextResponse } from "next/server"
import { createSupabaseClientWithCookies, createSupabaseAdminClient } from "@/utils/supabase/server"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const DB_SCHEMA = `
## Esquema de la base de datos CashBak

### orders
Órdenes de compra.
- id: uuid (PK)
- customer_id: uuid → customers.id
- order_total: numeric — monto total pagado por el cliente (incluye envío)
- cashback_amount: numeric — monto de cashback que recibirá el cliente si gana el evento
- order_status: text — estado general de la orden
- payment_status: text — estado del pago (ej: "paid")
- shipping_method: text — método de envío ("despacho" o "retiro")
- shipping_status: text — estado del envío: "Preparando pedido", "Listo para entrega", "Enviado", "Entregado"
- shipping_cost: integer — costo de envío en CLP (puede ser 0)
- cashback_status: text — estado del cashback: "evento_pendiente", "cashback_transferido", "evento_perdido"
- cashback_transfer_note: text — nota de la transferencia del cashback
- vendor_paid: boolean — si se le pagó al vendedor
- customer_confirmed: boolean — si el cliente confirmó recepción
- customer_notified_at: timestamptz — cuándo se notificó al cliente
- is_fake_order: integer — 1 si es orden de prueba
- created_at, updated_at: timestamptz

### order_items
Ítems dentro de cada orden.
- id: uuid (PK)
- order_id: uuid → orders.id
- product_id: integer → products.id
- product_name: text — nombre del producto al momento de la compra
- quantity: integer
- price: numeric — precio unitario
- size: text — talla seleccionada
- bet_option_id: integer → bets.id
- bet_name: text — nombre del evento al momento de la compra
- cashback_percentage: numeric — % de cashback ofrecido (ej: 0.25 = 25%)
- bet_amount: numeric — monto a apostar por este ítem (por unidad)
- bet_placed: boolean — si ya se colocó la apuesta para este ítem
- vendor_net_amount: integer — monto neto que recibe el vendedor por unidad
- comision_cashbak: integer — comisión de CashBak por este ítem
- tarifa_procesamiento: integer — tarifa de procesamiento

### customers
Compradores y administradores registrados.
- id: uuid (PK) — mismo ID que auth.users
- full_name: text
- email: text
- phone: text
- role: text — "customer" o "admin"
- created_at, updated_at: timestamptz

### stores
Tiendas de vendedores.
- id: uuid (PK)
- owner_id: uuid → customers.id
- name: text
- email: text
- status: text — "pending", "approved", "rejected"
- bank_name, account_type, account_number, account_holder, rut, owner_rut: text — datos bancarios del vendedor
- created_at, updated_at: timestamptz

### products
Productos publicados.
- id: integer (PK)
- store_id: uuid → stores.id
- name: text
- price: integer — precio de venta en CLP
- cost: integer — costo del producto
- category_name: text
- stock: jsonb — stock por talla
- margin_pct: numeric — margen del vendedor (ej: 0.20 = 20%)

### bets
Eventos deportivos disponibles.
- id: integer (PK)
- name: text — descripción del evento
- odd: numeric — cuota del evento
- end_date: timestamptz — fecha de resolución
- active: boolean — si está activo para nuevas compras
- is_winner: boolean | null — null=pendiente, true=ganó, false=perdió
- sport: text — deporte
- category: text

### bank_accounts
Cuentas bancarias de clientes para recibir cashback.
- id: uuid (PK)
- customer_id: uuid → customers.id
- bank_name, account_type, account_number, rut: text

### Notas importantes
- Los montos están en CLP (pesos chilenos)
- cashback_percentage en order_items es un decimal (0.25 = 25%)
- vendor_net_amount es por unidad — multiplicar por quantity para el total
- bet_amount es por unidad — multiplicar por quantity para el monto apostado total
- Para ver si una orden está completamente pagada al vendedor, mirar vendor_paid en orders
- Para cashback: cashback_status = "cashback_transferido" significa que ya se transfirió
- Excluir órdenes con is_fake_order = 1 en análisis de negocio reales
`

const SYSTEM_PROMPT = `Eres un asistente de base de datos para el panel de administración de CashBak. Tu trabajo es ayudar al administrador a consultar datos operacionales de la plataforma.

Cuando el administrador haga una pregunta sobre datos, usa la herramienta \`query_database\` para ejecutar una consulta SQL SELECT y luego interpreta y presenta el resultado de forma clara.

${DB_SCHEMA}

## Instrucciones
- Genera consultas SQL válidas para PostgreSQL
- Solo usa SELECT (nunca INSERT, UPDATE, DELETE, DROP, etc.)
- Siempre limita resultados a máximo 50 filas con LIMIT 50 salvo que se pida explícitamente más
- Formatea los montos en CLP con separador de miles cuando presentes los resultados
- Presenta los resultados de forma clara en español, con contexto útil
- Si hay múltiples pasos necesarios (ej: buscar ID primero, luego buscar órdenes), encadena múltiples llamadas a la herramienta
- Si la consulta no devuelve resultados, dilo claramente
- Para referencias a clientes, muestra siempre nombre + email
- Convierte cashback_percentage a % legible (multiplica por 100)
- Convierte vendor_net_amount y bet_amount a totales (multiplica por quantity cuando sea relevante)
- NO expliques el SQL generado a menos que se pida, solo muestra los resultados interpretados`

async function executeQuery(sql: string): Promise<{ data: unknown; error: string | null }> {
  try {
    const supabaseAdmin = createSupabaseAdminClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabaseAdmin as any).rpc("admin_safe_query", { query_text: sql })
    if (error) return { data: null, error: error.message }
    return { data, error: null }
  } catch (err: unknown) {
    return { data: null, error: err instanceof Error ? err.message : "Error desconocido" }
  }
}

export async function POST(req: NextRequest) {
  // Verify admin
  const supabase = await createSupabaseClientWithCookies()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { data: customer } = await supabase
    .from("customers")
    .select("role")
    .eq("id", user.id)
    .single()
  if (customer?.role !== "admin") return NextResponse.json({ error: "No autorizado" }, { status: 403 })

  let messages: Anthropic.MessageParam[]
  try {
    const body = await req.json()
    messages = body.messages
    if (!Array.isArray(messages) || messages.length === 0) throw new Error()
    for (const msg of messages) {
      if (msg.role !== "user" && msg.role !== "assistant") throw new Error()
      if (typeof msg.content !== "string" || msg.content.length > 4000) throw new Error()
    }
    if (messages[messages.length - 1]?.role !== "user") throw new Error()
  } catch {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 })
  }

  const tools: Anthropic.Tool[] = [
    {
      name: "query_database",
      description: "Ejecuta una consulta SQL SELECT en la base de datos de CashBak y devuelve los resultados.",
      input_schema: {
        type: "object" as const,
        properties: {
          sql: {
            type: "string",
            description: "Consulta SQL SELECT válida para PostgreSQL. Solo SELECT permitido.",
          },
        },
        required: ["sql"],
      },
    },
  ]

  const trimmedMessages = messages.slice(-20)

  try {
    // Agentic loop: Claude puede llamar la herramienta múltiples veces
    let currentMessages: Anthropic.MessageParam[] = trimmedMessages
    let finalText = ""
    const MAX_ITERATIONS = 5

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        tools,
        messages: currentMessages,
      })

      if (response.stop_reason === "end_turn") {
        finalText = response.content
          .filter(b => b.type === "text")
          .map(b => (b as { type: "text"; text: string }).text)
          .join("")
        break
      }

      if (response.stop_reason === "tool_use") {
        const toolUseBlocks = response.content.filter(b => b.type === "tool_use")
        const toolResults: Anthropic.ToolResultBlockParam[] = []

        for (const block of toolUseBlocks) {
          if (block.type !== "tool_use") continue
          const toolBlock = block as Anthropic.ToolUseBlock
          const input = toolBlock.input as { sql: string }
          const { data, error } = await executeQuery(input.sql)

          toolResults.push({
            type: "tool_result",
            tool_use_id: toolBlock.id,
            content: error
              ? `Error: ${error}`
              : JSON.stringify(data),
          })
        }

        // Add assistant message + tool results and continue
        currentMessages = [
          ...currentMessages,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResults },
        ]
        continue
      }

      // Unexpected stop reason
      break
    }

    if (!finalText) {
      finalText = "No pude generar una respuesta. Intenta de nuevo."
    }

    return NextResponse.json({ text: finalText })
  } catch (err: unknown) {
    console.error("[/api/admin-chat] error:", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
