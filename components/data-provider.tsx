"use client"

import { createContext, useContext, type ReactNode, useState } from "react"

// Типы данных
type User = {
  id: string
  name: string
  email: string
  position: string
  department: string
  phone?: string
  avatar?: string
  initials: string
  status: string
}

type Task = {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  assignee?: User
  assigneeId?: string
  creator: User
  creatorId: string
  createdAt: string
  updatedAt: string
}

type Document = {
  id: string
  name: string
  type: string
  description?: string
  url: string
  size: string
  creator: User
  creatorId: string
  createdAt: string
  updatedAt: string
}

type Event = {
  id: string
  title: string
  description?: string
  date: string
  startTime: string
  endTime: string
  location?: string
  type: string
  creator: User
  creatorId: string
  participants: EventParticipant[]
  createdAt: string
  updatedAt: string
}

type EventParticipant = {
  id: string
  eventId: string
  userId: string
  status: string
  user: User
}

type Message = {
  id: string
  content: string
  senderId: string
  receiverId: string
  sender: User
  receiver: User
  read: boolean
  attachments: MessageAttachment[]
  createdAt: string
  updatedAt: string
}

type MessageAttachment = {
  id: string
  name: string
  url: string
  type: string
  messageId: string
}

// Контекст данных
type DataContextType = {
  users: User[]
  tasks: Task[]
  documents: Document[]
  events: Event[]
  messages: Message[]
  loading: {
    users: boolean
    tasks: boolean
    documents: boolean
    events: boolean
    messages: boolean
  }
  error: {
    users: string | null
    tasks: string | null
    documents: string | null
    events: string | null
    messages: string | null
  }
  fetchUsers: (params?: Record<string, string>) => Promise<void>
  fetchTasks: (params?: Record<string, string>) => Promise<void>
  fetchDocuments: (params?: Record<string, string>) => Promise<void>
  fetchEvents: (params?: Record<string, string>) => Promise<void>
  fetchMessages: (params?: Record<string, string>) => Promise<void>
}

const DataContext = createContext<DataContextType | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [messages, setMessages] = useState<Message[]>([])

  const [loading, setLoading] = useState({
    users: false,
    tasks: false,
    documents: false,
    events: false,
    messages: false,
  })

  const [error, setError] = useState({
    users: null,
    tasks: null,
    documents: null,
    events: null,
    messages: null,
  })

  // Функция для формирования строки запроса из параметров
  const createQueryString = (params?: Record<string, string>) => {
    if (!params) return ""
    return Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== "")
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&")
  }

  // Функция для получения польз��вателей
  const fetchUsers = async (params?: Record<string, string>) => {
    try {
      setLoading((prev) => ({ ...prev, users: true }))
      setError((prev) => ({ ...prev, users: null }))

      const queryString = createQueryString(params)
      const response = await fetch(`/api/users${queryString ? `?${queryString}` : ""}`)

      if (!response.ok) {
        throw new Error("Ошибка при получении пользователей")
      }

      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError((prev) => ({ ...prev, users: err instanceof Error ? err.message : "Неизвестная ошибка" }))
    } finally {
      setLoading((prev) => ({ ...prev, users: false }))
    }
  }

  // Функция для получения задач
  const fetchTasks = async (params?: Record<string, string>) => {
    try {
      setLoading((prev) => ({ ...prev, tasks: true }))
      setError((prev) => ({ ...prev, tasks: null }))

      const queryString = createQueryString(params)
      const response = await fetch(`/api/tasks${queryString ? `?${queryString}` : ""}`)

      if (!response.ok) {
        throw new Error("Ошибка при получении задач")
      }

      const data = await response.json()
      setTasks(data)
    } catch (err) {
      setError((prev) => ({ ...prev, tasks: err instanceof Error ? err.message : "Неизвестная ошибка" }))
    } finally {
      setLoading((prev) => ({ ...prev, tasks: false }))
    }
  }

  // Функция для получения документов
  const fetchDocuments = async (params?: Record<string, string>) => {
    try {
      setLoading((prev) => ({ ...prev, documents: true }))
      setError((prev) => ({ ...prev, documents: null }))

      const queryString = createQueryString(params)
      const response = await fetch(`/api/documents${queryString ? `?${queryString}` : ""}`)

      if (!response.ok) {
        throw new Error("Ошибка при получении документов")
      }

      const data = await response.json()
      setDocuments(data)
    } catch (err) {
      setError((prev) => ({ ...prev, documents: err instanceof Error ? err.message : "Неизвестная ошибка" }))
    } finally {
      setLoading((prev) => ({ ...prev, documents: false }))
    }
  }

  // Функция для получения событий
  const fetchEvents = async (params?: Record<string, string>) => {
    try {
      setLoading((prev) => ({ ...prev, events: true }))
      setError((prev) => ({ ...prev, events: null }))

      const queryString = createQueryString(params)
      const response = await fetch(`/api/events${queryString ? `?${queryString}` : ""}`)

      if (!response.ok) {
        throw new Error("Ошибка при получении событий")
      }

      const data = await response.json()
      setEvents(data)
    } catch (err) {
      setError((prev) => ({ ...prev, events: err instanceof Error ? err.message : "Неизвестная ошибка" }))
    } finally {
      setLoading((prev) => ({ ...prev, events: false }))
    }
  }

  // Функция для получения сообщений
  const fetchMessages = async (params?: Record<string, string>) => {
    try {
      setLoading((prev) => ({ ...prev, messages: true }))
      setError((prev) => ({ ...prev, messages: null }))

      const queryString = createQueryString(params)
      const response = await fetch(`/api/messages${queryString ? `?${queryString}` : ""}`)

      if (!response.ok) {
        throw new Error("Ошибка при получении сообщений")
      }

      const data = await response.json()
      setMessages(data)
    } catch (err) {
      setError((prev) => ({ ...prev, messages: err instanceof Error ? err.message : "Неизвестная ошибка" }))
    } finally {
      setLoading((prev) => ({ ...prev, messages: false }))
    }
  }

  // Предоставляем контекст данных
  const value = {
    users,
    tasks,
    documents,
    events,
    messages,
    loading,
    error,
    fetchUsers,
    fetchTasks,
    fetchDocuments,
    fetchEvents,
    fetchMessages,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

// Хук для использования контекста данных
export function useData() {
  const context = useContext(DataContext)
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}

