import type { Metadata } from "next"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Announcements } from "@/components/announcements"

export const metadata: Metadata = {
  title: "Объявления | Корпоративный портал",
  description: "Просмотр всех объявлений компании",
}

export default function AnnouncementsPage() {
  return (


      <Card>
        <CardHeader>
          <CardTitle>Все объявления</CardTitle>
          <CardDescription>Просмотр всех объявлений компании</CardDescription>
        </CardHeader>
        <CardContent>
          <Announcements />
        </CardContent>
      </Card>
  )
}

