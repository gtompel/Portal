"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users, CalendarIcon, Loader2 } from "lucide-react"
import { ru } from "date-fns/locale"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

type Event = {
  id: string
  title: string
  description: string
  date: Date
  startTime: string
  endTime: string
  location: string
  type: "MEETING" | "DEADLINE" | "HOLIDAY" | "VACATION"
  participants: {
    id: string
    user: {
      id: string
      name: string
      avatar?: string
      initials: string
    }
    status: string
  }[]
  creator: {
    id: string
    name: string
    avatar?: string
    initials: string
  }
}

type Task = {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate: string
  assignee?: {
    id: string
    name: string
  }
}

type User = {
  id: string
  name: string
}

export function EventCalendar() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<"month" | "day">("month")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Форма создания события
  const eventSchema = z.object({
    title: z.string().min(3, "Название должно содержать минимум 3 символа"),
    description: z.string().optional(),
    date: z.date(),
    startTime: z.string().min(1, "Укажите время начала"),
    endTime: z.string().min(1, "Укажите время окончания"),
    location: z.string().optional(),
    type: z.enum(["MEETING", "DEADLINE", "HOLIDAY", "VACATION"]),
    participants: z.array(z.string()).optional(),
  })

  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      date: new Date(),
      startTime: "09:00",
      endTime: "10:00",
      location: "",
      type: "MEETING",
      participants: [],
    },
  })

  useEffect(() => {
    fetchEvents()
    fetchTasks()
    fetchUsers()
  }, [])

  const fetchEvents = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/events")

      if (!response.ok) {
        throw new Error("Не удалось загрузить события")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedEvents = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.description || "",
        date: new Date(item.date),
        startTime: item.startTime,
        endTime: item.endTime,
        location: item.location || "",
        type: item.type,
        participants: item.participants || [],
        creator: item.creator || {
          id: "unknown",
          name: "Неизвестный пользователь",
          initials: "НП",
        },
      }))

      setEvents(formattedEvents)
    } catch (err) {
      //console.error("Ошибка при загрузке событий:", err)
      setError("Не удалось загрузить события")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTasks = async () => {
    try {
      const response = await fetch("/api/tasks")

      if (!response.ok) {
        throw new Error("Не удалось загрузить задачи")
      }

      const data = await response.json()

      // Фильтруем задачи с установленной датой выполнения
      const tasksWithDueDate = data
        .filter((task: any) => task.dueDate)
        .map((task: any) => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate,
          assignee: task.assignee,
        }))

      setTasks(tasksWithDueDate)
    } catch (err) {
      console.error("Ошибка при загрузке задач:", err)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")

      if (!response.ok) {
        throw new Error("Не удалось загрузить пользователей")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedUsers = data.map((item: any) => ({
        id: item.id,
        name: item.name,
      }))

      setUsers(formattedUsers)
    } catch (err) {
     // console.error("Ошибка при загрузке пользователей:", err)
    }
  }

  const createEvent = async (data: z.infer<typeof eventSchema>) => {
    if (!session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания событий",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || "",
          date: data.date.toISOString(),
          startTime: data.startTime,
          endTime: data.endTime,
          location: data.location || "",
          type: data.type,
          creatorId: session.user.id,
          participants: data.participants || [],
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось создать событие")
      }

      const newEvent = await response.json()

      // Добавляем новое событие в список
      const formattedEvent: Event = {
        id: newEvent.id,
        title: newEvent.title,
        description: newEvent.description || "",
        date: new Date(newEvent.date),
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        location: newEvent.location || "",
        type: newEvent.type,
        participants: newEvent.participants || [],
        creator: {
          id: session.user.id,
          name: session.user.name || "Пользователь",
          initials: getInitials(session.user.name || "Пользователь"),
        },
      }

      setEvents((prev) => [...prev, formattedEvent])

      toast({
        title: "Успешно",
        description: "Событие успешно создано",
      })

      form.reset()
    } catch (err) {
      //console.error("Ошибка при создании события:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать событие",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setView("day")
    }
  }

  const handleBackToMonth = () => {
    setView("month")
  }

  // Получаем события и задачи для выбранной даты
  const getEventsAndTasksForDate = (date: Date) => {
    const eventsForDate = events.filter(
      (event) =>
        event.date.getDate() === date.getDate() &&
        event.date.getMonth() === date.getMonth() &&
        event.date.getFullYear() === date.getFullYear(),
    )

    const tasksForDate = tasks.filter((task) => {
      if (!task.dueDate) return false
      const dueDate = new Date(task.dueDate)
      return (
        dueDate.getDate() === date.getDate() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getFullYear() === date.getFullYear()
      )
    })

    return { events: eventsForDate, tasks: tasksForDate }
  }

  // Получаем все даты, на которые есть события или задачи
  const getDaysWithEventsOrTasks = () => {
    const eventDates = events.map((event) => event.date)

    const taskDates = tasks.filter((task) => task.dueDate).map((task) => new Date(task.dueDate))

    return [...eventDates, ...taskDates]
  }

  const getEventTypeColor = (type: Event["type"]) => {
    switch (type) {
      case "MEETING":
        return "bg-blue-100 text-blue-800"
      case "DEADLINE":
        return "bg-red-100 text-red-800"
      case "HOLIDAY":
        return "bg-green-100 text-green-800"
      case "VACATION":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getEventTypeText = (type: Event["type"]) => {
    switch (type) {
      case "MEETING":
        return "встреча"
      case "DEADLINE":
        return "дедлайн"
      case "HOLIDAY":
        return "праздник"
      case "VACATION":
        return "отпуск"
      default:
        return String(type).toLowerCase()
    }
  }

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "LOW":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTaskPriorityText = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "высокий"
      case "MEDIUM":
        return "средний"
      case "LOW":
        return "низкий"
      default:
        return priority.toLowerCase()
    }
  }

  // Функция для получения инициалов из имени
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ]

  const currentMonthName = monthNames[date.getMonth()]
  const currentYear = date.getFullYear()

  const handlePrevMonth = () => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() - 1)
    setDate(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() + 1)
    setDate(newDate)
  }

  const daysWithEventsOrTasks = getDaysWithEventsOrTasks()
  const { events: eventsForSelectedDate, tasks: tasksForSelectedDate } = getEventsAndTasksForDate(selectedDate)

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <Button onClick={fetchEvents} className="mt-2">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {view === "day" && (
            <Button variant="outline" size="sm" onClick={handleBackToMonth}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад к календарю
            </Button>
          )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Новое событие</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новое событие</DialogTitle>
              <DialogDescription>Заполните информацию о событии</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(createEvent)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название события" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип события *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="MEETING">Встреча</SelectItem>
                          <SelectItem value="DEADLINE">Дедлайн</SelectItem>
                          <SelectItem value="HOLIDAY">Праздник</SelectItem>
                          <SelectItem value="VACATION">Отпуск</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Дата *</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            value={field.value ? field.value.toISOString().split("T")[0] : ""}
                            onChange={(e) => {
                              const date = e.target.value ? new Date(e.target.value) : new Date()
                              field.onChange(date)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-2">
                    <FormLabel>Время *</FormLabel>
                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <span className="flex items-center">-</span>
                      <FormField
                        control={form.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Место</FormLabel>
                      <FormControl>
                        <Input placeholder="Укажите место проведения" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Опишите событие подробнее" rows={3} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="participants"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Участники</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const currentValues = field.value || []
                          if (!currentValues.includes(value)) {
                            field.onChange([...currentValues, value])
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите участников" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {field.value && field.value.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {field.value.map((userId) => {
                            const user = users.find((u) => u.id === userId)
                            return user ? (
                              <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                {user.name}
                                <button
                                  type="button"
                                  onClick={() => {
                                    field.onChange(field.value?.filter((id) => id !== userId))
                                  }}
                                  className="ml-1 rounded-full hover:bg-muted p-1"
                                >
                                  ✕
                                </button>
                              </Badge>
                            ) : null
                          })}
                        </div>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Создание...
                      </>
                    ) : (
                      "Создать событие"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {view === "month" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>
                {currentMonthName} {currentYear}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border"
              locale={ru}
              modifiers={{
                hasEvent: daysWithEventsOrTasks,
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  color: "var(--primary)",
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {view === "day" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate.toLocaleDateString("ru-RU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <CardDescription>
                {eventsForSelectedDate.length + tasksForSelectedDate.length}{" "}
                {eventsForSelectedDate.length + tasksForSelectedDate.length === 1
                  ? "событие"
                  : eventsForSelectedDate.length + tasksForSelectedDate.length >= 2 &&
                      eventsForSelectedDate.length + tasksForSelectedDate.length <= 4
                    ? "события"
                    : "событий"}
              </CardDescription>
            </CardHeader>
          </Card>

          {eventsForSelectedDate.length > 0 || tasksForSelectedDate.length > 0 ? (
            <div className="space-y-4">
              {/* События */}
              {eventsForSelectedDate.length > 0 && (
                <>
                  <h3 className="text-lg font-medium">События</h3>
                  {eventsForSelectedDate.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{event.title}</CardTitle>
                            <CardDescription>
                              {event.startTime} - {event.endTime}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className={getEventTypeColor(event.type)}>
                            {getEventTypeText(event.type)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="mb-4">{event.description}</p>
                        <div className="grid gap-2">
                          {event.location && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            <span>
                              {event.startTime} - {event.endTime}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              {event.participants.length > 0
                                ? event.participants.map((p) => p.user.name).join(", ")
                                : "Нет участников"}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">
                          Редактировать
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </>
              )}

              {/* Задачи */}
              {tasksForSelectedDate.length > 0 && (
                <>
                  <h3 className="text-lg font-medium">Задачи</h3>
                  {tasksForSelectedDate.map((task) => (
                    <Card key={task.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{task.title}</CardTitle>
                            <CardDescription>
                              Срок: {new Date(task.dueDate).toLocaleDateString("ru-RU")}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className={getTaskPriorityColor(task.priority)}>
                            Приоритет: {getTaskPriorityText(task.priority)}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-2">
                        <p className="mb-4">{task.description || "Описание отсутствует"}</p>
                        <div className="grid gap-2">
                          {task.assignee && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>Исполнитель: {task.assignee.name}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button variant="outline" className="w-full">
                          Перейти к задаче
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">На этот день нет событий</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Создать событие</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Создать новое событие</DialogTitle>
                      <DialogDescription>Заполните информацию о событии</DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(createEvent)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Название *</FormLabel>
                              <FormControl>
                                <Input placeholder="Введите название события" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Тип события *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите тип" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="MEETING">Встреча</SelectItem>
                                  <SelectItem value="DEADLINE">Дедлайн</SelectItem>
                                  <SelectItem value="HOLIDAY">Праздник</SelectItem>
                                  <SelectItem value="VACATION">Отпуск</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Дата *</FormLabel>
                                <FormControl>
                                  <Input
                                    type="date"
                                    value={selectedDate.toISOString().split("T")[0]}
                                    onChange={(e) => {
                                      const date = e.target.value ? new Date(e.target.value) : selectedDate
                                      field.onChange(date)
                                    }}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <div className="grid gap-2">
                            <FormLabel>Время *</FormLabel>
                            <div className="flex gap-2">
                              <FormField
                                control={form.control}
                                name="startTime"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <span className="flex items-center">-</span>
                              <FormField
                                control={form.control}
                                name="endTime"
                                render={({ field }) => (
                                  <FormItem className="flex-1">
                                    <FormControl>
                                      <Input type="time" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>

                        <FormField
                          control={form.control}
                          name="location"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Место</FormLabel>
                              <FormControl>
                                <Input placeholder="Укажите место проведения" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Описание</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Опишите событие подробнее" rows={3} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="participants"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Участники</FormLabel>
                              <Select
                                onValueChange={(value) => {
                                  const currentValues = field.value || []
                                  if (!currentValues.includes(value)) {
                                    field.onChange([...currentValues, value])
                                  }
                                }}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Выберите участников" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                      {user.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {field.value && field.value.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {field.value.map((userId) => {
                                    const user = users.find((u) => u.id === userId)
                                    return user ? (
                                      <Badge key={userId} variant="secondary" className="flex items-center gap-1">
                                        {user.name}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            field.onChange(field.value?.filter((id) => id !== userId))
                                          }}
                                          className="ml-1 rounded-full hover:bg-muted p-1"
                                        >
                                          ✕
                                        </button>
                                      </Badge>
                                    ) : null
                                  })}
                                </div>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <DialogFooter>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Создание...
                              </>
                            ) : (
                              "Создать событие"
                            )}
                          </Button>
                        </DialogFooter>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

