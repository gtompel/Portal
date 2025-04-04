"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageSquare, Plus, Loader2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"

type Announcement = {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    initials: string
  }
  date: string
  category: "IMPORTANT" | "NEWS" | "EVENT"
  likes: number
  comments: number
}

export function Announcements() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Форма создания объявления
  const announcementSchema = z.object({
    title: z.string().min(3, "Заголовок должен содержать минимум 3 символа"),
    content: z.string().min(10, "Содержание должно содержать минимум 10 символов"),
    category: z.enum(["IMPORTANT", "NEWS", "EVENT"]),
  })

  const form = useForm<z.infer<typeof announcementSchema>>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      category: "NEWS",
    },
  })

  useEffect(() => {
    fetchAnnouncements()
  }, [])

  const fetchAnnouncements = async () => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/announcements")

      if (!response.ok) {
        throw new Error("Не удалось загрузить объявления")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedAnnouncements = data.map((item: any) => ({
        id: item.id,
        title: item.title,
        content: item.content,
        author: {
          id: item.author?.id || "unknown",
          name: item.author?.name || "Неизвестный пользователь",
          avatar: item.author?.avatar,
          initials: item.author?.initials || getInitials(item.author?.name || "Неизвестный пользователь"),
        },
        date: item.createdAt,
        category: item.category,
        likes: item.likes || 0,
        comments: item.comments || 0,
      }))

      setAnnouncements(formattedAnnouncements)
    } catch (err) {
      console.error("Ошибка при загрузке объявлений:", err)
      setError("Не удалось з��грузить объявления")
    } finally {
      setIsLoading(false)
    }
  }

  const createAnnouncement = async (data: z.infer<typeof announcementSchema>) => {
    if (!session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Вы должны быть авторизованы для создания объявлений",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          authorId: session.user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось создать объявление")
      }

      const newAnnouncement = await response.json()

      // Добавляем новое объявление в список
      const formattedAnnouncement: Announcement = {
        id: newAnnouncement.id,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        author: {
          id: session.user.id,
          name: session.user.name || "Пользователь",
          initials: getInitials(session.user.name || "Пользователь"),
        },
        date: newAnnouncement.createdAt,
        category: newAnnouncement.category,
        likes: 0,
        comments: 0,
      }

      setAnnouncements((prev) => [formattedAnnouncement, ...prev])

      toast({
        title: "Успешно",
        description: "Объявление успешно создано",
      })

      form.reset()
    } catch (err) {
      console.error("Ошибка при создании объявления:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось создать объявление",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleLike = async (id: string) => {
    try {
      const response = await fetch(`/api/announcements/${id}/like`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Не удалось поставить лайк")
      }

      // Обновляем количество лайков в списке
      setAnnouncements((prev) =>
        prev.map((announcement) =>
          announcement.id === id ? { ...announcement, likes: announcement.likes + 1 } : announcement,
        ),
      )
    } catch (err) {
      console.error("Ошибка при постановке лайка:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось поставить лайк",
        variant: "destructive",
      })
    }
  }

  const getCategoryColor = (category: Announcement["category"]) => {
    switch (category) {
      case "IMPORTANT":
        return "bg-red-100 text-red-800"
      case "NEWS":
        return "bg-blue-100 text-blue-800"
      case "EVENT":
        return "bg-green-100 text-green-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getCategoryText = (category: Announcement["category"]) => {
    switch (category) {
      case "IMPORTANT":
        return "важное"
      case "NEWS":
        return "новость"
      case "EVENT":
        return "событие"
      default:
        return category
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
          <Button onClick={fetchAnnouncements} className="mt-2">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Объявления</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Новое объявление</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать объявление</DialogTitle>
              <DialogDescription>Заполните информацию для создания нового объявления</DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(createAnnouncement)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Заголовок</FormLabel>
                      <FormControl>
                        <Input placeholder="Введите заголовок объявления" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Содержание</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Введите текст объявления" className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Категория</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите категорию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NEWS">Новость</SelectItem>
                          <SelectItem value="IMPORTANT">Важное</SelectItem>
                          <SelectItem value="EVENT">Событие</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Опубликовать
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading ? (
          Array(3)
            .fill(0)
            .map((_, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <Skeleton className="h-5 w-64" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-6 w-24" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardFooter>
              </Card>
            ))
        ) : announcements.length > 0 ? (
          announcements.map((announcement) => (
            <Card key={announcement.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle>{announcement.title}</CardTitle>
                    <CardDescription>{new Date(announcement.date).toLocaleDateString("ru-RU")}</CardDescription>
                  </div>
                  <Badge variant="outline" className={getCategoryColor(announcement.category)}>
                    {getCategoryText(announcement.category)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p>{announcement.content}</p>
              </CardContent>
              <CardFooter className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={announcement.author.avatar} alt={announcement.author.name} />
                    <AvatarFallback>{announcement.author.initials}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">{announcement.author.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleLike(announcement.id)}>
                    <ThumbsUp className="h-4 w-4" />
                    <span>{announcement.likes}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="gap-1">
                    <MessageSquare className="h-4 w-4" />
                    <span>{announcement.comments}</span>
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10">
              <p className="text-muted-foreground mb-4">Объявлений пока нет</p>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать объявление
                </Button>
              </DialogTrigger>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

