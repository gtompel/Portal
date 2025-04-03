import { MessageSystem } from "@/components/message-system"

export default function MessagesPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold">Сообщения</h1>
      <p className="text-muted-foreground">Общайтесь с коллегами и обменивайтесь информацией</p>

      <MessageSystem />
    </div>
  )
}

