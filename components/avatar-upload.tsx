"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, User, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface AvatarUploadProps {
  currentAvatar?: string
  initials?: string
  onAvatarChange?: (avatarUrl: string) => void
  size?: "sm" | "md" | "lg"
  className?: string
}

export function AvatarUpload({ 
  currentAvatar, 
  initials, 
  onAvatarChange, 
  size = "md",
  className 
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const sizeClasses = {
    sm: "h-16 w-16",
    md: "h-24 w-24",
    lg: "h-32 w-32"
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    console.log("📁 Выбран файл:", {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Валидация типа файла
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      console.error("❌ Неподдерживаемый тип файла:", file.type)
      toast({
        title: "Ошибка",
        description: "Неподдерживаемый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WebP)",
        variant: "destructive",
      })
      return
    }

    // Валидация размера файла (5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      console.error("❌ Файл слишком большой:", file.size)
      toast({
        title: "Ошибка",
        description: "Файл слишком большой. Максимальный размер: 5MB",
        variant: "destructive",
      })
      return
    }

    // Создаем предварительный просмотр
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
      console.log("✅ Предварительный просмотр создан")
    }
    reader.onerror = (e) => {
      console.error("❌ Ошибка создания предварительного просмотра:", e)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) {
      console.error("❌ Файл не выбран")
      return
    }

    console.log("🚀 Начало загрузки файла:", file.name)
    setIsUploading(true)
    
    const formData = new FormData()
    formData.append("file", file)

    try {
      console.log("📦 FormData создан")
      console.log("📋 Параметры запроса:", {
        method: "POST",
        url: "/api/upload",
        fileType: file.type,
        fileSize: file.size
      })

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      console.log("📡 Ответ получен:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
          console.error("❌ Ошибка сервера:", errorData)
        } catch (parseError) {
          console.error("❌ Ошибка парсинга ответа:", parseError)
        }
        
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("✅ Успешный ответ:", result)
      
      if (onAvatarChange) {
        onAvatarChange(result.url)
      }

      toast({
        title: "Успешно",
        description: "Фото профиля обновлено",
      })

      setIsDialogOpen(false)
      setPreviewUrl(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

    } catch (error) {
      console.error("💥 Ошибка загрузки:", error)
      
      let errorMessage = "Не удалось загрузить файл"
      if (error instanceof Error) {
        errorMessage = error.message
        
        // Специальная обработка для разных типов ошибок
        if (error.name === 'AbortError') {
          errorMessage = "Загрузка была отменена"
        } else if (errorMessage.includes("Failed to fetch")) {
          errorMessage = "Ошибка подключения к серверу. Проверьте интернет-соединение и попробуйте снова."
        }
      }
      
      toast({
        title: "Ошибка загрузки",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = () => {
    if (onAvatarChange) {
      onAvatarChange("")
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast({
      title: "Успешно",
      description: "Фото профиля удалено",
    })
  }

  const displayAvatar = previewUrl || currentAvatar

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <Avatar className={cn(sizeClasses[size], "cursor-pointer")}>
        <AvatarImage 
          src={displayAvatar} 
          alt="Фото профиля"
          showModal={true}
        />
        <AvatarFallback className="text-lg">
          {initials || <User className="h-6 w-6" />}
        </AvatarFallback>
      </Avatar>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Изменить фото
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Изменить фото профиля</DialogTitle>
            <DialogDescription>
              Загрузите новое изображение для вашего профиля. Поддерживаются форматы JPEG, PNG, GIF, WebP.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-4">
            {/* Предварительный просмотр */}
            {previewUrl && (
              <div className="flex flex-col items-center gap-2">
                <Label>Предварительный просмотр:</Label>
                <Avatar className="h-20 w-20">
                  <AvatarImage src={previewUrl} alt="Предварительный просмотр" />
                  <AvatarFallback>Превью</AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Выбор файла */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="avatar-upload">Выберите файл:</Label>
              <Input
                id="avatar-upload"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <p className="text-xs text-muted-foreground">
                Максимальный размер: 5MB. Поддерживаемые форматы: JPEG, PNG, GIF, WebP
              </p>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-2">
              <Button
                onClick={handleUpload}
                disabled={!fileInputRef.current?.files?.[0] || isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить
                  </>
                )}
              </Button>
              
              {currentAvatar && (
                <Button
                  variant="outline"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Удалить
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 