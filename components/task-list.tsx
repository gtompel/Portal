"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search } from "lucide-react"

type Task = {
  id: string
  title: string
  assignee: string
  status: "новая" | "в работе" | "на проверке" | "завершена"
  priority: "низкий" | "средний" | "высокий"
  dueDate: string
}

const tasks: Task[] = [
  {
    id: "TASK-1001",
    title: "Подготовить отчет за квартал",
    assignee: "Иван Петров",
    status: "в работе",
    priority: "высокий",
    dueDate: "2025-04-10",
  },
  {
    id: "TASK-1002",
    title: "Обновить документацию проекта",
    assignee: "Мария Сидорова",
    status: "на проверке",
    priority: "средний",
    dueDate: "2025-04-15",
  },
  {
    id: "TASK-1003",
    title: "Провести собеседования с кандидатами",
    assignee: "Алексей Иванов",
    status: "новая",
    priority: "средний",
    dueDate: "2025-04-08",
  },
  {
    id: "TASK-1004",
    title: "Подготовить презентацию для клиента",
    assignee: "Елена Смирнова",
    status: "завершена",
    priority: "высокий",
    dueDate: "2025-04-05",
  },
  {
    id: "TASK-1005",
    title: "Обновить план маркетинга",
    assignee: "Дмитрий Козлов",
    status: "в работе",
    priority: "низкий",
    dueDate: "2025-04-20",
  },
]

const getStatusColor = (status: Task["status"]) => {
  switch (status) {
    case "новая":
      return "bg-blue-500"
    case "в работе":
      return "bg-yellow-500"
    case "на проверке":
      return "bg-purple-500"
    case "завершена":
      return "bg-green-500"
    default:
      return "bg-gray-500"
  }
}

const getPriorityColor = (priority: Task["priority"]) => {
  switch (priority) {
    case "низкий":
      return "bg-green-100 text-green-800"
    case "средний":
      return "bg-yellow-100 text-yellow-800"
    case "высокий":
      return "bg-red-100 text-red-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function TaskList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignee.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === "all" || task.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск задач..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все статусы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              <SelectItem value="новая">Новая</SelectItem>
              <SelectItem value="в работе">В работе</SelectItem>
              <SelectItem value="на проверке">На проверке</SelectItem>
              <SelectItem value="завершена">Завершена</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          <span>Новая задача</span>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Исполнитель</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Приоритет</TableHead>
              <TableHead className="text-right">Срок</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.id}</TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.assignee}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(task.status)} text-white`}>
                      {task.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{new Date(task.dueDate).toLocaleDateString("ru-RU")}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Задачи не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

