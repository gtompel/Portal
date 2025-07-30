"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"

// Схема валидации для запроса сброса пароля
const requestResetSchema = z.object({
  email: z.string().email("Неверный формат email")
})

// Схема валидации для установки нового пароля
const resetPasswordSchema = z.object({
  email: z.string().email("Неверный формат email"),
  newPassword: z.string().min(6, "Пароль должен содержать минимум 6 символов"),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"]
})

type RequestResetForm = z.infer<typeof requestResetSchema>
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export function ForgotPasswordForm() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState<"request" | "reset">("request")
  const [resetToken, setResetToken] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const requestForm = useForm<RequestResetForm>({
    resolver: zodResolver(requestResetSchema),
    defaultValues: {
      email: ""
    }
  })

  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      newPassword: "",
      confirmPassword: ""
    }
  })

  const onRequestReset = async (data: RequestResetForm) => {
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
      })

      const result = await response.json()

      if (response.ok) {
        setResetToken(result.resetToken)
        setUserEmail(data.email)
        setStep("reset")
        resetForm.setValue("email", data.email)
        
        toast({
          title: "Успешно",
          description: "Токен для сброса пароля отправлен. Введите новый пароль.",
        })
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось отправить запрос на сброс пароля",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Ошибка при запросе сброса пароля:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при отправке запроса",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const onResetPassword = async (data: ResetPasswordForm) => {
    try {
      setIsLoading(true)
      
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: data.email,
          newPassword: data.newPassword,
          resetToken: resetToken
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "Успешно",
          description: "Пароль успешно изменен. Теперь вы можете войти с новым паролем.",
        })
        
        // Перенаправляем на страницу входа
        window.location.href = "/auth/login"
      } else {
        toast({
          title: "Ошибка",
          description: result.error || "Не удалось изменить пароль",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Ошибка при сбросе пароля:", error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при изменении пароля",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (step === "reset") {
    return (
      <div className="space-y-4">
        <Form {...resetForm}>
          <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
            <FormField
              control={resetForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="email"
                      placeholder="email@example.com"
                      disabled
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={resetForm.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Новый пароль</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Введите новый пароль"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={resetForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подтвердите пароль</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Повторите новый пароль"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Изменить пароль
            </Button>
          </form>
        </Form>
        
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setStep("request")}
          disabled={isLoading}
        >
          Назад
        </Button>
      </div>
    )
  }

  return (
    <Form {...requestForm}>
      <form onSubmit={requestForm.handleSubmit(onRequestReset)} className="space-y-4">
        <FormField
          control={requestForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="email"
                  placeholder="email@example.com"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Отправить запрос на сброс пароля
        </Button>
      </form>
    </Form>
  )
}

