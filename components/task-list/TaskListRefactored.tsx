"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { TooltipProvider } from "@/components/ui/tooltip"
import { TaskListHeader } from "./components/TaskListHeader"
import { TaskListFilters } from "./components/TaskListFilters"
import { TaskListTable } from "./components/TaskListTable"
import { TaskDialogs } from "./components/TaskDialogs"
import { useTaskList } from "./hooks/useTaskList"
import { useTaskFilters } from "./hooks/useTaskFilters"
import { useTaskActions } from "./hooks/useTaskActions"
import { Task, TaskFormData } from "./types"
import { createTask as createTaskAction, updateTask as updateTaskAction, deleteTask as deleteTaskAction, archiveTask as archiveTaskAction, restoreTask as restoreTaskAction, updateTaskStatus as updateTaskStatusAction } from "@/lib/actions"

export function TaskListRefactored() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const searchParams = useSearchParams()
  
  // Состояния для диалогов
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  
  // Основная логика задач
  const {
    tasks,
    users,
    isLoading,
    error,
    isSSEConnected,
    fetchTasks,
    setTasks
  } = useTaskList()

  // Логика фильтров
  const {
    filters,
    filteredTasks,
    filtersChanged,
    filtersLoaded,
    updateFilter,
    handleSort,
    resetFiltersToDefaults
  } = useTaskFilters(tasks)

  // Логика действий
  const {
    isAddingTask,
    isEditingTask,
    isDeletingTask,
    createTask,
    updateTask,
    deleteTask,
    quickUpdateStatus,
    quickUpdatePriority,
    quickUpdateNetworkType,
    quickUpdateAssignee,
    archiveTask,
    restoreTask
  } = useTaskActions(setTasks)

  // Получаем taskId из URL параметров
  const taskId = searchParams?.get("taskId")

  // Загружаем задачи при изменении фильтра архива
  useEffect(() => {
    fetchTasks(filters.showArchived)
  }, [filters.showArchived, fetchTasks])

  // Если в URL указан taskId, открываем диалог редактирования
  useEffect(() => {
    if (taskId && tasks.length > 0) {
      const task = tasks.find(t => t.id === taskId)
      if (task) {
        setCurrentTask(task)
        setIsEditDialogOpen(true)
      }
    }
  }, [taskId, tasks])

  // Обработка ошибок
  if (error) {
    return (
      <div className="space-y-4">
        <div className="p-6 bg-destructive/10 rounded-md">
          <h3 className="font-semibold">Ошибка загрузки</h3>
          <p>{error}</p>
          <button 
            onClick={() => fetchTasks(filters.showArchived)}
            className="mt-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Повторить
          </button>
        </div>
      </div>
    )
  }

  // Обработчики диалогов
  const handleCreateTask = () => {
    setIsCreateDialogOpen(true)
  }

  const handleEditTask = (task: Task) => {
    setCurrentTask(task)
    setIsEditDialogOpen(true)
  }

  const handleDeleteTask = (task: Task) => {
    setTaskToDelete(task)
    setIsDeleteDialogOpen(true)
  }

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false)
  }

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false)
    setCurrentTask(null)
  }

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false)
    setTaskToDelete(null)
  }

  // Обработчики CRUD операций с Server Actions
  const handleCreateTaskSubmit = async (data: TaskFormData): Promise<boolean> => {
    try {
      // Создаем FormData для Server Action
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description || '')
      formData.append('status', data.status)
      formData.append('priority', data.priority)
      formData.append('networkType', data.networkType)
      formData.append('assigneeId', data.assigneeId || '')
      if (data.dueDate) {
        formData.append('dueDate', data.dueDate)
      }

      const result = await createTaskAction(formData)
      if (result.success && result.task) {
        // Обновляем локальное состояние
        setTasks(prev => [result.task, ...prev])
        return true
      }
      return false
    } catch (error) {
      console.error('Server Action error:', error)
      // Fallback к старому API
      const result = await createTask(data)
      return result ?? false
    }
  }

  const handleUpdateTask = async (taskId: string, data: TaskFormData): Promise<boolean> => {
    try {
      // Создаем FormData для Server Action
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description || '')
      formData.append('status', data.status)
      formData.append('priority', data.priority)
      formData.append('networkType', data.networkType)
      formData.append('assigneeId', data.assigneeId || '')
      if (data.dueDate) {
        formData.append('dueDate', data.dueDate)
      }

      const result = await updateTaskAction(taskId, formData)
      if (result.success && result.task) {
        // Обновляем локальное состояние
        setTasks(prev => prev.map(task => 
          task.id === taskId ? result.task : task
        ))
        return true
      }
      return false
    } catch (error) {
      console.error('Server Action error:', error)
      // Fallback к старому API
      const result = await updateTask(taskId, data)
      return result ?? false
    }
  }

  const handleDeleteTaskConfirm = async (taskId: string): Promise<boolean> => {
    try {
      const result = await deleteTaskAction(taskId)
      if (result.success) {
        // Обновляем локальное состояние
        setTasks(prev => prev.filter(task => task.id !== taskId))
        return true
      }
      return false
    } catch (error) {
      console.error('Server Action error:', error)
      // Fallback к старому API
      const result = await deleteTask(taskId)
      return result ?? false
    }
  }

  // Обработчики быстрых обновлений
  const handleQuickUpdateStatus = async (taskId: string, status: Task["status"]) => {
    try {
      const result = await updateTaskStatusAction(taskId, status)
      if (result.success) {
        // Обновляем локальное состояние
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, status } : task
        ))
        return true
      }
      return false
    } catch (error) {
      console.error('Server Action error:', error)
      // Fallback к старому API
      return await quickUpdateStatus(taskId, status)
    }
  }

  const handleQuickUpdatePriority = async (taskId: string, priority: Task["priority"]) => {
    return await quickUpdatePriority(taskId, priority)
  }

  const handleQuickUpdateNetworkType = async (taskId: string, networkType: Task["networkType"]) => {
    return await quickUpdateNetworkType(taskId, networkType)
  }

  const handleQuickUpdateAssignee = async (taskId: string, assigneeId: string) => {
    return await quickUpdateAssignee(taskId, assigneeId, users)
  }

  const handleArchiveTask = async (taskId: string) => {
    try {
      const result = await archiveTaskAction(taskId)
      if (result.success) {
        // Обновляем локальное состояние
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, isArchived: true } : task
        ))
        return true
      }
      return false
    } catch (error) {
      console.error('Server Action error:', error)
      // Fallback к старому API
      return await archiveTask(taskId)
    }
  }

  const handleRestoreTask = async (taskId: string) => {
    try {
      const result = await restoreTaskAction(taskId)
      if (result.success) {
        // Обновляем локальное состояние
        setTasks(prev => prev.map(task => 
          task.id === taskId ? { ...task, isArchived: false } : task
        ))
        return true
      }
      return false
    } catch (error) {
      console.error('Server Action error:', error)
      // Fallback к старому API
      return await restoreTask(taskId)
    }
  }

  return (
    <TooltipProvider>
      <div className="space-y-4">
        {/* Заголовок */}
        <TaskListHeader 
          showArchived={filters.showArchived}
          isSSEConnected={isSSEConnected}
        />
        
        {/* Фильтры */}
        <TaskListFilters
          filters={filters}
          users={users}
          onFilterChange={updateFilter}
          onResetFilters={resetFiltersToDefaults}
          filtersChanged={filtersChanged}
          onCreateTask={handleCreateTask}
        />
        {!filtersLoaded && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2 text-sm text-muted-foreground">Загрузка фильтров...</span>
          </div>
        )}
        
        {/* Таблица */}
        <TaskListTable
          tasks={filteredTasks}
          isLoading={isLoading}
          showArchived={filters.showArchived}
          onSort={handleSort}
          sortField={filters.sortField}
          sortDirection={filters.sortDirection}
          users={users}
          setTasks={setTasks}
          onEdit={handleEditTask}
          onDelete={handleDeleteTask}
          onArchive={handleArchiveTask}
          onRestore={handleRestoreTask}
          onQuickUpdateStatus={handleQuickUpdateStatus}
          onQuickUpdatePriority={handleQuickUpdatePriority}
          onQuickUpdateNetworkType={handleQuickUpdateNetworkType}
          onQuickUpdateAssignee={handleQuickUpdateAssignee}
        />
        
        {/* Диалоги */}
        <TaskDialogs
          users={users}
          isCreateDialogOpen={isCreateDialogOpen}
          isEditDialogOpen={isEditDialogOpen}
          isDeleteDialogOpen={isDeleteDialogOpen}
          currentTask={currentTask}
          taskToDelete={taskToDelete}
          isAddingTask={isAddingTask}
          isEditingTask={isEditingTask}
          isDeletingTask={isDeletingTask}
          onCreateTask={handleCreateTaskSubmit}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTaskConfirm}
          onCloseCreateDialog={handleCloseCreateDialog}
          onCloseEditDialog={handleCloseEditDialog}
          onCloseDeleteDialog={handleCloseDeleteDialog}
        />
      </div>
    </TooltipProvider>
  )
} 