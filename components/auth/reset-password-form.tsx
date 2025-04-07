"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Icons } from "@/components/icons"
import { Alert, AlertDescription } from "@/components/ui/alert"

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
    confirmPassword: z.string().min(6, { message: "Пароль должен содержать минимум 6 символов" }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  })

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>

export function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams?.get("token")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: ResetPasswordFormValues) {
    if (!token) {
      setError("Отсутствует токен сброса пароля")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // В реальном приложении здесь был бы запрос к API
      // const response = await fetch("/api/auth/reset-password", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     token,
      //     password: data.password,
      //   }),
      // })

      // if (!response.ok) {
      //   const errorData = await response.json()
      //   throw new Error(errorData.error || "Произошла ошибка при сбросе пароля")
      // }

      // Имитируем успешный ответ
      await new Promise((resolve) => setTimeout(resolve, 1500))

      router.push("/auth/login?reset=success")
    } catch (err) {
      console.error("Ошибка при сбросе пароля:", err)
      setError(err instanceof Error ? err.message : "Произошла ошибка при сбросе пароля")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!token && (
        <Alert variant="destructive">
          <AlertDescription>
            Недействительная или истекшая ссылка для сброса пароля. Пожалуйста, запросите новую ссылку.
          </AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Новый пароль</FormLabel>
                <FormControl>
                  <Input placeholder="******" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подтверждение пароля</FormLabel>
                <FormControl>
                  <Input placeholder="******" type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading || !token}>
            {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
            Сбросить пароль
          </Button>
        </form>
      </Form>
    </div>
  )
}

