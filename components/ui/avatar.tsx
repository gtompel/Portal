"use client"

import * as React from "react"
import * as AvatarPrimitive from "@radix-ui/react-avatar"
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
      className
    )}
    {...props}
  />
))
Avatar.displayName = AvatarPrimitive.Root.displayName

interface AvatarImageProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image> {
  showModal?: boolean
  fallbackSrc?: string
}

const AvatarImage = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Image>,
  AvatarImageProps
>(({ className, showModal = false, fallbackSrc, ...props }, ref) => {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleImageError = () => {
    setImageError(true)
    console.warn("Failed to load avatar image:", props.src)
  }

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const imageContent = (
    <AvatarPrimitive.Image
      ref={ref}
      className={cn("aspect-square h-full w-full object-cover", className)}
      onError={handleImageError}
      onLoad={handleImageLoad}
      {...props}
    />
  )

  if (showModal && imageLoaded && !imageError && props.src) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            {imageContent}
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center gap-4">
            <DialogTitle className="text-lg font-semibold">Фото профиля</DialogTitle>
            <DialogDescription className="text-center">
              Просмотр фото профиля
            </DialogDescription>
            <div className="relative">
              <img
                src={props.src as string}
                alt="Фото профиля"
                className="max-w-full h-auto rounded-lg shadow-lg"
                onError={handleImageError}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return imageContent
})
AvatarImage.displayName = AvatarPrimitive.Image.displayName

const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      "flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground",
      className
    )}
    {...props}
  />
))
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName

export { Avatar, AvatarImage, AvatarFallback }
