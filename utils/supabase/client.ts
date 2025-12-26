import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
          getItem: (key: string) => {
            if (typeof window === 'undefined') return null
            const cookies = document.cookie.split('; ')
            const cookie = cookies.find(row => row.startsWith(key + '='))
            return cookie ? cookie.split('=')[1] : null
          },
          setItem: (key: string, value: string) => {
            if (typeof window === 'undefined') return
            document.cookie = `${key}=${value}; path=/; secure; samesite=lax; max-age=31536000`
          },
          removeItem: (key: string) => {
            if (typeof window === 'undefined') return
            document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
          }
        }
      }
    } as any
  )
}
