import React from "react"
import { TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Edit, Trash, Check, Archive } from "lucide-react"
import { Task, User } from "../types"
import { 
  getTaskNumber, 
  getDisplayName, 
  getStatusColor, 
  getStatusText, 
  getPriorityColor, 
  getPriorityText, 
  getNetworkTypeColor, 
  getNetworkTypeText, 
  formatDate 
} from "../utils"

interface TaskRowProps {
  task: Task
  index: number
  users: User[]
  onEdit: (task: Task) => void
  onDelete: (task: Task) => void
  onArchive: (taskId: string) => void
  onRestore: (taskId: string) => void
  onQuickUpdateStatus: (taskId: string, status: Task["status"]) => void
  onQuickUpdatePriority: (taskId: string, priority: Task["priority"]) => void
  onQuickUpdateNetworkType: (taskId: string, networkType: Task["networkType"]) => void
  onQuickUpdateAssignee: (taskId: string, assigneeId: string) => void
}

function TaskRowComponent({
  task,
  index,
  users,
  onEdit,
  onDelete,
  onArchive,
  onRestore,
  onQuickUpdateStatus,
  onQuickUpdatePriority,
  onQuickUpdateNetworkType,
  onQuickUpdateAssignee
}: TaskRowProps) {
  return (
    <TableRow className={task.isArchived ? "opacity-60 bg-muted/30" : ""}>
      {/* Номер */}
      <TableCell className="font-medium">
        {getTaskNumber(task, index)}
      </TableCell>

      {/* Название */}
      <TableCell className="font-medium">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 max-w-[250px]">
              <span className="truncate">{task.title}</span>
              {task.isArchived && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  Архив
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          {task.title.length > 30 && (
            <TooltipContent>
              <p>{task.title}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TableCell>

      {/* Описание */}
      <TableCell>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="max-w-[200px] truncate">
              {task.description || "-"}
            </div>
          </TooltipTrigger>
          {task.description && task.description.length > 25 && (
            <TooltipContent>
              <p className="max-w-xs whitespace-pre-wrap">{task.description}</p>
            </TooltipContent>
          )}
        </Tooltip>
      </TableCell>

      {/* Исполнитель */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group">
              {task.assignee ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6 flex-shrink-0">
                        <AvatarImage src={task.assignee.avatar || ""} />
                        <AvatarFallback className="text-xs">{task.assignee.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm cursor-pointer group-hover:underline truncate max-w-[120px]">
                        {getDisplayName(task.assignee.name)}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{task.assignee.name}</p>
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span className="text-muted-foreground">Не назначен</span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <div className="px-2 py-1.5 text-sm font-semibold">Изменить исполнителя</div>
            <div className="-mx-1 my-1 h-px bg-muted"></div>
            <DropdownMenuItem
              onClick={() => onQuickUpdateAssignee(task.id, "not_assigned")}
              className={!task.assignee ? "bg-accent" : ""}
            >
              <span className="mr-2">Не назначен</span>
              {!task.assignee && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            {users.map((user) => (
              <DropdownMenuItem
                key={user.id}
                onClick={() => onQuickUpdateAssignee(task.id, user.id)}
                className={task.assignee?.id === user.id ? "bg-accent" : ""}
              >
                <span className="mr-2">{getDisplayName(user.name)}</span>
                {task.assignee?.id === user.id && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Статус */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group">
              <Badge className={`cursor-pointer transition-all duration-200 group-hover:scale-105 ${getStatusColor(task.status)}`}>
                {getStatusText(task.status)}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <div className="px-2 py-1.5 text-sm font-semibold">Изменить статус</div>
            <div className="-mx-1 my-1 h-px bg-muted"></div>
            <DropdownMenuItem 
              onClick={() => onQuickUpdateStatus(task.id, "NEW")}
              className={task.status === "NEW" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">Новый</Badge>
              {task.status === "NEW" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onQuickUpdateStatus(task.id, "IN_PROGRESS")}
              className={task.status === "IN_PROGRESS" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">Идёт настройка</Badge>
              {task.status === "IN_PROGRESS" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onQuickUpdateStatus(task.id, "REVIEW")}
              className={task.status === "REVIEW" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">Готов</Badge>
              {task.status === "REVIEW" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onQuickUpdateStatus(task.id, "COMPLETED")}
              className={task.status === "COMPLETED" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">Выдан</Badge>
              {task.status === "COMPLETED" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Приоритет */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group">
              <Badge variant="secondary" className={`cursor-pointer transition-all duration-200 group-hover:scale-105 ${getPriorityColor(task.priority)}`}>
                {getPriorityText(task.priority)}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <div className="px-2 py-1.5 text-sm font-semibold">Изменить приоритет</div>
            <div className="-mx-1 my-1 h-px bg-muted"></div>
            <DropdownMenuItem 
              onClick={() => onQuickUpdatePriority(task.id, "HIGH")}
              className={task.priority === "HIGH" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">СЗ</Badge>
              {task.priority === "HIGH" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onQuickUpdatePriority(task.id, "MEDIUM")}
              className={task.priority === "MEDIUM" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">Без СЗ</Badge>
              {task.priority === "MEDIUM" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onQuickUpdatePriority(task.id, "LOW")}
              className={task.priority === "LOW" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">Поручение</Badge>
              {task.priority === "LOW" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Тип сети */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-auto p-0 hover:bg-transparent group">
              <Badge variant="outline" className={`cursor-pointer transition-all duration-200 group-hover:scale-105 ${getNetworkTypeColor(task.networkType)}`}>
                {getNetworkTypeText(task.networkType)}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <div className="px-2 py-1.5 text-sm font-semibold">Изменить тип сети</div>
            <div className="-mx-1 my-1 h-px bg-muted"></div>
            <DropdownMenuItem 
              onClick={() => onQuickUpdateNetworkType(task.id, "EMVS")}
              className={task.networkType === "EMVS" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">ЕМВС</Badge>
              {task.networkType === "EMVS" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onQuickUpdateNetworkType(task.id, "INTERNET")}
              className={task.networkType === "INTERNET" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">Интернет</Badge>
              {task.networkType === "INTERNET" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onQuickUpdateNetworkType(task.id, "ASZI")}
              className={task.networkType === "ASZI" ? "bg-accent" : ""}
            >
              <Badge className="mr-2">АСЗИ</Badge>
              {task.networkType === "ASZI" && <Check className="ml-auto h-4 w-4" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>

      {/* Срок */}
      <TableCell>
        {formatDate(task.dueDate)}
      </TableCell>

      {/* Действия */}
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Edit className="h-4 w-4" />
              <span className="sr-only">Действия</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(task)}>
              <Edit className="mr-2 h-4 w-4" />
              <span>Редактировать</span>
            </DropdownMenuItem>
            {!task.isArchived ? (
              <DropdownMenuItem onClick={() => onArchive(task.id)}>
                <Archive className="mr-2 h-4 w-4" />
                <span>Архивировать</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onRestore(task.id)}>
                <Archive className="mr-2 h-4 w-4" />
                <span>Восстановить</span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(task)}>
              <Trash className="mr-2 h-4 w-4" />
              <span>Удалить</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

// Оптимизация с React.memo для предотвращения лишних ререндеров
export const TaskRow = React.memo(TaskRowComponent) 