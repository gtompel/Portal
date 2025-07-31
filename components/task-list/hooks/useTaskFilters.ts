import { useState, useEffect, useCallback, useMemo } from "react"
import { useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { Task, TaskFilters } from "../types"
import { DEFAULT_FILTERS } from "../constants"
import { filterTasks, sortTasks, getStorageKey } from "../utils"

export function useTaskFilters(tasks: Task[]) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS)
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [filtersChanged, setFiltersChanged] = useState(false)

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
    if (!userId) return
    
    try {
      const savedFilters = localStorage.getItem(getStorageKey(userId))
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters)
        setFilters(parsedFilters)
      }
    } catch (error) {
      console.warn('Не удалось загрузить настройки фильтров:', error)
    }
  }, [])

  // Сброс фильтров к дефолтным значениям
  const resetFiltersToDefaults = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    
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
    setFiltersChanged(true)
  }, [])

  // Изменение сортировки
  const handleSort = useCallback((field: string) => {
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortDirection: prev.sortField === field && prev.sortDirection === "asc" ? "desc" : "asc"
    }))
    setFiltersChanged(true)
  }, [])

  // Применение фильтров и сортировки
  const applyFilters = useCallback(() => {
    const filtered = filterTasks(tasks, {
      searchTerm: filters.searchTerm,
      statusFilter: filters.statusFilter,
      networkTypeFilter: filters.networkTypeFilter,
      assigneeFilter: filters.assigneeFilter,
      priorityFilter: filters.priorityFilter
    })
    
    const sorted = sortTasks(filtered, filters.sortField, filters.sortDirection)
    setFilteredTasks(sorted)
  }, [tasks, filters])

  // Применяем фильтры при изменении задач или фильтров
  useEffect(() => {
    if (tasks.length > 0) {
      applyFilters()
    }
  }, [tasks, filters, applyFilters])

  // Загружаем сохраненные фильтры при инициализации
  useEffect(() => {
    if (session?.user?.id) {
      loadFiltersFromStorage(session.user.id)
    }
  }, [session?.user?.id, loadFiltersFromStorage])

  // Автоматически сохраняем фильтры при их изменении
  useEffect(() => {
    if (session?.user?.id && filtersChanged) {
      const timeoutId = setTimeout(() => {
        saveFiltersToStorage(session.user.id)
      }, 1000)

      return () => clearTimeout(timeoutId)
    }
  }, [filters, session?.user?.id, filtersChanged, saveFiltersToStorage])

  // Отслеживаем изменения фильтров
  useEffect(() => {
    if (session?.user?.id) {
      setFiltersChanged(true)
    }
  }, [filters, session?.user?.id])

  return {
    filters,
    filteredTasks,
    filtersChanged,
    updateFilter,
    handleSort,
    resetFiltersToDefaults
  }
} 