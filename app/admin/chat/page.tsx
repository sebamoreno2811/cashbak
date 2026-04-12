"use client"

import { useState, useRef, useEffect } from "react"
import { Send, Loader2, ArrowLeft, Database, Bot } from "lucide-react"
import Link from "next/link"

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let key = 0
  let inTable = false
  let tableRows: string[][] = []

  const flushTable = () => {
    if (tableRows.length === 0) return
    const [header, , ...body] = tableRows
    elements.push(
      <div key={key++} className="overflow-x-auto my-2">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr className="bg-gray-100">
              {(header ?? []).map((cell, ci) => (
                <th key={ci} className="border border-gray-200 px-2 py-1 text-left font-semibold text-gray-700 whitespace-nowrap">{cell.trim()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                {row.map((cell, ci) => (
                  <td key={ci} className="border border-gray-200 px-2 py-1 text-gray-700 whitespace-nowrap">{cell.trim()}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
    tableRows = []
    inTable = false
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.includes("|") && line.trim().startsWith("|")) {
      inTable = true
      tableRows.push(line.split("|").filter((_, idx) => idx > 0 && idx < line.split("|").length - 1))
      continue
    }

    if (inTable) flushTable()

    if (line.startsWith("### ")) {
      elements.push(<p key={key++} className="font-semibold text-gray-900 mt-3 mb-1 text-sm">{line.slice(4)}</p>)
    } else if (line.startsWith("## ")) {
      elements.push(<p key={key++} className="font-bold text-gray-900 mt-3 mb-1">{line.slice(3)}</p>)
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      elements.push(
        <div key={key++} className="flex gap-1.5 items-start">
          <span className="mt-1.5 shrink-0 w-1 h-1 rounded-full bg-gray-500" />
          <span>{formatInline(line.slice(2))}</span>
        </div>
      )
    } else if (line.trim() === "") {
      if (elements.length > 0) elements.push(<div key={key++} className="h-1" />)
    } else {
      elements.push(<p key={key++}>{formatInline(line)}</p>)
    }
  }

  if (inTable) flushTable()

  return <div className="space-y-0.5 text-sm leading-relaxed">{elements}</div>
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    if (part.startsWith("`") && part.endsWith("`"))
      return <code key={i} className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>
    return part
  })
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTIONS = [
  "¿Se le transfirió el cashback a la orden más reciente?",
  "¿Qué clientes tienen cashback pendiente de transferir?",
  "¿Cuántas órdenes están pendientes de pago al vendedor?",
  "Muéstrame las últimas 10 órdenes con sus montos",
  "¿Qué tiendas no tienen datos bancarios registrados?",
]

export default function AdminChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg || loading) return

    const newMessages: Message[] = [...messages, { role: "user", content: msg }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    setMessages(prev => [...prev, { role: "assistant", content: "" }])

    try {
      const res = await fetch("/api/admin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: err.error ?? "Error al conectar con el servidor." },
        ])
        return
      }

      const data = await res.json()
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: data.text ?? "Sin respuesta." },
      ])
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "No pude conectarme. Revisa tu conexión." },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-900 flex items-center justify-center shrink-0">
              <Database className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900">Asistente de Base de Datos</h1>
              <p className="text-xs text-gray-400">Consulta datos operacionales en lenguaje natural</p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-2xl bg-green-900 flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">¿En qué te puedo ayudar?</h2>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Pregúntame sobre órdenes, clientes, cashbacks, pagos a vendedores, o cualquier dato de la plataforma.
                </p>
              </div>
              <div className="grid gap-2">
                {SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => send(s)}
                    className="text-left text-sm text-gray-700 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-green-700 hover:text-green-800 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-full bg-green-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-green-900 text-white rounded-br-sm text-sm whitespace-pre-wrap"
                    : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                }`}
              >
                {msg.role === "user"
                  ? msg.content
                  : msg.content === ""
                    ? (
                      <span className="inline-flex gap-1 py-0.5">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    )
                    : renderMarkdown(msg.content)
                }
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-4 py-4 shrink-0">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ej: ¿Se le transfirió el cashback a la orden ABC123?"
            rows={1}
            disabled={loading}
            className="flex-1 px-4 py-3 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-green-700 disabled:opacity-50 max-h-32 overflow-y-auto"
            style={{ lineHeight: "1.5" }}
            onInput={e => {
              const t = e.target as HTMLTextAreaElement
              t.style.height = "auto"
              t.style.height = Math.min(t.scrollHeight, 128) + "px"
            }}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            className="p-3 bg-green-900 hover:bg-green-800 text-white rounded-xl transition-colors disabled:opacity-40 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 mt-2">Solo lectura — no puede modificar datos</p>
      </div>
    </div>
  )
}
