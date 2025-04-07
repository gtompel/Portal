import { ProjectGantt } from "@/components/project-gantt"

export default function ProjectAnalyticsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Аналитика проектов</h1>
      <p className="text-muted-foreground">Визуализация сроков и прогресса проектов</p>

      <ProjectGantt />
    </div>
  )
}

