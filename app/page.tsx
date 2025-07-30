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
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 lg:p-6">
      {/* Заголовок */}
      <div className="space-y-2">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Добро пожаловать в систему управления задачами</h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Обзор системы и быстрый доступ к основным функциям
        </p>
      </div>

      {/* Статистика */}
      <DashboardStats />

      {/* Основной контент */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 lg:flex lg:w-auto">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">Обзор</TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs sm:text-sm">Задачи</TabsTrigger>
          <TabsTrigger value="documents" className="text-xs sm:text-sm">Документы</TabsTrigger>
          <TabsTrigger value="announcements" className="text-xs sm:text-sm">Объявления</TabsTrigger>
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

