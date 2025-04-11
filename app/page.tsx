import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TaskList } from "@/components/task-list"
import { RecentDocuments } from "@/components/recent-documents"
import { Announcements } from "@/components/announcements"
import { Overview } from "@/components/overview"
import { DashboardStats } from "@/components/dashboard-stats"
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();
export default async function Home() {
  const count = await redis.incr("counter");
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Добро пожаловать в корпоративный портал</h1>

      <DashboardStats />

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

