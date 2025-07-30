import { ProjectDetails } from "@/components/project-details"

export default async function ProjectDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Детали проекта</h1>
      <p className="text-muted-foreground">Подробная информация о проекте и его участниках</p>

      <ProjectDetails id={id} />
    </div>
  )
}

