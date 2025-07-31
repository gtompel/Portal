import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { Task, User, TaskFormData } from "../types"
import { getDisplayName } from "../utils"
import { useTaskForms } from "../hooks/useTaskForms"

interface TaskDialogsProps {
  users: User[]
  isCreateDialogOpen: boolean
  isEditDialogOpen: boolean
  isDeleteDialogOpen: boolean
  currentTask: Task | null
  taskToDelete: Task | null
  isAddingTask: boolean
  isEditingTask: boolean
  isDeletingTask: boolean
  onCreateTask: (data: TaskFormData) => Promise<boolean>
  onUpdateTask: (taskId: string, data: TaskFormData) => Promise<boolean>
  onDeleteTask: (taskId: string) => Promise<boolean>
  onCloseCreateDialog: () => void
  onCloseEditDialog: () => void
  onCloseDeleteDialog: () => void
}

export function TaskDialogs({
  users,
  isCreateDialogOpen,
  isEditDialogOpen,
  isDeleteDialogOpen,
  currentTask,
  taskToDelete,
  isAddingTask,
  isEditingTask,
  isDeletingTask,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onCloseCreateDialog,
  onCloseEditDialog,
  onCloseDeleteDialog
}: TaskDialogsProps) {
  const { createForm, editForm, populateEditForm, resetCreateForm } = useTaskForms()

  // Заполняем форму редактирования при изменении текущей задачи
  React.useEffect(() => {
    if (currentTask && isEditDialogOpen) {
      populateEditForm(currentTask)
    }
  }, [currentTask, isEditDialogOpen, populateEditForm])

  // Обработчики отправки форм
  const handleCreateSubmit = async (data: TaskFormData) => {
    const success = await onCreateTask(data)
    if (success) {
      resetCreateForm()
      onCloseCreateDialog()
    }
  }

  const handleEditSubmit = async (data: TaskFormData) => {
    if (!currentTask) return
    const success = await onUpdateTask(currentTask.id, data)
    if (success) {
      onCloseEditDialog()
    }
  }

  const handleDeleteConfirm = async () => {
    if (!taskToDelete) return
    const success = await onDeleteTask(taskToDelete.id)
    if (success) {
      onCloseDeleteDialog()
    }
  }

  return (
    <>
      {/* Диалог создания задачи */}
      <Dialog open={isCreateDialogOpen} onOpenChange={onCloseCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Создать новую настройку АРМ</DialogTitle>
            <DialogDescription>
              Заполните информацию о настройке АРМ. Поля, отмеченные *, обязательны для заполнения.
            </DialogDescription>
          </DialogHeader>

          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-4">
              <FormField
                control={createForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название настройки АРМ *</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите название настройки АРМ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Опишите настройку АРМ подробнее" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={createForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Приоритет *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите приоритет" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HIGH">СЗ</SelectItem>
                          <SelectItem value="MEDIUM">Без СЗ</SelectItem>
                          <SelectItem value="LOW">Поручение</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NEW">Новый</SelectItem>
                          <SelectItem value="IN_PROGRESS">Идёт настройка</SelectItem>
                          <SelectItem value="REVIEW">Готов</SelectItem>
                          <SelectItem value="COMPLETED">Выдан</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="networkType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип сети *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип сети" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMVS">ЕМВС</SelectItem>
                          <SelectItem value="INTERNET">Интернет</SelectItem>
                          <SelectItem value="ASZI">АСЗИ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Срок выполнения</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={createForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Исполнитель</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите исполнителя" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_assigned">Не назначен</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {getDisplayName(user.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={isAddingTask}>
                  {isAddingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Создать настройку АРМ
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог редактирования задачи */}
      <Dialog open={isEditDialogOpen} onOpenChange={onCloseEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Редактировать настройку АРМ</DialogTitle>
            <DialogDescription>Измените информацию о настройке АРМ.</DialogDescription>
          </DialogHeader>

          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Название настройки АРМ *</FormLabel>
                    <FormControl>
                      <Input placeholder="Введите название настройки АРМ" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Опишите настройку АРМ подробнее" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Статус *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите статус" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="NEW">Новый</SelectItem>
                          <SelectItem value="IN_PROGRESS">Идёт настройка</SelectItem>
                          <SelectItem value="REVIEW">Готов</SelectItem>
                          <SelectItem value="COMPLETED">Выдан</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Приоритет *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите приоритет" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="HIGH">СЗ</SelectItem>
                          <SelectItem value="MEDIUM">Без СЗ</SelectItem>
                          <SelectItem value="LOW">Поручение</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="networkType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Тип сети *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите тип сети" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="EMVS">ЕМВС</SelectItem>
                          <SelectItem value="INTERNET">Интернет</SelectItem>
                          <SelectItem value="ASZI">АСЗИ</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Срок выполнения</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="assigneeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Исполнитель</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите исполнителя" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="not_assigned">Не назначен</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {getDisplayName(user.name)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={onCloseEditDialog}>
                  Отмена
                </Button>
                <Button type="submit" disabled={isEditingTask}>
                  {isEditingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Сохранить изменения
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Диалог подтверждения удаления задачи */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={onCloseDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Подтверждение удаления</DialogTitle>
            <DialogDescription>
              Вы уверены, что хотите удалить настройку АРМ "{taskToDelete?.title}"?
              <br />
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={onCloseDeleteDialog}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} disabled={isDeletingTask}>
              {isDeletingTask && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Удалить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 