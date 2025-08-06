import { useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'

export function useUserActivity() {
  const { data: session } = useSession()
  const lastUpdateRef = useRef<{ isOnline: boolean; timestamp: number } | null>(null)

  useEffect(() => {
    if (!session?.user?.id) return

    // Функция для обновления активности с дебаунсом
    const updateActivity = async (isOnline: boolean) => {
      const now = Date.now()
      const lastUpdate = lastUpdateRef.current
      
      // Дебаунс: не обновляем если последнее обновление было менее 5 секунд назад и статус тот же
      if (lastUpdate && 
          now - lastUpdate.timestamp < 5000 && 
          lastUpdate.isOnline === isOnline) {
        return
      }

      try {
        await fetch('/api/users/activity', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isOnline }),
        })
        
        lastUpdateRef.current = { isOnline, timestamp: now }
      } catch (error) {
        console.error('Ошибка обновления активности:', error)
      }
    }

    // Устанавливаем пользователя как онлайн при загрузке
    updateActivity(true)

    // Обновляем активность каждые 120 секунд (2 минуты)
    const interval = setInterval(() => {
      updateActivity(true)
    }, 120000)

    // Обработчик для обновления активности при фокусе окна
    const handleFocus = () => {
      updateActivity(true)
    }

    // Обработчик для установки оффлайн при потере фокуса
    const handleBlur = () => {
      updateActivity(false)
    }

    // Обработчик для установки оффлайн при закрытии страницы
    const handleBeforeUnload = () => {
      updateActivity(false)
    }

    // Добавляем обработчики событий
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('beforeunload', handleBeforeUnload)

    // Очистка при размонтировании
    return () => {
      clearInterval(interval)
      updateActivity(false)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [session?.user?.id])
} 