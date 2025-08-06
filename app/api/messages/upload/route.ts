import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// POST /api/messages/upload - Загрузить файл для сообщения
export async function POST(request: NextRequest) {
  try {
    // Проверяем аутентификацию
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File



    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    }

    // Проверяем размер файла (максимум 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Файл слишком большой. Максимальный размер: 10MB" }, { status: 400 })
    }

    // Проверяем тип файла
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: `Неподдерживаемый тип файла: ${file.type}. Поддерживаемые типы: изображения (JPEG, PNG, GIF, WebP), PDF, документы Word/Excel, текстовые файлы` 
      }, { status: 400 })
    }

    // Создаем директорию для загрузок, если её нет
    const uploadDir = join(process.cwd(), "public", "uploads", "messages")
    
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Генерируем уникальное имя файла
    const timestamp = Date.now()
    const fileName = `${timestamp}-${file.name}`
    const filePath = join(uploadDir, fileName)

    // Сохраняем файл
    try {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)
      
      // Проверяем, что файл действительно создан
      if (!existsSync(filePath)) {
        return NextResponse.json({ error: "Файл не был сохранен" }, { status: 500 })
      }
    } catch (writeError) {
      return NextResponse.json({ error: "Не удалось сохранить файл" }, { status: 500 })
    }

    // Возвращаем информацию о файле
    const responseData = {
      name: file.name,
      url: `/uploads/messages/${fileName}`,
      type: file.type,
      size: file.size,
    }
    return NextResponse.json(responseData)
  } catch (error) {
    return NextResponse.json({ error: "Ошибка при загрузке файла" }, { status: 500 })
  }
} 