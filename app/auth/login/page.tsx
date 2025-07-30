import type { Metadata } from "next"
import Link from "next/link"
import LoginForm from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Вход | ГАиОАРМ",
  description: "Войдите в систему управления автоматизированными рабочими местами",
}

export default function LoginPage() {
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
            <h1 className="text-2xl font-semibold tracking-tight">Добро пожаловать</h1>
            <p className="text-sm text-muted-foreground">Введите свой email и пароль для входа</p>
          </div>
          <LoginForm />
          <p className="px-8 text-center text-sm text-muted-foreground">
            Нет учетной записи?{" "}
            <Link href="/auth/register" className="underline underline-offset-4 hover:text-primary">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

