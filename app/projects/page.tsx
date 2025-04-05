import { ProjectList } from "@/components/project-list"

export default function ProjectsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Проекты</h1>
      <p className="text-muted-foreground">Управление проектами и командами</p>

      <ProjectList />
    </div>
  )
}

