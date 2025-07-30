import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "@/components/task-list"
import { RecentDocuments } from "@/components/recent-documents"
import { Announcements } from "@/components/announcements"
import { UnifiedAnalytics } from "@/components/unified-analytics"

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Добро пожаловать в систему управления задачами</h1>

      <Tabs defaultValue="analytics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="analytics">Аналитика</TabsTrigger>
          <TabsTrigger value="tasks">Настройка АРМ</TabsTrigger>
          <TabsTrigger value="documents">Документы</TabsTrigger>
          <TabsTrigger value="announcements">Объявления</TabsTrigger>
        </TabsList>
        <TabsContent value="analytics" className="space-y-4">
          <UnifiedAnalytics />
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