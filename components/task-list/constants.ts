export const TASK_STATUSES = {
  NEW: "NEW",
  IN_PROGRESS: "IN_PROGRESS", 
  REVIEW: "REVIEW",
  COMPLETED: "COMPLETED"
} as const

export const TASK_PRIORITIES = {
  HIGH: "HIGH",
  MEDIUM: "MEDIUM", 
  LOW: "LOW"
} as const

export const NETWORK_TYPES = {
  EMVS: "EMVS",
  INTERNET: "INTERNET",
  ASZI: "ASZI"
} as const

export const STATUS_CONFIG = {
  [TASK_STATUSES.NEW]: {
    text: "Новый",
    color: "bg-blue-500"
  },
  [TASK_STATUSES.IN_PROGRESS]: {
    text: "Идёт настройка", 
    color: "bg-yellow-500"
  },
  [TASK_STATUSES.REVIEW]: {
    text: "Готов",
    color: "bg-purple-500"
  },
  [TASK_STATUSES.COMPLETED]: {
    text: "Выдан",
    color: "bg-green-500"
  }
} as const

export const PRIORITY_CONFIG = {
  [TASK_PRIORITIES.HIGH]: {
    text: "СЗ",
    color: "bg-green-500 text-white border-green-600"
  },
  [TASK_PRIORITIES.MEDIUM]: {
    text: "Без СЗ",
    color: "bg-red-500 text-white border-red-600"
  },
  [TASK_PRIORITIES.LOW]: {
    text: "Поручение",
    color: "bg-yellow-500 text-white border-yellow-600"
  }
} as const

export const NETWORK_CONFIG = {
  [NETWORK_TYPES.EMVS]: {
    text: "ЕМВС",
    color: "bg-blue-100 text-blue-800"
  },
  [NETWORK_TYPES.INTERNET]: {
    text: "Интернет", 
    color: "bg-green-100 text-green-800"
  },
  [NETWORK_TYPES.ASZI]: {
    text: "АСЗИ",
    color: "bg-orange-100 text-orange-800"
  }
} as const

export const DEFAULT_FILTERS = {
  searchTerm: "",
  statusFilter: "all",
  networkTypeFilter: "all", 
  assigneeFilter: "all",
  priorityFilter: "all",
  sortField: "taskNumber",
  sortDirection: "desc" as const,
  showArchived: false,
  dayTypeFilter: "all" as const
} as const 