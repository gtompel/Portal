"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, Download, Loader2, ZoomIn, ZoomOut } from "lucide-react"

type GanttTask = {
  id: string
  name: string
  start: Date
  end: Date
  progress: number
  dependencies?: string[]
  assignee?: {
    id: string
    name: string
    avatar?: string
  }
  status: "active" | "completed" | "delayed" | "upcoming"
}

type Project = {
  id: string
  name: string
  tasks: GanttTask[]
}

export function ProjectGantt({ projectId }: { projectId?: string }) {
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState("month")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchProjectData()
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch(`/api/projects/${projectId || 'all'}/gantt`)
      // if (!response.ok) {
      //   throw new Error("Не удалось загрузить данные проекта")
      // }
      // const data = await response.json()

      // Имитируем загрузку данных
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Генерируем тестовые данные
      const today = new Date()
      const mockProject: Project = {
        id: projectId || "project-1",
        name: "Разработка корпоративного портала",
        tasks: [
          {
            id: "task-1",
            name: "Планирование проекта",
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 30),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 25),
            progress: 100,
            status: "completed",
          },
          {
            id: "task-2",
            name: "Дизайн интерфейса",
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 25),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15),
            progress: 100,
            dependencies: ["task-1"],
            status: "completed",
          },
          {
            id: "task-3",
            name: "Разработка бэкенда",
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 20),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
            progress: 65,
            dependencies: ["task-1"],
            status: "active",
          },
          {
            id: "task-4",
            name: "Разработка фронтенда",
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 15),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 15),
            progress: 40,
            dependencies: ["task-2", "task-3"],
            status: "active",
          },
          {
            id: "task-5",
            name: "Тестирование",
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 10),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20),
            progress: 0,
            dependencies: ["task-3", "task-4"],
            status: "upcoming",
          },
          {
            id: "task-6",
            name: "Развертывание",
            start: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 20),
            end: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 25),
            progress: 0,
            dependencies: ["task-5"],
            status: "upcoming",
          },
        ],
      }

      setProject(mockProject)
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

  const handleExportData = () => {
    // В реальном приложении здесь был бы код для экспорта данных в CSV или Excel
    toast({
      title: "Экспорт данных",
      description: "Функция экспорта данных будет реализована позже",
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
      case "active":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "delayed":
        return "bg-red-500"
      case "upcoming":
        return "bg-gray-400"
      default:
        return "bg-gray-400"
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
            <CardDescription>Диаграмма Ганта для отслеживания прогресса</CardDescription>
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

        <div className="gantt-chart" style={{ minWidth: `${dates.length * cellWidth + 300}px` }}>
          {/* Заголовок с датами */}
          <div className="flex">
            <div className="w-[300px] p-2 font-medium border-b border-r">Задача</div>
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
          {project.tasks.map((task, taskIndex) => {
            // Вычисляем позицию и ширину полосы задачи
            const taskStartDate = new Date(task.start)
            const taskEndDate = new Date(task.end)

            // Находим индекс начальной и конечной даты в массиве дат
            const startIndex = dates.findIndex(
              (date) =>
                date.getFullYear() === taskStartDate.getFullYear() &&
                date.getMonth() === taskStartDate.getMonth() &&
                date.getDate() === taskStartDate.getDate(),
            )

            const endIndex = dates.findIndex(
              (date) =>
                date.getFullYear() === taskEndDate.getFullYear() &&
                date.getMonth() === taskEndDate.getMonth() &&
                date.getDate() === taskEndDate.getDate(),
            )

            // Если задача не попадает в текущий диапазон дат, пропускаем отрисовку полосы
            const isTaskVisible =
              startIndex !== -1 ||
              endIndex !== -1 ||
              (taskStartDate < dates[0] && taskEndDate > dates[dates.length - 1])

            // Вычисляем позицию и ширину полосы
            let barStart = startIndex !== -1 ? startIndex : 0
            let barWidth = endIndex !== -1 ? endIndex - barStart + 1 : dates.length - barStart

            // Если задача начинается до текущего диапазона, но заканчивается в нем
            if (startIndex === -1 && taskStartDate < dates[0] && endIndex !== -1) {
              barStart = 0
              barWidth = endIndex + 1
            }

            // Если задача начинается в текущем диапазоне, но заканчивается после него
            if (startIndex !== -1 && endIndex === -1 && taskEndDate > dates[dates.length - 1]) {
              barWidth = dates.length - startIndex
            }

            // Если задача полностью охватывает текущий диапазон
            if (
              startIndex === -1 &&
              endIndex === -1 &&
              taskStartDate < dates[0] &&
              taskEndDate > dates[dates.length - 1]
            ) {
              barStart = 0
              barWidth = dates.length
            }

            return (
              <div key={task.id} className="flex border-b">
                <div className="w-[300px] p-2 border-r flex items-center">
                  <div className="flex-1">
                    <div className="font-medium">{task.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(task.start, "full")} - {formatDate(task.end, "full")}
                    </div>
                  </div>
                  <div className="ml-2 text-xs">{task.progress}%</div>
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
                    >
                      <div
                        className="h-full bg-white rounded-l"
                        style={{
                          width: `${100 - task.progress}%`,
                          float: "right",
                          opacity: 0.7,
                        }}
                      />
                    </div>
                  )}

                  {/* Зависимости (стрелки) */}
                  {task.dependencies?.map((depId) => {
                    const depTask = project.tasks.find((t) => t.id === depId)
                    if (!depTask) return null

                    // Здесь должна быть логика отрисовки стрелок зависимостей,
                    // но это сложно реализовать в простом CSS, обычно используются
                    // специализированные библиотеки для диаграмм Ганта
                    return null
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

