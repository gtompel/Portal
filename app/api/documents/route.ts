import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET /api/documents - Получить все документы
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")
    const search = searchParams.get("search")
    const creatorId = searchParams.get("creatorId")

    let whereClause = {}

    if (type && type !== "all") {
      whereClause = {
        ...whereClause,
        type: type,
      }
    }

    if (creatorId) {
      whereClause = {
        ...whereClause,
        creatorId: creatorId,
      }
    }

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const documents = await prisma.document.findMany({
      where: whereClause,
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    })

    return NextResponse.json(documents)
  } catch (error) {
    console.error("Ошибка при получении документов:", error)
    return NextResponse.json({ error: "Ошибка при получении документов" }, { status: 500 })
  }
}

// POST /api/documents - Создать новый документ
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Проверка обязательных полей
    if (!body.name || !body.type || !body.url || !body.creatorId) {
      return NextResponse.json({ error: "Название, тип, URL и ID создателя обязательны" }, { status: 400 })
    }

    // Создание документа
    const document = await prisma.document.create({
      data: {
        name: body.name,
        type: body.type,
        description: body.description || null,
        url: body.url,
        size: body.size || "0 KB",
        creatorId: body.creatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatar: true,
            initials: true,
          },
        },
      },
    })

    return NextResponse.json(document, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании документа:", error)
    return NextResponse.json({ error: "Ошибка при создании документа" }, { status: 500 })
  }
}

