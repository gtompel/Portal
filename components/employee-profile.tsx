"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, MapPin, Briefcase, Calendar, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"

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
  const [employeeData, setEmployeeData] = useState<EmployeeDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/users/${id}`)

        if (!response.ok) {
          throw new Error("Не удалось загрузить данные сотрудника")
        }

        const data = await response.json()
        setEmployeeData(data)
      } catch (err) {
        console.error("Ошибка при загрузке данных сотрудника:", err)
        setError("Не удалось загрузить данные сотрудника")
      } finally {
        setIsLoading(false)
      }
    }

    if (id) {
      fetchEmployeeData()
    }
  }, [id])

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

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Avatar className="h-32 w-32 mx-auto mb-4">
              <AvatarImage src={employeeData.avatar || undefined} alt={employeeData.name} />
              <AvatarFallback className="text-4xl">{employeeData.initials}</AvatarFallback>
            </Avatar>
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
          <CardHeader>
            <CardTitle>О сотруднике</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{employeeData.bio || "Информация отсутствует"}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="experience">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="experience">Опыт работы</TabsTrigger>
            <TabsTrigger value="education">Образование</TabsTrigger>
            <TabsTrigger value="projects">Проекты</TabsTrigger>
          </TabsList>

          <TabsContent value="experience" className="space-y-4 mt-4">
            {employeeData.experience && employeeData.experience.length > 0 ? (
              employeeData.experience.map((exp) => (
                <Card key={exp.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{exp.position}</CardTitle>
                    <CardDescription>
                      {exp.company} | {exp.period}
                    </CardDescription>
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
            {employeeData.education && employeeData.education.length > 0 ? (
              employeeData.education.map((edu) => (
                <Card key={edu.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{edu.degree}</CardTitle>
                    <CardDescription>
                      {edu.institution} | {edu.year}
                    </CardDescription>
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

