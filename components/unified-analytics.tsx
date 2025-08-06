"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
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
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Bell,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Download,
  Target,
  BarChart3,
  Activity
} from "lucide-react"

// Типы данных
type AnalyticsData = {
  overview: {
    tasks: {
      total: number
      completed: number
      inProgress: number
      new: number
      overdue: number
      completionRate: number
      averageCompletionTime: number
    }
    documents: {
      total: number
      byType?: Record<string, number>
    }
    announcements: {
      total: number
    }
    users: {
      total: number
    }
  }
  details: {
    tasksByStatus: Array<{
      name: string
      value: number
      color: string
    }>
    tasksByPriority: Array<{
      name: string
      value: number
      color: string
    }>
    tasksByNetwork: Array<{
      name: string
      value: number
      color: string
    }>
    tasksByAssignee: Array<{
      name: string
      fullName: string
      completed: number
      inProgress: number
      overdue: number
      total: number
    }>
    tasksOverTime: Array<{
      date: string
      created: number
      completed: number
    }>
  }
  current: {
    overdueTasks: Array<{
      id: string
      title: string
      dueDate: string
      assignee?: {
        id: string
        name: string
        displayName: string
        avatar?: string
        initials: string
      }
    }>
    upcomingTasks: Array<{
      id: string
      title: string
      dueDate: string
      assignee?: {
        id: string
        name: string
        displayName: string
        avatar?: string
        initials: string
      }
    }>
  }
}

