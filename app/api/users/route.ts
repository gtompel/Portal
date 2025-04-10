import { type NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hash } from "bcrypt"

// GET /api/users - Получить всех пользователей
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const department = searchParams.get("department")
    const search = searchParams.get("search")

    let whereClause = {}

    if (department && department !== "all") {
      whereClause = {
        ...whereClause,
        department: department,
      }
    }

    if (search) {
      whereClause = {
        ...whereClause,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { position: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        phone: true,
        avatar: true,
        initials: true,
        status: true,
        location: true,
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error("Ошибка при получении пользователей:", error)
    return NextResponse.json({ error: "Ошибка при получении пользователей" }, { status: 500 })
  }
}

// POST /api/users - Создать нового пользователя
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Проверка обязательных полей
    const requiredFields = ["name", "email", "password", "position", "department"]
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `Поле ${field} обязательно для заполнения` }, { status: 400 })
      }
    }

    // Проверка, существует ли пользователь с таким email
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    })

    if (existingUser) {
      return NextResponse.json({ error: "Пользователь с таким email уже существует" }, { status: 400 })
    }

    // Хеширование пароля
    const hashedPassword = await hash(body.password, 10)

    // Создание инициалов из имени
    const nameParts = body.name.split(" ")
    const initials = nameParts.map((part: any[]) => part[0]).join("")

    // Создание пользователя
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        position: body.position,
        department: body.department,
        phone: body.phone || null,
        avatar: body.avatar || null,
        initials: body.initials || initials,
        status: body.status || "WORKING",
        location: body.location || null,
        hireDate: body.hireDate ? new Date(body.hireDate) : new Date(),
        birthday: body.birthday ? new Date(body.birthday) : null,
        bio: body.bio || null,
        managerId: body.managerId || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
        phone: true,
        avatar: true,
        initials: true,
        status: true,
      },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    console.error("Ошибка при создании пользователя:", error)
    return NextResponse.json({ error: "Ошибка при создании пользователя" }, { status: 500 })
  }
}

