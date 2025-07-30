"use client"

import { useState, useEffect, useRef } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Upload, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface UserProfile {
  id: string
  name: string
  email: string
  position: string
  department: string
  phone?: string
  avatar?: string
  initials: string
  status: "WORKING" | "ON_VACATION" | "REMOTE"
  location?: string
  hireDate: string
  birthday?: string
  bio?: string
  managerId: string
}

interface Manager {
  id: string
  name: string
  position: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [managers, setManagers] = useState<Manager[]>([])
  
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    name: "",
    email: "",
    position: "",
    department: "",
    phone: "",
    avatar: "",
    initials: "",
    status: "WORKING",
    location: "",
    hireDate: "",
    birthday: "",
    bio: "",
    managerId: ""
  })

  const [notifications, setNotifications] = useState({
    email: true,
    push: false
  })

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Загрузка данных профиля
  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile()
      fetchManagers()
    }
  }, [session])

  const fetchProfile = async () => {
    try {
      const response = await fetch(`/api/users/${session?.user?.id}`)
      if (response.ok) {
        const userData = await response.json()
        setProfile({
          ...userData,
          hireDate: userData.hireDate ? new Date(userData.hireDate).toISOString().split('T')[0] : "",
          birthday: userData.birthday ? new Date(userData.birthday).toISOString().split('T')[0] : "",
          managerId: userData.managerId || ""
        })
        
        // Устанавливаем предварительный просмотр аватара, если он есть
        if (userData.avatar) {
          setAvatarPreview(null) // Сбрасываем предварительный просмотр
        }
      }
    } catch (error) {
      console.error("Ошибка загрузки профиля:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить данные профиля",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/users")
      if (response.ok) {
        const users = await response.json()
        setManagers(users.filter((user: any) => user.id !== session?.user?.id))
      }
    } catch (error) {
      console.error("Ошибка загрузки менеджеров:", error)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const dataToSend = {
        ...profile,
        managerId: profile.managerId || null
      }
      
      const response = await fetch(`/api/users/${session?.user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataToSend),
      })

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Профиль обновлен",
        })
      } else {
        throw new Error("Ошибка обновления")
      }
    } catch (error) {
      console.error("Ошибка сохранения:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось сохранить изменения",
        variant: "destructive"
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setProfile(prev => ({ ...prev, [field]: value }))
  }

  const handleAvatarUpload = async (file: File) => {
    if (!file) return

    console.log("Начало загрузки файла:", {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // Проверка размера файла (максимум 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Ошибка",
        description: "Размер файла не должен превышать 5MB",
        variant: "destructive"
      })
      return
    }

    // Проверка типа файла
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Ошибка",
        description: "Поддерживаются только изображения: JPG, PNG, GIF, WebP",
        variant: "destructive"
      })
      return
    }

    setIsUploadingAvatar(true)
    try {
      // Создаем предварительный просмотр
      const reader = new FileReader()
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Загружаем файл на сервер
      const formData = new FormData()
      formData.append("file", file)

      console.log("Отправка запроса на /api/upload")
      const uploadResponse = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      
      console.log("Получен ответ:", {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        ok: uploadResponse.ok
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json()
        console.error("Ошибка загрузки файла:", errorData)
        throw new Error(errorData.error || "Ошибка загрузки")
      }

      const uploadResult = await uploadResponse.json()
      
      // Обновляем профиль с новым URL аватара
      setProfile(prev => ({ ...prev, avatar: uploadResult.url }))
      
      toast({
        title: "Успешно",
        description: "Аватар загружен",
      })
    } catch (error) {
      console.error("Ошибка загрузки аватара:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить аватар",
        variant: "destructive"
      })
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const removeAvatar = () => {
    setAvatarPreview(null)
    setProfile(prev => ({ ...prev, avatar: "" }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    toast({
      title: "Успешно",
      description: "Аватар удален",
    })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold">Настройки</h1>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Настройки</h1>
      <p className="text-muted-foreground">Управление настройками вашего аккаунта и приложения</p>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium">Профиль пользователя</h3>
            <p className="text-sm text-muted-foreground">
              Управляйте информацией вашего профиля и настройками аккаунта.
            </p>

            <div className="mt-6 space-y-6">
              {/* Секция аватара */}
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-20 w-20 cursor-pointer hover:opacity-80 transition-opacity" onClick={handleAvatarClick}>
                                      <AvatarImage 
                    src={avatarPreview || profile.avatar || ""} 
                    alt={profile.name}
                  />
                    <AvatarFallback className="text-lg">
                      {getInitials(profile.name)}
                    </AvatarFallback>
                  </Avatar>
                  {isUploadingAvatar && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Загрузка...
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-medium">Фото профиля</Label>
                  <p className="text-sm text-muted-foreground">
                    Поддерживаются форматы: JPG, PNG, GIF, WebP. Максимальный размер: 5MB
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAvatarClick}
                      disabled={isUploadingAvatar}
                    >
                      {isUploadingAvatar ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {isUploadingAvatar ? "Загрузка..." : "Загрузить"}
                    </Button>
                    {(avatarPreview || profile.avatar) && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={removeAvatar}
                        disabled={isUploadingAvatar}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Удалить
                      </Button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        handleAvatarUpload(file)
                      }
                    }}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Имя *</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Ваше полное имя"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="Ваш email"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="position">Должность *</Label>
                  <Input
                    id="position"
                    value={profile.position}
                    onChange={(e) => handleInputChange("position", e.target.value)}
                    placeholder="Ваша должность"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="department">Отдел *</Label>
                  <Input
                    id="department"
                    value={profile.department}
                    onChange={(e) => handleInputChange("department", e.target.value)}
                    placeholder="Ваш отдел"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="phone">Телефон</Label>
                  <Input
                    id="phone"
                    value={profile.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Местоположение</Label>
                  <Input
                    id="location"
                    value={profile.location || ""}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="Город, офис"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="initials">Инициалы *</Label>
                  <Input
                    id="initials"
                    value={profile.initials}
                    onChange={(e) => handleInputChange("initials", e.target.value)}
                    placeholder="ИО"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status">Статус *</Label>
                  <Select value={profile.status} onValueChange={(value: string) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите статус" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WORKING">Работает</SelectItem>
                      <SelectItem value="ON_VACATION">В отпуске</SelectItem>
                      <SelectItem value="REMOTE">Удаленно</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="hireDate">Дата приема *</Label>
                  <Input
                    id="hireDate"
                    type="date"
                    value={profile.hireDate}
                    onChange={(e) => handleInputChange("hireDate", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="birthday">Дата рождения</Label>
                  <Input
                    id="birthday"
                    type="date"
                    value={profile.birthday || ""}
                    onChange={(e) => handleInputChange("birthday", e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="managerId">Менеджер</Label>
                  <Select value={profile.managerId || "none"} onValueChange={(value: string) => handleInputChange("managerId", value === "none" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите менеджера" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Не назначен</SelectItem>
                      {managers.map((manager) => (
                        <SelectItem key={manager.id} value={manager.id}>
                          {manager.name} - {manager.position}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="bio">О себе</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ""}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                  placeholder="Расскажите о себе, своих интересах и опыте..."
                  rows={3}
                />
              </div>

              <Button onClick={handleSave} disabled={isSaving} className="w-fit">
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" />
                Сохранить изменения
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium">Настройки уведомлений</h3>
            <p className="text-sm text-muted-foreground">Настройте способы получения уведомлений.</p>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email-уведомления</p>
                  <p className="text-sm text-muted-foreground">Получайте уведомления о важных событиях на email.</p>
                </div>
                <Switch
                  checked={notifications.email}
                  onCheckedChange={(checked: boolean) => setNotifications(prev => ({ ...prev, email: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push-уведомления</p>
                  <p className="text-sm text-muted-foreground">Получайте уведомления в браузере.</p>
                </div>
                <Switch
                  checked={notifications.push}
                  onCheckedChange={(checked: boolean) => setNotifications(prev => ({ ...prev, push: checked }))}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

