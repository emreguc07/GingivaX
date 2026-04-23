// src/app/actions/booking.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function createAppointment(formData: {
  service: string;
  date: string;
  time: string;
  doctorId?: string;
  name?: string;
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
      }
    });


    return { success: true, appointment };
  } catch (error) {
    console.error("CREATE_APPOINTMENT_ERROR", error);
    return { success: false, error: "Randevu oluşturulamadı." };
  }
}
