// src/app/actions/reviews.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";

export async function createReview(data: {
  appointmentId: number;
  rating: number;
  comment: string;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error("Oturum bulunamadı.");
  }

  const patientId = (session.user as any).id;

  // Verify appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: data.appointmentId },
    select: { userId: true, doctorId: true, status: true }
  });

  if (!appointment || appointment.userId !== patientId) {
    throw new Error("Randevu bulunamadı veya size ait değil.");
  }

  if (appointment.status !== 'Tamamlandı') {
    throw new Error("Sadece tamamlanmış randevular için yorum yapabilirsiniz.");
  }

  if (!appointment.doctorId) {
    throw new Error("Hekim bilgisi bulunamadı.");
  }

  const review = await prisma.review.create({
    data: {
      rating: data.rating,
      comment: data.comment,
      patientId: patientId,
      doctorId: appointment.doctorId,
      appointmentId: data.appointmentId
    }
  });

  await logActivity("REVIEW_NEW", `Yeni bir hekim yorumu yapıldı (Hekim ID: ${appointment.doctorId})`);

  return { success: true, review };
}

export async function getDoctorReviews(doctorId: string) {
  return await prisma.review.findMany({
    where: { doctorId },
    include: {
      patient: { select: { name: true, image: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getLatestReviews() {
  return await prisma.review.findMany({
    take: 6,
    include: {
      patient: { select: { name: true, image: true } },
      doctor: { select: { name: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
}
