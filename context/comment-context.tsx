"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react"
import { createClient } from "@/utils/supabase/client"

export interface Comment {
  stars: number
  id: string
  product_id: number
  user_id: string
  user_name : string
  content: string
  created_at: string
}

interface CommentContextType {
  comments: Comment[]
  loading: boolean
  error: string | null
  refreshComments: () => Promise<void>
}

const CommentContext = createContext<CommentContextType | undefined>(undefined)

export function CommentProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching comments:", error)
      setError(error.message || "Error desconocido al cargar comentarios")
      setComments([])
    } else {
      setComments(data)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchComments()
  }, [])

  return (
    <CommentContext.Provider
      value={{
        comments,
        loading,
        error,
        refreshComments: fetchComments,
      }}
    >
      {children}
    </CommentContext.Provider>
  )
}

export function useComments() {
  const context = useContext(CommentContext)
  if (!context) {
    throw new Error("useComments must be used within a CommentProvider")
  }
  return context
}
