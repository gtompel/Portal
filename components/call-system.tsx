"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useSession } from "next-auth/react"
import { 
  Phone, 
  Video, 
  PhoneOff, 
  Mic, 
  MicOff, 
  Camera, 
  CameraOff,
  Volume2,
  VolumeX
} from "lucide-react"
import { IncomingCallModal } from './incoming-call-modal'

type Call = {
  id: string
  callerId: string
  receiverId: string
  type: 'AUDIO' | 'VIDEO'
  status: 'RINGING' | 'ACTIVE' | 'ENDED' | 'MISSED'
  startTime: string
  answerTime?: string
  endTime?: string
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

type CallSystemProps = {
  selectedUserId?: string
  onCallEnd?: () => void
  users?: Array<{
    id: string
    name: string
    avatar: string | null
    initials: string
    isOnline?: boolean
  }>
  onUserSelect?: (userId: string | undefined) => void
}

// Глобальное состояние для входящих звонков
let globalIncomingCall: any = null
let globalSetIncomingCall: ((call: any) => void) | null = null

// Функция для установки глобального обработчика
export function setGlobalIncomingCallHandler(handler: (call: any) => void) {
  globalSetIncomingCall = handler
}

// Функция для получения текущего входящего звонка
export function getGlobalIncomingCall() {
  return globalIncomingCall
}

export function CallSystem({ selectedUserId, onCallEnd, users, onUserSelect }: CallSystemProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [currentCall, setCurrentCall] = useState<Call | null>(null)
  const [isIncomingCall, setIsIncomingCall] = useState(false)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isVideoEnabled, setIsVideoEnabled] = useState(true)
  const [isSpeakerEnabled, setIsSpeakerEnabled] = useState(true)
  const [isWebRTCSupported, setIsWebRTCSupported] = useState(false)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  
  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)

  // Проверяем поддержку WebRTC
  useEffect(() => {
    const checkWebRTCSupport = () => {
      // Проверяем наличие navigator
      if (typeof navigator === 'undefined') {
        setIsWebRTCSupported(false)
        return
      }

      // Проверяем mediaDevices
      if (!navigator.mediaDevices) {
        setIsWebRTCSupported(false)
        return
      }

      // Проверяем getUserMedia
      if (!navigator.mediaDevices.getUserMedia) {
        setIsWebRTCSupported(false)
        return
      }

      // Проверяем HTTPS (только в продакшене)
      if (typeof window !== 'undefined' && location.protocol !== 'https:' && location.hostname !== 'localhost') {
        setIsWebRTCSupported(false)
        return
      }

      setIsWebRTCSupported(true)
    }
    
    checkWebRTCSupport()
  }, [])

  // Проверяем уведомления о звонках
  const [isConnected, setIsConnected] = useState(true)

  useEffect(() => {
    if (!session?.user?.id) return

    const interval = setInterval(async () => {
      try {
        // Проверяем активные звонки
        const callsResponse = await fetch(`/api/calls?userId=${session.user.id}`)
        if (callsResponse.ok) {
          const calls = await callsResponse.json()
          const activeCall = calls.find((call: any) => 
            call.status === 'RINGING' && call.receiverId === session.user.id
          )
          
          if (activeCall && !currentCall) {
            handleIncomingCall({
              callId: activeCall.id,
              callerId: activeCall.callerId,
              callType: activeCall.type
            })
          }
        }
      } catch (error) {
        console.error('Error checking calls:', error)
        setIsConnected(false)
      }
    }, 3000) // Проверяем каждые 3 секунды

    return () => clearInterval(interval)
  }, [session?.user?.id, currentCall])

  // Инициализация WebRTC
  useEffect(() => {
    if (isCallActive && currentCall && isWebRTCSupported) {
      initializeWebRTC()
    }
    
    return () => {
      cleanupWebRTC()
    }
  }, [isCallActive, currentCall, isWebRTCSupported])

  const initializeWebRTC = async () => {
    try {
      // Проверяем поддержку WebRTC
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('WebRTC не поддерживается в этом браузере')
      }

      // Проверяем, что мы на HTTPS (требуется для WebRTC)
      if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
        throw new Error('WebRTC требует HTTPS соединение')
      }

      // Запрашиваем разрешения на доступ к медиа устройствам
      const constraints = {
        video: currentCall?.type === 'VIDEO',
        audio: true
      }

      // Получаем медиа поток
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      localStreamRef.current = stream
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream
      }

      // Создаем RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' }
        ]
      })

      peerConnectionRef.current = peerConnection

      // Добавляем локальный поток
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream)
      })

      // Обработка входящих потоков
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      // Обработка ICE кандидатов
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Отправляем ICE кандидат другой стороне
          sendIceCandidate(event.candidate)
        }
      }

      toast({
        title: "Соединение установлено",
        description: "Звонок подключен успешно",
      })

    } catch (error) {
      console.error('WebRTC initialization error:', error)
      
      let errorMessage = "Не удалось подключить звонок"
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = "Разрешите доступ к камере и микрофону в браузере"
        } else if (error.name === 'NotFoundError') {
          errorMessage = "Камера или микрофон не найдены"
        } else if (error.name === 'NotSupportedError') {
          errorMessage = "Ваш браузер не поддерживает звонки"
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Ошибка подключения",
        description: errorMessage,
        variant: "destructive"
      })
    }
  }

  const cleanupWebRTC = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop())
      localStreamRef.current = null
    }
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
  }

  const handleIncomingCall = (data: any) => {
    setCurrentCall({
      id: data.callId,
      callerId: data.callerId,
      receiverId: session?.user?.id || '',
      type: data.callType,
      status: 'RINGING',
      startTime: new Date().toISOString(),
      caller: {
        id: data.callerId,
        name: '',
        avatar: null,
        initials: ''
      },
      receiver: {
        id: session?.user?.id || '',
        name: session?.user?.name || '',
        avatar: null,
        initials: session?.user?.name?.charAt(0) || ''
      }
    })
    setIsIncomingCall(true)
    
    // Звуковое уведомление
    try {
      const audio = new Audio('/notification.mp3') // Можно добавить звук
      audio.play().catch(() => {
        // Если звук не воспроизводится, используем встроенный звук
  
      })
    } catch (error) {
      
    }
    
    toast({
      title: "📞 Входящий звонок",
      description: `${data.callType === 'AUDIO' ? 'Аудио' : 'Видео'} звонок`,
    })
  }

  const handleCallAnswered = (data: any) => {
    setIsIncomingCall(false)
    setIsCallActive(true)
    
    toast({
      title: "Звонок",
      description: "Звонок принят",
    })
  }

  const handleCallEnded = (data: any) => {
    cleanupWebRTC()
    setCurrentCall(null)
    setIsCallActive(false)
    setIsIncomingCall(false)
    
    toast({
      title: "Звонок",
      description: "Звонок завершен",
    })
    
    onCallEnd?.()
  }

  const handleIceCandidate = (data: any) => {
    // WebRTC пока не реализован
    
  }

  const handleWebRTCOffer = async (data: any) => {
    // WebRTC пока не реализован
    
  }

  const handleWebRTCAnswer = async (data: any) => {
    // WebRTC пока не реализован
    
  }

  const sendIceCandidate = (candidate: RTCIceCandidate) => {
    // WebRTC пока не реализован
    
  }

  const initiateCall = async (callType: 'AUDIO' | 'VIDEO') => {
    if (!selectedUserId || !session?.user?.id) {
      toast({
        title: "Ошибка",
        description: "Не выбран пользователь для звонка",
        variant: "destructive"
      })
      return
    }

    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          receiverId: selectedUserId,
          callType
        })
      })

      if (response.ok) {
        const data = await response.json()
        setCurrentCall({
          id: data.callId,
          callerId: session.user.id,
          receiverId: selectedUserId,
          type: callType,
          status: 'RINGING',
          startTime: new Date().toISOString(),
          caller: {
            id: session.user.id,
            name: session.user.name || '',
            avatar: null,
            initials: session.user.name?.charAt(0) || ''
          },
          receiver: {
            id: selectedUserId,
            name: '',
            avatar: null,
            initials: ''
          }
        })
        
        // Уведомление уже отправлено сервером
        
        toast({
          title: "Звонок",
          description: `Инициация ${callType === 'AUDIO' ? 'аудио' : 'видео'} звонка...`
        })
      }
    } catch (error) {
      console.error('Call initiation error:', error)
      toast({
        title: "Ошибка",
        description: "Не удалось инициировать звонок",
        variant: "destructive"
      })
    }
  }

  const answerCall = async () => {
    if (!currentCall) return

    try {
      const response = await fetch(`/api/calls/${currentCall.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ACTIVE'
        })
      })

      if (response.ok) {
        // Создаем уведомление для звонящего
        fetch('/api/notifications', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'CALL_ANSWERED',
            userId: currentCall.callerId,
            read: false
          })
        })
        
        setIsIncomingCall(false)
        setIsCallActive(true)
        toast({
          title: "Звонок",
          description: "Звонок принят"
        })
      }
    } catch (error) {
      console.error('Call answer error:', error)
    }
  }

  const endCall = async () => {
    if (!currentCall) return

    try {
      await fetch(`/api/calls/${currentCall.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: 'ENDED'
        })
      })

      // Создаем уведомление о завершении звонка
      const targetUserId = currentCall.callerId === session?.user?.id 
        ? currentCall.receiverId 
        : currentCall.callerId
      
      fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'CALL_ENDED',
          userId: targetUserId,
          read: false
        })
      })

      cleanupWebRTC()
      setCurrentCall(null)
      setIsCallActive(false)
      setIsIncomingCall(false)
      
      toast({
        title: "Звонок",
        description: "Звонок завершен"
      })

      onCallEnd?.()
    } catch (error) {
      console.error('Call end error:', error)
    }
  }

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled
        setIsMuted(!audioTrack.enabled)
      }
    }
  }

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled
        setIsVideoEnabled(videoTrack.enabled)
      }
    }
  }

  const toggleSpeaker = () => {
    setIsSpeakerEnabled(!isSpeakerEnabled)
  }

  // Функции для входящих звонков
  const handleIncomingCallAnswer = async (callId: string) => {
    try {
      const response = await fetch(`/api/calls/${callId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ACTIVE' })
      })

      if (response.ok) {
        setIncomingCall((prev: any) => prev ? { ...prev, status: 'ACTIVE' } : null)
        setCurrentCall(prev => prev ? { ...prev, status: 'ACTIVE' } : null)
      }
    } catch (error) {
      console.error('Error answering call:', error)
    }
  }

  const handleIncomingCallReject = async (callId: string) => {
    try {
      const response = await fetch(`/api/calls/${callId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' })
      })

      if (response.ok) {
        setIncomingCall(null)
      }
    } catch (error) {
      console.error('Error rejecting call:', error)
    }
  }

  const handleIncomingCallEnd = async (callId: string) => {
    try {
      const response = await fetch(`/api/calls/${callId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ENDED' })
      })

      if (response.ok) {
        setIncomingCall(null)
        setCurrentCall(null)
      }
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  // Проверяем входящие звонки для активных пользователей
  useEffect(() => {
    if (!session?.user?.id) return

    const checkIncomingCalls = async () => {
      try {
        const response = await fetch(`/api/calls?userId=${session.user.id}`)
        if (response.ok) {
          const calls = await response.json()
          const ringingCall = calls.find((call: any) => 
            call.receiverId === session.user.id && call.status === 'RINGING'
          )
          
          if (ringingCall) {
            setIncomingCall(ringingCall)
            globalIncomingCall = ringingCall
            if (globalSetIncomingCall) {
              globalSetIncomingCall(ringingCall)
            }
          } else {
            setIncomingCall(null)
            globalIncomingCall = null
            if (globalSetIncomingCall) {
              globalSetIncomingCall(null)
            }
          }
        }
      } catch (error) {
        console.error('Error checking incoming calls:', error)
      }
    }

    const interval = setInterval(checkIncomingCalls, 3000)
    checkIncomingCalls()

    return () => clearInterval(interval)
  }, [session?.user?.id])

  if (!selectedUserId) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Звонки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm text-muted-foreground">
                {isConnected ? 'Подключено к серверу звонков' : 'Отключено от сервера звонков'}
              </span>
            </div>

            <p className="text-muted-foreground text-center py-4">
              Выберите пользователя для звонка
            </p>
            {users && users.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Доступные пользователи:</p>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 rounded-lg border cursor-pointer hover:bg-muted/50"
                      onClick={() => onUserSelect?.(user.id)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>{user.initials}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{user.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isIncomingCall && currentCall) {
    return (
      <Card className="w-80 shadow-lg border-2 border-green-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Phone className="h-5 w-5 animate-pulse" />
            Входящий звонок
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 ring-2 ring-green-500">
              <AvatarImage src={currentCall.caller.avatar || undefined} />
              <AvatarFallback className="text-lg">
                {currentCall.caller.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{currentCall.caller.name}</h3>
              <p className="text-muted-foreground">
                {currentCall.type === 'AUDIO' ? '📞 Аудио звонок' : '📹 Видео звонок'}
              </p>
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={answerCall}
              className="bg-green-500 hover:bg-green-600 text-white"
              size="lg"
            >
              <Phone className="h-5 w-5 mr-2" />
              Ответить
            </Button>
            <Button
              onClick={endCall}
              variant="destructive"
              size="lg"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              Отклонить
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (isCallActive && currentCall) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentCall.type === 'AUDIO' ? (
              <Phone className="h-5 w-5 text-green-500" />
            ) : (
              <Video className="h-5 w-5 text-green-500" />
            )}
            Активный звонок
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Видео элементы для видеозвонков */}
          {currentCall.type === 'VIDEO' && (
            <div className="relative">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-64 bg-black rounded-lg"
              />
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute bottom-4 right-4 w-32 h-24 bg-black rounded-lg"
              />
            </div>
          )}

          {/* Информация о звонке */}
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarImage src={currentCall.receiver.avatar || undefined} />
              <AvatarFallback>
                {currentCall.receiver.initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{currentCall.receiver.name}</h3>
              <p className="text-muted-foreground">
                {currentCall.type === 'AUDIO' ? 'Аудио звонок' : 'Видео звонок'}
              </p>
            </div>
          </div>

          {/* Элементы управления */}
          <div className="flex justify-center gap-4">
            <Button
              onClick={toggleMute}
              variant={isMuted ? "destructive" : "outline"}
              size="icon"
            >
              {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            
            {currentCall.type === 'VIDEO' && (
              <Button
                onClick={toggleVideo}
                variant={!isVideoEnabled ? "destructive" : "outline"}
                size="icon"
              >
                {!isVideoEnabled ? <CameraOff className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </Button>
            )}
            
            <Button
              onClick={toggleSpeaker}
              variant={!isSpeakerEnabled ? "destructive" : "outline"}
              size="icon"
            >
              {!isSpeakerEnabled ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            
            <Button
              onClick={endCall}
              variant="destructive"
              size="icon"
            >
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="w-96 shadow-lg">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-600" />
            Система звонков
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Подключено к серверу' : 'Отключено'}
            </span>
          </div>
          
          {!selectedUserId ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Выберите пользователя для звонка
              </p>
              {users && users.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-center">Доступные пользователи:</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => onUserSelect?.(user.id)}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback className="text-sm">{user.initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.isOnline ? '🟢 Онлайн' : '⚫ Офлайн'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-center p-3 bg-muted/30 rounded-lg">
                <p className="text-sm font-medium">Выбран пользователь:</p>
                <p className="text-sm text-muted-foreground truncate">
                  {users?.find(u => u.id === selectedUserId)?.name}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => initiateCall('AUDIO')}
                  className="flex-1"
                  size="sm"
                  disabled={!selectedUserId}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Аудио звонок
                </Button>
                <Button
                  onClick={() => initiateCall('VIDEO')}
                  className="flex-1"
                  size="sm"
                  disabled={!selectedUserId}
                >
                  <Video className="h-4 w-4 mr-2" />
                  Видео звонок
                </Button>
              </div>
              <Button
                onClick={() => onUserSelect?.(undefined)}
                variant="outline"
                size="sm"
                className="w-full"
              >
                Выбрать другого
              </Button>
            </div>
          )}
          
          {currentCall && (
            <div className="text-center space-y-2 p-3 bg-blue-50 rounded-lg">
              <Badge variant="secondary" className="text-xs">
                Звонок инициирован...
              </Badge>
              <Button
                onClick={endCall}
                variant="destructive"
                size="sm"
                className="w-full"
              >
                <PhoneOff className="h-4 w-4 mr-2" />
                Сбросить звонок
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Модальное окно для входящих звонков */}
      <IncomingCallModal
        call={incomingCall}
        onAnswer={handleIncomingCallAnswer}
        onReject={handleIncomingCallReject}
        onEnd={handleIncomingCallEnd}
      />
    </>
  )
} 