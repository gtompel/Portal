import { RecentDocuments } from "@/components/recent-documents"

export default function DocumentsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Документы</h1>
      <p className="text-muted-foreground">Управляйте документами вашей компании</p>

      <RecentDocuments />
    </div>
  )
}

