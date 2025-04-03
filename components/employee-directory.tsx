"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Phone, UserPlus } from "lucide-react"

type Employee = {
  id: string
  name: string
  position: string
  department: string
  email: string
  phone: string
  avatar: string
  initials: string
  status: "работает" | "в отпуске" | "удаленно"
}

const employees: Employee[] = [
  {
    id: "EMP-1001",
    name: "Иван Петров",
    position: "Генеральный директор",
    department: "Руководство",
    email: "i.petrov@example.com",
    phone: "+7 (999) 123-45-67",
    avatar: "/placeholder-user.jpg",
    initials: "ИП",
    status: "работает",
  },
  {
    id: "EMP-1002",
    name: "Мария Сидорова",
    position: "Руководитель отдела маркетинга",
    department: "Маркетинг",
    email: "m.sidorova@example.com",
    phone: "+7 (999) 234-56-78",
    avatar: "/placeholder-user.jpg",
    initials: "МС",
    status: "работает",
  },
  {
    id: "EMP-1003",
    name: "Алексей Иванов",
    position: "Старший разработчик",
    department: "IT",
    email: "a.ivanov@example.com",
    phone: "+7 (999) 345-67-89",
    avatar: "/placeholder-user.jpg",
    initials: "АИ",
    status: "удаленно",
  },
  {
    id: "EMP-1004",
    name: "Елена Смирнова",
    position: "Дизайнер",
    department: "Дизайн",
    email: "e.smirnova@example.com",
    phone: "+7 (999) 456-78-90",
    avatar: "/placeholder-user.jpg",
    initials: "ЕС",
    status: "работает",
  },
  {
    id: "EMP-1005",
    name: "Дмитрий Козлов",
    position: "Финансовый аналитик",
    department: "Финансы",
    email: "d.kozlov@example.com",
    phone: "+7 (999) 567-89-01",
    avatar: "/placeholder-user.jpg",
    initials: "ДК",
    status: "в отпуске",
  },
  {
    id: "EMP-1006",
    name: "Анна Михайлова",
    position: "HR-менеджер",
    department: "HR",
    email: "a.mikhailova@example.com",
    phone: "+7 (999) 678-90-12",
    avatar: "/placeholder-user.jpg",
    initials: "АМ",
    status: "работает",
  },
  {
    id: "EMP-1007",
    name: "Сергей Новиков",
    position: "Системный администратор",
    department: "IT",
    email: "s.novikov@example.com",
    phone: "+7 (999) 789-01-23",
    avatar: "/placeholder-user.jpg",
    initials: "СН",
    status: "работает",
  },
  {
    id: "EMP-1008",
    name: "Ольга Кузнецова",
    position: "Бухгалтер",
    department: "Финансы",
    email: "o.kuznetsova@example.com",
    phone: "+7 (999) 890-12-34",
    avatar: "/placeholder-user.jpg",
    initials: "ОК",
    status: "удаленно",
  },
]

const getStatusColor = (status: Employee["status"]) => {
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

export function EmployeeDirectory() {
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")

  const departments = Array.from(new Set(employees.map((emp) => emp.department)))

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesDepartment = departmentFilter === "all" || emp.department === departmentFilter

    return matchesSearch && matchesDepartment
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск сотрудников..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Все отделы" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все отделы</SelectItem>
              {departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button className="gap-1">
          <UserPlus className="h-4 w-4" />
          <span>Добавить сотрудника</span>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <Card key={employee.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Badge variant="outline" className={getStatusColor(employee.status)}>
                    {employee.status}
                  </Badge>
                  <CardDescription>{employee.department}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="pb-2 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-2">
                  <AvatarImage src={employee.avatar} alt={employee.name} />
                  <AvatarFallback className="text-xl">{employee.initials}</AvatarFallback>
                </Avatar>
                <CardTitle className="mb-1">{employee.name}</CardTitle>
                <CardDescription className="mb-4">{employee.position}</CardDescription>
                <div className="flex justify-center gap-2 mb-2">
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`mailto:${employee.email}`}>
                      <Mail className="h-4 w-4" />
                      <span className="sr-only">Email</span>
                    </Link>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <Link href={`tel:${employee.phone.replace(/\D/g, "")}`}>
                      <Phone className="h-4 w-4" />
                      <span className="sr-only">Телефон</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="secondary" className="w-full" asChild>
                  <Link href={`/employees/${employee.id}`}>Профиль</Link>
                </Button>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p>Сотрудники не найдены.</p>
          </div>
        )}
      </div>
    </div>
  )
}

