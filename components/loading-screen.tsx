import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  subMessage?: string
}

export default function LoadingScreen({ 
  message = "Загрузка...", 
  subMessage = "Пожалуйста, подождите" 
}: LoadingScreenProps) {
  return (
    <div className="flex items-center justify-center h-screen w-full bg-background">
      <div className="text-center">
        <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold">{message}</h2>
        <p className="text-muted-foreground mt-2">{subMessage}</p>
      </div>
    </div>
  )
}

