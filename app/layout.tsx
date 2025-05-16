import type React from "react"
import RootLayoutContent from "./clientLayout"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <RootLayoutContent>{children}</RootLayoutContent>
}
