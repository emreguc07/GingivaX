import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = req.headers.get("x-user-id") || searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID'si gereklidir." }, { status: 400 });
    }

    // Find all users who have exchanged messages with this user
    const sentTo = await prisma.message.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });

    const receivedFrom = await prisma.message.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const otherUserIds = Array.from(new Set([
      ...sentTo.map(m => m.receiverId),
      ...receivedFrom.map(m => m.senderId)
    ]));

    const users = await prisma.user.findMany({
      where: { id: { in: otherUserIds } },
      select: { id: true, name: true, image: true, role: true, specialty: true },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error("MOBILE_CHAT_LIST_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
