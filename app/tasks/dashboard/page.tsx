import { TaskDashboard } from "@/components/task-dashboard"

export default function TaskDashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Дашборд задач</h1>
      <p className="text-muted-foreground">Визуализация прогресса и статистики по задачам</p>

      <TaskDashboard />
    </div>
  )
}

