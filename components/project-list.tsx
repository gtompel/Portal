"use client"

import { useState, useEffect } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Loader2, Edit, Trash, Calendar, BarChart3 } from "lucide-react"
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProjectsGantt } from "./projects-gantt"

// Типы данных
type Project = {
  id: string
  name: string
  description?: string
  status: "ACTIVE" | "COMPLETED" | "SUSPENDED"
  startDate: string
  endDate?: string
  members: {
    id: string
    role: string
    user: {
      id: string
      name: string
      avatar?: string
      initials: string
      position: string
    }
  }[]
  createdAt: string
  updatedAt: string
}

type User = {
  id: string
  name: string
  position: string
}

export function ProjectList() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [projects, setProjects] = useState<Project[]>([])
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddingProject, setIsAddingProject] = useState(false)
  const [isEditingProject, setIsEditingProject] = useState(false)
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)

  // Форма создания/редактирования проекта
  const projectSchema = z.object({
    name: z.string().min(3, "Название должно содержать минимум 3 символа"),
    description: z.string().optional(),
    status: z.enum(["ACTIVE", "COMPLETED", "SUSPENDED"]),
    startDate: z.string().min(1, "Укажите дату начала"),
    endDate: z.string().optional(),
    members: z
      .array(
        z.object({
          userId: z.string(),
          role: z.string(),
        }),
      )
      .optional(),
  })

  const form = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "ACTIVE",
      startDate: new Date().toISOString().split("T")[0],
      endDate: "",
      members: [],
    },
  })

  const editForm = useForm<z.infer<typeof projectSchema>>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: "",
      description: "",
      status: "ACTIVE",
      startDate: "",
      endDate: "",
      members: [],
    },
  })

  useEffect(() => {
    fetchProjects()
    fetchUsers()
  }, [])

  useEffect(() => {
    if (projects.length) {
      filterProjects()
    }
  }, [searchTerm, statusFilter, projects])

  useEffect(() => {
    if (currentProject) {
      // Заполняем форму редактирования данными текущего проекта
      editForm.reset({
        name: currentProject.name,
        description: currentProject.description || "",
        status: currentProject.status,
        startDate: new Date(currentProject.startDate).toISOString().split("T")[0],
        endDate: currentProject.endDate ? new Date(currentProject.endDate).toISOString().split("T")[0] : "",
        members: currentProject.members.map((member) => ({
          userId: member.user.id,
          role: member.role,
        })),
      })
    }
  }, [currentProject, editForm])

  const fetchProjects = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/projects")

      if (!response.ok) {
        throw new Error("Не удалось загрузить проекты")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedProjects = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        description: item.description,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
        members: item.members,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      }))

      setProjects(formattedProjects)
      setFilteredProjects(formattedProjects)
    } catch (err) {
      //console.error("Ошибка при загрузке проектов:", err)
      setError("Не удалось загрузить проекты")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      setIsLoadingUsers(true)

      const response = await fetch("/api/users")

      if (!response.ok) {
        throw new Error("Не удалось загрузить пользователей")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedUsers = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        position: item.position,
      }))

      setUsers(formattedUsers)
    } catch (err) {
      //console.error("Ошибка при загрузке пользователей:", err)
    } finally {
      setIsLoadingUsers(false)
    }
  }

  const filterProjects = () => {
    let result = [...projects]

    if (searchTerm) {
      result = result.filter(
        (project) =>
          project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (project.description && project.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
          project.members.some((member) => member.user.name.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }

    if (statusFilter !== "all") {
      result = result.filter((project) => project.status === statusFilter)
    }

    setFilteredProjects(result)
  }

  const getStatusColor = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800"
      case "COMPLETED":
        return "bg-blue-100 text-blue-800"
      case "SUSPENDED":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: Project["status"]) => {
    switch (status) {
      case "ACTIVE":
        return "Активный"
      case "COMPLETED":
        return "Завершен"
      case "SUSPENDED":
        return "Приостановлен"
      default:
        return status
    }
  }

  const createProject = async (data: z.infer<typeof projectSchema>) => {
    if (!session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания проектов",
        variant: "destructive",
      })
      return
    }

    setIsAddingProject(true)

    try {
      // Добавляем текущего пользователя как руководителя проекта, если не указаны участники
      const members = data.members || []
      if (members.length === 0) {
        members.push({
          userId: session.user.id,
          role: "Руководитель проекта",
        })
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          members,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось создать проект")
      }

      const newProject = await response.json()

      // Добавляем новый проект в список
      setProjects((prev) => [newProject, ...prev])

      toast({
        title: "Успешно",
        description: "Проект успешно создан",
      })

      form.reset()
    } catch (err) {
      //console.error("Ошибка при создании проекта:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать проект",
        variant: "destructive",
      })
    } finally {
      setIsAddingProject(false)
    }
  }

  const updateProject = async (data: z.infer<typeof projectSchema>) => {
    if (!currentProject) return

    setIsEditingProject(true)

    try {
      const response = await fetch(`/api/projects/${currentProject.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить проект")
      }

      const updatedProject = await response.json()

      // Обновляем проект в списке
      setProjects((prev) => prev.map((project) => (project.id === currentProject.id ? updatedProject : project)))

      toast({
        title: "Успешно",
        description: "Проект успешно обновлен",
      })

      setCurrentProject(null)
    } catch (err) {
      //console.error("Ошибка при обновлении проекта:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить проект",
        variant: "destructive",
      })
    } finally {
      setIsEditingProject(false)
    }
  }

  const deleteProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить проект")
      }

      // Удаляем проект из списка
      setProjects((prev) => prev.filter((project) => project.id !== id))

      toast({
        title: "Успешно",
        description: "Проект успешно удален",
      })
    } catch (err) {
      //console.error("Ошибка при удалении проекта:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить проект",
        variant: "destructive",
      })
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <Button onClick={fetchProjects} className="mt-2">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Список проектов</TabsTrigger>
          <TabsTrigger value="gantt">Диаграмма Ганта</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-2 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Поиск проектов..."
                  className="pl-8 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px] lg:w-[180px]">
                  <SelectValue placeholder="Все статусы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="ACTIVE">Активные</SelectItem>
                  <SelectItem value="COMPLETED">Завершенные</SelectItem>
                  <SelectItem value="SUSPENDED">Приостановленные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button className="gap-1 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Новый проект</span>
                  <span className="sm:hidden">Добавить</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Создать новый проект</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о проекте. Поля, отмеченные *, обязательны для заполнения.
                  </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(createProject)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название проекта *</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите название проекта" {...field} />
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
                            <Textarea placeholder="Опишите проект подробнее" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата начала *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата окончания</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Статус *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите статус" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Активный</SelectItem>
                              <SelectItem value="COMPLETED">Завершен</SelectItem>
                              <SelectItem value="SUSPENDED">Приостановлен</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="submit" disabled={isAddingProject}>
                        {isAddingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Создать проект
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* Диалог редактирования проекта */}
            <Dialog open={!!currentProject} onOpenChange={(open) => !open && setCurrentProject(null)}>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Редактировать проект</DialogTitle>
                  <DialogDescription>Измените информацию о проекте.</DialogDescription>
                </DialogHeader>

                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(updateProject)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Название проекта *</FormLabel>
                          <FormControl>
                            <Input placeholder="Введите название проекта" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Описание</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Опишите проект подробнее" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={editForm.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата начала *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={editForm.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Дата окончания</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Статус *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите статус" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ACTIVE">Активный</SelectItem>
                              <SelectItem value="COMPLETED">Завершен</SelectItem>
                              <SelectItem value="SUSPENDED">Приостановлен</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setCurrentProject(null)}>
                        Отмена
                      </Button>
                      <Button type="submit" disabled={isEditingProject}>
                        {isEditingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Сохранить изменения
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="rounded-md border overflow-x-auto">
            <Table className="min-w-[600px] lg:min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Даты</TableHead>
                  <TableHead>Участники</TableHead>
                  <TableHead className="w-[80px]">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array(5)
                    .fill(0)
                    .map((_, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-20" />
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-4 w-24" />
                        </TableCell>
                        <TableCell>
                          <div className="flex -space-x-2">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-8 w-8 rounded-full" />
                          </div>
                        </TableCell>
                        <TableCell>
                          <Skeleton className="h-8 w-8 rounded-full" />
                        </TableCell>
                      </TableRow>
                    ))
                ) : filteredProjects.length > 0 ? (
                  filteredProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <Link href={`/projects/${project.id}`} className="font-medium hover:underline">
                            {project.name}
                          </Link>
                          {project.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{project.description}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusColor(project.status)}>
                          {getStatusText(project.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{new Date(project.startDate).toLocaleDateString("ru-RU")}</span>
                          {project.endDate && (
                            <>
                              <span>-</span>
                              <span>{new Date(project.endDate).toLocaleDateString("ru-RU")}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 3).map((member) => (
                            <Avatar key={member.id} className="h-8 w-8 border-2 border-background">
                              <AvatarImage src={member.user.avatar} alt={member.user.name} />
                              <AvatarFallback>{member.user.initials}</AvatarFallback>
                            </Avatar>
                          ))}
                          {project.members.length > 3 && (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
                              +{project.members.length - 3}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Действия</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setCurrentProject(project)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Редактировать</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteProject(project.id)}>
                              <Trash className="mr-2 h-4 w-4" />
                              <span>Удалить</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      Проекты не найдены.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="gantt" className="space-y-4">
          <ProjectsGantt />
        </TabsContent>
      </Tabs>
    </div>
  )
}

