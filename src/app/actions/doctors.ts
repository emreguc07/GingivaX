// src/app/actions/doctors.ts
'use server';

import { prisma } from "@/lib/prisma";

export async function getDoctorsList() {
  try {
    const doctors = await prisma.user.findMany({
      where: { role: 'DOCTOR' },
      select: {
        id: true,
        name: true,
        specialty: true,
        bio: true,
        education: true,
        image: true,
      }
    });
    return { success: true, doctors };
  } catch (error) {
    return { success: false, error: "Hekim listesi alınamadı." };
  }
}
