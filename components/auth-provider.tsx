"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"
import ProtectedLayout from "@/components/protected-layout"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider>
      <ProtectedLayout>{children}</ProtectedLayout>
    </SessionProvider>
  )
}

