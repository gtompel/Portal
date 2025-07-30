"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, ChevronRight, Download, Loader2, ZoomIn, ZoomOut } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

// Типы данных
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
  createdAt: string
  updatedAt: string
}

export function ProjectsGantt() {
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState("month")
  const [zoomLevel, setZoomLevel] = useState(100)
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/projects")
      if (!response.ok) {
        throw new Error("Не удалось загрузить проекты")
      }

      const data = await response.json()
      setProjects(data)
    } catch (err) {
      console.error("Ошибка при загрузке проектов:", err)
      setError("Не удалось загрузить проекты")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить проекты",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleExportData = () => {
    // Экспорт данных в CSV
    const csvContent = [
      ["ID", "Название", "Описание", "Статус", "Дата начала", "Дата окончания", "Участники"],
      ...projects.map(project => [
        project.id,
        project.name,
        project.description || "",
        getStatusText(project.status),
        new Date(project.startDate).toLocaleDateString("ru-RU"),
        project.endDate ? new Date(project.endDate).toLocaleDateString("ru-RU") : "",
        project.members.map(m => m.user.name).join(", ")
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `projects-gantt.csv`)
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

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-blue-500"
      case "COMPLETED":
        return "bg-green-500"
      case "SUSPENDED":
        return "bg-yellow-500"
      default:
        return "bg-gray-400"
    }
  }

  const getStatusText = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "Активный"
      case "COMPLETED":
        return "Завершен"
      case "SUSPENDED":
        return "Приостановлен"
      default:
        return status
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
          <Button onClick={fetchProjects}>Повторить попытку</Button>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle>Диаграмма Ганта проектов</CardTitle>
            <CardDescription>Визуализация сроков и статусов всех проектов</CardDescription>
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

        <div className="gantt-chart" style={{ minWidth: `${dates.length * cellWidth + 400}px` }}>
          {/* Заголовок с датами */}
          <div className="flex">
            <div className="w-[400px] p-2 font-medium border-b border-r">Проект</div>
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

          {/* Строки проектов */}
          {projects.length > 0 ? (
            projects.map((project) => {
              // Вычисляем позицию и ширину полосы проекта
              const projectStartDate = new Date(project.startDate)
              const projectEndDate = project.endDate ? new Date(project.endDate) : new Date(projectStartDate.getTime() + 30 * 24 * 60 * 60 * 1000) // +30 дней если нет срока

              // Находим индекс начальной и конечной даты в массиве дат
              const startIndex = dates.findIndex(
                (date) =>
                  date.getFullYear() === projectStartDate.getFullYear() &&
                  date.getMonth() === projectStartDate.getMonth() &&
                  date.getDate() === projectStartDate.getDate(),
              )

              const endIndex = dates.findIndex(
                (date) =>
                  date.getFullYear() === projectEndDate.getFullYear() &&
                  date.getMonth() === projectEndDate.getMonth() &&
                  date.getDate() === projectEndDate.getDate(),
              )

              // Если проект не попадает в текущий диапазон дат, пропускаем отрисовку полосы
              const isProjectVisible =
                startIndex !== -1 ||
                endIndex !== -1 ||
                (projectStartDate < dates[0] && projectEndDate > dates[dates.length - 1])

              // Вычисляем позицию и ширину полосы
              let barStart = startIndex !== -1 ? startIndex : 0
              let barWidth = endIndex !== -1 ? endIndex - barStart + 1 : dates.length - barStart

              // Если проект начинается до текущего диапазона, но заканчивается в нем
              if (startIndex === -1 && projectStartDate < dates[0] && endIndex !== -1) {
                barStart = 0
                barWidth = endIndex + 1
              }

              // Если проект начинается в текущем диапазоне, но заканчивается после него
              if (startIndex !== -1 && endIndex === -1 && projectEndDate > dates[dates.length - 1]) {
                barWidth = dates.length - startIndex
              }

              // Если проект полностью охватывает текущий диапазон
              if (
                startIndex === -1 &&
                endIndex === -1 &&
                projectStartDate < dates[0] &&
                projectEndDate > dates[dates.length - 1]
              ) {
                barStart = 0
                barWidth = dates.length
              }

              return (
                <div key={project.id} className="flex border-b">
                  <div className="w-[400px] p-2 border-r">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                          {project.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(projectStartDate, "full")} - {project.endDate ? formatDate(projectEndDate, "full") : "Без срока"}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {getStatusText(project.status)}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {project.members.length} участников
                          </span>
                        </div>
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

                    {/* Полоса проекта */}
                    {isProjectVisible && (
                      <div
                        className={`absolute top-1 h-6 rounded ${getStatusColor(project.status)}`}
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
                Проекты не найдены
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
    </Card>
  )
} 