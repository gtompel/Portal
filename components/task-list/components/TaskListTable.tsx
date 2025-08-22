import React from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Task, User } from "../types"
import { TaskRow } from "./TaskRow"

interface TaskListTableProps {
  tasks: Task[]
  isLoading: boolean
  showArchived: boolean
  onSort: (field: string) => void
  sortField: string
  sortDirection: "asc" | "desc"
  users: User[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onArchive: (taskId: string) => void
  onRestore: (taskId: string) => void
  onQuickUpdateStatus: (taskId: string, status: Task["status"]) => void
  onQuickUpdatePriority: (taskId: string, priority: Task["priority"]) => void
  onQuickUpdateNetworkType: (taskId: string, networkType: Task["networkType"]) => void
  onQuickUpdateAssignee: (taskId: string, assigneeId: string) => void
}

export function TaskListTable({
  tasks,
  isLoading,
  showArchived,
  onSort,
  sortField,
  sortDirection,
  users,
  setTasks,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onQuickUpdateStatus,
  onQuickUpdatePriority,
  onQuickUpdateNetworkType,
  onQuickUpdateAssignee
}: TaskListTableProps) {
  // Функция для получения иконки сортировки
  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    )
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table className="min-w-[900px] lg:min-w-[1100px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[80px]">
              <Button
                variant="ghost"
                onClick={() => onSort("taskNumber")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                #
                {getSortIcon("taskNumber")}
              </Button>
            </TableHead>
            <TableHead className="w-[250px]">
              <Button
                variant="ghost"
                onClick={() => onSort("title")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Название
                {getSortIcon("title")}
              </Button>
            </TableHead>
            <TableHead className="w-[300px]">
              <Button
                variant="ghost"
                onClick={() => onSort("description")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Описание
                {getSortIcon("description")}
              </Button>
            </TableHead>
            <TableHead className="w-[140px]">
              <Button
                variant="ghost"
                onClick={() => onSort("assignee")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Исполнитель
                {getSortIcon("assignee")}
              </Button>
            </TableHead>
            <TableHead className="w-[120px]">
              <Button
                variant="ghost"
                onClick={() => onSort("status")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Статус
                {getSortIcon("status")}
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">
              <Button
                variant="ghost"
                onClick={() => onSort("priority")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Приоритет
                {getSortIcon("priority")}
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">
              <Button
                variant="ghost"
                onClick={() => onSort("networkType")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                Тип сети
                {getSortIcon("networkType")}
              </Button>
            </TableHead>
            <TableHead className="w-[100px]">
              <Button
                variant="ghost"
                onClick={() => onSort("dueDate")}
                className="h-auto p-0 font-semibold hover:bg-transparent"
              >
                День
                {getSortIcon("dueDate")}
              </Button>
            </TableHead>
            <TableHead className="w-[80px]">Действия</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-8" />
                </TableCell>
                                     <TableCell>
                       <Skeleton className="h-4 w-[280px]" />
                     </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[150px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[100px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[70px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[70px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[80px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[40px]" />
                </TableCell>
              </TableRow>
            ))
          ) : tasks.length > 0 ? (
            tasks.map((task, index) => (
              <TaskRow
                key={task.id}
                task={task}
                index={index}
                users={users}
                onEdit={onEdit}
                onDelete={onDelete}
                onArchive={onArchive}
                onRestore={onRestore}
                onQuickUpdateStatus={onQuickUpdateStatus}
                onQuickUpdatePriority={onQuickUpdatePriority}
                onQuickUpdateNetworkType={onQuickUpdateNetworkType}
                onQuickUpdateAssignee={onQuickUpdateAssignee}
              />
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={9} className="h-24 text-center">
                {showArchived ? "Архивные настройки АРМ не найдены." : "Настройки АРМ не найдены."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
} 