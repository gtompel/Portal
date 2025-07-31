import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TaskFormData, Task } from "../types"

// Схема валидации для формы задачи
const taskSchema = z.object({
  title: z.string().min(3, "Название должно содержать минимум 3 символа"),
  description: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  status: z.enum(["NEW", "IN_PROGRESS", "REVIEW", "COMPLETED"]),
  networkType: z.enum(["EMVS", "INTERNET", "ASZI"]),
  dueDate: z.string(),
  assigneeId: z.string(),
})

export function useTaskForms() {
  // Форма создания задачи
  const createForm = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "LOW",
      status: "NEW",
      networkType: "EMVS",
      dueDate: "",
      assigneeId: "",
    },
  })

  // Форма редактирования задачи
  const editForm = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "LOW",
      status: "NEW",
      networkType: "EMVS",
      dueDate: "",
      assigneeId: "",
    },
  })

  // Заполнение формы редактирования данными задачи
  const populateEditForm = (task: Task) => {
    editForm.reset({
      title: task.title,
      description: task.description || "",
      priority: task.priority,
      status: task.status,
      networkType: task.networkType,
      dueDate: task.dueDate || "",
      assigneeId: task.assignee?.id || "",
    })
  }

  // Сброс формы создания
  const resetCreateForm = () => {
    createForm.reset()
  }

  // Сброс формы редактирования
  const resetEditForm = () => {
    editForm.reset()
  }

  return {
    createForm,
    editForm,
    populateEditForm,
    resetCreateForm,
    resetEditForm,
    taskSchema
  }
} 