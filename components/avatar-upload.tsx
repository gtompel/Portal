"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Upload, X, User } from "lucide-react"
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

    // Валидация типа файла
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
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
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", fileInputRef.current.files[0])

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Ошибка при загрузке файла")
      }

      const result = await response.json()
      
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
      console.error("Ошибка загрузки:", error)
      toast({
        title: "Ошибка",
        description: error instanceof Error ? error.message : "Не удалось загрузить файл",
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
                  <AvatarFallback>
                    {initials || <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>
              </div>
            )}

            {/* Загрузка файла */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="avatar-upload">Выберите изображение:</Label>
              <Input
                id="avatar-upload"
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              <p className="text-xs text-muted-foreground">
                Поддерживаемые форматы: JPEG, PNG, GIF, WebP. Максимальный размер: 5MB
              </p>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-2 justify-end">
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
              <Button
                onClick={handleUpload}
                disabled={!previewUrl || isUploading}
              >
                {isUploading ? "Загрузка..." : "Сохранить"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 