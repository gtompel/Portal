import { EventCalendar } from "@/components/event-calendar"

export default function CalendarPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Календарь событий</h1>
      <p className="text-muted-foreground">Планируйте и отслеживайте события и встречи</p>

      <EventCalendar />
    </div>
  )
}

