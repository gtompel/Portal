import { TaskDashboard } from "@/components/task-dashboard"

export default function TaskAnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Аналитика задач</h1>
      <p className="text-muted-foreground">Визуализация прогресса и статистики задач</p>

      <TaskDashboard />
    </div>
  )
}