export function UnifiedAnalytics() {
  const { toast } = useToast()
  const [period, setPeriod] = useState("month")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsData | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/analytics/unified?period=${period}`)
      if (!response.ok) {
        throw new Error("Не удалось загрузить данные")
      }

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (err) {
      console.error("Ошибка при загрузке данных:", err)
      setError("Не удалось загрузить данные")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аналитические данные",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [period, toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleExportData = () => {
    if (!data) return

    const csvData = [
      ["Период", period],
      ["Всего задач", data.overview.tasks.total],
      ["Выполнено", data.overview.tasks.completed],
      ["В работе", data.overview.tasks.inProgress],
      ["Новые", data.overview.tasks.new],
      ["Просрочено", data.overview.tasks.overdue],
      ["Процент выполнения", `${data.overview.tasks.completionRate}%`],
      ["Среднее время выполнения", `${data.overview.tasks.averageCompletionTime} дней`],
    ].map(row => row.join(",")).join("\n")

    const blob = new Blob([csvData], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `analytics-${period}-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)

    toast({
      title: "Экспорт завершен",
      description: "Данные успешно экспортированы в CSV",
    })
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <Button onClick={fetchData} className="mt-2">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и фильтры */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Аналитика системы</h2>
          <p className="text-muted-foreground">
            Комплексный анализ производительности и статистики
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Выберите период" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="quarter">Квартал</SelectItem>
              <SelectItem value="year">Год</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportData} disabled={!data}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт
          </Button>
        </div>
      </div>

      {/* Основные метрики */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[60px]" />
                <Skeleton className="h-4 w-[80px] mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : data ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                           <div className="text-2xl font-bold text-blue-600">{data.overview.tasks.total}</div>
             <p className="text-xs text-muted-foreground">
               <span className="text-green-600 font-medium">{data.overview.tasks.completionRate}%</span> выполнено
             </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">В работе</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                           <div className="text-2xl font-bold text-orange-600">{data.overview.tasks.inProgress}</div>
             <p className="text-xs text-muted-foreground">
               <span className="text-red-600 font-medium">{data.overview.tasks.overdue}</span> просрочено
             </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Пользователи</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                           <div className="text-2xl font-bold text-purple-600">{data.overview.users.total}</div>
             <p className="text-xs text-muted-foreground">
               Активных пользователей
             </p>
            </CardContent>
          </Card>

                     <Card>
             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
               <CardTitle className="text-sm font-medium">Документы</CardTitle>
               <FileText className="h-4 w-4 text-muted-foreground" />
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold text-indigo-600">{data.overview.documents.total}</div>
               <p className="text-xs text-muted-foreground">
                 {data.overview.documents.total > 0 ? 'Всего документов' : 'Загружено за период'}
               </p>
             </CardContent>
           </Card>
        </div>
      ) : null}

      {/* Детальная аналитика */}
      {data && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Обзор</TabsTrigger>
            <TabsTrigger value="tasks">Задачи</TabsTrigger>
            <TabsTrigger value="documents">Документы</TabsTrigger>
            <TabsTrigger value="users">Пользователи</TabsTrigger>
            <TabsTrigger value="performance">Производительность</TabsTrigger>
            <TabsTrigger value="current">Текущие</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* График по статусам */}
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по статусам</CardTitle>
                  <CardDescription>
                    Количество задач по статусам выполнения
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                                             <Pie
                         data={data.details.tasksByStatus}
                         cx="50%"
                         cy="50%"
                         labelLine={false}
                         label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                         outerRadius={100}
                         fill="#8884d8"
                         dataKey="value"
                       >
                        {data.details.tasksByStatus.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* График по приоритетам */}
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по приоритетам</CardTitle>
                  <CardDescription>
                    Количество задач по приоритетам
                  </CardDescription>
                </CardHeader>
                <CardContent>
                                     <ResponsiveContainer width="100%" height={300}>
                     <BarChart data={data.details.tasksByPriority}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="name" />
                       <YAxis />
                       <Tooltip 
                         formatter={(value: any, name: any) => [
                           `${value} задач`, 
                           'Количество'
                         ]}
                         labelFormatter={(label: any) => `Приоритет: ${label}`}
                       />
                       <Bar dataKey="value" fill="#8884d8">
                         {data.details.tasksByPriority.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={entry.color} />
                         ))}
                       </Bar>
                     </BarChart>
                   </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* График по времени */}
              <Card>
                <CardHeader>
                  <CardTitle>Динамика задач</CardTitle>
                  <CardDescription>
                    Созданные и выполненные задачи по дням
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.details.tasksOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="created" stroke="#8884d8" name="Создано" />
                      <Line type="monotone" dataKey="completed" stroke="#82ca9d" name="Выполнено" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* График по типам сети */}
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по типам сети</CardTitle>
                  <CardDescription>
                    Количество задач по типам сети
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.details.tasksByNetwork}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documents" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Статистика по типам документов */}
              <Card>
                <CardHeader>
                  <CardTitle>Распределение по типам</CardTitle>
                  <CardDescription>
                    Количество документов по типам
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.overview.documents.byType && Object.keys(data.overview.documents.byType).length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={Object.entries(data.overview.documents.byType).map(([type, count]) => ({
                            name: type,
                            value: count,
                            color: getDocumentTypeColor(type)
                          }))}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {Object.entries(data.overview.documents.byType).map(([type], index) => (
                            <Cell key={`cell-${index}`} fill={getDocumentTypeColor(type)} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-2" />
                      <p>Нет документов для отображения</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Детальная информация о документах */}
              <Card>
                <CardHeader>
                  <CardTitle>Информация о документах</CardTitle>
                  <CardDescription>
                    Детальная статистика
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Всего документов</span>
                    <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                      {data.overview.documents.total}
                    </Badge>
                  </div>
                  {data.overview.documents.byType && Object.entries(data.overview.documents.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{type}</span>
                      <Badge variant="outline">
                        {count}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Статистика по пользователям */}
              <Card>
                <CardHeader>
                  <CardTitle>Все пользователи</CardTitle>
                  <CardDescription>
                    Детальная статистика по каждому пользователю
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Легенда для бейджей */}
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Статус задач:</p>
                    <div className="flex gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 rounded-full"></div>
                        <span className="text-green-700">Выполнено</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-orange-100 rounded-full"></div>
                        <span className="text-orange-700">В работе</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 rounded-full"></div>
                        <span className="text-red-700">Просрочено</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    {data.details.tasksByAssignee.map((user) => (
                      <div key={user.name} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium" title={user.fullName}>{user.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Всего задач: {user.total}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Badge className="bg-green-100 text-green-800 text-xs" title="Выполнено">
                            {user.completed}
                          </Badge>
                          <Badge className="bg-orange-100 text-orange-800 text-xs" title="В работе">
                            {user.inProgress}
                          </Badge>
                          <Badge className="bg-red-100 text-red-800 text-xs" title="Просрочено">
                            {user.overdue}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* График производительности пользователей */}
              <Card>
                <CardHeader>
                  <CardTitle>Производительность пользователей</CardTitle>
                  <CardDescription>
                    Сравнение по выполненным задачам
                  </CardDescription>
                </CardHeader>
                <CardContent>
                                     <ResponsiveContainer width="100%" height={300}>
                     <BarChart data={data.details.tasksByAssignee.filter(user => user.total > 0)}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="name" />
                       <YAxis />
                       <Tooltip 
                         labelFormatter={(label) => {
                           const user = data.details.tasksByAssignee.find(item => item.name === label)
                           return user?.fullName || label
                         }}
                       />
                       <Bar dataKey="completed" fill="#10B981" name="Выполнено" />
                     </BarChart>
                   </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Производительность исполнителей */}
              <Card>
                <CardHeader>
                  <CardTitle>Производительность исполнителей</CardTitle>
                  <CardDescription>
                    Статистика по исполнителям
                  </CardDescription>
                </CardHeader>
                <CardContent>
                                     <ResponsiveContainer width="100%" height={300}>
                     <BarChart data={data.details.tasksByAssignee}>
                       <CartesianGrid strokeDasharray="3 3" />
                       <XAxis dataKey="name" />
                       <YAxis />
                       <Tooltip 
                         formatter={(value, name) => [value, name]}
                         labelFormatter={(label) => {
                           const user = data.details.tasksByAssignee.find(item => item.name === label)
                           return `${user?.fullName || label} (всего: ${user?.total || 0})`
                         }}
                       />
                       <Legend />
                       <Bar dataKey="completed" fill="#10B981" name="Выполнено" />
                       <Bar dataKey="inProgress" fill="#F59E0B" name="В работе" />
                       <Bar dataKey="overdue" fill="#EF4444" name="Просрочено" />
                     </BarChart>
                   </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Метрики производительности */}
              <Card>
                <CardHeader>
                  <CardTitle>Ключевые метрики</CardTitle>
                  <CardDescription>
                    Показатели эффективности
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                                     <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">Процент выполнения</span>
                     <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                       {data.overview.tasks.completionRate}%
                     </Badge>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">Среднее время выполнения</span>
                     <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                       {data.overview.tasks.averageCompletionTime} дней
                     </Badge>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">Просроченные задачи</span>
                     <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                       {data.overview.tasks.overdue}
                     </Badge>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-sm font-medium">Новые задачи</span>
                     <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200">
                       {data.overview.tasks.new}
                     </Badge>
                   </div>
                   <div className="pt-4 border-t">
                     <p className="text-sm font-medium mb-2">Пользователи с задачами:</p>
                     {data.details.tasksByAssignee
                       .filter(user => user.total > 0)
                       .sort((a, b) => b.total - a.total)
                       .slice(0, 5)
                       .map((user) => (
                         <div key={user.name} className="flex items-center justify-between mb-1">
                           <span 
                             className="text-xs text-muted-foreground truncate max-w-[120px] cursor-help"
                             title={user.fullName}
                           >
                             {user.name}
                           </span>
                           <Badge variant="outline" className="text-xs">
                             {user.total}
                           </Badge>
                         </div>
                       ))}
                   </div>
                   {data.overview.documents.byType && Object.keys(data.overview.documents.byType).length > 0 && (
                     <div className="pt-4 border-t">
                       <p className="text-sm font-medium mb-2">Документы по типам:</p>
                       {Object.entries(data.overview.documents.byType).map(([type, count]) => (
                         <div key={type} className="flex items-center justify-between mb-1">
                           <span className="text-xs text-muted-foreground">{type}</span>
                           <Badge variant="outline" className="text-xs">
                             {count}
                           </Badge>
                         </div>
                       ))}
                     </div>
                   )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="current" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Просроченные задачи */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    Просроченные задачи
                  </CardTitle>
                  <CardDescription>
                    Задачи с истекшим сроком выполнения
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.current.overdueTasks.length > 0 ? (
                    <div className="space-y-3">
                      {data.current.overdueTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {task.assignee && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={task.assignee.avatar || ""} />
                                <AvatarFallback className="text-xs">
                                  {task.assignee.initials}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.assignee?.displayName || task.assignee?.name} • Срок: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru-RU") : "Не указан"}
                              </p>
                            </div>
                          </div>
                                                     <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Просрочено</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>Нет просроченных задач</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Ближайшие задачи */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-500" />
                    Ближайшие задачи
                  </CardTitle>
                  <CardDescription>
                    Задачи со сроком в ближайшие 7 дней
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {data.current.upcomingTasks.length > 0 ? (
                    <div className="space-y-3">
                      {data.current.upcomingTasks.map((task) => (
                        <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {task.assignee && (
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={task.assignee.avatar || ""} />
                                <AvatarFallback className="text-xs">
                                  {task.assignee.initials}
                                </AvatarFallback>
                              </Avatar>
                            )}
                            <div>
                              <p className="text-sm font-medium">{task.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {task.assignee?.displayName || task.assignee?.name} • Срок: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru-RU") : "Не указан"}
                              </p>
                            </div>
                          </div>
                                                     <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Скоро</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                      <p>Нет задач на ближайшую неделю</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// Вспомогательная функция для цветов типов документов
function getDocumentTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case 'pdf': return '#EF4444'
    case 'doc': case 'docx': return '#3B82F6'
    case 'xls': case 'xlsx': return '#10B981'
    case 'ppt': case 'pptx': return '#F59E0B'
    case 'txt': return '#6B7280'
    case 'jpg': case 'jpeg': case 'png': case 'gif': return '#8B5CF6'
    default: return '#6B7280'
  }
} 