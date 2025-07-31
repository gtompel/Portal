import React from "react"

interface TaskListHeaderProps {
  showArchived: boolean
  isSSEConnected: boolean
}

export function TaskListHeader({ showArchived, isSSEConnected }: TaskListHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          <h2 className="text-xl sm:text-2xl font-bold">
            {showArchived ? "Архив настроек АРМ" : "Настройка АРМ"}
          </h2>
          {/* Индикатор SSE подключения */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSSEConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-xs text-muted-foreground">
              {isSSEConnected ? 'Real-time' : 'Offline'}
            </span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-muted-foreground">
          Создавайте, назначайте и отслеживайте настройки автоматизированных рабочих мест
        </p>
      </div>
    </div>
  )
} 