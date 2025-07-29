import { type NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import prisma from "@/lib/prisma"

// DELETE /api/projects/[id]/members/[memberId] - Удалить участника из проекта
export async function DELETE(request: NextRequest, { params }: { params: { id: string; memberId: string } }) {
    const token = await getToken({ 
      req: request as any, 
      secret: process.env.NEXTAUTH_SECRET 
    })
    
    if (!token?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  try {
    // Проверяем, существует ли участник
    const existingMember = await prisma.projectMember.findFirst({
      where: {
        projectId: params.id,
        id: params.memberId,
      },
    })

    if (!existingMember) {
      return NextResponse.json({ error: "Участник не найден" }, { status: 404 })
    }

    // Удаляем участника
    await prisma.projectMember.delete({
      where: { id: params.memberId },
    })

    return NextResponse.json({ message: "Участник успешно удален из проекта" })
  } catch (error) {
    console.error("Ошибка при удалении участника:", error)
    return NextResponse.json({ error: "Ошибка при удалении участника" }, { status: 500 })
  }
}

