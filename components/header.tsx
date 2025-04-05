"use client"

import { useState, useEffect } from "react"
import { Bell, Search, Settings, Calendar, CheckSquare, MessageSquare } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

type Notification = {
  id: string
  type: "EVENT" | "TASK" | "MESSAGE"
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
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [tasks, setTasks] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [messages, setMessages] = useState<any[]>([])

  // Fetch data on component mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotificationData()
    }
  }, [session])

  // Загрузка данных для уведомлений
  const fetchNotificationData = async () => {
    try {
      if (!session?.user?.id) return

      // Загружаем задачи
      const tasksResponse = await fetch("/api/tasks")
      if (tasksResponse.ok) {
        const tasksData = await tasksResponse.json()
        setTasks(tasksData)
      }

      // Загружаем события
      const eventsResponse = await fetch("/api/events")
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json()
        setEvents(eventsData)
      }

      // Загружаем сообщения
      const messagesResponse = await fetch(`/api/messages?receiverId=${session.user.id}`)
      if (messagesResponse.ok) {
        const messagesData = await messagesResponse.json()
        setMessages(messagesData)
      }

      // Создаем уведомления на основе полученных данных
      generateNotifications()
    } catch (error) {
      console.error("Ошибка при загрузке данных для уведомлений:", error)
    }
  }

  // Генерация уведомлений на основе данных
  const generateNotifications = () => {
    const now = new Date()
    const threeDaysFromNow = new Date(now)
    threeDaysFromNow.setDate(now.getDate() + 3)

    // Уведомления о предстоящих событиях
    const eventNotifications = events
      .filter((event) => {
        const eventDate = new Date(event.date)
        return eventDate >= now && eventDate <= threeDaysFromNow
      })
      .map((event) => ({
        id: `event-${event.id}`,
        type: "EVENT" as const,
        title: event.title,
        description: `Событие состоится ${new Date(event.date).toLocaleDateString("ru-RU")} в ${event.startTime}`,
        date: event.date,
        createdAt: event.createdAt || now.toISOString(),
        read: false,
        entityId: event.id,
        creatorName: event.creator?.name || "Система",
      }))

    // Уведомления о задачах с приближающимся сроком
    const taskNotifications = tasks
      .filter((task) => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)
        return dueDate >= now && dueDate <= threeDaysFromNow && task.status !== "COMPLETED"
      })
      .map((task) => ({
        id: `task-${task.id}`,
        type: "TASK" as const,
        title: task.title,
        description: `Срок выполнения задачи: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru-RU") : "Не указан"}`,
        date: task.dueDate,
        createdAt: task.createdAt || now.toISOString(),
        read: false,
        entityId: task.id,
        creatorName: task.creator?.name || "Система",
      }))

    // Уведомления о непрочитанных сообщениях
    const messageNotifications = messages
      .filter((message) => !message.read)
      .map((message) => ({
        id: `message-${message.id}`,
        type: "MESSAGE" as const,
        title: `Сообщение от ${message.sender.name}`,
        description: message.content.length > 50 ? `${message.content.substring(0, 50)}...` : message.content,
        date: null,
        createdAt: message.createdAt || now.toISOString(),
        read: false,
        entityId: message.id,
        creatorName: message.sender.name,
      }))

    // Если данных нет, добавляем демо-уведомления
    const demoNotifications: Notification[] = []
    if (eventNotifications.length === 0 && taskNotifications.length === 0 && messageNotifications.length === 0) {
      demoNotifications.push(
        {
          id: "event-demo-1",
          type: "EVENT",
          title: "Встреча команды",
          description: "Событие состоится 15.05.2025 в 14:00",
          date: "2025-05-15T14:00:00",
          createdAt: new Date().toISOString(),
          read: false,
          entityId: "demo-1",
          creatorName: "Администратор",
        },
        {
          id: "task-demo-1",
          type: "TASK",
          title: "Завершить отчет",
          description: "Срок выполнения задачи: 10.05.2025",
          date: "2025-05-10T18:00:00",
          createdAt: new Date().toISOString(),
          read: false,
          entityId: "demo-2",
          creatorName: "Руководитель проекта",
        },
        {
          id: "message-demo-1",
          type: "MESSAGE",
          title: "Новое сообщение",
          description: "Добрый день! Хотел уточнить детали по проекту...",
          date: null,
          createdAt: new Date().toISOString(),
          read: false,
          entityId: "demo-3",
          creatorName: "Иван Петров",
        },
      )
    }

    // Объединяем и сортируем уведомления по дате создания (сначала новые)
    const allNotifications = [
      ...eventNotifications,
      ...taskNotifications,
      ...messageNotifications,
      ...demoNotifications,
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10) // Ограничиваем количество уведомлений

    setNotifications(allNotifications)
    setUnreadCount(allNotifications.length)
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })))
    setUnreadCount(0)
  }

  // Извлекаем инициалы из имени пользователя
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="hidden md:flex md:flex-1">
        <form className="w-full max-w-lg">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск..."
              className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
            />
          </div>
        </form>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4 md:gap-2 lg:gap-4">
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
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Отметить все как прочитанные
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
                      {notification.type === "EVENT" ? (
                        <Calendar className="h-5 w-5 text-blue-500" />
                      ) : notification.type === "TASK" ? (
                        <CheckSquare className="h-5 w-5 text-green-500" />
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
        <Button variant="outline" size="icon" className="rounded-full" asChild>
          <Link href="/settings">
            <Settings className="h-4 w-4" />
            <span className="sr-only">Настройки</span>
          </Link>
        </Button>
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

