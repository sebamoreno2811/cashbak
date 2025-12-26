import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof window === 'undefined') return undefined
          const cookies = document.cookie.split('; ')
          const cookie = cookies.find(row => row.startsWith(name + '='))
          return cookie ? cookie.split('=')[1] : undefined
        },
        set(name: string, value: string, options: any) {
          if (typeof window === 'undefined') return
          let cookie = `${name}=${value}; path=/`
          if (options?.maxAge) cookie += `; max-age=${options.maxAge}`
          if (options?.expires) cookie += `; expires=${options.expires}`
          if (options?.secure) cookie += '; secure'
          if (options?.sameSite) cookie += `; samesite=${options.sameSite}`
          document.cookie = cookie
        },
        remove(name: string, options: any) {
          if (typeof window === 'undefined') return
          document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`
        },
      },
    }
  )
}
