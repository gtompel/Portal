"use client"

import { type ReactNode, useEffect, useState, useMemo } from "react"
import { useSession, signIn } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import LoadingScreen from "@/components/loading-screen"
import { sessionCache } from "@/lib/session-cache"

interface ProtectedLayoutProps {
  children: ReactNode
}

const publicRoutes = ["/auth/login", "/auth/register", "/auth/error", "/auth/forgot-password", "/auth/reset-password"]

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [hasInitialized, setHasInitialized] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  // Кэшируем сессию для оптимизации
  const cachedSession = useMemo(() => {
    if (session?.user?.id) {
      const cacheKey = `session_${session.user.id}`
      const cached = sessionCache.get(cacheKey)
      if (cached) {
        return cached
      }
      sessionCache.set(cacheKey, session, 5 * 60 * 1000) // 5 минут
      return session
    }
    return null
  }, [session])

  const isPublicRoute = useMemo(() => 
    publicRoutes.includes(pathname) || pathname?.startsWith("/auth/reset-password"), 
    [pathname]
  )

  // Функция для попытки восстановления сессии
  const attemptSessionRecovery = async () => {
    try {
      await update()
    } catch (error) {
      if (retryCount < 2) {
        setRetryCount(prev => prev + 1)
        setTimeout(() => attemptSessionRecovery(), 1000 * (retryCount + 1))
      }
    }
  }

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

    // Если статус unauthenticated, пытаемся восстановить сессию
    if (status === "unauthenticated" && retryCount < 2) {
      attemptSessionRecovery()
      return
    }

    // Если страница не публичная и нет сессии после попыток восстановления
    if (!isPublicRoute && status === "unauthenticated" && retryCount >= 2) {
      router.push("/auth/login")
    }

    // Если есть сессия и пользователь на странице аутентификации, перенаправляем на главную
    if (isPublicRoute && status === "authenticated") {
      router.push("/")
    }
  }, [status, router, pathname, isPublicRoute, hasInitialized, retryCount, update])

  // Показываем загрузку только при первой инициализации или при попытках восстановления
  if (isLoading || (status === "unauthenticated" && retryCount < 2)) {
    return (
      <LoadingScreen 
        message={retryCount > 0 ? "Восстановление сессии..." : "Загрузка..."}
        subMessage={retryCount > 0 ? `Попытка ${retryCount}/2` : "Пожалуйста, подождите"}
      />
    )
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

