// Исправляем импорт и делаем функцию асинхронной
import { EmployeeProfile } from "@/components/employee-profile"

export default async function EmployeeProfilePage(context: { params: { id: string } }) {
  // Получаем id из params
  const { id } = await context.params

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Профиль сотрудника</h1>
      <p className="text-muted-foreground">Подробная информация о сотруднике</p>

      <EmployeeProfile id={id} />
    </div>
  )
}

