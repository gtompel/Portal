import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Файл не найден" },
        { status: 400 }
      )
    }

    // Проверяем тип файла
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Неподдерживаемый тип файла. Разрешены только изображения (JPEG, PNG, GIF, WebP)" },
        { status: 400 }
      )
    }

    // Проверяем размер файла (максимум 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "Файл слишком большой. Максимальный размер: 5MB" },
        { status: 400 }
      )
    }

    // Создаем уникальное имя файла
    const fileExtension = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExtension}`

    // Путь для сохранения
    const uploadsDir = join(process.cwd(), "public", "uploads")
    
    // Создаем папку uploads, если она не существует
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      console.error("Ошибка при создании папки uploads:", error)
    }

    const filePath = join(uploadsDir, fileName)

    // Конвертируем файл в буфер и сохраняем
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Возвращаем URL файла
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: fileName,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error("Ошибка при загрузке файла:", error)
    return NextResponse.json(
      { error: "Ошибка при загрузке файла" },
      { status: 500 }
    )
  }
}

