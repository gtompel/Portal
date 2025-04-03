import { EmployeeDirectory } from "@/components/employee-directory"

export default function EmployeesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Сотрудники</h1>
      <p className="text-muted-foreground">Просмотр и управление информацией о сотрудниках компании</p>

      <EmployeeDirectory />
    </div>
  )
}

