"use client"

import { useState } from "react"
import { AvatarUpload } from "@/components/avatar-upload"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AvatarTestPage() {
  const [avatarUrl, setAvatarUrl] = useState<string>("")

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Тест загрузки аватара</h1>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Загрузка аватара</CardTitle>
          </CardHeader>
          <CardContent>
            <AvatarUpload
              currentAvatar={avatarUrl}
              initials="ТП"
              onAvatarChange={setAvatarUrl}
              size="lg"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Информация</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Текущий аватар:</strong></p>
              <p className="text-sm text-muted-foreground break-all">
                {avatarUrl || "Не установлен"}
              </p>
              
              <div className="mt-4">
                <p><strong>Возможности:</strong></p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Загрузка изображений (JPEG, PNG, GIF, WebP)</li>
                  <li>Максимальный размер: 5MB</li>
                  <li>Предварительный просмотр</li>
                  <li>Модальное окно просмотра</li>
                  <li>Удаление аватара</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 