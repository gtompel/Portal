import { EventEmitter } from 'events'

// Глобальный singleton EventEmitter для dev/HMR и многопроцессной среды
// Чтобы один и тот же инстанс использовался во всех импортёрах
const globalKey = '__TASK_EVENTS_SINGLETON__'
const globalAny = globalThis as unknown as Record<string, any>

if (!globalAny[globalKey]) {
  const emitter = new EventEmitter()
  emitter.setMaxListeners(100)
  globalAny[globalKey] = emitter
}

export const taskEvents: EventEmitter = globalAny[globalKey]

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
} 