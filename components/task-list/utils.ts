import { Task, User } from "./types"
import { STATUS_CONFIG, PRIORITY_CONFIG, NETWORK_CONFIG } from "./constants"

// Функция для получения инициалов из имени
export const getInitials = (name: string): string => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
}

// Функция для отображения имени в компактном формате
export const getDisplayName = (fullName: string): string => {
  const nameParts = fullName.trim().split(" ").filter(part => part.length > 0)
  
  // Если имя короткое, возвращаем как есть
  if (nameParts.length <= 2) {
    return fullName
  }
  
  // Для длинных имен: Фамилия И.О.
  if (nameParts.length >= 3) {
    const lastName = nameParts[0]
    const firstNameInitial = nameParts[1].charAt(0) + "."
    const middleNameInitial = nameParts[2].charAt(0) + "."
    return `${lastName} ${firstNameInitial}${middleNameInitial}`
  }
  
  return fullName
}

// Функция для получения цвета статуса
export const getStatusColor = (status: Task["status"]): string => {
  return STATUS_CONFIG[status]?.color || "bg-gray-500"
}

// Функция для получения текста статуса
export const getStatusText = (status: Task["status"]): string => {
  return STATUS_CONFIG[status]?.text || status
}

// Функция для получения цвета приоритета
export const getPriorityColor = (priority: Task["priority"]): string => {
  return PRIORITY_CONFIG[priority]?.color || "bg-gray-100 text-gray-800"
}

// Функция для получения текста приоритета
export const getPriorityText = (priority: Task["priority"]): string => {
  return PRIORITY_CONFIG[priority]?.text || priority
}

// Функция для получения цвета типа сети
export const getNetworkTypeColor = (networkType: Task["networkType"]): string => {
  return NETWORK_CONFIG[networkType]?.color || "bg-gray-100 text-gray-800"
}

// Функция для получения текста типа сети
export const getNetworkTypeText = (networkType: Task["networkType"]): string => {
  return NETWORK_CONFIG[networkType]?.text || networkType
}

// Функция для правильной нумерации задач
export const getTaskNumber = (task: Task): number => {
  return task.taskNumber || 0
}

// Функция для сортировки задач
export const sortTasks = (
  tasks: Task[], 
  sortField: string, 
  sortDirection: "asc" | "desc"
): Task[] => {
  return [...tasks].sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortField) {
      case "taskNumber":
        aValue = a.taskNumber || 0
        bValue = b.taskNumber || 0
        break
      case "title":
        aValue = a.title.toLowerCase()
        bValue = b.title.toLowerCase()
        break
      case "description":
        aValue = (a.description || "").toLowerCase()
        bValue = (b.description || "").toLowerCase()
        break
      case "assignee":
        aValue = a.assignee?.name.toLowerCase() || ""
        bValue = b.assignee?.name.toLowerCase() || ""
        break
      case "status":
        aValue = a.status
        bValue = b.status
        break
      case "priority":
        aValue = a.priority
        bValue = b.priority
        break
      case "networkType":
        aValue = a.networkType
        bValue = b.networkType
        break
      case "dueDate":
        aValue = a.dueDate ? new Date(a.dueDate).getTime() : 0
        bValue = b.dueDate ? new Date(b.dueDate).getTime() : 0
        break
      case "createdAt":
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
        break
    }

    if (aValue < bValue) {
      return sortDirection === "asc" ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === "asc" ? 1 : -1
    }
    return 0
  })
}

// Функция для фильтрации задач
export const filterTasks = (
  tasks: Task[],
  filters: {
    searchTerm: string
    statusFilter: string
    networkTypeFilter: string
    assigneeFilter: string
    priorityFilter: string
  }
): Task[] => {
  let result = [...tasks]

  if (filters.searchTerm) {
    result = result.filter(
      (task) =>
        task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))
    )
  }

  if (filters.statusFilter !== "all") {
    result = result.filter((task) => task.status === filters.statusFilter)
  }

  if (filters.networkTypeFilter !== "all") {
    result = result.filter((task) => task.networkType === filters.networkTypeFilter)
  }

  if (filters.assigneeFilter !== "all") {
    result = result.filter((task) => task.assignee?.id === filters.assigneeFilter)
  }

  if (filters.priorityFilter !== "all") {
    result = result.filter((task) => task.priority === filters.priorityFilter)
  }

  return result
}

// Функция для форматирования даты
export const formatDate = (dateString: string | null): string => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("ru-RU")
}

// Функция для получения ключа LocalStorage
export const getStorageKey = (userId: string): string => {
  return `taskFilters_${userId}`
} 