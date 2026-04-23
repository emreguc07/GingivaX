// src/app/actions/appointment.ts
'use server';

import { prisma } from "@/lib/prisma";

export async function getBookedSlots(doctorId: string, date: string) {
  if (!doctorId || !date) return { booked: [], isClosed: false };

  try {
    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.getDay();

    const [appointments, workingDay, offDate] = await Promise.all([
      prisma.appointment.findMany({
        where: { doctorId, date, status: { not: "İptal Edildi" } },
        select: { time: true }
      }),
      prisma.workingDay.findUnique({
        where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } }
      }),
      prisma.offDate.findUnique({
        where: { doctorId_date: { doctorId, date } }
      })
    ]);

    const booked = appointments.map(app => app.time);
    
    // Check if the business is closed or on holiday
    const isClosed = !!offDate || (!!workingDay && workingDay.isClosed);

    return { 
      booked, 
      isClosed,
      workingHours: workingDay ? { 
        start: workingDay.startTime, 
        end: workingDay.endTime 
      } : null 
    };
  } catch (error) {
    console.error("GET_BOOKED_SLOTS_ERROR", error);
    return { booked: [], isClosed: false };
  }
}

