import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"
import { mkdir } from "fs/promises"

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "Файл не найден" }, { status: 400 })
    }

    // Создаем уникальное имя файла
    const fileExtension = file.name.split(".").pop()
    const fileName = `${uuidv4()}.${fileExtension}`

    // Создаем директорию для загрузок, если она не существует
    const uploadDir = join(process.cwd(), "public", "uploads")
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      console.error("Ошибка при создании директории:", error)
    }

    // Путь для сохранения файла
    const filePath = join(uploadDir, fileName)

    // Читаем содержимое файла
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Записываем файл на диск
    await writeFile(filePath, buffer)

    // URL для доступа к файлу
    const fileUrl = `/uploads/${fileName}`

    return NextResponse.json({
      url: fileUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    })
  } catch (error) {
    console.error("Ошибка при загрузке файла:", error)
    return NextResponse.json({ error: "Ошибка при загрузке файла" }, { status: 500 })
  }
}

