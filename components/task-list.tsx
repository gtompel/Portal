"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Search, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"

// Типы данных
type Task = {
  id: string
  title: string
  assignee: {
    id: string
    name: string
    avatar?: string
    initials: string
  } | null
  status: "NEW" | "IN_PROGRESS" | "REVIEW" | "COMPLETED"
  priority: "LOW" | "MEDIUM" | "HIGH"
  dueDate: string | null
  createdAt: string
}

export function TaskList() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingTask, setIsAddingTask] = useState(false)

  // Форма создания задачи
  const taskSchema = z.object({
    title: z.string().min(3, "Название должно содержать минимум 3 символа"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
    dueDate: z.string().optional(),
    assigneeId: z.string().optional(),
  })

  const form = useForm<z.infer<typeof taskSchema>>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "MEDIUM",
      dueDate: "",
      assigneeId: "",
    },
  })

  useEffect(() => {
    fetchTasks()
  }, [])

  useEffect(() => {
    if (tasks.length) {
      filterTasks()
    }
  }, [searchTerm, statusFilter, tasks])

  const fetchTasks = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/tasks")

      if (!response.ok) {
        throw new Error("Не удалось загрузить задачи")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedTasks = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        assignee: item.assignee
          ? {
              id: item.assignee.id,
              name: item.assignee.name,
              avatar: item.assignee.avatar,
              initials: item.assignee.initials || getInitials(item.assignee.name),
            }
          : null,
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate,
        createdAt: item.createdAt,
      }))

      setTasks(formattedTasks)
      setFilteredTasks(formattedTasks)
    } catch (err) {
      console.error("Ошибка при загрузке задач:", err)
      setError("Не удалось загрузить задачи")
    } finally {
      setIsLoading(false)
    }
  }

  const filterTasks = () => {
    let result = [...tasks]

    if (searchTerm) {
      result = result.filter(
        (task) =>
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          task.assignee?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          false,
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((task) => task.status === statusFilter)
    }

    setFilteredTasks(result)
  }

  const getStatusColor = (status: Task["status"]) => {
    switch (status) {
      case "NEW":
        return "bg-blue-500"
      case "IN_PROGRESS":
        return "bg-yellow-500"
      case "REVIEW":
        return "bg-purple-500"
      case "COMPLETED":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "LOW":
        return "bg-green-100 text-green-800"
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800"
      case "HIGH":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: Task["status"]) => {
    switch (status) {
      case "NEW":
        return "Новая"
      case "IN_PROGRESS":
        return "В работе"
      case "REVIEW":
        return "На проверке"
      case "COMPLETED":
        return "Завершена"
      default:
        return status
    }
  }

  const getPriorityText = (priority: Task["priority"]) => {
    switch (priority) {
      case "LOW":
        return "Низкий"
      case "MEDIUM":
        return "Средний"
      case "HIGH":
        return "Высокий"
      default:
        return priority
    }
  }

  // Функция для получения инициалов из имени
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const createTask = async (data: z.infer<typeof taskSchema>) => {
    if (!session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания задач",
        variant: "destructive",
      })
      return
    }

    setIsAddingTask(true)

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          creatorId: session.user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось создать задачу")
      }

      const newTask = await response.json()

      // Добавляем новую задачу в список
      const formattedTask: Task = {
        id: newTask.id,
        title: newTask.title,
        assignee: newTask.assignee
          ? {
              id: newTask.assignee.id,
              name: newTask.assignee.name,
              avatar: newTask.assignee.avatar,
              initials: newTask.assignee.initials || getInitials(newTask.assignee.name),
            }
          : null,
        status: newTask.status,
        priority: newTask.priority,
        dueDate: newTask.dueDate,
        createdAt: newTask.createdAt,
      }

      setTasks((prev) => [formattedTask, ...prev])

      toast({
        title: "Успешно",
        description: "Задача успешно создана",
      })

      form.reset()
    } catch (err) {
      console.error("Ошибка при создании задачи:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
        variant: "destructive",
      })
    } finally {
      setIsAddingTask(false)
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <Button onClick={fetchTasks} className="mt-2">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

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
              <SelectItem value="NEW">Новая</SelectItem>
              <SelectItem value="IN_PROGRESS">В работе</SelectItem>
              <SelectItem value="REVIEW">На проверке</SelectItem>
              <SelectItem value="COMPLETED">Завершена</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Новая задача</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новую задачу</DialogTitle>
              <DialogDescription>
                Заполните информацию о задаче. Поля, отмеченные *, обязательны для заполнения.
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(createTask)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название задачи *</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите название задачи" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Опишите задачу подробнее" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Приоритет *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите приоритет" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="LOW">Низкий</SelectItem>
                            <SelectItem value="MEDIUM">Средний</SelectItem>
                            <SelectItem value="HIGH">Высокий</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Срок выполнения</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isAddingTask}>
                    {isAddingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Создать задачу
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
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
            {isLoading ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell className="text-right">
                      <Skeleton className="h-4 w-24 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TableRow key={task.id}>
                  <TableCell className="font-medium">{task.id}</TableCell>
                  <TableCell>{task.title}</TableCell>
                  <TableCell>{task.assignee?.name || "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusColor(task.status)} text-white`}>
                      {getStatusText(task.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getPriorityColor(task.priority)}>
                      {getPriorityText(task.priority)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {task.dueDate ? new Date(task.dueDate).toLocaleDateString("ru-RU") : "-"}
                  </TableCell>
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

