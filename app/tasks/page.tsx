import { TaskList } from "@/components/task-list"

export default function TasksPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Управление задачами</h1>
      <p className="text-muted-foreground">Создавайте, назначайте и отслеживайте задачи вашей команды</p>

      <TaskList />
    </div>
  )
}

