"use client"

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

type NotificationHandlerProps = {
  notification: {
    id: string
    type: string
    entityId?: string
    title: string
    description: string
  }
  onClose: () => void
}

export function NotificationHandler({ notification, onClose }: NotificationHandlerProps) {
  const router = useRouter()
  const { data: session } = useSession()

  const handleNotificationClick = () => {
    switch (notification.type) {
      case 'MESSAGE':
        // Переходим к сообщениям с выбранным пользователем
        if (notification.entityId) {
          // Получаем информацию о сообщении для определения отправителя
          fetch(`/api/messages/${notification.entityId}`)
            .then(res => res.json())
            .then(messageData => {
              const senderId = messageData.senderId
              router.push(`/messages?senderId=${senderId}`)
            })
            .catch(error => {
              console.error('Error fetching message data:', error)
              router.push('/messages')
            })
        } else {
          router.push('/messages')
        }
        break
      
      case 'CALL':
        // Переходим к звонкам
        router.push('/messages?showCallSystem=true')
        break
      
      case 'TASK':
        // Переходим к задаче
        if (notification.entityId) {
          router.push(`/tasks/${notification.entityId}`)
        } else {
          router.push('/tasks')
        }
        break
      
      case 'EVENT':
        // Переходим к событию
        if (notification.entityId) {
          router.push(`/calendar?eventId=${notification.entityId}`)
        } else {
          router.push('/calendar')
        }
        break
      
      case 'ANNOUNCEMENT':
        // Переходим к объявлению
        if (notification.entityId) {
          router.push(`/announcements/${notification.entityId}`)
        } else {
          router.push('/announcements')
        }
        break
      
      default:
        // По умолчанию переходим на главную
        router.push('/dashboard')
    }
    
    onClose()
  }

  return (
    <div 
      className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      onClick={handleNotificationClick}
    >
      <div className="p-4">
        <h4 className="font-semibold text-sm">{notification.title}</h4>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {notification.description}
        </p>
      </div>
    </div>
  )
} 