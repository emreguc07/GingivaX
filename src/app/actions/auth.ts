// src/app/actions/auth.ts
'use server';

import { prisma } from "@/lib/prisma";

export async function verifyEmail(token: string) {
  try {
    const existingToken = await prisma.verificationToken.findUnique({
      where: { token }
    });

    if (!existingToken) {
      return { error: "Geçersiz doğrulama kodlu." };
    }

    const hasExpired = new Date(existingToken.expires) < new Date();

    if (hasExpired) {
      return { error: "Doğrulama kodunun süresi dolmuş." };
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
        emailVerified: new Date(),
        email: existingToken.email // In case email changed, but here we just verify
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
