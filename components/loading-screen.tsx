import { Loader2 } from "lucide-react"

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-background">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold">Загрузка...</h2>
        <p className="text-muted-foreground mt-2">Пожалуйста, подождите</p>
      </div>
    </div>
  )
}

