export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Настройки</h1>
      <p className="text-muted-foreground">Управление настройками вашего аккаунта и приложения</p>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium">Профиль пользователя</h3>
            <p className="text-sm text-muted-foreground">
              Управляйте информацией вашего профиля и настройками аккаунта.
            </p>

            <div className="mt-4 space-y-4">
              <div className="grid gap-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Имя
                </label>
                <input
                  id="name"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Ваше имя"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Ваш email"
                />
              </div>

              <button className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-4 py-2">
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <h3 className="text-lg font-medium">Настройки уведомлений</h3>
            <p className="text-sm text-muted-foreground">Настройте способы получения уведомлений.</p>

            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Email-уведомления</p>
                  <p className="text-sm text-muted-foreground">Получайте уведомления о важных событиях на email.</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-primary relative">
                  <span className="block h-5 w-5 rounded-full bg-background absolute top-0.5 right-0.5"></span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Push-уведомления</p>
                  <p className="text-sm text-muted-foreground">Получайте уведомления в браузере.</p>
                </div>
                <div className="h-6 w-11 rounded-full bg-muted relative">
                  <span className="block h-5 w-5 rounded-full bg-background absolute top-0.5 left-0.5"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

