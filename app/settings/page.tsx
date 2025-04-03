import type { Metadata } from "next"
import { SettingsForm } from "@/components/settings/settings-form"

export const metadata: Metadata = {
  title: "Настройки | Корпоративный портал",
  description: "Управление настройками пользователя и приложения",
}

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Настройки</h1>
      <p className="text-muted-foreground">Управление настройками вашего аккаунта и приложения</p>

      <SettingsForm />
    </div>
  )
}

