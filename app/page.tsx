import { DashboardStats } from "@/components/dashboard-stats"
import { Overview } from "@/components/overview"
import { TaskList } from "@/components/task-list"
import { RecentDocuments } from "@/components/recent-documents"
import { Announcements } from "@/components/announcements"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard, 
  Monitor, 
  FileText, 
  BarChart, 
  Users, 
  Calendar, 
  MessageSquare, 
  BellRing,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Заголовок */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Добро пожаловать в систему управления задачами</h1>
        <p className="text-muted-foreground">
          Обзор системы и быстрый доступ к основным функциям
        </p>
      </div>

      {/* Статистика */}
      <DashboardStats />

      {/* Основной контент */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Обзор</TabsTrigger>
          <TabsTrigger value="tasks">Задачи</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
          <TabsTrigger value="announcements">Объявления</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Overview />
        </TabsContent>

        <TabsContent value="tasks" className="space-y-4">
          <TaskList />
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <RecentDocuments />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Announcements />
        </TabsContent>
      </Tabs>
    </div>
  )
}

