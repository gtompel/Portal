import type { Metadata } from "next"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export const metadata: Metadata = {
  title: "Помощь | Корпоративный портал",
  description: "Руководство пользователя и часто задаваемые вопросы",
}

export default function HelpPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold">Центр помощи</h1>
        <p className="text-muted-foreground">Руководство пользователя и ответы на часто задаваемые вопросы</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input type="search" placeholder="Поиск по справке..." className="pl-8" />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Начало работы</CardTitle>
            <CardDescription>Базовая информация для новых пользователей</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Как создать учётную запись?</AccordionTrigger>
                <AccordionContent>
                  Для создания новой учётной записи перейдите на страницу регистрации и заполните все необходимые поля.
                  После регистрации вы сможете войти в систему, используя указанные email и пароль.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Как изменить пароль?</AccordionTrigger>
                <AccordionContent>
                  Для изменения пароля перейдите в настройки профиля. В разделе безопасности нажмите на кнопку "Изменить
                  пароль" и следуйте инструкциям.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Как обновить информацию профиля?</AccordionTrigger>
                <AccordionContent>
                  Для обновления информации профиля перейдите в раздел "Настройки" &gt; "Профиль". Внесите необходимые
                  изменения и нажмите кнопку "Сохранить изменения".
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Работа с задачами</CardTitle>
            <CardDescription>Информация о системе управления задачами</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Как создать новую задачу?</AccordionTrigger>
                <AccordionContent>
                  Для создания новой задачи перейдите в раздел "Задачи" и нажмите кнопку "Новая задача". Заполните все
                  необходимые поля в форме создания задачи и нажмите "Сохранить".
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Как назначить задачу другому сотруднику?</AccordionTrigger>
                <AccordionContent>
                  При создании или редактировании задачи выберите сотрудника из выпадающего списка "Исполнитель". Если
                  вы являетесь создателем задачи, вы можете изменить исполнителя в любое время.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Как изменить статус задачи?</AccordionTrigger>
                <AccordionContent>
                  Откройте задачу, нажав на её название в списке задач. В открывшемся окне вы можете изменить статус
                  задачи, выбрав соответствующее значение из выпадающего списка "Статус".
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Документы</CardTitle>
            <CardDescription>Информация о работе с документами</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Как загрузить новый документ?</AccordionTrigger>
                <AccordionContent>
                  Для загрузки нового документа перейдите в раздел "Документы" и нажмите кнопку "Загрузить". Выберите
                  файл на вашем компьютере, заполните информацию о документе и нажмите "Сохранить".
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Какие форматы файлов поддерживаются?</AccordionTrigger>
                <AccordionContent>
                  Система поддерживает большинство популярных форматов файлов, включая: DOCX, XLSX, PPTX, PDF, JPG, PNG
                  и другие. Максимальный размер файла составляет 50 МБ.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Как поделиться документом с коллегами?</AccordionTrigger>
                <AccordionContent>
                  Откройте документ и нажмите кнопку "Поделиться". В появившемся окне выберите сотрудников, с которыми
                  хотите поделиться документ��м, и нажмите "Отправить". Сотрудники получат уведомление о доступе к
                  документу.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Календарь и события</CardTitle>
            <CardDescription>Информация о работе с календарём и событиями</CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Как создать новое событие?</AccordionTrigger>
                <AccordionContent>
                  Для создания нового события перейдите в раздел "Календарь" и нажмите кнопку "Новое событие". Заполните
                  все необходимые поля в форме создания события и нажмите "Сохранить".
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Как пригласить участников на событие?</AccordionTrigger>
                <AccordionContent>
                  При создании или редактировании события выберите сотрудников из списка "Участники". Выбранные
                  сотрудники получат приглашение на событие и смогут принять или отклонить его.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>Как настроить напоминания о событиях?</AccordionTrigger>
                <AccordionContent>
                  Перейдите в настройки и выберите раздел "Уведомления". В этом разделе вы можете настроить время и
                  способ получения напоминаний о предстоящих событиях.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Техническая поддержка</CardTitle>
          <CardDescription>Не нашли ответ на свой вопрос? Свяжитесь с нами.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Если у вас возникли технические проблемы или вопросы, которых нет в нашей справке, вы можете обратиться в
            службу технической поддержки:
          </p>
          <ul className="list-disc ml-6 space-y-2">
            <li>
              По электронной почте:{" "}
              <a href="mailto:support@example.com" className="text-primary hover:underline">
                support@example.com
              </a>
            </li>
            <li>
              По телефону:{" "}
              <a href="tel:+7123456789" className="text-primary hover:underline">
                +7 (123) 456-78-90
              </a>
            </li>
            <li>Через форму обратной связи в разделе "Поддержка"</li>
          </ul>
          <p>Время работы службы поддержки: пн-пт с 9:00 до 18:00 (МСК).</p>
        </CardContent>
      </Card>
    </div>
  )
}

