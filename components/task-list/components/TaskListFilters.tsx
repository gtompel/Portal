import React, { useState, useEffect } from "react"
import { Search, X, Plus, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { User, TaskFilters } from "../types"
import { useDebounce } from "@/hooks/use-debounce"

interface TaskListFiltersProps {
  filters: TaskFilters
  users: User[]
  onFilterChange: (key: keyof TaskFilters, value: any) => void
  onResetFilters: () => void
  filtersChanged: boolean
  onCreateTask: () => void
}

export function TaskListFilters({
  filters,
  users,
  onFilterChange,
  onResetFilters,
  filtersChanged,
  onCreateTask
}: TaskListFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.searchTerm)
  const debouncedSearchValue = useDebounce(searchValue, 300)

  // Синхронизируем локальное состояние с пропсами
  useEffect(() => {
    setSearchValue(filters.searchTerm)
  }, [filters.searchTerm])

  // Обработчик сброса фильтров
  const handleResetFilters = () => {
    setSearchValue("") // Принудительно очищаем поиск
    onResetFilters()
  }

  // Применяем debounced значение к фильтрам
  useEffect(() => {
    onFilterChange("searchTerm", debouncedSearchValue)
  }, [debouncedSearchValue, onFilterChange])

  return (
    <div className="flex flex-col gap-4">
      {/* Строка поиска и кнопки управления */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Строка поиска */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Поиск..."
            className="pl-10 pr-10 w-full h-9 text-sm"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
          {searchValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchValue("")}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Кнопки управления */}
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <div className="flex items-center space-x-2">
            <Switch
              id="show-archived"
              checked={filters.showArchived}
              onCheckedChange={(checked) => onFilterChange("showArchived", checked)}
            />
            <Label htmlFor="show-archived" className="text-sm whitespace-nowrap">
              {filters.showArchived ? "Активные" : "Архив"}
            </Label>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetFilters}
            disabled={!filtersChanged}
            className={`gap-1 h-9 text-sm ${filtersChanged ? 'border-orange-500 text-orange-600' : ''}`}
            title={filtersChanged ? 'Есть активные фильтры' : 'Сбросить фильтры'}
          >
            <RotateCcw className="h-4 w-4" />
            <span className="hidden sm:inline">Сброс</span>
            <span className="sm:hidden">Сброс</span>
            {filtersChanged && (
              <div className="w-2 h-2 bg-orange-500 rounded-full ml-1" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Фильтры - в одну строку, с горизонтальным скроллом при нехватке места */}
      <div className="flex flex-row items-center gap-2 overflow-x-auto">
        <Select value={filters.statusFilter} onValueChange={(value) => onFilterChange("statusFilter", value)}>
          <SelectTrigger className="w-40 h-9 text-sm whitespace-nowrap">
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="NEW">Новый</SelectItem>
            <SelectItem value="IN_PROGRESS">Идёт настройка</SelectItem>
            <SelectItem value="REVIEW">Готов</SelectItem>
            <SelectItem value="COMPLETED">Выдан</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.networkTypeFilter} onValueChange={(value) => onFilterChange("networkTypeFilter", value)}>
          <SelectTrigger className="w-40 h-9 text-sm whitespace-nowrap">
            <SelectValue placeholder="Сеть" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все сети</SelectItem>
            <SelectItem value="EMVS">ЕМВС</SelectItem>
            <SelectItem value="INTERNET">Интернет</SelectItem>
            <SelectItem value="ASZI">АСЗИ</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.assigneeFilter} onValueChange={(value) => onFilterChange("assigneeFilter", value)}>
          <SelectTrigger className="w-48 h-9 text-sm whitespace-nowrap">
            <SelectValue placeholder="Исполнитель" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все исполнители</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={filters.priorityFilter} onValueChange={(value) => onFilterChange("priorityFilter", value)}>
          <SelectTrigger className="w-44 h-9 text-sm whitespace-nowrap">
            <SelectValue placeholder="Приоритет" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все приоритеты</SelectItem>
            <SelectItem value="HIGH">СЗ</SelectItem>
            <SelectItem value="MEDIUM">Без СЗ</SelectItem>
            <SelectItem value="LOW">Поручение</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filters.dayTypeFilter || 'all'} onValueChange={(value) => onFilterChange("dayTypeFilter", value)}>
          <SelectTrigger className="w-36 h-9 text-sm whitespace-nowrap">
            <SelectValue placeholder="День" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все дни</SelectItem>
            <SelectItem value="WEEKDAY">Будни</SelectItem>
            <SelectItem value="WEEKEND">Выходной</SelectItem>
            <SelectItem value="none">—</SelectItem>
          </SelectContent>
        </Select>
        
        {/* Кнопка "Новая настройка АРМ" */}
        {!filters.showArchived && (
          <Button className="gap-1 h-9 text-sm whitespace-nowrap ml-auto" onClick={onCreateTask}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Новый АРМ</span>
            <span className="sm:hidden">+</span>
          </Button>
        )}
      </div>
    </div>
  )
} 