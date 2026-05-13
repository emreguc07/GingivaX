// src/app/actions/doctor.ts
'use server';

import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/notifications";

export async function getAppointments() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new Error("Oturum bulunamadı veya yetkisiz erişim.");
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  let appointments;
  if (userRole === 'ADMIN') {
    appointments = await prisma.appointment.findMany({
      select: {
        id: true,
        service: true,
        date: true,
        time: true,
        status: true,
        name: true,
        imageUrl: true,
        userId: true,
        doctor: { select: { name: true } },
        user: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  } else {
    appointments = await prisma.appointment.findMany({
      where: { doctorId: userId },
      select: {
        id: true,
        service: true,
        date: true,
        time: true,
        status: true,
        name: true,
        imageUrl: true,
        userId: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  const now = new Date();
  return appointments.map((app: any) => {
    if (app.status === 'Bekliyor') {
      try {
        const appDateTime = new Date(`${app.date}T${app.time || '00:00'}`);
        if (appDateTime < now) {
          return { ...app, status: 'Zaman Aşımı' };
        }
      } catch (e) {}
    }
    return app;
  });
}


export async function updateAppointmentStatus(id: number, status: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'DOCTOR' && (session.user as any).role !== 'ADMIN') {
    throw new Error("Yetkisiz erişim. Sadece hekimler veya yöneticiler durumu güncelleyebilir.");
  }

  const userRole = (session.user as any).role;
  const userId = (session.user as any).id;

  const whereClause: any = { id: id };
  if (userRole !== 'ADMIN') {
    whereClause.doctorId = userId;
  }

  const updated = await prisma.appointment.update({
    where: whereClause,
    data: { status },
    include: {
      user: { select: { id: true, email: true, name: true } },
      doctor: { select: { name: true } }
    }
  });

  await logActivity("APPOINTMENT_STATUS", `Randevu durumu '${status}' olarak güncellendi (ID: ${id})`);

  if (status === 'Onaylandı' && updated.user?.email) {
    await sendEmail({
      to: updated.user.email,
      subject: "Randevunuz Onaylandı! - GingivaX",
      body: `Sayın ${updated.user.name}, randevunuz hekimimiz tarafından onaylanmıştır.`,
      details: {
        date: updated.date,
        time: updated.time,
        service: updated.service,
        doctor: (updated as any).doctor?.name || (session.user as any).name
      }
    });
  }

  if (updated.user?.id) {
    const { createNotification } = await import("@/app/actions/notification");
    let title = "Randevu Durumu Güncellendi";
    let message = `Randevunuzun durumu '${status}' olarak güncellendi.`;
    
    if (status === 'Onaylandı') {
      title = "Randevunuz Onaylandı 🔔";
      message = `${updated.date} ${updated.time} tarihli randevunuz hekim tarafından onaylanmıştır.`;
    } else if (status === 'İptal Edildi') {
      title = "Randevunuz İptal Edildi ❌";
      message = `${updated.date} ${updated.time} tarihli randevunuz iptal edilmiştir.`;
    }
    
    await createNotification(updated.user.id, title, message, "APPOINTMENT", "/profile");
  }

  return updated;
}

export async function deleteAppointment(id: number) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'DOCTOR' && (session.user as any).role !== 'ADMIN') {
    throw new Error("Yetkisiz erişim. Sadece hekimler veya yöneticiler randevuyu silebilir.");
  }

  await prisma.appointment.delete({
    where: { id }
  });

  await logActivity("APPOINTMENT_DELETE", `Bir randevu kaydı silindi (ID: ${id})`);
}

export async function getPatientsByDoctor() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'DOCTOR') {
    throw new Error("Yetkisiz erişim.");
  }

  const doctorId = (session.user as any).id;

  const patients = await prisma.user.findMany({
    where: {
      appointments: {
        some: { doctorId: doctorId }
      }
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      appointments: {
        where: { doctorId: doctorId },
        select: {
          id: true,
          service: true,
          date: true,
          time: true,
          status: true,
          imageUrl: true,
          clinicalNote: true
        },

        orderBy: { createdAt: 'desc' }
      }
    }
  });

  const now = new Date();
  return patients.map(p => ({
    ...p,
    appointments: p.appointments.map((app: any) => {
      if (app.status === 'Bekliyor') {
        try {
          const appDateTime = new Date(`${app.date}T${app.time || '00:00'}`);
          if (appDateTime < now) {
            return { ...app, status: 'Zaman Aşımı' };
          }
        } catch (e) {}
      }
      return app;
    })
  }));
}

export async function saveClinicalNote(appointmentId: number, note: string) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || (session.user as any).role !== 'DOCTOR') {
    throw new Error("Yetkisiz erişim.");
  }

  const doctorId = (session.user as any).id;

  const updated = await prisma.appointment.update({
    where: { 
      id: appointmentId,
      doctorId: doctorId // Ensure this doctor owns the appointment
    },
    data: { clinicalNote: note }
  });

  await logActivity("APPOINTMENT_NOTE", `Randevu için tedavi notu güncellendi (ID: ${appointmentId})`);

  return { success: true, updated };
}

