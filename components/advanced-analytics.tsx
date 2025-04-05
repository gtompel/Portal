"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts"
import { Download, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Типы данных для аналитики
type AnalyticsData = {
  performanceData: {
    month: string
    выполнено: number
    план: number
  }[]
  departmentPerformance: {
    name: string
    значение: number
  }[]
  projectStatusData: {
    name: string
    value: number
    color: string
  }[]
  employeePerformanceData: {
    name: string
    задачи: number
    эффективность: number
  }[]
  resourceUtilizationData: {
    month: string
    бюджет: number
    время: number
    персонал: number
  }[]
}

export function AdvancedAnalytics() {
  const [period, setPeriod] = useState("year")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [projectData, setProjectData] = useState<any>(null)

  // Функция для загрузки данных аналитики
  const fetchAnalyticsData = async (period: string) => {
    try {
      setIsLoading(true)

      // Загружаем данные о производительности
      const response = await fetch(`/api/analytics/performance?period=${period}`)

      if (!response.ok) {
        throw new Error("Не удалось загрузить данные аналитики")
      }

      const analyticsData = await response.json()

      // Преобразуем данные API в формат, ожидаемый компонентом
      const formattedData: AnalyticsData = {
        performanceData: analyticsData.tasksByMonth.map((item: any) => ({
          month: item.month,
          выполнено: Number(item.completed_count) || 0,
          план: Number(item.tasks_count) || 0,
        })),
        departmentPerformance: analyticsData.departmentPerformance.map((dept: any) => ({
          name: dept.department || "Не указан",
          значение: Number(dept.efficiency) || 0,
        })),
        projectStatusData: [
          { name: "Завершено", value: 0, color: "#22c55e" },
          { name: "В процессе", value: 0, color: "#3b82f6" },
          { name: "На проверке", value: 0, color: "#a855f7" },
          { name: "Новые", value: 0, color: "#eab308" },
        ],
        employeePerformanceData: analyticsData.employeePerformance.map((emp: any) => ({
          name: emp.name.split(" ")[0] + " " + (emp.name.split(" ")[1]?.[0] || "") + ".",
          задачи: Number(emp.tasks_count) || 0,
          эффективность: Number(emp.efficiency) || 0,
        })),
        resourceUtilizationData: analyticsData.tasksByMonth.map((item: any) => {
          // Рассчитываем использование ресурсов на основе показателей выполнения задач
          const completionRate = Number(item.completed_count) / (Number(item.tasks_count) || 1)
          return {
            month: item.month,
            бюджет: Math.round(completionRate * 100),
            время: Math.round(completionRate * 90 + Math.random() * 10),
            персонал: Math.round(completionRate * 85 + Math.random() * 15),
          }
        }),
      }

      setData(formattedData)
    } catch (err) {
      console.error("Ошибка при загрузке данных аналитики:", err)
      setError("Не удалось загрузить данные аналитики")
    } finally {
      setIsLoading(false)
    }
  }

  // Загрузка данных о проектах
  const fetchProjectData = async (period: string) => {
    try {
      // Загружаем данные о проектах
      const response = await fetch(`/api/analytics/projects?period=${period}`)

      if (!response.ok) {
        console.warn("Не удалось загрузить данные о проектах, используем данные о задачах")
        return
      }

      const projectsData = await response.json()
      setProjectData(projectsData)

      // Обновляем данные о статусах задач, если они доступны
      if (projectsData.taskStatusStats && data) {
        const statusColors = {
          NEW: "#eab308",
          IN_PROGRESS: "#3b82f6",
          REVIEW: "#a855f7",
          COMPLETED: "#22c55e",
        }

        const statusNames = {
          NEW: "Новые",
          IN_PROGRESS: "В процессе",
          REVIEW: "На проверке",
          COMPLETED: "Завершено",
        }

        const projectStatusData = projectsData.taskStatusStats.map((stat: any) => ({
          name: statusNames[stat.status as keyof typeof statusNames] || stat.status,
          value: stat.count,
          color: statusColors[stat.status as keyof typeof statusColors] || "#94a3b8",
        }))

        setData({
          ...data,
          projectStatusData,
        })
      }
    } catch (err) {
      console.error("Ошибка при загрузке данных о проектах:", err)
    }
  }

  // Загрузка данных при монтировании компонента и изменении периода
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // Загружаем пользователей
        const usersResponse = await fetch("/api/users")
        if (!usersResponse.ok) {
          throw new Error("Не удалось загрузить данные пользователей")
        }
        const usersData = await usersResponse.json()
        setUsers(
          usersData.map((user: any) => ({
            id: user.id,
            name: user.name,
          })),
        )

        // Загружаем задачи
        const tasksResponse = await fetch("/api/tasks")
        if (!tasksResponse.ok) {
          throw new Error("Не удалось загрузить данные задач")
        }
        const tasksData = await tasksResponse.json()
        setTasks(tasksData)

        // Загружаем данные аналитики
        await fetchAnalyticsData(period)

        // Загружаем данные о проектах
        await fetchProjectData(period)

        // Если данные о проектах не загрузились, используем данные о задачах
        if (!projectData && data) {
          const taskStatusCounts = {
            NEW: 0,
            IN_PROGRESS: 0,
            REVIEW: 0,
            COMPLETED: 0,
          }

          tasksData.forEach((task: any) => {
            if (taskStatusCounts[task.status as keyof typeof taskStatusCounts] !== undefined) {
              taskStatusCounts[task.status as keyof typeof taskStatusCounts]++
            }
          })

          const projectStatusData = [
            { name: "Завершено", value: taskStatusCounts.COMPLETED, color: "#22c55e" },
            { name: "В процессе", value: taskStatusCounts.IN_PROGRESS, color: "#3b82f6" },
            { name: "На проверке", value: taskStatusCounts.REVIEW, color: "#a855f7" },
            { name: "Новые", value: taskStatusCounts.NEW, color: "#eab308" },
          ]

          setData({
            ...data,
            projectStatusData,
          })
        }
      } catch (err) {
        console.error("Ошибка при загрузке данных:", err)
        setError("Не удалось загрузить данные")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [period])

  // Функция экспорта данных
  const handleExportData = () => {
    // В реальном приложении здесь должен быть код для экспорта данных в CSV или Excel
    alert("Функция экспорта данных будет реализована позже")
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Card className="w-full max-w-md">
          <CardHeader className="bg-destructive/10">
            <CardTitle>Ошибка загрузки данных</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Button onClick={() => window.location.reload()}>Повторить попытку</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Подготовка данных о статусах задач для отображения
  const getTaskStatusData = () => {
    // Если данные о проектах загружены, используем их
    if (data?.projectStatusData && data.projectStatusData.some((item) => item.value > 0)) {
      return data.projectStatusData
    }

    // Если данные не загружены или пусты, используем данные из задач
    const taskStatusCounts = {
      NEW: 0,
      IN_PROGRESS: 0,
      REVIEW: 0,
      COMPLETED: 0,
    }

    tasks.forEach((task) => {
      if (taskStatusCounts[task.status as keyof typeof taskStatusCounts] !== undefined) {
        taskStatusCounts[task.status as keyof typeof taskStatusCounts]++
      }
    })

    return [
      { name: "Завершено", value: taskStatusCounts.COMPLETED, color: "#22c55e" },
      { name: "В процессе", value: taskStatusCounts.IN_PROGRESS, color: "#3b82f6" },
      { name: "На проверке", value: taskStatusCounts.REVIEW, color: "#a855f7" },
      { name: "Новые", value: taskStatusCounts.NEW, color: "#eab308" },
    ].filter((item) => item.value > 0) // Фильтруем, чтобы показывать только непустые значения
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="quarter">Квартал</SelectItem>
              <SelectItem value="year">Год</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" className="gap-1" onClick={handleExportData}>
          <Download className="h-4 w-4" />
          <span>Экспорт данных</span>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Выполнение плана</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2 w-full mt-4" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {Math.round((tasks.filter((task) => task.status === "COMPLETED").length / (tasks.length || 1)) * 100)}
                  %
                </div>
                <p className="text-xs text-muted-foreground">
                  {tasks.filter((task) => task.status === "COMPLETED").length} из {tasks.length} задач
                </p>
                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.round(
                        (tasks.filter((task) => task.status === "COMPLETED").length / (tasks.length || 1)) * 100,
                      )}%`,
                    }}
                  ></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Завершенные задачи</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2 w-full mt-4" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{tasks.filter((task) => task.status === "COMPLETED").length}</div>
                <p className="text-xs text-muted-foreground">
                  {
                    tasks.filter(
                      (task) =>
                        task.status === "COMPLETED" &&
                        new Date(task.updatedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                    ).length
                  }{" "}
                  за последнюю неделю
                </p>
                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(
                        Math.round(
                          (tasks.filter((task) => task.status === "COMPLETED").length / (tasks.length || 1)) * 100,
                        ),
                        100,
                      )}%`,
                    }}
                  ></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активные задачи</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2 w-full mt-4" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {
                    tasks.filter(
                      (task) => task.status === "NEW" || task.status === "IN_PROGRESS" || task.status === "REVIEW",
                    ).length
                  }
                </div>
                <p className="text-xs text-muted-foreground">
                  {tasks.filter((task) => task.status === "IN_PROGRESS").length} в работе
                </p>
                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${Math.min(
                        Math.round(
                          (tasks.filter(
                            (task) =>
                              task.status === "NEW" || task.status === "IN_PROGRESS" || task.status === "REVIEW",
                          ).length /
                            (tasks.length || 1)) *
                            100,
                        ),
                        100,
                      )}%`,
                    }}
                  ></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Эффективность</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-2 w-full mt-4" />
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {users.length > 0
                    ? Math.round(
                        (users.reduce((acc, user) => {
                          const userTasks = tasks.filter((task) => task.assigneeId === user.id)
                          const completedTasks = userTasks.filter((task) => task.status === "COMPLETED").length
                          const totalTasks = userTasks.length || 1
                          return acc + completedTasks / totalTasks
                        }, 0) /
                          users.length) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">Средняя эффективность сотрудников</p>
                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{
                      width: `${
                        users.length > 0
                          ? Math.round(
                              (users.reduce((acc, user) => {
                                const userTasks = tasks.filter((task) => task.assigneeId === user.id)
                                const completedTasks = userTasks.filter((task) => task.status === "COMPLETED").length
                                const totalTasks = userTasks.length || 1
                                return acc + completedTasks / totalTasks
                              }, 0) /
                                users.length) *
                                100,
                            )
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="performance">Производительность</TabsTrigger>
          <TabsTrigger value="projects">Проекты</TabsTrigger>
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
          <TabsTrigger value="resources">Ресурсы</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-80" />
                </CardHeader>
                <CardContent>
                  <div className="h-[400px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Выполнение плана по месяцам</CardTitle>
                  <CardDescription>Сравнение фактических показателей с плановыми</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.performanceData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="выполнено" fill="#3b82f6" name="Выполнено" />
                        <Bar dataKey="план" fill="#94a3b8" name="План" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Производительность по отделам</CardTitle>
                    <CardDescription>Эффективность работы отделов (%)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data?.departmentPerformance} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" domain={[0, 100]} />
                          <YAxis dataKey="name" type="category" width={100} />
                          <Tooltip />
                          <Bar dataKey="значение" fill="#3b82f6" name="Эффективность (%)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Динамика эффективности</CardTitle>
                    <CardDescription>Изменение показателей за период</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data?.performanceData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="выполнено" stroke="#3b82f6" name="Выполнено" />
                          <Line type="monotone" dataKey="план" stroke="#94a3b8" name="План" strokeDasharray="5 5" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="projects" className="space-y-6 mt-6">
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Array(5)
                      .fill(0)
                      .map((_, index) => (
                        <div key={index}>
                          <div className="flex justify-between mb-1">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-8" />
                          </div>
                          <Skeleton className="h-2 w-full" />
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Статус задач</CardTitle>
                  <CardDescription>Распределение задач по статусам</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getTaskStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {getTaskStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Выполнение задач</CardTitle>
                  <CardDescription>Процент выполнения активных задач</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {tasks
                      .filter((task) => task.status === "IN_PROGRESS")
                      .slice(0, 5)
                      .map((task) => {
                        // Рассчитываем примерный процент выполнения на основе статуса
                        let percent = 0
                        switch (task.status) {
                          case "NEW":
                            percent = 0
                            break
                          case "IN_PROGRESS":
                            percent = 50
                            break
                          case "REVIEW":
                            percent = 80
                            break
                          case "COMPLETED":
                            percent = 100
                            break
                          default:
                            percent = 0
                        }

                        return (
                          <div key={task.id}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">{task.title}</span>
                              <span className="text-sm font-medium">{percent}%</span>
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary" style={{ width: `${percent}%` }}></div>
                            </div>
                          </div>
                        )
                      })}

                    {tasks.filter((task) => task.status === "IN_PROGRESS").length === 0 && (
                      <div className="text-center py-4 text-muted-foreground">Нет активных задач в работе</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="employees" className="space-y-6 mt-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-96" />
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Производительность сотрудников</CardTitle>
                <CardDescription>Количество выполненных задач и эффективность</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.employeePerformanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis />
                      <YAxis yAxisId="left" orientation="left" />
                      <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="задачи" fill="#3b82f6" name="Выполненные задачи" />
                      <Bar yAxisId="right" dataKey="эффективность" fill="#22c55e" name="Эффективность (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="resources" className="space-y-6 mt-6">
          {isLoading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-80" />
              </CardHeader>
              <CardContent>
                <div className="h-[400px] flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Использование ресурсов</CardTitle>
                <CardDescription>Эффективность использования бюджета, времени и персонала (%)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.resourceUtilizationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="бюджет"
                        stackId="1"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        name="Бюджет"
                      />
                      <Area type="monotone" dataKey="время" stackId="2" stroke="#22c55e" fill="#22c55e" name="Время" />
                      <Area
                        type="monotone"
                        dataKey="персонал"
                        stackId="3"
                        stroke="#eab308"
                        fill="#eab308"
                        name="Персонал"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

