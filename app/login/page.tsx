"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import AuthForm from "@/components/auth/auth-form"
import Link from "next/link"
import Image from "next/image"

function LoginContent() {
  const params = useSearchParams()
  const redirectTo = params.get("redirect") ?? "/"

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8">
        <Image src="/img/logo.png" alt="CashBak" width={140} height={40} className="object-contain" />
      </Link>
      <div className="w-full max-w-md">
        <AuthForm redirectTo={redirectTo} />
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
