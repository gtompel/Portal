"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, Users, CalendarIcon } from "lucide-react"
import { ru } from "date-fns/locale"

type Event = {
  id: string
  title: string
  description: string
  date: Date
  startTime: string
  endTime: string
  location: string
  type: "встреча" | "дедлайн" | "праздник" | "отпуск"
  participants: string[]
}

// Создаем события на текущий месяц
const currentDate = new Date()
const currentYear = currentDate.getFullYear()
const currentMonth = currentDate.getMonth()

const events: Event[] = [
  {
    id: "EVT-1001",
    title: "Еженедельное собрание команды",
    description: "Обсуждение текущих проектов и планирование на неделю",
    date: new Date(currentYear, currentMonth, 5, 10, 0),
    startTime: "10:00",
    endTime: "11:30",
    location: "Конференц-зал А",
    type: "встреча",
    participants: ["Иван Петров", "Мария Сидорова", "Алексей Иванов", "Елена Смирнова"],
  },
  {
    id: "EVT-1002",
    title: "Дедлайн проекта 'Альфа'",
    description: "Сдача финальной версии проекта заказчику",
    date: new Date(currentYear, currentMonth, 15, 18, 0),
    startTime: "18:00",
    endTime: "18:00",
    location: "Онлайн",
    type: "дедлайн",
    participants: ["Алексей Иванов", "Сергей Новиков", "Дмитрий Козлов"],
  },
  {
    id: "EVT-1003",
    title: "Корпоративный праздник",
    description: "Празднование дня основания компании",
    date: new Date(currentYear, currentMonth, 20, 16, 0),
    startTime: "16:00",
    endTime: "22:00",
    location: "Ресторан 'Панорама'",
    type: "праздник",
    participants: ["Все сотрудники"],
  },
  {
    id: "EVT-1004",
    title: "Отпуск - Дмитрий Козлов",
    description: "Плановый отпуск",
    date: new Date(currentYear, currentMonth, 25, 0, 0),
    startTime: "00:00",
    endTime: "23:59",
    location: "",
    type: "отпуск",
    participants: ["Дмитрий Козлов"],
  },
]

const getEventTypeColor = (type: Event["type"]) => {
  switch (type) {
    case "встреча":
      return "bg-blue-100 text-blue-800"
    case "дедлайн":
      return "bg-red-100 text-red-800"
    case "праздник":
      return "bg-green-100 text-green-800"
    case "отпуск":
      return "bg-purple-100 text-purple-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

const getEventsByDate = (date: Date) => {
  return events.filter(
    (event) =>
      event.date.getDate() === date.getDate() &&
      event.date.getMonth() === date.getMonth() &&
      event.date.getFullYear() === date.getFullYear(),
  )
}

const getDaysWithEvents = () => {
  return events.map((event) => event.date)
}

export function EventCalendar() {
  const [date, setDate] = useState<Date>(new Date())
  const [view, setView] = useState<"month" | "day">("month")
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      setView("day")
    }
  }

  const handleBackToMonth = () => {
    setView("month")
  }

  const daysWithEvents = getDaysWithEvents()
  const eventsForSelectedDate = getEventsByDate(selectedDate)

  const monthNames = [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ]

  const currentMonthName = monthNames[date.getMonth()]
  const currentYear = date.getFullYear()

  const handlePrevMonth = () => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() - 1)
    setDate(newDate)
  }

  const handleNextMonth = () => {
    const newDate = new Date(date)
    newDate.setMonth(newDate.getMonth() + 1)
    setDate(newDate)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          {view === "day" && (
            <Button variant="outline" size="sm" onClick={handleBackToMonth}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Назад к календарю
            </Button>
          )}
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              <span>Новое событие</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Создать новое событие</DialogTitle>
              <DialogDescription>Заполните информацию о событии</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title">Название</label>
                <input id="title" className="border p-2 rounded-md" />
              </div>
              <div className="grid gap-2">
                <label>Тип события</label>
                <Select defaultValue="встреча">
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите тип" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="встреча">Встреча</SelectItem>
                    <SelectItem value="дедлайн">Дедлайн</SelectItem>
                    <SelectItem value="праздник">Праздник</SelectItem>
                    <SelectItem value="отпуск">Отпуск</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label>Дата</label>
                  <input type="date" className="border p-2 rounded-md" />
                </div>
                <div className="grid gap-2">
                  <label>Время</label>
                  <div className="flex gap-2">
                    <input type="time" className="border p-2 rounded-md w-full" />
                    <span className="flex items-center">-</span>
                    <input type="time" className="border p-2 rounded-md w-full" />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <label htmlFor="location">Место</label>
                <input id="location" className="border p-2 rounded-md" />
              </div>
              <div className="grid gap-2">
                <label htmlFor="description">Описание</label>
                <textarea id="description" className="border p-2 rounded-md" rows={3}></textarea>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Создать событие</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {view === "month" && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" onClick={handlePrevMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <CardTitle>
                {currentMonthName} {currentYear}
              </CardTitle>
              <Button variant="outline" size="icon" onClick={handleNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={date}
              onSelect={handleDateSelect}
              className="rounded-md border"
              locale={ru}
              modifiers={{
                hasEvent: daysWithEvents,
              }}
              modifiersStyles={{
                hasEvent: {
                  fontWeight: "bold",
                  textDecoration: "underline",
                  color: "var(--primary)",
                },
              }}
            />
          </CardContent>
        </Card>
      )}

      {view === "day" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedDate.toLocaleDateString("ru-RU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </CardTitle>
              <CardDescription>
                {eventsForSelectedDate.length}{" "}
                {eventsForSelectedDate.length === 1
                  ? "событие"
                  : eventsForSelectedDate.length >= 2 && eventsForSelectedDate.length <= 4
                    ? "события"
                    : "событий"}
              </CardDescription>
            </CardHeader>
          </Card>

          {eventsForSelectedDate.length > 0 ? (
            <div className="space-y-4">
              {eventsForSelectedDate.map((event) => (
                <Card key={event.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>
                          {event.startTime} - {event.endTime}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={getEventTypeColor(event.type)}>
                        {event.type}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="mb-4">{event.description}</p>
                    <div className="grid gap-2">
                      {event.location && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {event.startTime} - {event.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{event.participants.join(", ")}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">
                      Редактировать
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10">
                <CalendarIcon className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">На этот день нет событий</p>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Создать событие</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Создать новое событие</DialogTitle>
                      <DialogDescription>Заполните информацию о событии</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <label htmlFor="title">Название</label>
                        <input id="title" className="border p-2 rounded-md" />
                      </div>
                      <div className="grid gap-2">
                        <label>Тип события</label>
                        <Select defaultValue="встреча">
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="встреча">Встреча</SelectItem>
                            <SelectItem value="дедлайн">Дедлайн</SelectItem>
                            <SelectItem value="праздник">Праздник</SelectItem>
                            <SelectItem value="отпуск">Отпуск</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <label>Дата</label>
                          <input type="date" className="border p-2 rounded-md" />
                        </div>
                        <div className="grid gap-2">
                          <label>Время</label>
                          <div className="flex gap-2">
                            <input type="time" className="border p-2 rounded-md w-full" />
                            <span className="flex items-center">-</span>
                            <input type="time" className="border p-2 rounded-md w-full" />
                          </div>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="location">Место</label>
                        <input id="location" className="border p-2 rounded-md" />
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor="description">Описание</label>
                        <textarea id="description" className="border p-2 rounded-md" rows={3}></textarea>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Создать событие</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

