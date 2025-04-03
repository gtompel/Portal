"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

const taskData = [
  { name: "Янв", новые: 4, выполненные: 2 },
  { name: "Фев", новые: 3, выполненные: 4 },
  { name: "Мар", новые: 5, выполненные: 3 },
  { name: "Апр", новые: 7, выполненные: 5 },
  { name: "Май", новые: 2, выполненные: 6 },
  { name: "Июн", новые: 6, выполненные: 4 },
]

const statusData = [
  { name: "Новые", value: 12, color: "#3b82f6" },
  { name: "В работе", value: 8, color: "#eab308" },
  { name: "На проверке", value: 4, color: "#a855f7" },
  { name: "Завершенные", value: 16, color: "#22c55e" },
]

const documentData = [
  { name: "Документы", value: 45, color: "#3b82f6" },
  { name: "Таблицы", value: 30, color: "#22c55e" },
  { name: "Презентации", value: 15, color: "#f97316" },
  { name: "Изображения", value: 10, color: "#a855f7" },
]

export function Overview() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Статистика задач</CardTitle>
          <CardDescription>Количество новых и выполненных задач за последние 6 месяцев</CardDescription>
        </CardHeader>
        <CardContent className="pl-2">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={taskData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="новые" fill="#3b82f6" name="Новые задачи" />
              <Bar dataKey="выполненные" fill="#22c55e" name="Выполненные задачи" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Распределение</CardTitle>
          <CardDescription>Статистика по типам и статусам</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="status">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="status">Статусы задач</TabsTrigger>
              <TabsTrigger value="documents">Типы документов</TabsTrigger>
            </TabsList>
            <TabsContent value="status" className="space-y-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            <TabsContent value="documents" className="space-y-4">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={documentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {documentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

