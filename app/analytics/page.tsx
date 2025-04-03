import { AdvancedAnalytics } from "@/components/advanced-analytics"

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Расширенная аналитика</h1>
      <p className="text-muted-foreground">Детальный анализ производительности компании</p>

      <AdvancedAnalytics />
    </div>
  )
}

