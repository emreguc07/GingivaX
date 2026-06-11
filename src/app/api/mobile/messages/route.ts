import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/app/actions/notification";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = req.headers.get("x-user-id") || searchParams.get("userId");
    const otherUserId = searchParams.get("otherUserId");

    if (!userId || !otherUserId) {
      return NextResponse.json({ error: "Kullanıcı ve alıcı ID'leri gereklidir." }, { status: 400 });
    }

    // Retrieve messages between these two users
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: {
        createdAt: 'asc',
      },
      include: {
        sender: { select: { name: true, image: true, role: true } },
      },
    });

    // Mark messages from other user as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error("MOBILE_GET_MESSAGES_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const senderId = req.headers.get("x-user-id");
    const body = await req.json();
    const { receiverId, content } = body;

    if (!senderId || !receiverId || !content) {
      return NextResponse.json({ error: "Eksik bilgi (gönderen, alıcı ve mesaj içeriği gereklidir)." }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId,
      },
      include: {
        sender: { select: { name: true, image: true, role: true } },
      }
    });

    // Get sender name for notification
    const sender = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true }
    });

    await createNotification(
      receiverId,
      "Yeni Mesaj 💬",
      `${sender?.name || 'Bir kullanıcı'} size yeni bir mesaj gönderdi.`,
      "MESSAGE",
      "/doctor" // Default doc path
    );

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error("MOBILE_SEND_MESSAGE_ERROR", error);
    return NextResponse.json({ error: "Mesaj gönderilemedi." }, { status: 500 });
  }
}
