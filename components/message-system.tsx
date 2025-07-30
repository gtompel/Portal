"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Search, Send, Paperclip, MoreVertical, Phone, Video, Loader2 } from "lucide-react"
import { useSearchParams } from "next/navigation"

type User = {
  id: string
  name: string
  avatar: string | null
  initials: string
  status: "WORKING" | "ON_VACATION" | "REMOTE"
  lastSeen?: string
  unreadCount?: number
}

type Message = {
  id: string
  senderId: string
  receiverId: string
  content: string
  timestamp: string
  read: boolean
  attachments?: { id: string; name: string; url: string; type: string }[]
  sender: {
    id: string
    name: string
    avatar: string | null
    initials: string
  }
  receiver: {
    id: string
    name: string
    avatar: string | null
    initials: string
  }
}

export function MessageSystem() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const initialUserId = searchParams?.get("user")

  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      if (!session?.user?.id) return

      try {
        setIsLoadingUsers(true)
        const response = await fetch("/api/users")

        if (!response.ok) {
          throw new Error("Не удалось загрузить список пользователей")
        }

        const data = await response.json()

        // Не включаем текущего пользователя в список контактов
        const filteredUsers = data
          .filter((user: any) => user.id !== session.user.id)
          .map((user: any) => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            initials: user.initials || getInitials(user.name),
            status: user.status,
            lastSeen: user.lastSeen || null,
            unreadCount: 0,
          }))

        setUsers(filteredUsers)
        setFilteredUsers(filteredUsers)

        // Если в URL указан id пользователя, выбираем его
        if (initialUserId) {
          const userFromUrl = filteredUsers.find((user: { id: string }) => user.id === initialUserId)
          if (userFromUrl) {
            setSelectedUser(userFromUrl)
          }
        }
      } catch (err) {
        //console.error("Ошибка загрузки пользователей:", err)
        setError("Не удалось загрузить список пользователей")
      } finally {
        setIsLoadingUsers(false)
      }
    }

    fetchUsers()
  }, [session, initialUserId])

  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter((user) => user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  // Fetch messages when a user is selected
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedUser || !session?.user?.id) return

      try {
        setIsLoadingMessages(true)
        const response = await fetch(`/api/messages?senderId=${session.user.id}&receiverId=${selectedUser.id}`)

        if (!response.ok) {
          throw new Error("Не удалось загрузить сообщения")
        }

        const data = await response.json()
        setMessages(data)

        // Mark messages as read
        const unreadMessages = data.filter((msg: Message) => msg.receiverId === session.user.id && !msg.read)

        if (unreadMessages.length > 0) {
          await Promise.all(
            unreadMessages.map((msg: Message) =>
              fetch(`/api/messages/${msg.id}`, {
                method: "PUT",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ read: true }),
              }),
            ),
          )
        }
      } catch (err) {
        console.error("Ошибка загрузки сообщений:", err)
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить сообщения",
          variant: "destructive",
        })
      } finally {
        setIsLoadingMessages(false)
      }
    }

    fetchMessages()
  }, [selectedUser, session, toast])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || !session?.user?.id) return

    setIsSending(true)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage,
          senderId: session.user.id,
          receiverId: selectedUser.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось отправить сообщение")
      }

      const sentMessage = await response.json()
      setMessages((prev) => [...prev, sentMessage])
      setNewMessage("")
      toast({
        title: "Успешно",
        description: "Сообщение отправлено",
      })
    } catch (err) {
     // console.error("Ошибка отправки сообщения:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  const getStatusColor = (status: User["status"]) => {
    switch (status) {
      case "WORKING":
        return "bg-green-500"
      case "ON_VACATION":
        return "bg-yellow-500"
      case "REMOTE":
        return "bg-blue-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusText = (status: User["status"]) => {
    switch (status) {
      case "WORKING":
        return "В сети"
      case "ON_VACATION":
        return "В отпуске"
      case "REMOTE":
        return "Удаленно"
      default:
        return status
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Проверяем, что дата валидна
      if (isNaN(date.getTime())) {
        return "Сейчас"
      }
      return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
    } catch (error) {
      console.error("Ошибка форматирования времени:", error)
      return "Сейчас"
    }
  }

  if (error) {
    return (
      <Card className="h-[calc(100vh-12rem)]">
        <CardHeader>
          <CardTitle>Ошибка</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Повторить попытку</Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[600px] sm:h-[calc(100vh-12rem)]">
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
            {isLoadingUsers ? (
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <div key={index}>
                    <div className="flex items-center gap-3 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-24 mb-1" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <Separator />
                  </div>
                ))
            ) : filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <div key={user.id}>
                  <button
                    className={`w-full flex items-center gap-3 p-3 hover:bg-muted text-left ${
                      selectedUser?.id === user.id ? "bg-muted" : ""
                    }`}
                    onClick={() => setSelectedUser(user)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
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
                      <p className="text-sm text-muted-foreground truncate">{getStatusText(user.status)}</p>
                    </div>
                  </button>
                  <Separator />
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-24">
                <p className="text-muted-foreground">Контакты не найдены</p>
              </div>
            )}
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
                    <AvatarImage src={selectedUser.avatar || undefined} alt={selectedUser.name} />
                    <AvatarFallback>{selectedUser.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getStatusText(selectedUser.status)}</p>
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
              {isLoadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const isCurrentUser = message.senderId === session?.user?.id

                    return (
                      <div key={message.id} className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[70%] ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-3`}
                        >
                          <p>{message.content}</p>

                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {message.attachments.map((attachment) => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-2 p-2 bg-background/20 rounded"
                                >
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
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Начните диалог, отправив сообщение</p>
                </div>
              )}
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
                <Button onClick={handleSendMessage} disabled={!newMessage.trim() || isSending}>
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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

