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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSearchParams } from "next/navigation"
import { useUserStatus } from "@/hooks/use-user-status"
import { useUserActivity } from "@/hooks/use-user-activity"
import { useMessageStream } from "@/hooks/use-message-stream"
import { ImageViewer } from "@/components/image-viewer"

type User = {
  id: string
  name: string
  avatar: string | null
  initials: string
  status: "WORKING" | "ON_VACATION" | "REMOTE"
  unreadCount?: number
  isOnline?: boolean
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
  const { users: statusUsers, isConnected, updateUserStatus } = useUserStatus()
  
  const [searchTerm, setSearchTerm] = useState("")
  const [messageSearchTerm, setMessageSearchTerm] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [attachments, setAttachments] = useState<{ name: string; url: string; type: string }[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [imageViewer, setImageViewer] = useState<{
    isOpen: boolean
    imageUrl: string
    imageName: string
  }>({
    isOpen: false,
    imageUrl: '',
    imageName: ''
  })

  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Используем SSE для сообщений
  const { messages, isConnected: isMessageStreamConnected } = useMessageStream(selectedUser?.id || null)

  // Отслеживаем активность пользователя - вызываем после всех других хуков
  useUserActivity()



    // Обновляем статус пользователей при изменении SSE данных с дебаунсом
  useEffect(() => {
    if (statusUsers.length > 0 && users.length > 0) {
      // Дебаунс для предотвращения частых обновлений
      const timeoutId = setTimeout(() => {
        setUsers(prevUsers => {
          const updatedUsers = prevUsers.map(user => {
            const statusUser = statusUsers.find((statusUser: any) => statusUser.id === user.id)
            const isOnline = statusUser?.isOnline || false
            
            // Обновляем только если статус действительно изменился
            if (user.isOnline !== isOnline) {
              return {
                ...user,
                isOnline
              }
            }
            
            return user
          })
          
          // Проверяем, есть ли реальные изменения
          const hasChanges = updatedUsers.some((user, index) => user.isOnline !== prevUsers[index]?.isOnline)
          
          if (!hasChanges) {
            return prevUsers // Возвращаем старый массив если изменений нет
          }
          
          return updatedUsers
        })
      }, 1000) // Увеличили дебаунс до 1 секунды

      return () => clearTimeout(timeoutId)
    }
  }, [statusUsers, users.length])

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

        // Получаем количество непрочитанных сообщений
        const unreadResponse = await fetch(`/api/messages/unread?userId=${session.user.id}`)
        let unreadData: { totalUnread: number; unreadBySender: Array<{ senderId: string; count: number }> } = { 
          totalUnread: 0, 
          unreadBySender: [] 
        }
        
        if (unreadResponse.ok) {
          unreadData = await unreadResponse.json()
        }

        // Не включаем текущего пользователя в список контактов
        const filteredUsers = data
          .filter((user: any) => user.id !== session.user.id)
          .map((user: any) => {
            const unreadCount = unreadData.unreadBySender.find(
              (item: any) => item.senderId === user.id
            )?.count || 0
            
            // Получаем статус из SSE данных
            const statusUser = statusUsers.find((statusUser: any) => statusUser.id === user.id)
            
            return {
              id: user.id,
              name: user.name,
              avatar: user.avatar,
              initials: user.initials || getInitials(user.name),
              status: user.status,
              unreadCount,
              isOnline: statusUser?.isOnline || false,
            }
          })

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

  // Сообщения теперь загружаются через SSE

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && attachments.length === 0) || !selectedUser || !session?.user?.id) return

    setIsSending(true)

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage || " ",
          senderId: session.user.id,
          receiverId: selectedUser.id,
          attachments: attachments,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось отправить сообщение")
      }

      await response.json()
      setNewMessage("")
      setAttachments([])
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

  const handleDeleteMessage = async (messageId: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Не удалось удалить сообщение")
      }


      toast({
        title: "Успешно",
        description: "Сообщение удалено",
      })
    } catch (err) {
      console.error("Ошибка удаления сообщения:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить сообщение",
        variant: "destructive",
      })
    }
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!session?.user?.id) return

    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newContent,
        }),
      })

      if (!response.ok) {
        throw new Error("Не удалось отредактировать сообщение")
      }

      await response.json()
      setEditingMessageId(null)
      setEditingContent("")
      toast({
        title: "Успешно",
        description: "Сообщение отредактировано",
      })
    } catch (err) {
      console.error("Ошибка редактирования сообщения:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось отредактировать сообщение",
        variant: "destructive",
      })
    }
  }

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId)
    setEditingContent(content)
  }

  const cancelEditing = () => {
    setEditingMessageId(null)
    setEditingContent("")
  }

  const handleFileUpload = async (file: File) => {
    if (!file) {
      return
    }

    if (!selectedUser) {
      toast({
        title: "Ошибка",
        description: "Сначала выберите пользователя для отправки сообщения",
        variant: "destructive",
      })
      return
    }

    if (!session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Необходима авторизация для загрузки файлов",
        variant: "destructive",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/messages/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Не удалось загрузить файл")
      }

      const uploadedFile = await response.json()
      setAttachments((prev) => [...prev, uploadedFile])
      
      // Очищаем input после успешной загрузки
      const fileInput = document.getElementById("file-upload") as HTMLInputElement
      if (fileInput) {
        fileInput.value = ""
      }
      
      toast({
        title: "Успешно",
        description: "Файл загружен",
      })
    } catch (err) {
      console.error("Ошибка загрузки файла:", err)
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось загрузить файл",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const openImageViewer = (imageUrl: string, imageName: string) => {
    setImageViewer({
      isOpen: true,
      imageUrl,
      imageName
    })
  }



  const closeImageViewer = () => {
    setImageViewer({
      isOpen: false,
      imageUrl: '',
      imageName: ''
    })
  }

  const getStatusColor = (user: User) => {
    if (user.isOnline) {
      return "bg-green-500"
    }
    return "bg-gray-400"
  }

  const getStatusText = (user: User) => {
    if (user.isOnline) {
      return "В сети"
    }
    return "Отсутствует"
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
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Подключено' : 'Отключено'}
              </span>
            </div>
                  <div className="text-xs text-muted-foreground">
        {users.filter(user => user.isOnline).length} активных
      </div>
          </div>
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
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(user)}`}
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
                      <p className="text-sm text-muted-foreground truncate">{getStatusText(user)}</p>
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
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar || undefined} alt={selectedUser.name} />
                      <AvatarFallback>{selectedUser.initials}</AvatarFallback>
                    </Avatar>
                    <span
                      className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background ${getStatusColor(selectedUser)}`}
                    ></span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">{selectedUser.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{getStatusText(selectedUser)}</p>
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
              <div className="mt-3">
                <Input
                  placeholder="Поиск в сообщениях..."
                  value={messageSearchTerm}
                  onChange={(e) => setMessageSearchTerm(e.target.value)}
                  className="w-full"
                />
              </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-4">
              {messages.length > 0 ? (
                <div className="space-y-4">
                  {messages
                    .filter((message) =>
                      messageSearchTerm
                        ? message.content.toLowerCase().includes(messageSearchTerm.toLowerCase())
                        : true
                    )
                    .map((message) => {
                    const isCurrentUser = message.senderId === session?.user?.id
                    const isEditing = editingMessageId === message.id

                    return (
                      <div 
                      key={message.id} 
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                        <div
                          className={`max-w-[70%] ${isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted"} rounded-lg p-3 relative group`}
                        >
                          {isEditing ? (
                            <div className="space-y-2">
                              <Input
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault()
                                    handleEditMessage(message.id, editingContent)
                                  } else if (e.key === "Escape") {
                                    cancelEditing()
                                  }
                                }}
                                className="bg-background text-foreground"
                              />
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleEditMessage(message.id, editingContent)}
                                  disabled={!editingContent.trim()}
                                >
                                  Сохранить
                                </Button>
                                <Button size="sm" variant="outline" onClick={cancelEditing}>
                                  Отмена
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <p>{message.content}</p>

                              {message.attachments && message.attachments.length > 0 && (
                                <div className="mt-2 space-y-2">
                                  {message.attachments.map((attachment) => (
                                    <div
                                      key={attachment.id}
                                      className="flex items-center gap-2 p-2 bg-background/20 rounded"
                                    >
                                      {attachment.type.startsWith("image/") ? (
                                        <div className="relative group">
                                          <div 
                                            className="relative cursor-pointer"
                                            style={{ pointerEvents: 'auto' }}
                                          >
                                            <img
                                              src={attachment.url}
                                              alt={attachment.name}
                                              className="h-12 w-12 object-cover rounded hover:opacity-80 transition-opacity"
                                              onError={(e) => {
                                                console.error('Ошибка загрузки изображения:', attachment.url)
                                              }}

                                            />
                                            <button
                                              className="absolute inset-0 w-full h-full bg-transparent border-0 cursor-pointer"
                                              onClick={(e) => {
                                                e.preventDefault()
                                                e.stopPropagation()
                                                openImageViewer(attachment.url, attachment.name)
                                              }}
                                              style={{ zIndex: 10 }}
                                            >
                                              <span className="sr-only">Открыть изображение</span>
                                            </button>
                                          </div>
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                                              Увеличить
                                            </span>
                                          </div>
                                        </div>
                                      ) : (
                                        <div className="h-12 w-12 bg-background/30 rounded flex items-center justify-center">
                                          <Paperclip className="h-5 w-5" />
                                        </div>
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm truncate block">{attachment.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                          {attachment.type.startsWith("image/") ? "Изображение" : "Файл"}
                                        </span>
                                      </div>
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

                              {isCurrentUser && (
                                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="h-3 w-3" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => startEditing(message.id, message.content)}>
                                        Редактировать
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        onClick={() => handleDeleteMessage(message.id)}
                                        className="text-destructive"
                                      >
                                        Удалить
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </>
                          )}
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
              {attachments.length > 0 && (
                <div className="mb-3 space-y-2">
                  {attachments.map((attachment, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                      {attachment.type.startsWith("image/") ? (
                        <div className="relative group">
                          <div 
                            className="relative cursor-pointer"
                            style={{ pointerEvents: 'auto' }}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('Клик по контейнеру изображения в attachments:', attachment.url, attachment.name)
                              openImageViewer(attachment.url, attachment.name)
                            }}
                            onMouseDown={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              console.log('MouseDown по контейнеру изображения в attachments')
                            }}
                          >
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="h-16 w-16 object-cover rounded hover:opacity-80 transition-opacity"
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                openImageViewer(attachment.url, attachment.name)
                              }}
                              onError={(e) => {
                                console.error('Ошибка загрузки изображения в attachments:', attachment.url)
                              }}

                            />
                          </div>
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded flex items-center justify-center">
                            <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">
                              Увеличить
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="h-16 w-16 bg-muted-foreground/10 rounded flex items-center justify-center">
                          <Paperclip className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm truncate block">{attachment.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {attachment.type.startsWith("image/") ? "Изображение" : "Файл"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                        className="h-6 w-6 p-0"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              <div 
                className={`flex gap-2 border-2 border-dashed transition-colors ${
                  isDragOver 
                    ? "border-primary bg-primary/5" 
                    : "border-transparent hover:border-muted-foreground/20"
                }`}
                onDragOver={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragOver(true)
                }}
                onDragLeave={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragOver(false)
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsDragOver(false)
                  const files = Array.from(e.dataTransfer.files)
                  if (files.length > 0 && selectedUser) {
                    handleFileUpload(files[0])
                  }
                }}
              >
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleFileUpload(file)
                    }
                  }}
                  accept="image/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.webp"
                />
                <label 
                  htmlFor="file-upload" 
                  title={!selectedUser 
                    ? "Сначала выберите пользователя" 
                    : isUploading 
                      ? "Загрузка файла..." 
                      : "Прикрепить файл (изображения, PDF, документы)"
                  }
                >
                  <Button 
                    variant="outline" 
                    size="icon" 
                    disabled={isUploading || !selectedUser} 
                    className="relative cursor-pointer hover:bg-accent"
                    onClick={() => {
                      if (!selectedUser) {
                        toast({
                          title: "Ошибка",
                          description: "Сначала выберите пользователя для отправки сообщения",
                          variant: "destructive",
                        })
                        return
                      }
                      const fileInput = document.getElementById("file-upload") as HTMLInputElement
                      if (fileInput) {
                        fileInput.click()
                      }
                    }}
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                    {isUploading && (
                      <span className="absolute inset-0 bg-background/50 rounded-md flex items-center justify-center">
                        <Loader2 className="h-3 w-3 animate-spin" />
                      </span>
                    )}
                  </Button>
                </label>
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
                  disabled={isSending}
                />
                <Button onClick={handleSendMessage} disabled={(!newMessage.trim() && attachments.length === 0) || isSending}>
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

      {/* Image Viewer Modal */}
      <ImageViewer
        isOpen={imageViewer.isOpen}
        onClose={closeImageViewer}
        imageUrl={imageViewer.imageUrl}
        imageName={imageViewer.imageName}
      />
    </div>
  )
}

