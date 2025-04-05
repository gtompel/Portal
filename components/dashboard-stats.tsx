"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

type DashboardStats = {
  tasks: {
    total: number
    active: number
    totalDiff?: number // Сделал необязательным
    activeDiff?: number // Сделал необязательным
  }
  documents: {
    total: number
    diff?: number // Сделал необязательным
  }
  announcements: {
    total: number
    diff?: number // Сделал необязательным
  }
}

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true)

        // В реальном приложении здесь должен быть запрос к API
        const response = await fetch("/api/dashboard/stats")

        if (!response.ok) {
          throw new Error("Не удалось загрузить статистику")
        }

        const data = (await response.json()) as DashboardStats;
        setStats(data)
      } catch (err) {
        console.error("Ошибка при загрузке статистики:", err)
        setError("Не удалось загрузить статистику")
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.tasks.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.tasks.totalDiff != null && (stats?.tasks.totalDiff > 0 ? "+" : "")}
                {stats?.tasks.totalDiff || 0} с прошлой недели
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Активные задачи</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.tasks.active || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.tasks.activeDiff != null && (stats?.tasks.activeDiff > 0 ? "+" : "")}
                {stats?.tasks.activeDiff || 0} с прошлой недели
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Документы</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.documents.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.documents.diff != null && (stats?.documents.diff > 0 ? "+" : "")}
                {stats?.documents.diff || 0} с прошлой недели
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Объявления</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{stats?.announcements.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                {stats?.announcements.diff != null && (stats?.announcements.diff > 0 ? "+" : "")}
                {stats?.announcements.diff || 0} с прошлой недели
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
