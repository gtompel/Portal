"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Mail, Phone, UserPlus, Loader2 } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"

type Employee = {
  id: string
  name: string
  position: string
  department: string
  email: string
  phone: string
  avatar?: string
  initials: string
  status: "WORKING" | "ON_VACATION" | "REMOTE"
  location?: string
}

export function EmployeeDirectory() {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [departments, setDepartments] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Форма добавления сотрудника
  const employeeSchema = z
    .object({
      name: z.string().min(3, "Имя должно содержать минимум 3 символа"),
      email: z.string().email("Введите корректный email"),
      position: z.string().min(2, "Должность должна содержать минимум 2 символа"),
      department: z.string().min(2, "Отдел должен содержать минимум 2 символа"),
      phone: z.string().optional(),
      location: z.string().optional(),
      status: z.enum(["WORKING", "ON_VACATION", "REMOTE"]),
      password: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
      confirmPassword: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Пароли не совпадают",
      path: ["confirmPassword"],
    })

  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      position: "",
      department: "",
      phone: "",
      location: "",
      status: "WORKING",
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    fetchEmployees()
  }, [])

  useEffect(() => {
    if (employees.length) {
      filterEmployees()

      // Получаем уникальные отделы
      const uniqueDepartments = Array.from(new Set(employees.map((emp) => emp.department)))
      setDepartments(uniqueDepartments)
    }
  }, [searchTerm, departmentFilter, employees])

  const fetchEmployees = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/users")

      if (!response.ok) {
        throw new Error("Не удалось загрузить сотрудников")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedEmployees = data.map((item: any) => ({
        id: item.id,
        name: item.name,
        position: item.position,
        department: item.department,
        email: item.email,
        phone: item.phone || "",
        avatar: item.avatar,
        initials: item.initials || getInitials(item.name),
        status: item.status,
        location: item.location,
      }))

      setEmployees(formattedEmployees)
      setFilteredEmployees(formattedEmployees)
    } catch (err) {
      console.error("Ошибка при загрузке сотрудников:", err)
      setError("Не удалось загрузить сотрудников")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить список сотрудников",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const filterEmployees = () => {
    let result = [...employees]

    if (searchTerm) {
      result = result.filter(
        (emp) =>
          emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    if (departmentFilter !== "all") {
      result = result.filter((emp) => emp.department === departmentFilter)
    }

    setFilteredEmployees(result)
  }

  const createEmployee = async (data: z.infer<typeof employeeSchema>) => {
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          position: data.position,
          department: data.department,
          phone: data.phone,
          location: data.location,
          status: data.status,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Не удалось создать сотрудника")
      }

      const newEmployee = await response.json()

      // Добавляем нового сотрудника в список
      const formattedEmployee: Employee = {
        id: newEmployee.id,
        name: newEmployee.name,
        position: newEmployee.position,
        department: newEmployee.department,
        email: newEmployee.email,
        phone: newEmployee.phone || "",
        avatar: newEmployee.avatar,
        initials: newEmployee.initials || getInitials(newEmployee.name),
        status: newEmployee.status,
        location: newEmployee.location,
      }

      setEmployees((prev) => [...prev, formattedEmployee])

      toast({
        title: "Успешно",
        description: "Сотрудник успешно добавлен",
      })

      form.reset()
    } catch (err) {
     // console.error("Ошибка при создании сотрудника:", err)
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось создать сотрудника",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: Employee["status"]) => {
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

  const getStatusText = (status: Employee["status"]) => {
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

  // Функция для получения инициалов из имени
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <Button onClick={fetchEmployees} className="mt-2">
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

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <UserPlus className="h-4 w-4" />
              <span>Добавить сотрудника</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Добавить сотрудника</DialogTitle>
              <DialogDescription>Заполните информацию для добавления нового сотрудника</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(createEmployee)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ФИО</FormLabel>
                      <FormControl>
                        <Input placeholder="Иванов Иван Иванович" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="ivanov@example.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Должность</FormLabel>
                        <FormControl>
                          <Input placeholder="Менеджер" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="department"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Отдел</FormLabel>
                        <FormControl>
                          <Input placeholder="Маркетинг" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+7 (999) 123-45-67" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Местоположение</FormLabel>
                        <FormControl>
                          <Input placeholder="Москва, Россия" {...field} />
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
                      <FormLabel>Статус</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="WORKING">Работает</SelectItem>
                          <SelectItem value="ON_VACATION">В отпуске</SelectItem>
                          <SelectItem value="REMOTE">Удаленно</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Пароль</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Подтверждение пароля</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Добавить сотрудника
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array(8)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </CardHeader>
                <CardContent className="pb-2 text-center">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto mb-2" />
                  <Skeleton className="h-6 w-32 mx-auto mb-1" />
                  <Skeleton className="h-4 w-48 mx-auto mb-4" />
                  <div className="flex justify-center gap-2 mb-2">
                    <Skeleton className="h-8 w-8 rounded-md" />
                    <Skeleton className="h-8 w-8 rounded-md" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-9 w-full rounded-md" />
                </CardFooter>
              </Card>
            ))
        ) : filteredEmployees.length > 0 ? (
          filteredEmployees.map((employee) => (
            <Card key={employee.id} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <Badge variant="outline" className={getStatusColor(employee.status)}>
                    {getStatusText(employee.status)}
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

