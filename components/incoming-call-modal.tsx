import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Phone, PhoneOff, Video, Mic, MicOff, Camera, CameraOff } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

type IncomingCall = {
  id: string
  callerId: string
  receiverId: string
  type: 'AUDIO' | 'VIDEO'
  status: 'RINGING' | 'ACTIVE' | 'ENDED' | 'MISSED'
  startTime: string
  caller: {
    id: string
    name: string
    avatar: string | null
    initials: string
  }
  receiver: {
    id: string
    name: string
    avatar: string | null
    initials: string
  }
}

type IncomingCallModalProps = {
  call: IncomingCall | null
  onAnswer: (callId: string) => void
  onReject: (callId: string) => void
  onEnd: (callId: string) => void
}

export function IncomingCallModal({ call, onAnswer, onReject, onEnd }: IncomingCallModalProps) {
  const { toast } = useToast()
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isCallActive, setIsCallActive] = useState(false)

  useEffect(() => {
    if (call) {
      setIsCallActive(call.status === 'ACTIVE')
    }
  }, [call])

  const handleAnswer = async () => {
    if (call) {
      try {
        // Запрашиваем разрешения на медиа устройства
        if (call.type === 'VIDEO') {
          await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        } else {
          await navigator.mediaDevices.getUserMedia({ audio: true })
        }
        
        onAnswer(call.id)
        setIsCallActive(true)
        
        toast({
          title: "Звонок принят",
          description: "Соединение установлено",
        })
      } catch (error) {
        console.error('Error accessing media devices:', error)
        toast({
          title: "Ошибка доступа",
          description: "Не удалось получить доступ к камере/микрофону",
          variant: "destructive"
        })
      }
    }
  }

  const handleReject = () => {
    if (call) {
      onReject(call.id)
      toast({
        title: "Звонок отклонен",
        description: "Звонок был отклонен",
      })
    }
  }

  const handleEnd = () => {
    if (call) {
      onEnd(call.id)
      setIsCallActive(false)
      toast({
        title: "Звонок завершен",
        description: "Соединение разорвано",
      })
    }
  }

  if (!call) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96 shadow-lg border-2 border-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Phone className="h-5 w-5 animate-pulse" />
            {isCallActive ? 'Активный звонок' : 'Входящий звонок'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-green-500">
              <AvatarImage src={call.caller.avatar || undefined} />
              <AvatarFallback className="text-lg">
                {call.caller.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{call.caller.name}</h3>
              <p className="text-muted-foreground">
                {call.type === 'AUDIO' ? '📞 Аудио звонок' : '📹 Видео звонок'}
              </p>
            </div>
          </div>
          
          {!isCallActive ? (
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleAnswer}
                className="bg-green-500 hover:bg-green-600 text-white"
                size="lg"
              >
                <Phone className="h-5 w-5 mr-2" />
                Ответить
              </Button>
              <Button
                onClick={handleReject}
                variant="destructive"
                size="lg"
              >
                <PhoneOff className="h-5 w-5 mr-2" />
                Отклонить
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Элементы управления звонком */}
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant={isMuted ? "destructive" : "outline"}
                  size="icon"
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                
                {call.type === 'VIDEO' && (
                  <Button
                    onClick={() => setIsVideoEnabled(!isVideoEnabled)}
                    variant={!isVideoEnabled ? "destructive" : "outline"}
                    size="icon"
                  >
                    {!isVideoEnabled ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
                  </Button>
                )}
                
                <Button
                  onClick={handleEnd}
                  variant="destructive"
                  size="icon"
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Звонок активен
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 