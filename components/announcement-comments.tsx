"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { Loader2, Reply, ThumbsUp, MoreVertical, Edit, Trash } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

type Comment = {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
    initials: string
  }
  createdAt: string
  likes: number
  replies?: Comment[]
  isReply?: boolean
}

export function AnnouncementComments({ announcementId }: { announcementId: string }) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [replyTo, setReplyTo] = useState<Comment | null>(null)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchComments()
  }, [announcementId])

  const fetchComments = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch(`/api/announcements/${announcementId}/comments`)

      if (!response.ok) {
        throw new Error("Не удалось загрузить комментарии")
      }

      const data = await response.json()

      // Преобразуем данные в нужный формат
      const formattedComments = data.map((item: any) => ({
        id: item.id,
        content: item.content,
        author: {
          id: item.author?.id || "unknown",
          name: item.author?.name || "Неизвестный пользователь",
          avatar: item.author?.avatar,
          initials: item.author?.initials || getInitials(item.author?.name || "Неизвестный пользователь"),
        },
        createdAt: item.createdAt,
        likes: item.likes || 0,
        replies: item.replies?.map((reply: any) => ({
          id: reply.id,
          content: reply.content,
          author: {
            id: reply.author?.id || "unknown",
            name: reply.author?.name || "Неизвестный пользователь",
            avatar: reply.author?.avatar,
            initials: reply.author?.initials || getInitials(reply.author?.name || "Неизвестный пользователь"),
          },
          createdAt: reply.createdAt,
          likes: reply.likes || 0,
          isReply: true,
        })),
      }))

      setComments(formattedComments)
    } catch (err) {
      console.error("Ошибка при загрузке комментариев:", err)
      setError("Не удалось загрузить комментарии")
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить комментарии",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const addComment = async () => {
    if (!session?.user?.id || !newComment.trim()) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/announcements/${announcementId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newComment,
          parentId: replyTo?.id,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Не удалось добавить комментарий")
      }

      const newCommentData = await response.json()

      const formattedComment: Comment = {
        id: newCommentData.id,
        content: newCommentData.content,
        author: {
          id: newCommentData.author.id,
          name: newCommentData.author.name,
          avatar: newCommentData.author.avatar,
          initials: newCommentData.author.initials || getInitials(newCommentData.author.name),
        },
        createdAt: newCommentData.createdAt,
        likes: 0,
        isReply: !!replyTo,
      }

      if (replyTo) {
        // Добавляем ответ к комментарию
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === replyTo.id
              ? {
                  ...comment,
                  replies: [...(comment.replies || []), formattedComment],
                }
              : comment,
          ),
        )
        setReplyTo(null)
      } else {
        // Добавляем новый комментарий
        setComments((prev) => [formattedComment, ...prev])
      }

      setNewComment("")
      toast({
        title: "Успешно",
        description: "Комментарий добавлен",
      })
    } catch (err: any) {
      console.error("Ошибка при добавлении комментария:", err)
      toast({
        title: "Ошибка",
        description: err.message || "Не удалось добавить комментарий",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const updateComment = async () => {
    if (!editingComment || !session?.user?.id) return

    setIsSubmitting(true)

    try {
      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch(`/api/announcements/${announcementId}/comments/${editingComment.id}`, {
      //   method: "PUT",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     content: newComment
      //   }),
      // })
      // if (!response.ok) {
      //   throw new Error("Не удалось обновить комментарий")
      // }
      // const data = await response.json()

      // Имитируем успешный ответ
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (editingComment.isReply) {
        // Обновляем ответ
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === editingComment.id ? { ...reply, content: newComment } : reply,
                ),
              }
            }
            return comment
          }),
        )
      } else {
        // Обновляем комментарий
        setComments((prev) =>
          prev.map((comment) => (comment.id === editingComment.id ? { ...comment, content: newComment } : comment)),
        )
      }

      setEditingComment(null)
      setNewComment("")
      toast({
        title: "Успешно",
        description: "Комментарий обновлен",
      })
    } catch (err) {
      console.error("Ошибка при обновлении комментария:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось обновить комментарий",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const deleteComment = async (commentId: string, isReply = false, parentId?: string) => {
    try {
      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch(`/api/announcements/${announcementId}/comments/${commentId}`, {
      //   method: "DELETE"
      // })
      // if (!response.ok) {
      //   throw new Error("Не удалось удалить комментарий")
      // }

      // Имитируем успешный ответ
      await new Promise((resolve) => setTimeout(resolve, 500))

      if (isReply && parentId) {
        // Удаляем ответ
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentId && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.filter((reply) => reply.id !== commentId),
              }
            }
            return comment
          }),
        )
      } else {
        // Удаляем комментарий
        setComments((prev) => prev.filter((comment) => comment.id !== commentId))
      }

      toast({
        title: "Успешно",
        description: "Комментарий удален",
      })
    } catch (err) {
      console.error("Ошибка при удалении комментария:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось удалить комментарий",
        variant: "destructive",
      })
    }
  }

  const likeComment = async (commentId: string, isReply = false, parentId?: string) => {
    try {
      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch(`/api/announcements/${announcementId}/comments/${commentId}/like`, {
      //   method: "POST"
      // })
      // if (!response.ok) {
      //   throw new Error("Не удалось поставить лайк")
      // }

      // Имитируем успешный ответ
      await new Promise((resolve) => setTimeout(resolve, 300))

      if (isReply && parentId) {
        // Обновляем лайк для ответа
        setComments((prev) =>
          prev.map((comment) => {
            if (comment.id === parentId && comment.replies) {
              return {
                ...comment,
                replies: comment.replies.map((reply) =>
                  reply.id === commentId ? { ...reply, likes: reply.likes + 1 } : reply,
                ),
              }
            }
            return comment
          }),
        )
      } else {
        // Обновляем лайк для комментария
        setComments((prev) =>
          prev.map((comment) => (comment.id === commentId ? { ...comment, likes: comment.likes + 1 } : comment)),
        )
      }
    } catch (err) {
      console.error("Ошибка при добавлении лайка:", err)
      toast({
        title: "Ошибка",
        description: "Не удалось поставить лайк",
        variant: "destructive",
      })
    }
  }

  const handleReply = (comment: Comment) => {
    setReplyTo(comment)
    setEditingComment(null)
    setNewComment("")
  }

  const handleEdit = (comment: Comment) => {
    setEditingComment(comment)
    setReplyTo(null)
    setNewComment(comment.content)
  }

  const cancelAction = () => {
    setReplyTo(null)
    setEditingComment(null)
    setNewComment("")
  }

  // Функция для получения инициалов из имени
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
  }

  // Форматирование даты
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      // Проверяем, что дата валидна
      if (isNaN(date.getTime())) {
        return "Недавно"
      }

      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.round(diffMs / (1000 * 60))
      const diffHours = Math.round(diffMs / (1000 * 60 * 60))
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))

      if (diffMins < 60) {
        return `${diffMins} мин. назад`
      } else if (diffHours < 24) {
        return `${diffHours} ч. назад`
      } else if (diffDays < 7) {
        return `${diffDays} дн. назад`
      } else {
        return date.toLocaleDateString("ru-RU")
      }
    } catch (error) {
      console.error("Ошибка форматирования даты:", error)
      return "Недавно"
    }
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Комментарии ({comments.length})</h3>

      {/* Форма добавления комментария */}
      <div className="flex gap-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={session?.user?.image || undefined} alt={session?.user?.name || "Пользователь"} />
          <AvatarFallback>{session?.user?.name ? getInitials(session.user.name) : "U"}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-2">
          <Textarea
            placeholder={
              replyTo
                ? `Ответить ${replyTo.author.name}...`
                : editingComment
                  ? "Редактировать комментарий..."
                  : "Написать комментарий..."
            }
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[80px]"
          />
          <div className="flex justify-between">
            {(replyTo || editingComment) && (
              <Button variant="outline" onClick={cancelAction}>
                Отмена
              </Button>
            )}
            <Button
              className="ml-auto"
              onClick={editingComment ? updateComment : addComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingComment ? "Сохранить" : replyTo ? "Ответить" : "Отправить"}
            </Button>
          </div>
        </div>
      </div>

      {replyTo && (
        <div className="ml-14 p-3 bg-muted rounded-md text-sm">
          <div className="font-medium">Ответ на комментарий {replyTo.author.name}:</div>
          <div className="text-muted-foreground">{replyTo.content}</div>
        </div>
      )}

      <Separator />

      {/* Список комментариев */}
      {isLoading ? (
        <div className="space-y-6">
          {Array(3)
            .fill(0)
            .map((_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex gap-4 mt-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-6">
          {comments.map((comment) => (
            <div key={comment.id} className="space-y-4">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
                  <AvatarFallback>{comment.author.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div className="font-medium">{comment.author.name}</div>
                    <div className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</div>
                  </div>
                  <div className="mt-1">{comment.content}</div>
                  <div className="flex items-center gap-4 mt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground"
                      onClick={() => likeComment(comment.id)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{comment.likes}</span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-muted-foreground"
                      onClick={() => handleReply(comment)}
                    >
                      <Reply className="h-4 w-4" />
                      <span>Ответить</span>
                    </Button>

                    {session?.user?.id === comment.author.id && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(comment)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Редактировать
                          </DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <Trash className="h-4 w-4 mr-2" />
                                Удалить
                              </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Это действие нельзя отменить. Комментарий будет удален навсегда.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Отмена</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteComment(comment.id)}>Удалить</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>
              </div>

              {/* Ответы на комментарий */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="ml-14 space-y-4">
                  {comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-4">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={reply.author.avatar} alt={reply.author.name} />
                        <AvatarFallback>{reply.author.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <div className="font-medium">{reply.author.name}</div>
                          <div className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</div>
                        </div>
                        <div className="mt-1 text-sm">{reply.content}</div>
                        <div className="flex items-center gap-4 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-muted-foreground h-7 text-xs"
                            onClick={() => likeComment(reply.id, true, comment.id)}
                          >
                            <ThumbsUp className="h-3 w-3" />
                            <span>{reply.likes}</span>
                          </Button>

                          {session?.user?.id === reply.author.id && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground h-7">
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(reply)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Редактировать
                                </DropdownMenuItem>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                      <Trash className="h-4 w-4 mr-2" />
                                      Удалить
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Удалить комментарий?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Это действие нельзя отменить. Комментарий будет удален навсегда.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => deleteComment(reply.id, true, comment.id)}>
                                        Удалить
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-muted-foreground">
          Пока нет комментариев. Будьте первым, кто оставит комментарий!
        </div>
      )}
    </div>
  )
}

