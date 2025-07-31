"use client"

import React from "react"
import { TaskListRefactored } from "./TaskListRefactored"

// Обертка для совместимости с существующим кодом
// Этот компонент можно использовать как замену оригинального TaskList
export function TaskList() {
  return <TaskListRefactored />
}

// Экспортируем также рефакторенную версию для прямого использования
export { TaskListRefactored } 