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

  // Загрузка данных с сервера
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)

        // В реальном приложении здесь должен быть запрос к API
        // const response = await fetch(`/api/analytics?period=${period}`);
        // const result = await response.json();

        // Временно используем заглушку для демонстрации
        // В реальном коде эти данные должны приходить с сервера
        setTimeout(() => {
          const demoData: AnalyticsData = {
            performanceData: [
              { month: "Янв", выполнено: 45, план: 40 },
              { month: "Фев", выполнено: 52, план: 45 },
              { month: "Мар", выполнено: 48, план: 50 },
              { month: "Апр", выполнено: 61, план: 55 },
              { month: "Май", выполнено: 55, план: 60 },
              { month: "Июн", выполнено: 67, план: 65 },
            ],
            departmentPerformance: [
              { name: "IT", значение: 85 },
              { name: "Маркетинг", значение: 78 },
              { name: "Продажи", значение: 92 },
              { name: "Финансы", значение: 88 },
              { name: "HR", значение: 76 },
            ],
            projectStatusData: [
              { name: "Завершено", value: 35, color: "#22c55e" },
              { name: "В процессе", value: 45, color: "#3b82f6" },
              { name: "Отложено", value: 15, color: "#eab308" },
              { name: "Отменено", value: 5, color: "#ef4444" },
            ],
            employeePerformanceData: [
              { name: "Иван П.", задачи: 45, эффективность: 92 },
              { name: "Мария С.", задачи: 38, эффективность: 85 },
              { name: "Алексей И.", задачи: 52, эффективность: 78 },
              { name: "Елена С.", задачи: 30, эффективность: 95 },
              { name: "Дмитрий К.", задачи: 41, эффективность: 88 },
            ],
            resourceUtilizationData: [
              { month: "Янв", бюджет: 85, время: 78, персонал: 92 },
              { month: "Фев", бюджет: 82, время: 80, персонал: 90 },
              { month: "Мар", бюджет: 78, время: 82, персонал: 88 },
              { month: "Апр", бюджет: 75, время: 85, персонал: 85 },
              { month: "Май", бюджет: 80, время: 87, персонал: 82 },
              { month: "Июн", бюджет: 85, время: 90, персонал: 80 },
            ],
          }

          setData(demoData)
          setIsLoading(false)
        }, 1500)
      } catch (err) {
        console.error("Ошибка при загрузке данных аналитики:", err)
        setError("Не удалось загрузить данные аналитики")
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
                <div className="text-2xl font-bold">87%</div>
                <p className="text-xs text-muted-foreground">+5% с прошлого периода</p>
                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "87%" }}></div>
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
                <div className="text-2xl font-bold">256</div>
                <p className="text-xs text-muted-foreground">+12% с прошлого периода</p>
                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "75%" }}></div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Активные проекты</CardTitle>
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
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 с прошлого периода</p>
                <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary" style={{ width: "60%" }}></div>
                </div>
              </>
            )}
            style={{ width: "60%" }}></div>
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
  isLoading ? (
    <div className="space-y-2">
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-2 w-full mt-4" />
    </div>
  ) : (
    <>
      <div className="text-2xl font-bold">92%</div>
      <p className="text-xs text-muted-foreground">+3% с прошлого периода</p>
      <div className="mt-4 h-2 w-full bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-primary" style={{ width: "92%" }}></div>
      </div>
    </>
  )
  </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance">
        <TabsList className="grid grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="performance">Производительность</TabsTrigger>
          <TabsTrigger value="projects">Проекты</TabsTrigger>r>
          <TabsTrigger value="employees">Сотрудники</TabsTrigger>
          <TabsTrigger value="resources">Ресурсы</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-6 mt-6">
  isLoading ? (
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
  )
  </TabsContent>

        <TabsContent value="projects" className="space-y-6 mt-6">
  isLoading ? (
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
          <CardTitle>Статус проектов</CardTitle>
          <CardDescription>Распределение проектов по статусам</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.projectStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {data?.projectStatusData.map((entry, index) => (
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
          <CardTitle>Выполнение проектов</CardTitle>
          <CardDescription>Процент выполнения активных проектов</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Корпоративный портал</span>
                <span className="text-sm font-medium">75%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "75%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Мобильное приложение</span>
                <span className="text-sm font-medium">60%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "60%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Система аналитики</span>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "45%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Интеграция CRM</span>
                <span className="text-sm font-medium">90%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "90%" }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Обновление инфраструктуры</span>
                <span className="text-sm font-medium">30%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "30%" }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
  </TabsContent>

        <TabsContent value="employees" className="space-y-6 mt-6">
  isLoading ? (
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
  )
  </TabsContent>

        <TabsContent value="resources" className="space-y-6 mt-6">
  isLoading ? (
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
              <Area type="monotone" dataKey="бюджет" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Бюджет" />
              <Area type="monotone" dataKey="время" stackId="2" stroke="#22c55e" fill="#22c55e" name="Время" />
              <Area type="monotone" dataKey="персонал" stackId="3" stroke="#eab308" fill="#eab308" name="Персонал" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
  </TabsContent>
      </Tabs>
    </div>
  )
}

