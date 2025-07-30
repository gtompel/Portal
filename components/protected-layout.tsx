"use client"

import { type ReactNode, useEffect, useState, useMemo } from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import LoadingScreen from "@/components/loading-screen"

interface ProtectedLayoutProps {
  children: ReactNode
}

const publicRoutes = ["/auth/login", "/auth/register", "/auth/error", "/auth/forgot-password", "/auth/reset-password"]

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)

  const isPublicRoute = useMemo(() => 
    publicRoutes.includes(pathname) || pathname?.startsWith("/auth/reset-password"), 
    [pathname]
  )

  useEffect(() => {
    // Инициализация только один раз
    if (!hasInitialized && status !== "loading") {
      setHasInitialized(true)
      setIsLoading(false)
    }
  }, [status, hasInitialized])

  useEffect(() => {
    // Только после инициализации проверяем аутентификацию
    if (!hasInitialized) return

    // Если страница не публичная и нет сессии, перенаправляем на логин
    if (!isPublicRoute && status === "unauthenticated") {
      router.push("/auth/login")
    }

    // Если есть сессия и пользователь на странице аутентификации, перенаправляем на главную
    if (isPublicRoute && status === "authenticated") {
      router.push("/")
    }
  }, [status, router, pathname, isPublicRoute, hasInitialized])

  // Показываем загрузку только при первой инициализации
  if (isLoading) {
    return <LoadingScreen />
  }

  // Для публичных маршрутов просто отображаем контент без общего layout
  if (isPublicRoute) {
    return <>{children}</>
  }

  // Для защищенных маршрутов отображаем полный layout с сайдбаром и хедером
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <main className="flex-1 overflow-auto p-3 sm:p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

