import { ProjectDetails } from "@/components/project-details"

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Детали проекта</h1>
      <p className="text-muted-foreground">Подробная информация о проекте и его участниках</p>

      <ProjectDetails id={params.id} />
    </div>
  )
}

