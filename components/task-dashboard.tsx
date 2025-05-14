"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Download } from "lucide-react"
import {
  AreaChart,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  Bar,
} from "recharts"

type TaskStatus = "NEW" | "IN_PROGRESS" | "REVIEW" | "COMPLETED"
type TaskPriority = "LOW" | "MEDIUM" | "HIGH"

type TaskStats = {
  total: number
  completed: number
  inProgress: number
  overdue: number
  completionRate: number
  averageCompletionTime: number // в днях
}

type TasksByStatus = {
  name: string
  value: number
  color: string
}

type TasksByPriority = {
  name: string
  value: number
  color: string
}

type TasksByProject = {
  name: string
  value: number
}

type TasksOverTime = {
  date: string
  created: number
  completed: number
}

type TasksByAssignee = {
  name: string
  completed: number
  inProgress: number
  overdue: number
}

export function TaskDashboard() {
  const { toast } = useToast()
  const [period, setPeriod] = useState("month")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<TaskStats | null>(null)
  const [tasksByStatus, setTasksByStatus] = useState<TasksByStatus[]>([])
  const [tasksByPriority, setTasksByPriority] = useState<TasksByPriority[]>([])
  const [tasksByProject, setTasksByProject] = useState<TasksByProject[]>([])
  const [tasksOverTime, setTasksOverTime] = useState<TasksOverTime[]>([])
  const [tasksByAssignee, setTasksByAssignee] = useState<TasksByAssignee[]>([])

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Запрос к API для получения данных
      const response = await fetch(`/api/analytics/tasks?period=${period}`)
      if (!response.ok) {
        throw new Error("Не удалось загрузить данные")
      }
      const data = await response.json()

      setStats(data.stats)
      setTasksByStatus(data.tasksByStatus)
      setTasksByPriority(data.tasksByPriority)
      setTasksByProject(data.tasksByProject)
      setTasksOverTime(data.tasksOverTime)
      setTasksByAssignee(data.tasksByAssignee)
    } catch (err) {
      //console.error("Ошибка при загрузке данных:", err)
      setError("Не удалось загрузить данные")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные",
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

  // Форматирование даты для отображения на графике
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "short" })
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ошибка</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={fetchData}>Повторить попытку</Button>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-[120px]" />
            ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array(2)
            .fill(0)
            .map((_, i) => (
              <Skeleton key={i} className="h-[300px]" />
            ))}
        </div>
        <Skeleton className="h-[400px]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Tabs defaultValue="overview" className="w-full sm:w-auto">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="performance">Производительность</TabsTrigger>
            <TabsTrigger value="projects">Проекты</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="quarter">Квартал</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Завершено: {stats.completed} ({Math.round(stats.completionRate)}%)
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">В работе</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.inProgress / stats.total) * 100).toFixed(1)}% от общего числа
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Просроченные</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.overdue}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.overdue / stats.total) * 100).toFixed(1)}% от общего числа
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Среднее время выполнения</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.averageCompletionTime.toFixed(1)} дн.</div>
              <p className="text-xs text-muted-foreground">За выбранный период</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Задачи по статусу</CardTitle>
            <CardDescription>Распределение задач по текущему статусу</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={tasksByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {tasksByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">Статус</span>
                                <span className="font-bold text-muted-foreground">{data.name}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">Количество</span>
                                <span className="font-bold">{data.value}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Задачи по приоритету</CardTitle>
            <CardDescription>Распределение задач по уровню приоритета</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tasksByPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload
                        return (
                          <div className="rounded-lg border bg-background p-2 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">Приоритет</span>
                                <span className="font-bold text-muted-foreground">{data.name}</span>
                              </div>
                              <div className="flex flex-col">
                                <span className="text-[0.70rem] uppercase text-muted-foreground">Количество</span>
                                <span className="font-bold">{data.value}</span>
                              </div>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar dataKey="value">
                    {tasksByPriority.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Динамика задач</CardTitle>
          <CardDescription>Созданные и завершенные задачи за период</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={tasksOverTime}>
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fontSize: 12 }}
                  interval={period === "week" ? 0 : period === "month" ? 2 : 6}
                />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-sm font-bold">{formatDate(label)}</div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-blue-500" />
                              <span className="text-xs text-muted-foreground">Создано:</span>
                              <span className="text-xs font-bold">{payload[0].value}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="text-xs text-muted-foreground">Завершено:</span>
                              <span className="text-xs font-bold">{payload[1].value}</span>
                            </div>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                  name="Создано"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  stroke="#22c55e"
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                  name="Завершено"
                />
                <Legend />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Производительность сотрудников</CardTitle>
          <CardDescription>Количество задач по сотрудникам</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={tasksByAssignee} layout="vertical" margin={{ top: 20, right: 30, left: 100, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="text-sm font-bold">{label}</div>
                          <div className="grid grid-cols-1 gap-2 mt-2">
                            {payload.map((entry, index) => (
                              <div key={index} className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                <span className="text-xs text-muted-foreground">{entry.name}:</span>
                                <span className="text-xs font-bold">{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Legend />
                <Bar dataKey="completed" stackId="a" fill="#22c55e" name="Завершено" />
                <Bar dataKey="inProgress" stackId="a" fill="#3b82f6" name="В работе" />
                <Bar dataKey="overdue" stackId="a" fill="#ef4444" name="Просрочено" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

