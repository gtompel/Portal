"use client"

import { useState, useEffect } from "react"
import { Bell, MessageSquare, CheckCheck } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/hooks/use-toast"

type MessageNotification = {
  id: string
  type: "MESSAGE"
  title: string
  description: string
  createdAt: string
  read: boolean
  entityId: string
  creatorName: string
}

export function MessageNotifications() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<MessageNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isBatchLoading, setIsBatchLoading] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/notifications?userId=${session?.user?.id}`)
      if (response.ok) {
        const data = await response.json()
        const messageNotifications = data.filter((n: any) => n.type === "MESSAGE")
        setNotifications(messageNotifications)
        setUnreadCount(messageNotifications.filter((n: MessageNotification) => !n.read).length)
      }
    } catch (error) {
      console.error("Ошибка загрузки уведомлений:", error)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/mark-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: [notificationId],
        }),
      })

      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Ошибка отметки уведомления как прочитанного:", error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
      if (unreadIds.length === 0) return

      setIsBatchLoading(true)
      const response = await fetch(`/api/notifications/mark-read`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notificationIds: unreadIds,
        }),
      })

      if (response.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
        toast({
          title: "Успешно",
          description: "Все уведомления отмечены как прочитанные",
        })
      }
    } catch (error) {
      console.error("Ошибка отметки всех уведомлений:", error)
    } finally {
      setIsBatchLoading(false)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="rounded-full relative">
          <MessageSquare className="h-4 w-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Уведомления о сообщениях</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-medium">Уведомления о сообщениях</h4>
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
                className={`p-4 border-b flex items-start gap-3 ${notification.read ? "opacity-70" : "bg-muted/30"}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="mt-0.5">
                  <MessageSquare className="h-5 w-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm font-medium">{notification.title}</p>
                  <p className="text-xs text-muted-foreground">{notification.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">От: {notification.creatorName}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-muted-foreground">Нет уведомлений о сообщениях</div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 