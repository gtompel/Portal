import { ProjectGantt } from "@/components/project-gantt"

export default async function ProjectGanttPage({ params }: { params: { id: string } }) {
  // Убедимся, что params.id доступен
  const projectId = params.id

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Диаграмма Ганта</h1>
      <p className="text-muted-foreground">Визуализация сроков и прогресса проекта</p>

      <ProjectGantt projectId={projectId} />
    </div>
  )
}

