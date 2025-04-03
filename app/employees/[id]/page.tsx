import { EmployeeProfile } from "@/components/employee-profile"

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Профиль сотрудника</h1>
      <p className="text-muted-foreground">Подробная информация о сотруднике</p>

      <EmployeeProfile id={params.id} />
    </div>
  )
}

