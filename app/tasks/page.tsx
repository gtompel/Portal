import { TaskList } from "@/components/task-list"

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Настройка АРМ</h1>
      <p className="text-muted-foreground">Создавайте, назначайте и отслеживайте настройки автоматизированных рабочих мест</p>

      <TaskList />
    </div>
  )
}

