// src/app/actions/appointment.ts
'use server';

import { prisma } from "@/lib/prisma";

export async function getBookedSlots(doctorId: string, date: string) {
  if (!doctorId || !date) return [];

  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        date,
        status: { not: "İptal Edildi" }
      },
      select: {
        time: true
      }
    });

    return appointments.map(app => app.time);
  } catch (error) {
    console.error("GET_BOOKED_SLOTS_ERROR", error);
    return [];
  }
}
