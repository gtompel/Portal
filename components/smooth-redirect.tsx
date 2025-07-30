"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, ArrowRight } from 'lucide-react'

interface SmoothRedirectProps {
  to: string
  delay?: number
  message?: string
}

export function SmoothRedirect({ to, delay = 2000, message = "Перенаправление..." }: SmoothRedirectProps) {
  const router = useRouter()
  const [countdown, setCountdown] = useState(Math.ceil(delay / 1000))

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push(to)
    }, delay)

    const countdownTimer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearInterval(countdownTimer)
    }
  }, [to, delay, router])

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
          </div>
          <CardTitle className="text-xl">Перенаправление</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Через</span>
            <span className="text-lg font-semibold text-blue-600">{countdown}</span>
            <span className="text-sm text-muted-foreground">секунд</span>
            <ArrowRight className="h-4 w-4 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 