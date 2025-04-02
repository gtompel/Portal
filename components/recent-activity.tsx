"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"

const activities = [
  {
    user: {
      name: "Иван Петров",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&q=75&fit=crop",
      initials: "ИП"
    },
    action: "завершил задачу",
    target: "Обновление документации",
    time: "2 минуты назад"
  },
  {
    user: {
      name: "Анна Смирнова",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&q=75&fit=crop",
      initials: "АС"
    },
    action: "оставила комментарий к",
    target: "График проекта",
    time: "15 минут назад"
  },
  {
    user: {
      name: "Михаил Иванов",
      image: "https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=32&h=32&q=75&fit=crop",
      initials: "МИ"
    },
    action: "загрузил",
    target: "Отчет Q1.pdf",
    time: "1 час назад"
  },
  {
    user: {
      name: "Елена Козлова",
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=32&h=32&q=75&fit=crop",
      initials: "ЕК"
    },
    action: "создала задачу",
    target: "Проверка маркетинговых материалов",
    time: "2 часа назад"
  }
]

export function RecentActivity() {
  return (
    <ScrollArea className="h-[350px] pr-4">
      <div className="space-y-4">
        {activities.map((activity, i) => (
          <div key={i} className="flex items-center gap-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src={activity.user.image} />
              <AvatarFallback>{activity.user.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <p className="text-sm">
                <span className="font-medium">{activity.user.name}</span>
                {' '}{activity.action}{' '}
                <span className="font-medium">{activity.target}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                {activity.time}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}