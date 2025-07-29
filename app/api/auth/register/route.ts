import { type NextRequest, NextResponse } from "next/server"
import { hash } from "bcrypt"
import prisma from "@/lib/prisma"

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
    const initials = nameParts.map((part: string) => part[0]).join("")

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
        status: "WORKING",
        location: body.location || "Россия",
        hireDate: new Date(),
        bio: body.bio || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        position: true,
        department: true,
      },
    })

    return NextResponse.json(
      {
        message: "Пользователь успешно зарегистрирован",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 201 },
    )
  } catch (error) {
    console.error("Ошибка при регистрации:", error)
    return NextResponse.json({ error: "Ошибка при регистрации пользователя" }, { status: 500 })
  }
}

