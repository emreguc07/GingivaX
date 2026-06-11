import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = req.headers.get("x-user-id") || searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID'si gereklidir." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        createdAt: true,
        specialty: true,
        bio: true,
        education: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("MOBILE_PROFILE_GET_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { name, phone } = body;

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID'si gereklidir." }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: "İsim alanı gereklidir." }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      }
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("MOBILE_PROFILE_UPDATE_ERROR", error);
    return NextResponse.json({ error: "Profil güncellenemedi." }, { status: 500 });
  }
}
