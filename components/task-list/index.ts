// Основные компоненты
export { TaskListRefactored } from "./TaskListRefactored"
export { TaskList } from "./TaskList"

// Типы
export type { Task, User, TaskFilters, TaskFormData } from "./types"

// Константы
export { 
  TASK_STATUSES, 
  TASK_PRIORITIES, 
  NETWORK_TYPES,
  STATUS_CONFIG,
  PRIORITY_CONFIG,
  NETWORK_CONFIG,
  DEFAULT_FILTERS
} from "./constants"

// Утилиты
export {
  getInitials,
  getDisplayName,
  getStatusColor,
  getStatusText,
  getPriorityColor,
  getPriorityText,
  getNetworkTypeColor,
  getNetworkTypeText,
  getTaskNumber,
  sortTasks,
  filterTasks,
  formatDate,
  getStorageKey
} from "./utils"

// Хуки
export { useTaskList } from "./hooks/useTaskList"
export { useTaskFilters } from "./hooks/useTaskFilters"
export { useTaskActions } from "./hooks/useTaskActions"
export { useTaskForms } from "./hooks/useTaskForms" 