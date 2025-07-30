"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, Download, Loader2, ZoomIn, ZoomOut, Plus, Edit, Trash } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

// Типы данных
type GanttTask = {
  id: string
  title: string
  description?: string
  status: "NEW" | "IN_PROGRESS" | "REVIEW" | "COMPLETED"
  priority: "LOW" | "MEDIUM" | "HIGH"
  networkType: "EMVS" | "INTERNET" | "ASZI"
  dueDate?: string
  createdAt: string
  updatedAt: string
  assignee?: {
    id: string
    name: string
    avatar?: string
    initials: string
  }
  creator: {
    id: string
    name: string
    avatar?: string
    initials: string
  }
}

type Project = {
  id: string
  name: string
  description?: string
  status: "ACTIVE" | "COMPLETED" | "SUSPENDED"
  startDate: string
  endDate?: string
  members: {
    id: string
    role: string
    user: {
      id: string
      name: string
      avatar?: string
      initials: string
      position: string
    }
  }[]
}

type User = {
  id: string
  name: string
  position: string
}

// Схема валидации для создания/редактирования задачи
const taskSchema = z.object({
  title: z.string().min(3, "Название должно содержать минимум 3 символа"),
  description: z.string().optional(),
  status: z.enum(["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  networkType: z.enum(["EMVS", "INTERNET", "ASZI"]),
  dueDate: z.string().optional(),
  assigneeId: z.string().optional(),
})

export function ProjectGantt({ projectId }: { projectId?: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<GanttTask[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState("month")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isAddingTask, setIsAddingTask] = useState(false)
  const [isEditingTask, setIsEditingTask] = useState(false)
  const [currentTask, setCurrentTask] = useState<GanttTask | null>(null)

  // Формы
  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "NEW",
      priority: "LOW",
      networkType: "EMVS",
      dueDate: "",
      assigneeId: "",
    },
  })

  const editForm = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "NEW",
      priority: "LOW",
      networkType: "EMVS",
      dueDate: "",
      assigneeId: "",
    },
  })

  useEffect(() => {
    if (projectId) {
      fetchProjectData()
      fetchUsers()
    }
  }, [projectId])

  useEffect(() => {
    if (currentTask) {
      editForm.reset({
        title: currentTask.title,
        description: currentTask.description || "",
        status: currentTask.status,
        priority: currentTask.priority,
        networkType: currentTask.networkType,
        dueDate: currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().split("T")[0] : "",
        assigneeId: currentTask.assignee?.id || "",
      })
    }
  }, [currentTask, editForm])

  const fetchProjectData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Получаем данные проекта
      const projectResponse = await fetch(`/api/projects/${projectId}`)
      if (!projectResponse.ok) {
        throw new Error("Не удалось загрузить данные проекта")
      }
      const projectData = await projectResponse.json()
      setProject(projectData)

      // Получаем задачи проекта
      const tasksResponse = await fetch(`/api/projects/${projectId}/tasks`)
      if (!tasksResponse.ok) {
        throw new Error("Не удалось загрузить задачи проекта")
      }
      const tasksData = await tasksResponse.json()
      setTasks(tasksData)
    } catch (err) {
      console.error("Ошибка при загрузке данных проекта:", err)
      setError("Не удалось загрузить данные проекта")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные проекта",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)
      const response = await fetch("/api/users")
      if (!response.ok) {
        throw new Error("Не удалось загрузить пользователей")
      }
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const createTask = async (data: z.infer<typeof taskSchema>) => {
    if (!session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания задач",
        variant: "destructive",
      })
      return
    }

    setIsAddingTask(true)

    try {
      const response = await fetch(`/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось создать задачу")
      }

      const newTask = await response.json()
      setTasks((prev) => [newTask, ...prev])
      setIsAddingTask(false)
      form.reset()

      toast({
        title: "Успешно",
        description: "Задача успешно создана",
      })
    } catch (err) {
      console.error("Ошибка при создании задачи:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
        variant: "destructive",
      })
    } finally {
      setIsAddingTask(false)
    }
  }

  const updateTask = async (data: z.infer<typeof taskSchema>) => {
    if (!currentTask) return

    setIsEditingTask(true)

    try {
      const response = await fetch(`/api/tasks/${currentTask.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить задачу")
      }

      const updatedTask = await response.json()
      setTasks((prev) => prev.map((task) => (task.id === currentTask.id ? updatedTask : task)))
      setIsEditingTask(false)
      setCurrentTask(null)

      toast({
        title: "Успешно",
        description: "Задача успешно обновлена",
      })
    } catch (err) {
      console.error("Ошибка при обновлении задачи:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить задачу",
        variant: "destructive",
      })
    } finally {
      setIsEditingTask(false)
    }
  }

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить задачу")
      }

      setTasks((prev) => prev.filter((task) => task.id !== taskId))

      toast({
        title: "Успешно",
        description: "Задача успешно удалена",
      })
    } catch (err) {
      console.error("Ошибка при удалении задачи:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить задачу",
        variant: "destructive",
      })
    }
  }

  const handleExportData = () => {
    // Экспорт данных в CSV
    const csvContent = [
      ["ID", "Название", "Описание", "Статус", "Приоритет", "Сеть", "Срок", "Исполнитель", "Создатель"],
      ...tasks.map(task => [
        task.id,
        task.title,
        task.description || "",
        getStatusText(task.status),
        getPriorityText(task.priority),
        getNetworkText(task.networkType),
        task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru-RU") : "",
        task.assignee?.name || "Не назначен",
        task.creator.name
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `project-tasks-${projectId}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "Экспорт завершен",
      description: "Данные успешно экспортированы в CSV",
    })
  }

  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel((prev) => prev + 20)
    }
  }

  const handleZoomOut = () => {
    if (zoomLevel > 60) {
      setZoomLevel((prev) => prev - 20)
    }
  }

  const handlePrevPeriod = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() - 7)
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else if (viewMode === "quarter") {
      newDate.setMonth(newDate.getMonth() - 3)
    }
    setCurrentDate(newDate)
  }

  const handleNextPeriod = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "week") {
      newDate.setDate(newDate.getDate() + 7)
    } else if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else if (viewMode === "quarter") {
      newDate.setMonth(newDate.getMonth() + 3)
    }
    setCurrentDate(newDate)
  }

  const getStatusColor = (status: GanttTask["status"]) => {
    switch (status) {
      case "IN_PROGRESS":
        return "bg-blue-500"
      case "COMPLETED":
        return "bg-green-500"
      case "REVIEW":
        return "bg-yellow-500"
      case "NEW":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = (status: GanttTask["status"]) => {
    switch (status) {
      case "NEW":
        return "Новая"
      case "IN_PROGRESS":
        return "В работе"
      case "REVIEW":
        return "На проверке"
      case "COMPLETED":
        return "Завершена"
      default:
        return status
    }
  }

  const getPriorityText = (priority: GanttTask["priority"]) => {
    switch (priority) {
      case "LOW":
        return "Низкий"
      case "MEDIUM":
        return "Средний"
      case "HIGH":
        return "Высокий"
      default:
        return priority
    }
  }

  const getNetworkText = (network: GanttTask["networkType"]) => {
    switch (network) {
      case "EMVS":
        return "ЕМВС"
      case "INTERNET":
        return "Интернет"
      case "ASZI":
        return "АСЗИ"
      default:
        return network
    }
  }

  // Функция для получения дат в диапазоне для отображения на диаграмме
  const getDatesInRange = () => {
    const dates: Date[] = []
    const startDate = new Date(currentDate)

    // Устанавливаем начало периода
    if (viewMode === "week") {
      startDate.setDate(startDate.getDate() - startDate.getDay()) // Начало недели (воскресенье)
    } else if (viewMode === "month") {
      startDate.setDate(1) // Начало месяца
    } else if (viewMode === "quarter") {
      const quarterMonth = Math.floor(startDate.getMonth() / 3) * 3
      startDate.setMonth(quarterMonth)
      startDate.setDate(1) // Начало квартала
    }

    // Определяем количество дней для отображения
    let daysToShow = 7 // для недели
    if (viewMode === "month") {
      // Получаем количество дней в текущем месяце
      const lastDay = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0)
      daysToShow = lastDay.getDate()
    } else if (viewMode === "quarter") {
      daysToShow = 90 // примерно 3 месяца
    }

    // Заполняем массив дат
    for (let i = 0; i < daysToShow; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      dates.push(date)
    }

    return dates
  }

  // Получаем даты для отображения
  const dates = getDatesInRange()

  // Форматирование даты для отображения
  const formatDate = (date: Date, format: "day" | "month" | "full" = "day") => {
    if (format === "day") {
      return date.getDate().toString()
    } else if (format === "month") {
      return date.toLocaleDateString("ru-RU", { month: "short" })
    } else {
      return date.toLocaleDateString("ru-RU")
    }
  }

  // Определяем ширину ячейки в зависимости от уровня масштабирования
  const cellWidth = Math.max(30, Math.round(30 * (zoomLevel / 100)))

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ошибка</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchProjectData}>Повторить попытку</Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!project) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Нет данных</CardTitle>
          <CardDescription>Данные проекта недоступны</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>{project.name}</CardTitle>
            <CardDescription>Диаграмма Ганта для отслеживания прогресса задач</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={viewMode} onValueChange={setViewMode}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Масштаб" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Неделя</SelectItem>
                <SelectItem value="month">Месяц</SelectItem>
                <SelectItem value="quarter">Квартал</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleExportData}>
              <Download className="h-4 w-4" />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить задачу
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать новую задачу</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о задаче для проекта
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(createTask)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название задачи *</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите название задачи" {...field} />
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
                            <Textarea placeholder="Опишите задачу подробнее" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Статус *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите статус" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="NEW">Новая</SelectItem>
                                <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                                <SelectItem value="REVIEW">На проверке</SelectItem>
                                <SelectItem value="COMPLETED">Завершена</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Приоритет *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите приоритет" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="LOW">Низкий</SelectItem>
                                <SelectItem value="MEDIUM">Средний</SelectItem>
                                <SelectItem value="HIGH">Высокий</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="networkType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Сеть *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите сеть" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="EMVS">ЕМВС</SelectItem>
                                <SelectItem value="INTERNET">Интернет</SelectItem>
                                <SelectItem value="ASZI">АСЗИ</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Срок выполнения</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="assigneeId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Исполнитель</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Выберите исполнителя" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="">Не назначен</SelectItem>
                                {users.map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} - {user.position}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <DialogFooter>
                      <Button type="submit" disabled={isAddingTask}>
                        {isAddingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Создать задачу
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <Button variant="outline" size="sm" onClick={handlePrevPeriod}>
            <ChevronLeft className="h-4 w-4 mr-1" />
            Назад
          </Button>
          <div className="font-medium">
            {viewMode === "week" && `Неделя с ${formatDate(dates[0], "full")}`}
            {viewMode === "month" && `${formatDate(dates[0], "month")} ${dates[0].getFullYear()}`}
            {viewMode === "quarter" && `Квартал ${Math.floor(dates[0].getMonth() / 3) + 1}, ${dates[0].getFullYear()}`}
          </div>
          <Button variant="outline" size="sm" onClick={handleNextPeriod}>
            Вперед
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="gantt-chart" style={{ minWidth: `${dates.length * cellWidth + 400}px` }}>
          {/* Заголовок с датами */}
          <div className="flex">
            <div className="w-[400px] p-2 font-medium border-b border-r">Задача</div>
            <div className="flex flex-1">
              {dates.map((date, index) => (
                <div
                  key={index}
                  className={`text-center border-b border-r p-1 text-xs ${date.getDay() === 0 || date.getDay() === 6 ? "bg-muted" : ""}`}
                  style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                >
                  {formatDate(date)}
                  {index === 0 || date.getDate() === 1 ? (
                    <div className="text-[10px] text-muted-foreground">{formatDate(date, "month")}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          {/* Строки задач */}
          {tasks.length > 0 ? (
            tasks.map((task) => {
              // Вычисляем позицию и ширину полосы задачи
              const taskCreatedDate = new Date(task.createdAt)
              const taskDueDate = task.dueDate ? new Date(task.dueDate) : new Date(taskCreatedDate.getTime() + 7 * 24 * 60 * 60 * 1000) // +7 дней если нет срока

              // Находим индекс начальной и конечной даты в массиве дат
              const startIndex = dates.findIndex(
                (date) =>
                  date.getFullYear() === taskCreatedDate.getFullYear() &&
                  date.getMonth() === taskCreatedDate.getMonth() &&
                  date.getDate() === taskCreatedDate.getDate(),
              )

              const endIndex = dates.findIndex(
                (date) =>
                  date.getFullYear() === taskDueDate.getFullYear() &&
                  date.getMonth() === taskDueDate.getMonth() &&
                  date.getDate() === taskDueDate.getDate(),
              )

              // Если задача не попадает в текущий диапазон дат, пропускаем отрисовку полосы
              const isTaskVisible =
                startIndex !== -1 ||
                endIndex !== -1 ||
                (taskCreatedDate < dates[0] && taskDueDate > dates[dates.length - 1])

              // Вычисляем позицию и ширину полосы
              let barStart = startIndex !== -1 ? startIndex : 0
              let barWidth = endIndex !== -1 ? endIndex - barStart + 1 : dates.length - barStart

              // Если задача начинается до текущего диапазона, но заканчивается в нем
              if (startIndex === -1 && taskCreatedDate < dates[0] && endIndex !== -1) {
                barStart = 0
                barWidth = endIndex + 1
              }

              // Если задача начинается в текущем диапазоне, но заканчивается после него
              if (startIndex !== -1 && endIndex === -1 && taskDueDate > dates[dates.length - 1]) {
                barWidth = dates.length - startIndex
              }

              // Если задача полностью охватывает текущий диапазон
              if (
                startIndex === -1 &&
                endIndex === -1 &&
                taskCreatedDate < dates[0] &&
                taskDueDate > dates[dates.length - 1]
              ) {
                barStart = 0
                barWidth = dates.length
              }

              return (
                <div key={task.id} className="flex border-b">
                  <div className="w-[400px] p-2 border-r">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-medium">{task.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(taskCreatedDate, "full")} - {task.dueDate ? formatDate(taskDueDate, "full") : "Без срока"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getStatusText(task.status)}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {getPriorityText(task.priority)}
                          </Badge>
                          {task.assignee && (
                            <div className="flex items-center gap-1">
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={task.assignee.avatar} alt={task.assignee.name} />
                                <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
                              </Avatar>
                              <span className="text-xs text-muted-foreground">{task.assignee.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => {
                            setCurrentTask(task)
                            setIsEditingTask(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-1 relative">
                    {/* Фон для строки */}
                    {dates.map((date, index) => (
                      <div
                        key={index}
                        className={`border-r ${date.getDay() === 0 || date.getDay() === 6 ? "bg-muted" : ""}`}
                        style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                      />
                    ))}

                    {/* Полоса задачи */}
                    {isTaskVisible && (
                      <div
                        className={`absolute top-1 h-6 rounded ${getStatusColor(task.status)}`}
                        style={{
                          left: `${barStart * cellWidth}px`,
                          width: `${barWidth * cellWidth - 4}px`,
                          opacity: 0.8,
                        }}
                      />
                    )}
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex border-b">
              <div className="w-[400px] p-4 border-r text-center text-muted-foreground">
                Задачи не найдены
              </div>
              <div className="flex flex-1">
                {dates.map((_, index) => (
                  <div
                    key={index}
                    className="border-r"
                    style={{ width: `${cellWidth}px`, minWidth: `${cellWidth}px` }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>

      {/* Диалог редактирования задачи */}
      <Dialog open={isEditingTask} onOpenChange={(open) => !open && setCurrentTask(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Редактировать задачу</DialogTitle>
            <DialogDescription>Измените информацию о задаче</DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(updateTask)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название задачи *</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите название задачи" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Опишите задачу подробнее" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NEW">Новая</SelectItem>
                          <SelectItem value="IN_PROGRESS">В работе</SelectItem>
                          <SelectItem value="REVIEW">На проверке</SelectItem>
                          <SelectItem value="COMPLETED">Завершена</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Приоритет *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите приоритет" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="LOW">Низкий</SelectItem>
                          <SelectItem value="MEDIUM">Средний</SelectItem>
                          <SelectItem value="HIGH">Высокий</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="networkType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сеть *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите сеть" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMVS">ЕМВС</SelectItem>
                          <SelectItem value="INTERNET">Интернет</SelectItem>
                          <SelectItem value="ASZI">АСЗИ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Срок выполнения</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Исполнитель</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите исполнителя" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Не назначен</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name} - {user.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCurrentTask(null)}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isEditingTask}>
                  {isEditingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить изменения
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </Card>
  )
}

