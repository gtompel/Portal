"use client"

import { type ReactNode, useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { usePathname, useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import Header from "@/components/header"
import LoadingScreen from "@/components/loading-screen"

interface ProtectedLayoutProps {
  children: ReactNode
}

const publicRoutes = ["/auth/login", "/auth/register", "/auth/error", "/auth/forgot-password"]

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)

  const isPublicRoute = publicRoutes.includes(pathname)

  useEffect(() => {
    // Если страница не публичная и нет сессии, перенаправляем на логин
    if (!isLoading && !isPublicRoute && status === "unauthenticated") {
      router.push("/auth/login")
    }

    // Если есть сессия и пользователь на странице аутентификации, перенаправляем на главную
    if (!isLoading && isPublicRoute && status === "authenticated") {
      router.push("/")
    }

    if (status !== "loading") {
      setIsLoading(false)
    }
  }, [status, router, pathname, isPublicRoute, isLoading])

  // Показываем загрузку пока проверяем аутентификацию
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
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  )
}

