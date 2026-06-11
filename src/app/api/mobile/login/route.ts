import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Lütfen email ve şifre girin." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      return NextResponse.json({ error: "Hatalı şifre." }, { status: 400 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ 
        error: "Lütfen giriş yapmadan önce e-postanızı doğrulayın.",
        unverified: true,
        email: user.email
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error("MOBILE_LOGIN_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
