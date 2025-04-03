"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThumbsUp, MessageSquare, Plus } from "lucide-react"

type Announcement = {
  id: string
  title: string
  content: string
  author: {
    name: string
    avatar: string
    initials: string
  }
  date: string
  category: "важное" | "новость" | "событие"
  likes: number
  comments: number
}

const announcements: Announcement[] = [
  {
    id: "ANN-1001",
    title: "Обновление корпоративной политики",
    content:
      "Уважаемые коллеги, сообщаем о внесении изменений в корпоративную политику компании. Новая версия документа доступна в разделе 'Документы'. Просим ознакомиться до конца недели.",
    author: {
      name: "Анна Михайлова",
      avatar: "/placeholder-user.jpg",
      initials: "АМ",
    },
    date: "2025-04-02",
    category: "важное",
    likes: 12,
    comments: 5,
  },
  {
    id: "ANN-1002",
    title: "Корпоративное мероприятие",
    content:
      "Приглашаем всех сотрудников на корпоративное мероприятие, которое состоится 15 апреля в 18:00 в конференц-зале. В программе: награждение лучших сотрудников, развлекательная программа и фуршет. Просьба подтвердить своё участие до 10 апреля.",
    author: {
      name: "Дмитрий Соколов",
      avatar: "/placeholder-user.jpg",
      initials: "ДС",
    },
    date: "2025-04-01",
    category: "событие",
    likes: 24,
    comments: 8,
  },
  {
    id: "ANN-1003",
    title: "Новый офис компании",
    content:
      "Рады сообщить, что с 1 мая наша компания переезжает в новый современный офис по адресу: ул. Ленина, 123. Новый офис оборудован всем необходимым для комфортной работы. Схема проезда будет отправлена дополнительно.",
    author: {
      name: "Елена Смирнова",
      avatar: "/placeholder-user.jpg",
      initials: "ЕС",
    },
    date: "2025-03-30",
    category: "новость",
    likes: 35,
    comments: 12,
  },
]

const getCategoryColor = (category: Announcement["category"]) => {
  switch (category) {
    case "важное":
      return "bg-red-100 text-red-800"
    case "новость":
      return "bg-blue-100 text-blue-800"
    case "событие":
      return "bg-green-100 text-green-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function Announcements() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Объявления</h2>
        <Button className="gap-1">
          <Plus className="h-4 w-4" />
          <span>Новое объявление</span>
        </Button>
      </div>

      <div className="grid gap-4">
        {announcements.map((announcement) => (
          <Card key={announcement.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <CardTitle>{announcement.title}</CardTitle>
                  <CardDescription>{new Date(announcement.date).toLocaleDateString("ru-RU")}</CardDescription>
                </div>
                <Badge variant="outline" className={getCategoryColor(announcement.category)}>
                  {announcement.category}
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
                <Button variant="ghost" size="sm" className="gap-1">
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
        ))}
      </div>
    </div>
  )
}

