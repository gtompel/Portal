import { EventEmitter } from 'events'

// Глобальный EventEmitter для передачи событий
export const taskEvents = new EventEmitter()

// Типы событий
export type TaskEventType = 
  | 'task_created'
  | 'task_updated' 
  | 'task_deleted'
  | 'task_archived'
  | 'task_status_changed'
  | 'task_priority_changed'
  | 'task_network_type_changed'
  | 'task_assigned'

export interface TaskEvent {
  type: TaskEventType
  taskId?: string
  task?: any
  userId?: string
  timestamp: number
}

// Функция для отправки события
export const emitTaskEvent = (eventType: TaskEventType, data: Partial<TaskEvent> = {}) => {
  const event: TaskEvent = {
    type: eventType,
    timestamp: Date.now(),
    ...data
  }
  
  taskEvents.emit('task_change', event)
  // Логируем только в режиме разработки
  if (process.env.NODE_ENV === 'development') {
    console.log(`Task event: ${eventType}`, { taskId: event.taskId, userId: event.userId })
  }
} 