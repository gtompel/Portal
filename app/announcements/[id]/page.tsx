import type { Metadata } from "next"
import { Card, CardContent } from "@/components/ui/card"
import { AnnouncementComments } from "@/components/announcement-comments"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { AnnouncementDetail } from "@/components/announcement-detail"

export const metadata: Metadata = {
  title: "Объявление | Корпоративный портал",
  description: "Просмотр объявления и комментариев",
}

export default async function AnnouncementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: announcementId } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Объявление</h1>
          <p className="text-muted-foreground">Просмотр объявления и комментариев</p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/announcements">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Назад к списку
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <AnnouncementDetail id={announcementId} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <AnnouncementComments announcementId={announcementId} />
        </CardContent>
      </Card>
    </div>
  )
}

