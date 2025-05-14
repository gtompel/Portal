import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// POST /api/announcements/[id]/like
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const announcementId = params.id;
  const userId = session.user.id;

  try {
    // Проверяем, существует ли объявление
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      return NextResponse.json({ error: "Объявление не найдено" }, { status: 404 });
    }

    // Проверяем, не лайкнул ли пользователь уже это объявление
    const existingLike = await prisma.announcementLike.findUnique({
      where: {
        userId_announcementId: {
          userId,
          announcementId,
        },
      },
    });

    if (existingLike) {
      return NextResponse.json({ error: "Вы уже поставили лайк этому объявлению" }, { status: 400 });
    }

    // Создание лайка
    await prisma.announcementLike.create({
      data: {
        userId,
        announcementId,
      },
    });

    // Увеличиваем счетчик лайков в объявлении
    await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        likes: { increment: 1 },
      },
    });

    return NextResponse.json({ message: "Лайк успешно добавлен" }, { status: 200 });
  } catch (error) {
    console.error("Ошибка при добавлении лайка: ", error);
    return NextResponse.json({ error: "Ошибка при добавлении лайка" }, { status: 500 });
  }
}

// DELETE /api/announcements/[id]/like
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Необходима авторизация" }, { status: 401 });
  }

  const announcementId = params.id;
  const userId = session.user.id;

  try {
    // Проверяем, существует ли лайк
    const existingLike = await prisma.announcementLike.findUnique({
      where: {
        userId_announcementId: {
          userId,
          announcementId,
        },
      },
    });

    if (!existingLike) {
      return NextResponse.json({ error: "Вы не ставили лайк этому объявлению" }, { status: 400 });
    }

    // Удаление лайка
    await prisma.announcementLike.delete({
      where: {
        userId_announcementId: {
          userId,
          announcementId,
        },
      },
    });

    // Уменьшаем счетчик лайков в объявлении
    await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        likes: { decrement: 1 },
      },
    });

    return NextResponse.json({ message: "Лайк успешно удален" }, { status: 200 });
  } catch (error) {
    console.error("Ошибка при удалении лайка:", error);
    return NextResponse.json({ error: "Ошибка при удалении лайка" }, { status: 500 });
  }
}