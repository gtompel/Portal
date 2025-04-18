"use client"

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
  BarChart,
  Settings,
  HelpCircle,
  Briefcase,
  BellRing,
} from "lucide-react"

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const routes = [
    {
      href: "/",
      icon: LayoutDashboard,
      title: "Главная",
    },
    {
      href: "/tasks",
      icon: CheckSquare,
      title: "Задачи",
    },
    {
      href: "/documents",
      icon: FileText,
      title: "Документы",
    },
    {
      href: "/employees",
      icon: Users,
      title: "Сотрудники",
    },
    {
      href: "/projects",
      icon: Briefcase,
      title: "Проекты",
    },
    {
      href: "/calendar",
      icon: Calendar,
      title: "Календарь",
    },
    {
      href: "/messages",
      icon: MessageSquare,
      title: "Сообщения",
    },
    {
      href: "/analytics",
      icon: BarChart,
      title: "Аналитика",
    },
    {
      href: "/analytics/tasks",
      icon: BarChart,
      title: "Аналитика задач",
    },
    {
      href: "/analytics/projects",
      icon: BarChart,
      title: "Аналитика проектов",
    },
    {
      href: "/announcements",
      icon: BellRing,
      title: "Объявления",
    },
    {
      href: "/settings",
      icon: Settings,
      title: "Настройки",
    },
    {
      href: "/help",
      icon: HelpCircle,
      title: "Помощь",
    },
  ]

  return (
    <div className="relative border-r bg-background">
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
          {routes.map((route) => (
            <Link key={route.href} href={route.href} passHref>
              <Button
                variant={pathname === route.href ? "secondary" : "ghost"}
                className={cn("justify-start", isCollapsed && "justify-center")}
              >
                <route.icon className="mr-2 h-4 w-4" />
                {!isCollapsed && <span>{route.title}</span>}
              </Button>
            </Link>
          ))}
        </div>
      </ScrollArea>
    </div>
  )
}

