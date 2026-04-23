// src/app/api/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { logActivity } from "@/lib/activity";
import { generateVerificationToken } from "@/lib/tokens";
import { sendEmail } from "@/lib/notifications";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Eksik bilgi." }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Bu email zaten kullanımda." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    // Email Verification Logic
    const verificationToken = await generateVerificationToken(email);
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const verificationUrl = `${appUrl}/verify?token=${verificationToken.token}`;

    await sendEmail({
      to: email,
      subject: "E-postanızı Doğrulayın - GingivaX",
      body: `Hoş geldiniz ${name}! Kaydınızı tamamlamak için aşağıdaki butonla e-postanızı doğrulayın.`,
      actionUrl: verificationUrl,
      actionText: "Hesabımı Doğrula"
    });

    // Special verification section in notifications.ts would be better but for now I'll use the body
    // Actually I'll update notifications.ts shortly to handle a specific link button.

    await logActivity("USER_REGISTER", `${name} isimli yeni bir hasta kayıt oldu (Doğrulama bekleniyor).`);

    return NextResponse.json({ 
      message: "Kayıt başarılı. Lütfen e-postanızı kontrol ederek hesabınızı doğrulayın." 
    }, { status: 201 });
  } catch (error) {
    console.error("REGISTER_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
