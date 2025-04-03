"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function SettingsForm() {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleSaveProfile = async () => {
    setIsLoading(true)

    // Здесь будет код для сохранения профиля

    // Имитация задержки запроса
    setTimeout(() => {
      setIsLoading(false)
      toast({
        title: "Настройки сохранены",
        description: "Изменения профиля успешно сохранены.",
      })
    }, 1000)
  }

  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger value="profile">Профиль</TabsTrigger>
        <TabsTrigger value="appearance">Внешний вид</TabsTrigger>
        <TabsTrigger value="notifications">Уведомления</TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
            <CardDescription>Управляйте информацией вашего профиля и настройками аккаунта.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <div className="flex flex-col items-center space-y-2">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={session?.user?.image || ""} alt={session?.user?.name || ""} />
                  <AvatarFallback className="text-xl">
                    {session?.user?.name
                      ?.split(" ")
                      .map((n) => n[0])
                      .join("") || "U"}
                  </AvatarFallback>
                </Avatar>
                <Button variant="outline" size="sm">
                  Изменить фото
                </Button>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Имя</Label>
                  <Input id="name" defaultValue={session?.user?.name || ""} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={session?.user?.email || ""} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="position">Должность</Label>
                <Input id="position" defaultValue={session?.user?.role || ""} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Телефон</Label>
                <Input id="phone" placeholder="+7 (999) 123-45-67" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="location">Местоположение</Label>
                <Input id="location" placeholder="Город, Страна" />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveProfile} disabled={isLoading}>
              {isLoading ? "Сохранение..." : "Сохранить изменения"}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="appearance">
        <Card>
          <CardHeader>
            <CardTitle>Внешний вид</CardTitle>
            <CardDescription>Настройте внешний вид и тему интерфейса.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Тёмная тема</Label>
                <p className="text-sm text-muted-foreground">
                  Включите тёмную тему для комфортной работы в условиях низкой освещённости.
                </p>
              </div>
              <Switch id="dark-mode" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="compact-mode">Компактный режим</Label>
                <p className="text-sm text-muted-foreground">Уменьшает отступы и размеры элементов интерфейса.</p>
              </div>
              <Switch id="compact-mode" />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Сохранить настройки</Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Уведомления</CardTitle>
            <CardDescription>Настройте способы получения уведомлений.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-notifications">Email-уведомления</Label>
                <p className="text-sm text-muted-foreground">Получайте уведомления о важных событиях на email.</p>
              </div>
              <Switch id="email-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="browser-notifications">Push-уведомления в браузере</Label>
                <p className="text-sm text-muted-foreground">
                  Получайте уведомления в браузере, даже когда вкладка не активна.
                </p>
              </div>
              <Switch id="browser-notifications" />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="task-notifications">Уведомления о задачах</Label>
                <p className="text-sm text-muted-foreground">Уведомления о новых и изменённых задачах.</p>
              </div>
              <Switch id="task-notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="message-notifications">Уведомления о сообщениях</Label>
                <p className="text-sm text-muted-foreground">Уведомления о новых личных сообщениях.</p>
              </div>
              <Switch id="message-notifications" defaultChecked />
            </div>
          </CardContent>
          <CardFooter>
            <Button>Сохранить настройки</Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

