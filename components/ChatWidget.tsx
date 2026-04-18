"use client"

import { useState, useRef, useEffect } from "react"
import { MessageCircle, X, Send, Loader2 } from "lucide-react"

function renderMarkdown(text: string) {
  const lines = text.split("\n")
  const elements: React.ReactNode[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith("## ")) {
      elements.push(<p key={key++} className="font-semibold text-gray-900 mt-2 mb-0.5">{line.slice(3)}</p>)
    } else if (line.startsWith("- ") || line.startsWith("• ")) {
      const content = line.slice(2)
      elements.push(
        <div key={key++} className="flex gap-1.5 items-start">
          <span className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full bg-green-700" />
          <span>{formatInline(content)}</span>
        </div>
      )
    } else if (line.trim() === "") {
      if (elements.length > 0) elements.push(<div key={key++} className="h-1" />)
    } else {
      elements.push(<p key={key++}>{formatInline(line)}</p>)
    }
  }

  return <div className="space-y-0.5">{elements}</div>
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch)
      return <a key={i} href={linkMatch[2]} className="text-green-700 underline font-medium hover:text-green-900">{linkMatch[1]}</a>
    return part
  })
}

interface Message {
  role: "user" | "assistant"
  content: string
}

const SUGGESTED_QUESTIONS = [
  { label: "¿Cómo funciona el CashBak?", text: "¿Cómo funciona el CashBak?" },
  { label: "¿Cuándo recibo mi cashback?", text: "¿Cuándo recibo mi cashback?" },
  { label: "Soy vendedor — ¿cómo configuro bien mis productos?", text: "Soy vendedor y quiero saber cómo configurar bien mis productos para ofrecer un buen cashback y usar bien la plataforma." },
  { label: "¿Cómo confirmo que recibí mi pedido?", text: "¿Cómo confirmo que recibí mi pedido?" },
]

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
      if (messages.length === 0) {
        setMessages([{
          role: "assistant",
          content: "¡Hola! Soy Baki, el asistente virtual de CashBak 👋\n\nEstoy aquí para ayudarte a entender cómo funciona la plataforma, el CashBak, cómo usar tu cuenta y mucho más. ¿En qué te puedo ayudar?",
        }])
      }
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: "user", content: text }]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    const assistantMessage: Message = { role: "assistant", content: "" }
    setMessages(prev => [...prev, assistantMessage])

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: err.error ?? "Ocurrió un error. Intenta de nuevo." },
        ])
        return
      }

      const data = await res.json()
      const text = data.text ?? ""

      if (!text.trim()) {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "No pude generar una respuesta. Intenta de nuevo." },
        ])
      } else {
        setMessages(prev => [
          ...prev.slice(0, -1),
          { role: "assistant", content: text },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "No pude conectarme. Revisa tu conexión e intenta de nuevo." },
      ])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <>
      {/* Ventana del chat */}
      {open && (
        <div className="fixed z-50 flex flex-col overflow-hidden bg-white border border-gray-200 shadow-2xl bottom-20 right-4 w-80 sm:w-96 rounded-2xl"
          style={{ maxHeight: "70vh" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-green-900 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <p className="text-sm font-semibold text-white">Baki — Asistente CashBak</p>
            </div>
            <button onClick={() => setOpen(false)} className="transition-colors text-white/70 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 p-4 space-y-3 overflow-y-auto bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-green-900 text-white rounded-br-sm whitespace-pre-wrap"
                      : "bg-white text-gray-800 border border-gray-200 rounded-bl-sm shadow-sm"
                  }`}
                >
                  {msg.role === "user" ? msg.content : renderMarkdown(msg.content)}
                  {msg.role === "assistant" && msg.content === "" && (
                    <span className="inline-flex gap-0.5">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {/* Chips de preguntas sugeridas — solo mientras no hay mensajes del usuario */}
            {messages.length === 1 && messages[0].role === "assistant" && (
              <div className="flex flex-col gap-2 pt-1">
                <p className="text-xs text-gray-400 text-center">o elige una pregunta</p>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q.label}
                    onClick={async () => {
                      const newMessages: Message[] = [...messages, { role: "user", content: q.text }]
                      setMessages(newMessages)
                      setLoading(true)
                      setMessages(prev => [...prev, { role: "assistant", content: "" }])
                      try {
                        const res = await fetch("/api/chat", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ messages: newMessages }),
                        })
                        const data = await res.json()
                        setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: data.text ?? "No pude generar una respuesta." }])
                      } catch {
                        setMessages(prev => [...prev.slice(0, -1), { role: "assistant", content: "No pude conectarme. Intenta de nuevo." }])
                      } finally {
                        setLoading(false)
                      }
                    }}
                    disabled={loading}
                    className="text-left text-xs px-3 py-2 rounded-xl border border-green-200 bg-white text-green-900 hover:bg-green-50 hover:border-green-400 transition-colors font-medium disabled:opacity-40"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-3 bg-white border-t border-gray-200 shrink-0">
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
              placeholder="Escribe tu pregunta..."
              disabled={loading}
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-700 disabled:opacity-50"
            />
            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="p-2 text-white transition-colors bg-green-900 shrink-0 hover:bg-green-800 rounded-xl disabled:opacity-40"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        {/* Etiqueta "¿Tienes dudas?" */}
        {!open && (
          <div className="flex items-center gap-2 bg-white text-green-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md border border-green-100 animate-bounce-slow whitespace-nowrap">
            <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
            ¿Tienes dudas? Pregúntame
          </div>
        )}
        <button
          onClick={() => setOpen(v => !v)}
          className="relative bg-green-900 hover:bg-green-800 text-white rounded-full shadow-xl transition-all hover:scale-105 active:scale-95 flex items-center gap-3 px-5 py-4"
          aria-label="Abrir chat de soporte"
        >
          {open ? (
            <X className="w-5 h-5" />
          ) : (
            <>
              {/* Pulso de atención */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
              </span>
              <MessageCircle className="w-6 h-6" />
              <span className="text-base font-semibold">Baki</span>
            </>
          )}
        </button>
      </div>
    </>
  )
}
