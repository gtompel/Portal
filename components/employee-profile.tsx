"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, MapPin, Briefcase, Calendar, MessageSquare } from "lucide-react"

type EmployeeDetails = {
  id: string
  name: string
  position: string
  department: string
  email: string
  phone: string
  avatar: string
  initials: string
  status: "работает" | "в отпуске" | "удаленно"
  location: string
  hireDate: string
  birthday: string
  manager: string
  bio: string
  skills: string[]
  education: {
    degree: string
    institution: string
    year: string
  }[]
  experience: {
    position: string
    company: string
    period: string
    description: string
  }[]
  projects: {
    name: string
    role: string
    period: string
    status: "активный" | "завершен" | "приостановлен"
  }[]
}

// Моковые данные для профиля сотрудника
const employeeData: EmployeeDetails = {
  id: "EMP-1001",
  name: "Иван Петров",
  position: "Генеральный директор",
  department: "Руководство",
  email: "i.petrov@example.com",
  phone: "+7 (999) 123-45-67",
  avatar: "/placeholder-user.jpg",
  initials: "ИП",
  status: "работает",
  location: "Москва, Россия",
  hireDate: "2020-01-15",
  birthday: "1980-05-20",
  manager: "",
  bio: "Опытный руководитель с более чем 15-летним стажем работы в IT-индустрии. Специализируется на развитии бизнеса и стратегическом планировании. Под его руководством компания выросла в 3 раза за последние 5 лет.",
  skills: [
    "Стратегическое планирование",
    "Управление персоналом",
    "Бизнес-анализ",
    "Переговоры",
    "Финансовое планирование",
    "Управление проектами",
  ],
  education: [
    {
      degree: "MBA, Бизнес-администрирование",
      institution: "Московская школа управления СКОЛКОВО",
      year: "2015",
    },
    {
      degree: "Магистр компьютерных наук",
      institution: "Московский государственный университет",
      year: "2005",
    },
  ],
  experience: [
    {
      position: "Генеральный директор",
      company: "ООО 'Инновационные Технологии'",
      period: "2020 - настоящее время",
      description: "Руководство компанией, стратегическое планирование, развитие бизнеса.",
    },
    {
      position: "Технический директор",
      company: "ООО 'ТехноСофт'",
      period: "2015 - 2020",
      description: "Руководство техническим отделом, разработка и внедрение новых технологий.",
    },
    {
      position: "Руководитель проектов",
      company: "ООО 'ИТ-Решения'",
      period: "2010 - 2015",
      description: "Управление IT-проектами, координация работы команды разработчиков.",
    },
  ],
  projects: [
    {
      name: "Разработка корпоративного портала",
      role: "Руководитель проекта",
      period: "2023 - настоящее время",
      status: "активный",
    },
    {
      name: "Внедрение CRM-системы",
      role: "Спонсор проекта",
      period: "2022 - 2023",
      status: "завершен",
    },
    {
      name: "Оптимизация бизнес-процессов",
      role: "Руководитель",
      period: "2021 - 2022",
      status: "завершен",
    },
  ],
}

const getStatusColor = (status: EmployeeDetails["status"]) => {
  switch (status) {
    case "работает":
      return "bg-green-100 text-green-800"
    case "в отпуске":
      return "bg-yellow-100 text-yellow-800"
    case "удаленно":
      return "bg-blue-100 text-blue-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getProjectStatusColor = (status: "активный" | "завершен" | "приостановлен") => {
  switch (status) {
    case "активный":
      return "bg-green-100 text-green-800"
    case "завершен":
      return "bg-blue-100 text-blue-800"
    case "приостановлен":
      return "bg-yellow-100 text-yellow-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function EmployeeProfile({ id }: { id: string }) {
  // В реальном приложении здесь был бы запрос к API для получения данных сотрудника по ID
  // Для демонстрации используем моковые данные

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6 text-center">
            <Avatar className="h-32 w-32 mx-auto mb-4">
              <AvatarImage src={employeeData.avatar} alt={employeeData.name} />
              <AvatarFallback className="text-4xl">{employeeData.initials}</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold">{employeeData.name}</h2>
            <p className="text-muted-foreground mb-2">{employeeData.position}</p>
            <Badge variant="outline" className={getStatusColor(employeeData.status)}>
              {employeeData.status}
            </Badge>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${employeeData.email}`} className="text-sm hover:underline">
                  {employeeData.email}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${employeeData.phone.replace(/\D/g, "")}`} className="text-sm hover:underline">
                  {employeeData.phone}
                </a>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{employeeData.location}</span>
              </div>
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

        <Card>
          <CardHeader>
            <CardTitle>Навыки</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {employeeData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>О сотруднике</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{employeeData.bio}</p>
          </CardContent>
        </Card>

        <Tabs defaultValue="experience">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="experience">Опыт работы</TabsTrigger>
            <TabsTrigger value="education">Образование</TabsTrigger>
            <TabsTrigger value="projects">Проекты</TabsTrigger>
          </TabsList>

          <TabsContent value="experience" className="space-y-4 mt-4">
            {employeeData.experience.map((exp, index) => (
              <Card key={index}>
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
            ))}
          </TabsContent>

          <TabsContent value="education" className="space-y-4 mt-4">
            {employeeData.education.map((edu, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{edu.degree}</CardTitle>
                  <CardDescription>
                    {edu.institution} | {edu.year}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="projects" className="space-y-4 mt-4">
            {employeeData.projects.map((project, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                      <CardDescription>
                        {project.role} | {project.period}
                      </CardDescription>
                    </div>
                    <Badge variant="outline" className={getProjectStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

