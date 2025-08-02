export type Task = {
  id: string
  title: string
  description: string | null
  assignee: {
    id: string
    name: string
    avatar: string | null
    initials: string
  } | null
  status: "NEW" | "IN_PROGRESS" | "REVIEW" | "COMPLETED"
  priority: "LOW" | "MEDIUM" | "HIGH"
  networkType: "EMVS" | "INTERNET" | "ASZI"
  dueDate: Date | null
  createdAt: Date
  taskNumber: number | null
  isArchived: boolean
  creator: {
    id: string
    name: string
  }
}

export type User = {
  id: string
  name: string
  initials: string
  avatar?: string
}

export type TaskFilters = {
  searchTerm: string
  statusFilter: string
  networkTypeFilter: string
  assigneeFilter: string
  priorityFilter: string
  sortField: string
  sortDirection: "asc" | "desc"
  showArchived: boolean
}

export type TaskFormData = {
  title: string
  description: string
  priority: "LOW" | "MEDIUM" | "HIGH"
  status: "NEW" | "IN_PROGRESS" | "REVIEW" | "COMPLETED"
  networkType: "EMVS" | "INTERNET" | "ASZI"
  dueDate: string
  assigneeId: string
} 