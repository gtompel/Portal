import { NextRequest, NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { v4 as uuidv4 } from "uuid"

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}

export async function POST(request: NextRequest) {
  console.log("🚀 Начало обработки загрузки файла")
  
  try {
    console.log("📦 Получение FormData...")
    const formData = await request.formData()
    console.log("✅ FormData получен успешно")
    
    const file = formData.get("file") as File

    if (!file) {
      console.error("❌ Файл не найден в FormData")
                 return NextResponse.json(
             { error: "Файл не найден" },
             { 
               status: 400,
               headers: {
                 'Access-Control-Allow-Origin': '*',
                 'Access-Control-Allow-Methods': 'POST, OPTIONS',
                 'Access-Control-Allow-Headers': 'Content-Type',
                 'Access-Control-Max-Age': '86400',
               },
             }
           )
    }

    console.log("📋 Файл получен:", {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    })

    // Проверяем тип файла
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"]
    if (!allowedTypes.includes(file.type)) {
      console.error("❌ Неподдерживаемый тип файла:", file.type)
                 return NextResponse.json(
             { error: `Неподдерживаемый тип файла: ${file.type}. Разрешены только изображения (JPEG, PNG, GIF, WebP)` },
             { 
               status: 400,
               headers: {
                 'Access-Control-Allow-Origin': '*',
                 'Access-Control-Allow-Methods': 'POST, OPTIONS',
                 'Access-Control-Allow-Headers': 'Content-Type',
                 'Access-Control-Max-Age': '86400',
               },
             }
           )
    }

    // Проверяем размер файла (максимум 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      console.error("❌ Файл слишком большой:", file.size, "байт")
                 return NextResponse.json(
             { error: "Файл слишком большой. Максимальный размер: 5MB" },
             { 
               status: 400,
               headers: {
                 'Access-Control-Allow-Origin': '*',
                 'Access-Control-Allow-Methods': 'POST, OPTIONS',
                 'Access-Control-Allow-Headers': 'Content-Type',
                 'Access-Control-Max-Age': '86400',
               },
             }
           )
    }

    // Создаем уникальное имя файла
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${uuidv4()}.${fileExtension}`

    console.log("📝 Создано имя файла:", fileName)

    // Путь для сохранения
    const uploadsDir = join(process.cwd(), "public", "uploads")
    
    // Создаем папку uploads, если она не существует
    try {
      await mkdir(uploadsDir, { recursive: true })
      console.log("✅ Папка uploads создана/проверена")
    } catch (error) {
      console.error("❌ Ошибка при создании папки uploads:", error)
                   return NextResponse.json(
               { error: "Ошибка при создании папки для загрузки" },
               { 
                 status: 500,
                 headers: {
                   'Access-Control-Allow-Origin': '*',
                   'Access-Control-Allow-Methods': 'POST, OPTIONS',
                   'Access-Control-Allow-Headers': 'Content-Type',
                   'Access-Control-Max-Age': '86400',
                 },
               }
             )
    }

    const filePath = join(uploadsDir, fileName)
    console.log("📁 Путь для сохранения:", filePath)

    // Конвертируем файл в буфер и сохраняем
    console.log("🔄 Начало конвертации файла в буфер...")
    
    const bytes = await file.arrayBuffer()
    console.log("✅ Файл конвертирован в ArrayBuffer, размер:", bytes.byteLength, "байт")
    
    const buffer = Buffer.from(bytes)
    console.log("✅ Создан Buffer, размер:", buffer.length, "байт")
    
    await writeFile(filePath, buffer)
    console.log("✅ Файл сохранен на диск")

    // Возвращаем URL файла
    const fileUrl = `/uploads/${fileName}`
    console.log("🔗 URL файла:", fileUrl)

               return NextResponse.json({
             success: true,
             url: fileUrl,
             fileName: fileName,
             size: file.size,
             type: file.type
           }, {
             headers: {
               'Access-Control-Allow-Origin': '*',
               'Access-Control-Allow-Methods': 'POST, OPTIONS',
               'Access-Control-Allow-Headers': 'Content-Type',
               'Access-Control-Max-Age': '86400',
             },
           })

  } catch (error) {
    console.error("💥 Общая ошибка при загрузке файла:", error)
    
               return NextResponse.json(
             { error: `Ошибка при загрузке файла: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}` },
             { 
               status: 500,
               headers: {
                 'Access-Control-Allow-Origin': '*',
                 'Access-Control-Allow-Methods': 'POST, OPTIONS',
                 'Access-Control-Allow-Headers': 'Content-Type',
                 'Access-Control-Max-Age': '86400',
               },
             }
           )
  }
}

