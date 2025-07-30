"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageSquare } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"

type AnnouncementDetail = {
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

export function AnnouncementDetail({ id }: { id: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [announcement, setAnnouncement] = useState<AnnouncementDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnnouncementDetail()
  }, [id])

  const fetchAnnouncementDetail = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/announcements/${id}`)

      if (!response.ok) {
        throw new Error("Не удалось загрузить объявление")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedAnnouncement: AnnouncementDetail = {
        id: data.id,
        title: data.title,
        content: data.content,
        author: {
          id: data.author?.id || "unknown",
          name: data.author?.name || "Неизвестный пользователь",
          avatar: data.author?.avatar,
          initials: data.author?.initials || getInitials(data.author?.name || "Неизвестный пользователь"),
        },
        date: data.createdAt,
        category: data.category,
        likes: data.likes || 0,
        comments: data.comments || 0,
      }

      setAnnouncement(formattedAnnouncement)
    } catch (err) {
     // console.error("Ошибка при загрузке объявления:", err)
      setError("Не удалось загрузить объявление")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить объявление",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleLike = async () => {
    try {
      const response = await fetch(`/api/announcements/${id}/like`, {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Не удалось поставить лайк")
      }

      // Обновляем количество лайков
      setAnnouncement((prev) => (prev ? { ...prev, likes: data.likesCount || data.likes } : null))
    } catch (err: any) {
    //  console.error("Ошибка при постановке лайка:", err)
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось поставить лайк",
        variant: "destructive",
      })
    }
  }

  const getCategoryColor = (category: AnnouncementDetail["category"]) => {
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

  const getCategoryText = (category: AnnouncementDetail["category"]) => {
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

  // Функция для форматирования даты
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Проверяем, что дата валидна
      if (isNaN(date.getTime())) {
        return "Недавно"
      }
      return date.toLocaleDateString("ru-RU")
    } catch (error) {
     // console.error("Ошибка форматирования даты:", error)
      return "Недавно"
    }
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <Button onClick={fetchAnnouncementDetail} className="mt-2">
            Повторить
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
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
    )
  }

  if (!announcement) {
    return <div className="text-center py-10 text-muted-foreground">Объявление не найдено</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-2xl">{announcement.title}</CardTitle>
            <CardDescription>{formatDate(announcement.date)}</CardDescription>
          </div>
          <Badge variant="outline" className={getCategoryColor(announcement.category)}>
            {getCategoryText(announcement.category)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <p>{announcement.content}</p>
        </div>
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
          <Button variant="ghost" size="sm" className="gap-1" onClick={handleLike}>
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
  )
}

