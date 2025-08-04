"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Task, TaskFilters } from "../types"
import { DEFAULT_FILTERS } from "../constants"
import { filterTasks, sortTasks, getStorageKey } from "../utils"
import { useOptimizedState, useOptimizedFilter, useOptimizedSort } from "@/hooks/use-optimized-state"

export function useTaskFilters(tasks: Task[]) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [filters, setFilters] = useOptimizedState<TaskFilters>(DEFAULT_FILTERS)
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [filtersChanged, setFiltersChanged] = useState(false)
  const [filtersLoaded, setFiltersLoaded] = useState(false)

  // Сохранение фильтров в LocalStorage
  const saveFiltersToStorage = useCallback((userId: string) => {
    if (!userId) return
    
    try {
      localStorage.setItem(getStorageKey(userId), JSON.stringify(filters))
      setFiltersChanged(false)
    } catch (error) {
      console.warn('Не удалось сохранить настройки фильтров:', error)
    }
  }, [filters])

  // Загрузка фильтров из LocalStorage
  const loadFiltersFromStorage = useCallback((userId: string) => {
    if (!userId) {
      setFiltersLoaded(true)
      return
    }
    
    try {
      const savedFilters = localStorage.getItem(getStorageKey(userId))
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters)
        setFilters(parsedFilters)
      }
      setFiltersLoaded(true)
    } catch (error) {
      console.warn('Не удалось загрузить настройки фильтров:', error)
      setFiltersLoaded(true)
    }
  }, [])

  // Проверка, есть ли активные фильтры
  const hasActiveFilters = useMemo(() => {
    return (
      filters.searchTerm !== "" ||
      filters.statusFilter !== "all" ||
      filters.networkTypeFilter !== "all" ||
      filters.assigneeFilter !== "all" ||
      filters.priorityFilter !== "all" ||
      filters.sortField !== "taskNumber" ||
      filters.sortDirection !== "desc"
    )
  }, [filters])

  // Сброс фильтров к дефолтным значениям
  const resetFiltersToDefaults = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setFiltersChanged(false)
    
    if (session?.user?.id) {
      localStorage.removeItem(getStorageKey(session.user.id))
    }
    
    toast({
      title: "Фильтры сброшены",
      description: "Настройки фильтрации возвращены к значениям по умолчанию",
    })
  }, [session?.user?.id, toast])

  // Обновление фильтров
  const updateFilter = useCallback((key: keyof TaskFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }, [])

  // Изменение сортировки
  const handleSort = useCallback((field: string) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === "asc" ? "desc" : "asc"
    }))
  }, [])

  // Применение фильтров и сортировки с оптимизацией
  const filtered = useOptimizedFilter(tasks, (task) => {
    const matchesSearch = !filters.searchTerm || 
      task.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(filters.searchTerm.toLowerCase()))
    
    const matchesStatus = filters.statusFilter === "all" || task.status === filters.statusFilter
    const matchesNetwork = filters.networkTypeFilter === "all" || task.networkType === filters.networkTypeFilter
    const matchesAssignee = filters.assigneeFilter === "all" || task.assignee?.id === filters.assigneeFilter
    const matchesPriority = filters.priorityFilter === "all" || task.priority === filters.priorityFilter
    
    return Boolean(matchesSearch && matchesStatus && matchesNetwork && matchesAssignee && matchesPriority)
  }, [filters.searchTerm, filters.statusFilter, filters.networkTypeFilter, filters.assigneeFilter, filters.priorityFilter])

  const sortedTasks = useOptimizedSort(filtered, (a, b) => {
    const aValue = a[filters.sortField as keyof Task]
    const bValue = b[filters.sortField as keyof Task]
    
    // Безопасное сравнение с учетом null/undefined
    const aSafe = aValue ?? ""
    const bSafe = bValue ?? ""
    
    if (filters.sortDirection === "asc") {
      return aSafe > bSafe ? 1 : -1
    } else {
      return aSafe < bSafe ? 1 : -1
    }
  }, [filters.sortField, filters.sortDirection])

  // Обновляем отфильтрованные задачи
  useEffect(() => {
    setFilteredTasks(sortedTasks)
  }, [sortedTasks])

  // Применяем фильтры при изменении задач
  useEffect(() => {
    if (tasks.length > 0) {
      // Фильтрация и сортировка уже оптимизированы выше
    }
  }, [tasks])

  // Загружаем сохраненные фильтры при инициализации
  useEffect(() => {
    if (session?.user?.id) {
      loadFiltersFromStorage(session.user.id)
    } else {
      // Если пользователь не авторизован, все равно помечаем фильтры как загруженные
      setFiltersLoaded(true)
    }
  }, [session?.user?.id, loadFiltersFromStorage])

  // Автоматически сохраняем фильтры при их изменении
  useEffect(() => {
    if (session?.user?.id && hasActiveFilters) {
      const timeoutId = setTimeout(() => {
        saveFiltersToStorage(session.user.id)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [filters, session?.user?.id, hasActiveFilters, saveFiltersToStorage])

  return {
    filters,
    filteredTasks,
    filtersChanged: hasActiveFilters,
    filtersLoaded,
    updateFilter,
    handleSort,
    resetFiltersToDefaults
  }
} 