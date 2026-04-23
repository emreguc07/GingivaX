// src/app/actions/auth.ts
'use server';

import { prisma } from "@/lib/prisma";

export async function verifyCode(email: string, token: string) {
  try {
    const existingToken = await prisma.verificationToken.findFirst({
      where: { email, token }
    });

    if (!existingToken) {
      return { error: "Geçersiz doğrulama kodu." };
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      return { error: "Doğrulama kodunun süresi dolmuş. Lütfen yeni bir kod isteyin." };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: existingToken.email }
    });

    if (!existingUser) {
      return { error: "Kullanıcı bulunamadı." };
    }

    await prisma.user.update({
      where: { id: existingUser.id },
      data: { 
        emailVerified: new Date()
      }
    });

    await prisma.verificationToken.delete({
      where: { id: existingToken.id }
    });

    return { success: "E-postanız başarıyla doğrulandı! Artık giriş yapabilirsiniz." };
  } catch (error) {
    return { error: "Bir hata oluştu." };
  }
}

export async function resendVerificationCode(email: string) {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return { error: "Kullanıcı bulunamadı." };

    const token = await (await import("@/lib/tokens")).generateVerificationToken(email);
    const { sendEmail } = await import("@/lib/notifications");

    await sendEmail({
      to: email,
      subject: "Yeni Doğrulama Kodunuz - GingivaX",
      body: "Yeni doğrulama kodunuz aşağıdadır:",
      details: {
        date: "Hemen",
        time: "Doğrulama Kodu",
        service: token.token,
        doctor: "GingivaX Güvenlik"
      }
    });

    return { success: "Yeni kod e-postanıza gönderildi." };
  } catch (err) {
    return { error: "Kod gönderilemedi." };
  }
}

