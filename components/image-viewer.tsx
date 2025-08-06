import { useState } from 'react'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'

interface ImageViewerProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageName: string
}

export function ImageViewer({ isOpen, onClose, imageUrl, imageName }: ImageViewerProps) {
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95">
        <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
        <DialogDescription className="sr-only">Модальное окно для просмотра изображения с возможностью увеличения и поворота</DialogDescription>
        <div className="relative w-full h-full">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-black/50 text-white">
            <span className="text-sm truncate">{imageName}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Controls */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 bg-black/50 rounded-lg p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="text-white hover:bg-white/20"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-white hover:bg-white/20 text-xs"
            >
              {Math.round(scale * 100)}%
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={scale >= 3}
              className="text-white hover:bg-white/20"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="text-white hover:bg-white/20"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>

          {/* Image */}
          <div 
            className="w-full h-full flex items-center justify-center overflow-hidden"
            onKeyDown={handleKeyDown}
            tabIndex={0}
          >
            <img
              src={imageUrl}
              alt={imageName}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
              draggable={false}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 