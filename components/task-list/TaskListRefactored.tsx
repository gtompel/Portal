"use client"

import React, { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { TaskListHeader } from "./components/TaskListHeader"
import { TaskListFilters } from "./components/TaskListFilters"
import { TaskListTable } from "./components/TaskListTable"
import { TaskDialogs } from "./components/TaskDialogs"
import { useTaskList } from "./hooks/useTaskList"
import { useTaskFilters } from "./hooks/useTaskFilters"
import { useTaskActions } from "./hooks/useTaskActions"
import { Task, TaskFormData } from "./types"

export function TaskListRefactored() {
  const { data: session } = useSession()
  const { toast } = useToast()
  
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

  // Загружаем задачи при изменении фильтра архива
  useEffect(() => {
    fetchTasks(filters.showArchived)
  }, [filters.showArchived, fetchTasks])

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

  // Обработчики CRUD операций
  const handleCreateTaskSubmit = async (data: TaskFormData): Promise<boolean> => {
    const result = await createTask(data)
    return result ?? false
  }

  const handleUpdateTask = async (taskId: string, data: TaskFormData): Promise<boolean> => {
    const result = await updateTask(taskId, data)
    return result ?? false
  }

  const handleDeleteTaskConfirm = async (taskId: string): Promise<boolean> => {
    const result = await deleteTask(taskId)
    return result ?? false
  }

  // Обработчики быстрых обновлений
  const handleQuickUpdateStatus = async (taskId: string, status: Task["status"]) => {
    return await quickUpdateStatus(taskId, status)
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
    return await archiveTask(taskId)
  }

  const handleRestoreTask = async (taskId: string) => {
    return await restoreTask(taskId)
  }

  return (
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
  )
} 