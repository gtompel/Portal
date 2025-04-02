"use client"

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AuthForm } from '@/components/auth-form'

interface Task {
  id: string
  title: string
  description: string
  status: string
  created_at: string
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [newTask, setNewTask] = useState({ title: '', description: '' })
  const { toast } = useToast()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        fetchTasks()
      }
      setLoading(false)
    }
    fetchUser()
  }, [])

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить задачи",
        variant: "destructive",
      })
    } else {
      setTasks(data || [])
    }
  }

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        { 
          title: newTask.title,
          description: newTask.description,
          user_id: user.id
        }
      ])
      .select()

    if (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось создать задачу",
        variant: "destructive",
      })
    } else {
      toast({
        title: "Успех",
        description: "Задача создана",
      })
      setNewTask({ title: '', description: '' })
      fetchTasks()
    }
  }

  if (loading) {
    return <div className="p-8">Загрузка...</div>
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center">
        <AuthForm />
      </div>
    )
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Задачи</h1>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Создать задачу
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новая задача</DialogTitle>
            </DialogHeader>
            <form onSubmit={createTask} className="space-y-4">
              <Input
                placeholder="Название задачи"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                required
              />
              <Textarea
                placeholder="Описание задачи"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
              />
              <Button type="submit">Создать</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <CardTitle>{task.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{task.description}</p>
            </CardContent>
          </Card>
        ))}
        
        {tasks.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Нет созданных задач
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}