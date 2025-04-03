"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CheckSquare,
  FileText,
  Users,
  Calendar,
  MessageSquare,
  Settings,
  HelpCircle,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn("relative border-r bg-background", className)}>
      <div className="flex h-16 items-center justify-between border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          {!isCollapsed && <span>Корпоративный портал</span>}
        </Link>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsCollapsed(!isCollapsed)}>
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          <span className="sr-only">Свернуть меню</span>
        </Button>
      </div>
      <ScrollArea className="h-[calc(100vh-4rem)]">
        <div className="flex flex-col gap-2 p-2">
          <Link href="/" passHref>
            <Button
              variant={pathname === "/" ? "secondary" : "ghost"}
              className={cn("justify-start", isCollapsed && "justify-center")}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>Главная</span>}
            </Button>
          </Link>
          <Link href="/tasks" passHref>
            <Button
              variant={pathname === "/tasks" ? "secondary" : "ghost"}
              className={cn("justify-start", isCollapsed && "justify-center")}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>Задачи</span>}
            </Button>
          </Link>
          <Link href="/documents" passHref>
            <Button
              variant={pathname === "/documents" ? "secondary" : "ghost"}
              className={cn("justify-start", isCollapsed && "justify-center")}
            >
              <FileText className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>Документы</span>}
            </Button>
          </Link>
          <Link href="/employees" passHref>
            <Button
              variant={pathname === "/employees" ? "secondary" : "ghost"}
              className={cn("justify-start", isCollapsed && "justify-center")}
            >
              <Users className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>Сотрудники</span>}
            </Button>
          </Link>
          <Link href="/calendar" passHref>
            <Button
              variant={pathname === "/calendar" ? "secondary" : "ghost"}
              className={cn("justify-start", isCollapsed && "justify-center")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>Календарь</span>}
            </Button>
          </Link>
          <Link href="/messages" passHref>
            <Button
              variant={pathname === "/messages" ? "secondary" : "ghost"}
              className={cn("justify-start", isCollapsed && "justify-center")}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>Сообщения</span>}
            </Button>
          </Link>
          <Link href="/settings" passHref>
            <Button
              variant={pathname === "/settings" ? "secondary" : "ghost"}
              className={cn("justify-start", isCollapsed && "justify-center")}
            >
              <Settings className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>Настройки</span>}
            </Button>
          </Link>
          <Link href="/help" passHref>
            <Button
              variant={pathname === "/help" ? "secondary" : "ghost"}
              className={cn("justify-start", isCollapsed && "justify-center")}
            >
              <HelpCircle className="mr-2 h-4 w-4" />
              {!isCollapsed && <span>Помощь</span>}
            </Button>
          </Link>
        </div>
      </ScrollArea>
    </div>
  )
}

