import { useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

interface Notification {
  id: string
  type: string
  read: boolean
  createdAt: string
  eventId?: string
  taskId?: string
  messageId?: string
  announcementId?: string
}

interface BatchResult {
  marked?: string | number
  notifications?: Notification[]
  count?: number
  migrated?: number
}

export function useNotificationsBatch() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const executeBatchOperation = useCallback(async (
    action: string,
    data?: any
  ): Promise<BatchResult | null> => {
    if (!session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Необходима авторизация",
        variant: "destructive"
      })
      return null
    }

    setIsLoading(true)
    try {
      const response = await fetch("/api/notifications/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          ...data
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      // Показываем уведомление об успехе
      switch (action) {
        case "mark_read":
          if (result.marked === "all") {
            toast({
              title: "Успешно",
              description: "Все уведомления отмечены как прочитанные"
            })
          } else if (typeof result.marked === "number") {
            toast({
              title: "Успешно",
              description: `Отмечено ${result.marked} уведомлений как прочитанные`
            })
          }
          break
        case "migrate":
          if (result.migrated > 0) {
            toast({
              title: "Успешно",
              description: `Создано ${result.migrated} уведомлений`
            })
          } else {
            toast({
              title: "Информация",
              description: "Новых уведомлений для создания нет"
            })
          }
          break
        case "sync":
          if (result.count > 0) {
            toast({
              title: "Синхронизация",
              description: `Получено ${result.count} новых уведомлений`
            })
          }
          break
      }

      return result
    } catch (error) {
      console.error("Batch operation error:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось выполнить операцию",
        variant: "destructive"
      })
      return null
    } finally {
      setIsLoading(false)
    }
  }, [session?.user?.id, toast])

  const markAllAsRead = useCallback(() => {
    return executeBatchOperation("mark_read", { markAll: true })
  }, [executeBatchOperation])

  const markSelectedAsRead = useCallback((notificationIds: string[]) => {
    return executeBatchOperation("mark_read", { notificationIds })
  }, [executeBatchOperation])

  const syncNotifications = useCallback((lastSync?: string) => {
    return executeBatchOperation("sync", { lastSync })
  }, [executeBatchOperation])

  const migrateNotifications = useCallback(() => {
    return executeBatchOperation("migrate")
  }, [executeBatchOperation])

  return {
    isLoading,
    markAllAsRead,
    markSelectedAsRead,
    syncNotifications,
    migrateNotifications,
    executeBatchOperation
  }
} 