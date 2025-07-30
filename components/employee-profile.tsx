"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AvatarUpload } from "@/components/avatar-upload"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  MessageSquare,
  Camera,
  Loader2,
  Plus,
  Edit,
  Trash,
  PencilLine,
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type EmployeeDetails = {
  id: string
  name: string
  position: string
  department: string
  email: string
  phone: string | null
  avatar: string | null
  initials: string
  status: "WORKING" | "ON_VACATION" | "REMOTE"
  location: string | null
  hireDate: string
  birthday: string | null
  manager: {
    id: string
    name: string
    position: string
    email: string
  } | null
  bio: string | null
  skills: {
    id: string
    name: string
  }[]
  education: {
    id: string
    degree: string
    institution: string
    year: string
  }[]
  experience: {
    id: string
    position: string
    company: string
    period: string
    description: string | null
  }[]
  projects: {
    project: {
      id: string
      name: string
      status: "ACTIVE" | "COMPLETED" | "SUSPENDED"
    }
    role: string
    id: string
  }[]
}

export function EmployeeProfile({ id }: { id: string }) {
  const { data: session } = useSession()
  const [employeeData, setEmployeeData] = useState<EmployeeDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [isEditingBio, setIsEditingBio] = useState(false)
  const [isAddingEducation, setIsAddingEducation] = useState(false)
  const [isEditingEducation, setIsEditingEducation] = useState(false)
  const [currentEducation, setCurrentEducation] = useState<any>(null)
  const [isAddingExperience, setIsAddingExperience] = useState(false)
  const [isEditingExperience, setIsEditingExperience] = useState(false)
  const [currentExperience, setCurrentExperience] = useState<any>(null)

  const { toast } = useToast()

  // Форма для редактирования биографии
  const bioSchema = z.object({
    bio: z.string().optional(),
  })

  const bioForm = useForm<z.infer<typeof bioSchema>>({
    resolver: zodResolver(bioSchema),
    defaultValues: {
      bio: employeeData?.bio || "",
    },
  })

  // Форма для образования
  const educationSchema = z.object({
    degree: z.string().min(2, "Укажите степень/квалификацию"),
    institution: z.string().min(2, "Укажите учебное заведение"),
    year: z.string().min(4, "Укажите год"),
  })

  const educationForm = useForm<z.infer<typeof educationSchema>>({
    resolver: zodResolver(educationSchema),
    defaultValues: {
      degree: "",
      institution: "",
      year: "",
    },
  })

  // Форма для опыта работы
  const experienceSchema = z.object({
    position: z.string().min(2, "Укажите должность"),
    company: z.string().min(2, "Укажите компанию"),
    period: z.string().min(2, "Укажите период работы"),
    description: z.string().optional(),
  })

  const experienceForm = useForm<z.infer<typeof experienceSchema>>({
    resolver: zodResolver(experienceSchema),
    defaultValues: {
      position: "",
      company: "",
      period: "",
      description: "",
    },
  })

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${id}`)

        if (!response.ok) {
          throw new Error("Не удалось загрузить данные сотрудника")
        }

        const data = await response.json()

        // Преобразуем данные в нужный формат
        const formattedEmployee: EmployeeDetails = {
          id: data.id,
          name: data.name,
          position: data.position,
          department: data.department,
          email: data.email,
          phone: data.phone,
          avatar: data.avatar,
          initials: data.initials || getInitials(data.name),
          status: data.status,
          location: data.location,
          hireDate: data.hireDate,
          birthday: data.birthday,
          manager: data.manager,
          bio: data.bio,
          skills: data.skills || [],
          education: data.education || [],
          experience: data.experience || [],
          projects: data.projects || [],
        }

        setEmployeeData(formattedEmployee)
      } catch (error) {
        console.error("Ошибка при загрузке данных сотрудника:", error)
        setError("Не удалось загрузить данные сотрудника")
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить профиль сотрудника",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchEmployeeData()
    }
  }, [id, bioForm])

  // Устанавливаем значения в форму редактирования образования
  useEffect(() => {
    if (currentEducation) {
      educationForm.setValue("degree", currentEducation.degree)
      educationForm.setValue("institution", currentEducation.institution)
      educationForm.setValue("year", currentEducation.year)
    }
  }, [currentEducation, educationForm])

  // Устанавливаем значения в форму редактирования опыта работы
  useEffect(() => {
    if (currentExperience) {
      experienceForm.setValue("position", currentExperience.position)
      experienceForm.setValue("company", currentExperience.company)
      experienceForm.setValue("period", currentExperience.period)
      experienceForm.setValue("description", currentExperience.description || "")
    }
  }, [currentExperience, experienceForm])

  const handleAvatarChange = async (avatarUrl: string) => {
    try {
      // Обновляем аватар в базе данных
      const updateResponse = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          avatar: avatarUrl,
        }),
      })

      if (!updateResponse.ok) {
        throw new Error("Ошибка при обновлении профиля")
      }

      // Обновляем локальное состояние
      setEmployeeData((prev) => prev ? {
        ...prev,
        avatar: avatarUrl,
      } : null)
    } catch (error) {
      console.error("Ошибка обновления аватара:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить фото профиля",
        variant: "destructive",
      })
    }
  }

  const updateBio = async (data: z.infer<typeof bioSchema>) => {
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bio: data.bio,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить информацию")
      }

      const updatedUser = await response.json()

      // Обновляем данные сотрудника
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          bio: data.bio || null,
        })
      }

      setIsEditingBio(false)
      toast({
        title: "Успешно",
        description: "Информация о сотруднике обновлена",
      })
    } catch (err) {
     // console.error("Ошибка при обновлении информации:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить информацию",
        variant: "destructive",
      })
    }
  }

  const addEducation = async (data: z.infer<typeof educationSchema>) => {
    try {
      const response = await fetch(`/api/users/${id}/education`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось добавить образование")
      }

      const newEducation = await response.json()

      // Обновляем данные сотрудника
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          education: [...employeeData.education, newEducation],
        })
      }

      setIsAddingEducation(false)
      educationForm.reset()
      toast({
        title: "Успешно",
        description: "Информация об образовании добавлена",
      })
    } catch (err) {
     // console.error("Ошибка при добавлении образования:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить образование",
        variant: "destructive",
      })
    }
  }

  const updateEducation = async (data: z.infer<typeof educationSchema>) => {
    if (!currentEducation) return

    try {
      const response = await fetch(`/api/users/${id}/education/${currentEducation.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить образование")
      }

      const updatedEducation = await response.json()

      // Обновляем данные сотрудника
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          education: employeeData.education.map((edu) => (edu.id === currentEducation.id ? updatedEducation : edu)),
        })
      }

      setIsEditingEducation(false)
      setCurrentEducation(null)
      toast({
        title: "Успешно",
        description: "Информация об образовании обновлена",
      })
    } catch (err) {
     // console.error("Ошибка при обновлении образования:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить образование",
        variant: "destructive",
      })
    }
  }

  const deleteEducation = async (educationId: string) => {
    try {
      const response = await fetch(`/api/users/${id}/education/${educationId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить образование")
      }

      // Обновляем данные сотрудника
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          education: employeeData.education.filter((edu) => edu.id !== educationId),
        })
      }

      toast({
        title: "Успешно",
        description: "Информация об образовании удалена",
      })
    } catch (err) {
      console.error("Ошибка при удалении образования:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить образование",
        variant: "destructive",
      })
    }
  }

  const addExperience = async (data: z.infer<typeof experienceSchema>) => {
    try {
      const response = await fetch(`/api/users/${id}/experience`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось добавить опыт работы")
      }

      const newExperience = await response.json()

      // Обновляем данные сотрудника
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          experience: [...employeeData.experience, newExperience],
        })
      }

      setIsAddingExperience(false)
      experienceForm.reset()
      toast({
        title: "Успешно",
        description: "Информация об опыте работы добавлена",
      })
    } catch (err) {
     // console.error("Ошибка при добавлении опыта работы:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось добавить опыт работы",
        variant: "destructive",
      })
    }
  }

  const updateExperience = async (data: z.infer<typeof experienceSchema>) => {
    if (!currentExperience) return

    try {
      const response = await fetch(`/api/users/${id}/experience/${currentExperience.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error("Не удалось обновить опыт работы")
      }

      const updatedExperience = await response.json()

      // Обновляем данные сотрудника
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          experience: employeeData.experience.map((exp) => (exp.id === currentExperience.id ? updatedExperience : exp)),
        })
      }

      setIsEditingExperience(false)
      setCurrentExperience(null)
      toast({
        title: "Успешно",
        description: "Информация об опыте работы обновлена",
      })
    } catch (err) {
     // console.error("Ошибка при обновлении опыта работы:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить опыт работы",
        variant: "destructive",
      })
    }
  }

  const deleteExperience = async (experienceId: string) => {
    try {
      const response = await fetch(`/api/users/${id}/experience/${experienceId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить опыт работы")
      }

      // Обновляем данные сотрудника
      if (employeeData) {
        setEmployeeData({
          ...employeeData,
          experience: employeeData.experience.filter((exp) => exp.id !== experienceId),
        })
      }

      toast({
        title: "Успешно",
        description: "Информация об опыте работы удалена",
      })
    } catch (err) {
      //console.error("Ошибка при удалении опыта работы:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить опыт работы",
        variant: "destructive",
      })
    }
  }



  const getStatusColor = (status: string) => {
    switch (status) {
      case "WORKING":
        return "bg-green-100 text-green-800"
      case "ON_VACATION":
        return "bg-yellow-100 text-yellow-800"
      case "REMOTE":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "WORKING":
        return "работает"
      case "ON_VACATION":
        return "в отпуске"
      case "REMOTE":
        return "удаленно"
      default:
        return status
    }
  }

  const getProjectStatusColor = (status: "ACTIVE" | "COMPLETED" | "SUSPENDED") => {
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

  const getProjectStatusText = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "активный"
      case "COMPLETED":
        return "завершен"
      case "SUSPENDED":
        return "приостановлен"
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
          <Button onClick={() => window.location.reload()}>Повторить попытку</Button>
        </CardFooter>
      </Card>
    )
  }

  if (isLoading) {
    return <EmployeeProfileSkeleton />
  }

  if (!employeeData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Профиль сотрудника не найден</CardTitle>
          <CardDescription>Запрашиваемый профиль не существует или был удален</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const isOwnProfile = session?.user?.id === id

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-4">
              {isOwnProfile ? (
                <AvatarUpload
                  currentAvatar={employeeData.avatar || undefined}
                  initials={employeeData.initials}
                  onAvatarChange={handleAvatarChange}
                  size="lg"
                  className="mx-auto"
                />
              ) : (
                <Avatar className="h-32 w-32 mx-auto">
                  <AvatarImage src={employeeData.avatar || undefined} alt={employeeData.name} showModal={true} />
                  <AvatarFallback className="text-4xl">{employeeData.initials}</AvatarFallback>
                </Avatar>
              )}
            </div>
            <h2 className="text-2xl font-bold">{employeeData.name}</h2>
            <p className="text-muted-foreground mb-2">{employeeData.position}</p>
            <Badge variant="outline" className={getStatusColor(employeeData.status)}>
              {getStatusText(employeeData.status)}
            </Badge>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${employeeData.email}`} className="text-sm hover:underline">
                  {employeeData.email}
                </a>
              </div>
              {employeeData.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${employeeData.phone.replace(/\D/g, "")}`} className="text-sm hover:underline">
                    {employeeData.phone}
                  </a>
                </div>
              )}
              {employeeData.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{employeeData.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{employeeData.department}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  В компании с {new Date(employeeData.hireDate).toLocaleDateString("ru-RU")}
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Button variant="outline" className="w-full" asChild>
              <a href={`/messages?user=${employeeData.id}`}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Сообщение
              </a>
            </Button>
          </CardFooter>
        </Card>

        {employeeData.skills && employeeData.skills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Навыки</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {employeeData.skills.map((skill) => (
                  <Badge key={skill.id} variant="secondary">
                    {skill.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <CardTitle>О сотруднике</CardTitle>
            {isOwnProfile && (
              <Button variant="ghost" size="sm" onClick={() => setIsEditingBio(true)}>
                <PencilLine className="h-4 w-4 mr-1" />
                Редактировать
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <p>{employeeData.bio || "Информация отсутствует"}</p>
          </CardContent>
        </Card>

        <Dialog open={isEditingBio} onOpenChange={setIsEditingBio}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Редактировать информацию</DialogTitle>
              <DialogDescription>Расскажите о себе, своих интересах и профессиональных целях</DialogDescription>
            </DialogHeader>
            <Form {...bioForm}>
              <form onSubmit={bioForm.handleSubmit(updateBio)} className="space-y-4">
                <FormField
                  control={bioForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>О себе</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Расскажите о себе..."
                          className="min-h-[150px]"
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsEditingBio(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">Сохранить</Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Tabs defaultValue="experience">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="experience">Опыт работы</TabsTrigger>
            <TabsTrigger value="education">Образование</TabsTrigger>
            <TabsTrigger value="projects">Проекты</TabsTrigger>
          </TabsList>

          <TabsContent value="experience" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Опыт работы</h3>
              {isOwnProfile && (
                <Button size="sm" onClick={() => setIsAddingExperience(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить
                </Button>
              )}
            </div>

            {employeeData.experience && employeeData.experience.length > 0 ? (
              employeeData.experience.map((exp) => (
                <Card key={exp.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-lg">{exp.position}</CardTitle>
                        <CardDescription>
                          {exp.company} | {exp.period}
                        </CardDescription>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentExperience(exp)
                              setIsEditingExperience(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Запись об опыте работы будет удалена.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteExperience(exp.id)}>Удалить</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p>{exp.description}</p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Информация об опыте работы отсутствует
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="education" className="space-y-4 mt-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Образование</h3>
              {isOwnProfile && (
                <Button size="sm" onClick={() => setIsAddingEducation(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Добавить
                </Button>
              )}
            </div>

            {employeeData.education && employeeData.education.length > 0 ? (
              employeeData.education.map((edu) => (
                <Card key={edu.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div>
                        <CardTitle className="text-lg">{edu.degree}</CardTitle>
                        <CardDescription>
                          {edu.institution} | {edu.year}
                        </CardDescription>
                      </div>
                      {isOwnProfile && (
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setCurrentEducation(edu)
                              setIsEditingEducation(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Запись об образовании будет удалена.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteEducation(edu.id)}>Удалить</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Информация об образовании отсутствует
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4 mt-4">
            {employeeData.projects && employeeData.projects.length > 0 ? (
              employeeData.projects.map((project) => (
                <Card key={project.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{project.project.name}</CardTitle>
                        <CardDescription>{project.role}</CardDescription>
                      </div>
                      <Badge variant="outline" className={getProjectStatusColor(project.project.status)}>
                        {getProjectStatusText(project.project.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-6 text-center text-muted-foreground">
                  Информация о проектах отсутствует
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Диалог добавления образования */}
      <Dialog open={isAddingEducation} onOpenChange={setIsAddingEducation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить образование</DialogTitle>
            <DialogDescription>Укажите информацию о вашем образовании</DialogDescription>
          </DialogHeader>
          <Form {...educationForm}>
            <form onSubmit={educationForm.handleSubmit(addEducation)} className="space-y-4">
              <FormField
                control={educationForm.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Степень/Квалификация</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Бакалавр информатики" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={educationForm.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Учебное заведение</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: МГУ им. Ломоносова" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={educationForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Год окончания</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: 2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingEducation(false)}>
                  Отмена
                </Button>
                <Button type="submit">Добавить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования образования */}
      <Dialog open={isEditingEducation} onOpenChange={setIsEditingEducation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать образование</DialogTitle>
            <DialogDescription>Измените информацию о вашем образовании</DialogDescription>
          </DialogHeader>
          <Form {...educationForm}>
            <form onSubmit={educationForm.handleSubmit(updateEducation)} className="space-y-4">
              <FormField
                control={educationForm.control}
                name="degree"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Степень/Квалификация</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Бакалавр информатики" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={educationForm.control}
                name="institution"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Учебное заведение</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: МГУ им. Ломоносова" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={educationForm.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Год окончания</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: 2020" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingEducation(false)
                    setCurrentEducation(null)
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог добавления опыта работы */}
      <Dialog open={isAddingExperience} onOpenChange={setIsAddingExperience}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Добавить опыт работы</DialogTitle>
            <DialogDescription>Укажите информацию о вашем опыте работы</DialogDescription>
          </DialogHeader>
          <Form {...experienceForm}>
            <form onSubmit={experienceForm.handleSubmit(addExperience)} className="space-y-4">
              <FormField
                control={experienceForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Должность</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Старший разработчик" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={experienceForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Компания</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: ООО 'Технологии'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={experienceForm.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Период работы</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: 2018-2022" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={experienceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите ваши обязанности и достижения..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddingExperience(false)}>
                  Отмена
                </Button>
                <Button type="submit">Добавить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования опыта работы */}
      <Dialog open={isEditingExperience} onOpenChange={setIsEditingExperience}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать опыт работы</DialogTitle>
            <DialogDescription>Измените информацию о вашем опыте работы</DialogDescription>
          </DialogHeader>
          <Form {...experienceForm}>
            <form onSubmit={experienceForm.handleSubmit(updateExperience)} className="space-y-4">
              <FormField
                control={experienceForm.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Должность</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: Старший разработчик" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={experienceForm.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Компания</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: ООО 'Технологии'" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={experienceForm.control}
                name="period"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Период работы</FormLabel>
                    <FormControl>
                      <Input placeholder="Например: 2018-2022" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={experienceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите ваши обязанности и достижения..."
                        className="min-h-[100px]"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsEditingExperience(false)
                    setCurrentExperience(null)
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit">Сохранить</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Skeleton loader for the employee profile
function EmployeeProfileSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Skeleton className="h-32 w-32 rounded-full mx-auto mb-4" />
            <Skeleton className="h-8 w-48 mx-auto mb-2" />
            <Skeleton className="h-5 w-36 mx-auto mb-2" />
            <Skeleton className="h-5 w-24 mx-auto mb-4" />

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-52" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex gap-2">
            <Skeleton className="h-10 w-full" />
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
              <Skeleton className="h-6 w-28" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>

        <div>
          <Skeleton className="h-10 w-full mb-4" />

          <Card>
            <CardHeader className="pb-2">
              <Skeleton className="h-6 w-48 mb-2" />
              <Skeleton className="h-4 w-36" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

