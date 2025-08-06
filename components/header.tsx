"use client"

import { useState, useEffect } from "react"
import { Bell, Calendar, CheckSquare, MessageSquare, CheckCheck, Phone } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import Link from "next/link"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { useToast } from "@/hooks/use-toast"
import { useNotificationsBatch } from "@/hooks/use-notifications-batch"
import { NotificationHandler } from "@/components/notification-handler"

type Notification = {
  id: string
  type: "EVENT" | "TASK" | "MESSAGE" | "ANNOUNCEMENT" | "ASSIGNED" | "CALL_MISSED" 
  title: string
  description: string
  date: string | null
  createdAt: string
  read: boolean
  entityId: string
  creatorName: string
}

export default function Header() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  
  // Используем batch операции для уведомлений
  const {
    isLoading: isBatchLoading,
    markAllAsRead: batchMarkAllAsRead,
    markSelectedAsRead: batchMarkSelectedAsRead,
    syncNotifications: batchSyncNotifications,
    migrateNotifications: batchMigrateNotifications
  } = useNotificationsBatch()

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotificationData()
      // Миграция уведомлений при входе
      migrateNotifications()
    }
  }, [session])

  // Миграция уведомлений для старых задач (используем batch)
  const migrateNotifications = async () => {
    try {
      if (!session?.user?.id) return
      const result = await batchMigrateNotifications()
      if (result) {
        // После миграции обновляем список уведомлений
        fetchNotificationData()
      }
    } catch (error) {
      console.error("Ошибка при миграции уведомлений:", error)
    }
  }

  // Загрузка реальных уведомлений из API
  const fetchNotificationData = async () => {
    try {
      if (!session?.user?.id) return
      const res = await fetch(`/api/notifications?userId=${session.user.id}`)
      if (res.ok) {
        const notifications = await res.json()
        setNotifications(notifications)
        setUnreadCount(notifications.filter((n: Notification) => !n.read).length)
      } else {
        throw new Error("Не удалось загрузить уведомления")
      }
    } catch (error) {
      console.error("Ошибка при загрузке уведомлений:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить уведомления",
        variant: "destructive",
      })
    }
  }



  // Отметка как прочитанное с отправкой на сервер (используем batch)
  const markAsRead = async (id: string) => {
    try {
      const result = await batchMarkSelectedAsRead([id])
      if (result) {
        setNotifications((prev) =>
          prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Ошибка при отметке уведомления как прочитанного:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const result = await batchMarkAllAsRead()
      if (result) {
        setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error("Ошибка при отметке всех уведомлений как прочитанных:", error)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-2 sm:gap-4 border-b bg-background px-3 sm:px-4 md:px-6">
      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
        <ThemeToggle />

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="rounded-full relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                  {unreadCount}
                </Badge>
              )}
              <span className="sr-only">Уведомления</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between p-4 border-b">
              <h4 className="font-medium">Уведомления</h4>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={markAllAsRead}
                  disabled={isBatchLoading}
                  className="h-8 w-8"
                  title="Отметить все как прочитанные"
                >
                  {isBatchLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                  ) : (
                    <CheckCheck className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>
            <div className="max-h-80 overflow-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b flex items-start gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${notification.read ? "opacity-70" : "bg-muted/30"}`}
                    onClick={() => {
                      markAsRead(notification.id)
                      // Обработка переходов в зависимости от типа уведомления
                      switch (notification.type) {
                        case 'MESSAGE':
                          if (notification.entityId) {
                            // Переходим к конкретному сообщению
                            router.push(`/messages?messageId=${notification.entityId}`)
                          } else {
                            router.push('/messages')
                          }
                          break
                        case 'CALL_MISSED':
                          router.push('/messages?showCallSystem=true')
                          break
                        case 'TASK':
                        case 'ASSIGNED':
                          if (notification.entityId) {
                            router.push(`/tasks?taskId=${notification.entityId}`)
                          } else {
                            router.push('/tasks')
                          }
                          break
                        case 'EVENT':
                          if (notification.entityId) {
                            router.push(`/calendar?eventId=${notification.entityId}`)
                          } else {
                            router.push('/calendar')
                          }
                          break
                        case 'ANNOUNCEMENT':
                          if (notification.entityId) {
                            router.push(`/announcements/${notification.entityId}`)
                          } else {
                            router.push('/announcements')
                          }
                          break
                        default:
                          router.push('/dashboard')
                      }
                    }}
                  >
                    <div className="mt-0.5">
                      {notification.type === "EVENT" ? (
                        <Calendar className="h-5 w-5 text-blue-500" />
                      ) : notification.type === "TASK" ? (
                        <CheckSquare className="h-5 w-5 text-green-500" />
                      ) : notification.type === "ASSIGNED" ? (
                        <CheckSquare className="h-5 w-5 text-orange-500" />
                      ) : notification.type === "ANNOUNCEMENT" ? (
                        <Bell className="h-5 w-5 text-yellow-500" />
                      ) : notification.type === "CALL_MISSED" ? (
                        <Phone className="h-5 w-5 text-red-500" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">От: {notification.creatorName}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">Нет новых уведомлений</div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                  <AvatarFallback>{session.user.name ? getInitials(session.user.name) : "U"}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Профиль</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{session.user.name || "Пользователь"}</DropdownMenuLabel>
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                {session.user.email || ""}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/employees/${session.user.id}`}>Профиль</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">Настройки</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/auth/login" })}>Выйти</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  )
}

