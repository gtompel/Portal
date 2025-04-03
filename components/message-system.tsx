"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Search, Send, Paperclip, MoreVertical, Phone, Video } from "lucide-react"

type User = {
  id: string
  name: string
  avatar: string
  initials: string
  status: "online" | "offline" | "away"
  lastSeen?: string
  unreadCount?: number
}

type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: Date
  read: boolean
  attachments?: { name: string; url: string; type: string }[]
}

const users: User[] = [
  {
    id: "USR-1001",
    name: "Иван Петров",
    avatar: "/placeholder-user.jpg",
    initials: "ИП",
    status: "online",
    unreadCount: 0,
  },
  {
    id: "USR-1002",
    name: "Мария Сидорова",
    avatar: "/placeholder-user.jpg",
    initials: "МС",
    status: "online",
    unreadCount: 3,
  },
  {
    id: "USR-1003",
    name: "Алексей Иванов",
    avatar: "/placeholder-user.jpg",
    initials: "АИ",
    status: "away",
    lastSeen: "30 минут назад",
    unreadCount: 0,
  },
  {
    id: "USR-1004",
    name: "Елена Смирнова",
    avatar: "/placeholder-user.jpg",
    initials: "ЕС",
    status: "offline",
    lastSeen: "2 часа назад",
    unreadCount: 0,
  },
  {
    id: "USR-1005",
    name: "Дмитрий Козлов",
    avatar: "/placeholder-user.jpg",
    initials: "ДК",
    status: "online",
    unreadCount: 0,
  },
  {
    id: "USR-1006",
    name: "Анна Михайлова",
    avatar: "/placeholder-user.jpg",
    initials: "АМ",
    status: "offline",
    lastSeen: "вчера",
    unreadCount: 0,
  },
]

const messages: Message[] = [
  {
    id: "MSG-1001",
    senderId: "USR-1002",
    receiverId: "USR-1001",
    content: "Привет! Ты уже просмотрел отчет, который я отправила вчера?",
    timestamp: new Date(2025, 3, 2, 9, 30),
    read: true,
  },
  {
    id: "MSG-1002",
    senderId: "USR-1001",
    receiverId: "USR-1002",
    content: "Доброе утро! Да, просмотрел. Очень хорошая работа, но есть несколько моментов, которые нужно обсудить.",
    timestamp: new Date(2025, 3, 2, 9, 45),
    read: true,
  },
  {
    id: "MSG-1003",
    senderId: "USR-1002",
    receiverId: "USR-1001",
    content: "Спасибо! Когда будет удобно обсудить?",
    timestamp: new Date(2025, 3, 2, 10, 0),
    read: true,
  },
  {
    id: "MSG-1004",
    senderId: "USR-1001",
    receiverId: "USR-1002",
    content: "Давай сегодня после обеда, примерно в 14:00. Я буду в офисе.",
    timestamp: new Date(2025, 3, 2, 10, 15),
    read: true,
  },
  {
    id: "MSG-1005",
    senderId: "USR-1002",
    receiverId: "USR-1001",
    content: "Отлично! Буду ждать. Кстати, вот финальная версия презентации для клиента.",
    timestamp: new Date(2025, 3, 2, 10, 30),
    read: false,
    attachments: [
      {
        name: "Презентация_для_клиента_финал.pptx",
        url: "#",
        type: "presentation",
      },
    ],
  },
  {
    id: "MSG-1006",
    senderId: "USR-1002",
    receiverId: "USR-1001",
    content: "И еще данные по последнему исследованию рынка.",
    timestamp: new Date(2025, 3, 2, 10, 32),
    read: false,
    attachments: [
      {
        name: "Исследование_рынка_Q1_2025.xlsx",
        url: "#",
        type: "spreadsheet",
      },
    ],
  },
  {
    id: "MSG-1007",
    senderId: "USR-1002",
    receiverId: "USR-1001",
    content: "Не забудь просмотреть эти материалы перед встречей.",
    timestamp: new Date(2025, 3, 2, 10, 35),
    read: false,
  },
]

const getStatusColor = (status: User["status"]) => {
  switch (status) {
    case "online":
      return "bg-green-500"
    case "offline":
      return "bg-gray-500"
    case "away":
      return "bg-yellow-500"
    default:
      return "bg-gray-500"
  }
}

export function MessageSystem() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(users[1]) // Мария Сидорова выбрана по умолчанию
  const [newMessage, setNewMessage] = useState("")

  const filteredUsers = users.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const chatMessages = messages
    .filter(
      (msg) =>
        (msg.senderId === selectedUser?.id && msg.receiverId === "USR-1001") ||
        (msg.receiverId === selectedUser?.id && msg.senderId === "USR-1001"),
    )
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

  const handleSendMessage = () => {
    if (newMessage.trim() && selectedUser) {
      // В реальном приложении здесь был бы код для отправки сообщения на сервер
      console.log("Отправка сообщения:", {
        to: selectedUser.name,
        content: newMessage,
      })
      setNewMessage("")
    }
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-12rem)]">
      <Card className="md:col-span-1">
        <CardHeader className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Поиск контактов..."
              className="pl-8 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <CardContent className="p-0">
            {filteredUsers.map((user) => (
              <div key={user.id}>
                <button
                  className={`w-full flex items-center gap-3 p-3 hover:bg-muted text-left ${
                    selectedUser?.id === user.id ? "bg-muted" : ""
                  }`}
                  onClick={() => setSelectedUser(user)}
                >
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={user.avatar} alt={user.name} />
                      <AvatarFallback>{user.initials}</AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(user.status)}`}
                    ></span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <p className="font-medium truncate">{user.name}</p>
                      {user.unreadCount ? (
                        <span className="inline-flex items-center justify-center h-5 w-5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                          {user.unreadCount}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {user.status === "online"
                        ? "В сети"
                        : user.status === "away"
                          ? `Отошел (${user.lastSeen})`
                          : `Не в сети (${user.lastSeen})`}
                    </p>
                  </div>
                </button>
                <Separator />
              </div>
            ))}
          </CardContent>
        </ScrollArea>
      </Card>

      <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
        {selectedUser ? (
          <>
            <CardHeader className="p-4 border-b">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={selectedUser.avatar} alt={selectedUser.name} />
                    <AvatarFallback>{selectedUser.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {selectedUser.status === "online"
                        ? "В сети"
                        : selectedUser.status === "away"
                          ? `Отошел (${selectedUser.lastSeen})`
                          : `Не в сети (${selectedUser.lastSeen})`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {chatMessages.map((message) => {
                  const isCurrentUser = message.senderId === "USR-1001"

                  return (
                    <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[70%] ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-3`}
                      >
                        <p>{message.content}</p>

                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {message.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-background/20 rounded">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm truncate">{attachment.name}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        <div
                          className={`text-xs mt-1 ${isCurrentUser ? "text-primary-foreground/70" : "text-muted-foreground"} flex justify-end`}
                        >
                          {formatMessageTime(message.timestamp)}
                          {isCurrentUser && <span className="ml-1">{message.read ? "✓✓" : "✓"}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <div className="p-4 border-t">
              <div className="flex gap-2">
                <Button variant="outline" size="icon">
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSendMessage()
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <CardContent className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Выберите контакт для начала общения</p>
          </CardContent>
        )}
      </Card>
    </div>
  )
}

