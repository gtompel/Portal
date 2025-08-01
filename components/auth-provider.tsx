"use client"

import { SessionProvider } from "next-auth/react"
import type { ReactNode } from "react"
import ProtectedLayout from "@/components/protected-layout"

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider 
      refetchInterval={5 * 60} // Обновляем сессию каждые 5 минут
      refetchOnWindowFocus={true} // Обновляем при фокусе окна
    >
      <ProtectedLayout>{children}</ProtectedLayout>
    </SessionProvider>
  )
}

