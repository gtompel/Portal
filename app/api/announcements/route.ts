import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// GET /api/announcements - Получить все объявления
export async function GET(request: NextRequest) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    let whereClause = {}

    if (category && category !== "all") {
      whereClause = {
        ...whereClause,
        category: category,
      }
    }

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const announcements = await prisma.announcement.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(announcements)
  } catch (error) {
    console.error("Ошибка при получении объявлений:", error)
    return NextResponse.json({ error: "Ошибка при получении объявлений" }, { status: 500 })
  }
}

// POST /api/announcements - Создать новое объявление
export async function POST(request: NextRequest) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.title || !body.content || !body.authorId) {
      return NextResponse.json({ error: "Заголовок, содержание и ID автора обязательны" }, { status: 400 })
    }

    // Создание объявления
    const announcement = await prisma.announcement.create({
      data: {
        title: body.title,
        content: body.content,
        category: body.category || "NEWS",
        authorId: body.authorId,
        likes: 0,
        comments: 0,
      },
    })

    // Создаём уведомления для всех пользователей (кроме автора)
    const allUsers = await prisma.user.findMany({
      where: {
        id: {
          not: body.authorId,
        },
      },
      select: {
        id: true,
      },
    });

    if (allUsers.length > 0) {
      await prisma.notification.createMany({
        data: allUsers.map((user) => ({
          type: "ANNOUNCEMENT",
          userId: user.id,
          announcementId: announcement.id,
          read: false,
        })),
      });
    }

    return NextResponse.json(announcement, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании объявления:", error)
    return NextResponse.json({ error: "Ошибка при создании объявления" }, { status: 500 })
  }
}

