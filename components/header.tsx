"use client"

import { useState, useEffect } from "react"
import { Bell, Search, Settings, Calendar, CheckSquare } from "lucide-react"
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
  type: "event" | "task"
  title: string
  date: string
  read: boolean
}

export default function Header() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications on component mount
  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications()
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      // Fetch upcoming events
      const eventsResponse = await fetch("/api/events")
      const events = await eventsResponse.json()

      // Fetch tasks with upcoming deadlines
      const tasksResponse = await fetch("/api/tasks")
      const tasks = await tasksResponse.json()

      // Create notifications from events and tasks
      const eventNotifications = events
        .filter((event: any) => {
          // Filter events that are coming up in the next 3 days
          const eventDate = new Date(event.date)
          const today = new Date()
          const threeDaysFromNow = new Date()
          threeDaysFromNow.setDate(today.getDate() + 3)
          return eventDate >= today && eventDate <= threeDaysFromNow
        })
        .map((event: any) => ({
          id: `event-${event.id}`,
          type: "event" as const,
          title: event.title,
          date: new Date(event.date).toLocaleDateString("ru-RU"),
          read: false,
        }))

      const taskNotifications = tasks
        .filter((task: any) => {
          // Filter tasks with upcoming deadlines
          if (!task.dueDate) return false
          const dueDate = new Date(task.dueDate)
          const today = new Date()
          const threeDaysFromNow = new Date()
          threeDaysFromNow.setDate(today.getDate() + 3)
          return dueDate >= today && dueDate <= threeDaysFromNow && task.status !== "COMPLETED"
        })
        .map((task: any) => ({
          id: `task-${task.id}`,
          type: "task" as const,
          title: task.title,
          date: new Date(task.dueDate).toLocaleDateString("ru-RU"),
          read: false,
        }))

      const allNotifications = [...eventNotifications, ...taskNotifications]
      setNotifications(allNotifications)
      setUnreadCount(allNotifications.length)
    } catch (error) {
      console.error("Error fetching notifications:", error)
    }
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
                      {notification.type === "event" ? (
                        <Calendar className="h-5 w-5 text-blue-500" />
                      ) : (
                        <CheckSquare className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {notification.type === "event" ? "Событие" : "Задача"}: {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground">Дата: {notification.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">Нет новых уведомлений</div>
              )}
            </div>
          </PopoverContent>
        </Popover>
        <Button variant="outline" size="icon" className="rounded-full">
          <Settings className="h-4 w-4" />
          <span className="sr-only">Настройки</span>
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

