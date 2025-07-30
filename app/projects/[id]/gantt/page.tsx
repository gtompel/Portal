import { ProjectGantt } from "@/components/project-gantt"

export default async function ProjectGanttPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Диаграмма Ганта</h1>
      <p className="text-muted-foreground">Визуализация сроков и прогресса проекта</p>

      <ProjectGantt projectId={id} />
    </div>
  )
}

