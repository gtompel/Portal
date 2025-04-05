"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, Edit, Plus, Trash, Users } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

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
      email: string
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

export function ProjectDetails({ id }: { id: string }) {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [users, setUsers] = useState<User[]>([])

  // Форма редактирования проекта
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
      startDate: "",
      endDate: "",
      members: [],
    },
  })

  // Форма добавления участника
  const memberSchema = z.object({
    userId: z.string().min(1, "Выберите пользователя"),
    role: z.string().min(1, "Укажите роль"),
  })

  const memberForm = useForm<z.infer<typeof memberSchema>>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      userId: "",
      role: "",
    },
  })

  useEffect(() => {
    if (id) {
      fetchProject()
      fetchUsers()
    }
  }, [id])

  useEffect(() => {
    if (project) {
      form.reset({
        name: project.name,
        description: project.description || "",
        status: project.status,
        startDate: new Date(project.startDate).toISOString().split("T")[0],
        endDate: project.endDate ? new Date(project.endDate).toISOString().split("T")[0] : "",
        members: project.members.map((member) => ({
          userId: member.user.id,
          role: member.role,
        })),
      })
    }
  }, [project, form])

  const fetchProject = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/projects/${id}`)

      if (!response.ok) {
        throw new Error("Не удалось загрузить данные проекта")
      }

      const data = await response.json()
      setProject(data)
    } catch (err) {
      console.error("Ошибка при загрузке данных проекта:", err)
      setError("Не удалось загрузить данные проекта")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users")

      if (!response.ok) {
        throw new Error("Не удалось загрузить пользователей")
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      console.error("Ошибка при загрузке пользователей:", err)
    }
  }

  const updateProject = async (data: z.infer<typeof projectSchema>) => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
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
      setProject(updatedProject)
      setIsEditing(false)

      // Обновляем участников проекта, если они были изменены
      if (data.members && data.members.length > 0) {
        // Получаем текущих участников
        const currentMemberIds = project?.members.map((member) => member.user.id) || []

        // Находим новых участников, которых нужно добавить
        const newMembers = data.members.filter((member) => !currentMemberIds.includes(member.userId))

        // Добавляем новых участников
        for (const member of newMembers) {
          await fetch(`/api/projects/${id}/members`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: member.userId,
              role: member.role,
            }),
          })
        }

        // Обновляем проект после добавления участников
        fetchProject()
      }

      toast({
        title: "Успешно",
        description: "Проект успешно обновлен",
      })
    } catch (err) {
      console.error("Ошибка при обновлении проекта:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить проект",
        variant: "destructive",
      })
    }
  }

  const addMember = async (data: z.infer<typeof memberSchema>) => {
    try {
      const response = await fetch(`/api/projects/${id}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось добавить участника")
      }

      const newMember = await response.json()

      // Обновляем список участников
      if (project) {
        setProject({
          ...project,
          members: [...project.members, newMember],
        })
      }

      setIsAddingMember(false)
      memberForm.reset()

      toast({
        title: "Успешно",
        description: "Участник успешно добавлен",
      })
    } catch (err) {
      console.error("Ошибка при добавлении участника:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить участника",
        variant: "destructive",
      })
    }
  }

  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/projects/${id}/members/${memberId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить участника")
      }

      // Обновляем список участников
      if (project) {
        setProject({
          ...project,
          members: project.members.filter((member) => member.id !== memberId),
        })
      }

      toast({
        title: "Успешно",
        description: "Участник успешно удален",
      })
    } catch (err) {
      console.error("Ошибка при удалении участника:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить участника",
        variant: "destructive",
      })
    }
  }

  const deleteProject = async () => {
    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить проект")
      }

      toast({
        title: "Успешно",
        description: "Проект успешно удален",
      })

      router.push("/projects")
    } catch (err) {
      console.error("Ошибка при удалении проекта:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить проект",
        variant: "destructive",
      })
    }
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

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Ошибка</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/projects")}>Вернуться к списку проектов</Button>
        </CardFooter>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array(3)
                .fill(0)
                .map((_, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Проект не найден</CardTitle>
          <CardDescription>Запрашиваемый проект не существует или был удален</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/projects")}>Вернуться к списку проектов</Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>{project.name}</CardTitle>
              <Badge variant="outline" className={getStatusColor(project.status)}>
                {getStatusText(project.status)}
              </Badge>
            </div>
            <CardDescription>Создан {new Date(project.createdAt).toLocaleDateString("ru-RU")}</CardDescription>
          </div>
          <div className="flex gap-2">
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4 mr-1" />
                  Редактировать
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Редактировать проект</DialogTitle>
                  <DialogDescription>Измените информацию о проекте</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(updateProject)} className="space-y-4">
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
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Отмена
                      </Button>
                      <Button type="submit">Сохранить изменения</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash className="h-4 w-4 mr-1" />
                  Удалить
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Удалить проект</DialogTitle>
                  <DialogDescription>
                    Вы уверены, что хотите удалить проект? Это действие нельзя отменить.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
                    Отмена
                  </Button>
                  <Button variant="destructive" onClick={deleteProject}>
                    Удалить
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Описание</h3>
            <p className="text-muted-foreground">{project.description || "Описание отсутствует"}</p>
          </div>

          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Начало: {new Date(project.startDate).toLocaleDateString("ru-RU")}</span>
            </div>
            {project.endDate && (
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Окончание: {new Date(project.endDate).toLocaleDateString("ru-RU")}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Участников: {project.members.length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Участники</TabsTrigger>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
        </TabsList>
        <TabsContent value="members" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Участники проекта</h3>
            <Dialog open={isAddingMember} onOpenChange={setIsAddingMember}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить участника
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить участника</DialogTitle>
                  <DialogDescription>Выберите пользователя и укажите его роль в проекте</DialogDescription>
                </DialogHeader>

                <Form {...memberForm}>
                  <form onSubmit={memberForm.handleSubmit(addMember)} className="space-y-4">
                    <FormField
                      control={memberForm.control}
                      name="userId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Пользователь *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Выберите пользователя" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {users
                                .filter((user) => !project.members.some((member) => member.user.id === user.id))
                                .map((user) => (
                                  <SelectItem key={user.id} value={user.id}>
                                    {user.name} - {user.position}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={memberForm.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Роль в проекте *</FormLabel>
                          <FormControl>
                            <Input placeholder="Например: Разработчик, Дизайнер, Менеджер" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsAddingMember(false)}>
                        Отмена
                      </Button>
                      <Button type="submit">Добавить</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {project.members.length > 0 ? (
              project.members.map((member) => (
                <Card key={member.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.user.avatar} alt={member.user.name} />
                          <AvatarFallback>{member.user.initials}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{member.user.name}</h4>
                          <p className="text-sm text-muted-foreground">{member.role}</p>
                          <p className="text-xs text-muted-foreground">{member.user.position}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeMember(member.id)}>
                        <Trash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-muted-foreground mb-4">В проекте пока нет участников</p>
                  <Button onClick={() => setIsAddingMember(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Добавить участника
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
        <TabsContent value="tasks" className="space-y-4 mt-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Задачи проекта</h3>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Создать задачу
            </Button>
          </div>

          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">Функционал задач проекта находится в разработке</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

