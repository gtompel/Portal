import type { Metadata } from "next"
import Link from "next/link"
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form"

export const metadata: Metadata = {
  title: "Забыли пароль | ГАиОАРМ",
  description: "Восстановление пароля для системы управления АРМ",
}

export default function ForgotPasswordPage() {
  return (
    <div className="container relative h-screen flex-col items-center justify-center grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <img 
            src="/ARM.png" 
            alt="ГАиОАРМ" 
            className="mr-2 h-6 w-6 object-contain"
          />
          ГАиОАРМ
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              Система управления автоматизированными рабочими местами.
            </p>
            <footer className="text-sm">© ГАиОАРМ, 2025</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight">Восстановление пароля</h1>
            <p className="text-sm text-muted-foreground">
              Введите ваш email для получения инструкций по сбросу пароля
            </p>
          </div>
          <ForgotPasswordForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
              Вернуться к входу
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

