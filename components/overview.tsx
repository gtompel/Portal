"use client"

import { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type OverviewData = {
  taskData: {
    name: string
    новые: number
    выполненные: number
  }[]
  statusData: {
    name: string
    value: number
    color: string
  }[]
  documentData: {
    name: string
    value: number
    color: string
  }[]
}

export function Overview() {
  const { toast } = useToast()
  const [data, setData] = useState<OverviewData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/dashboard/overview", {
        headers: {
          'Cache-Control': 'max-age=300'
        }
      })

      if (!response.ok) {
        throw new Error("Не удалось загрузить данные обзора")
      }

      const data = await response.json()
      setData(data)
    } catch (err) {
      console.error("Ошибка при загрузке данных обзора:", err)
      setError("Не удалось загрузить данные обзора")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные обзора",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (error) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Ошибка загрузки данных</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-64" />
            <Skeleton className="h-4 w-80" />
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-1 lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-full mb-4" />
            <div className="h-[300px] flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
      <Card className="col-span-1 lg:col-span-4">
        <CardHeader>
          <CardTitle>Статистика задач</CardTitle>
          <CardDescription>Количество новых и выполненных задач за последние 6 месяцев</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={data?.taskData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="новые" fill="#3b82f6" name="Новые задачи" />
              <Bar dataKey="выполненные" fill="#22c55e" name="Выполненные задачи" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="col-span-1 lg:col-span-3">
        <CardHeader>
          <CardTitle>Распределение</CardTitle>
          <CardDescription>Статистика по типам и статусам</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status">Статусы задач</TabsTrigger>
              <TabsTrigger value="documents">Типы документов</TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="space-y-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data?.statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="documents" className="space-y-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.documentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {data?.documentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

