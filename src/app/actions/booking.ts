// src/app/actions/booking.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/notifications";

export async function createAppointment(formData: {
  service: string;
  date: string;
  time: string;
  doctorId?: string;
  name?: string;
  imageUrl?: string;
}) {
  try {
    const session = await getServerSession(authOptions);

    if (formData.doctorId) {
      const existing = await prisma.appointment.findFirst({
        where: {
          doctorId: formData.doctorId,
          date: formData.date,
          time: formData.time,
          status: { not: "İptal Edildi" }
        }
      });

      if (existing) {
        return { success: false, error: "Bu saat dilimi az önce başkası tarafından alındı." };
      }
    }
    
    const appointment = await prisma.appointment.create({
      data: {
        service: formData.service,
        date: formData.date,
        time: formData.time,
        doctorId: formData.doctorId,
        name: formData.name || session?.user?.name || "Anonim",
        userId: (session?.user as any)?.id || null,
        imageUrl: formData.imageUrl || null
      }
    });


    await logActivity("APPOINTMENT_NEW", `${formData.name || session?.user?.name || "Bir hasta"} ${formData.date} tarihine randevu oluşturdu.`);

    if (session?.user?.email) {
      await sendEmail({
        to: session.user.email,
        subject: "Randevu Talebiniz Alındı - GingivaX",
        body: `Sayın ${formData.name || session.user.name}, randevu başvurunuz başarıyla sistemimize ulaşmıştır. Hekimimiz onayladıktan sonra size tekrar bildirim gönderilecektir.`,
        details: {
          date: formData.date,
          time: formData.time,
          service: formData.service,
          doctor: "Belirlenen Hekim" // Or fetch doctor name if needed
        }
      });
    }

    return { success: true, appointment };
  } catch (error) {
    console.error("CREATE_APPOINTMENT_ERROR", error);
    return { success: false, error: "Randevu oluşturulamadı." };
  }
}
