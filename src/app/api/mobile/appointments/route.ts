import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getBookedSlots } from "@/app/actions/appointment";
import { logActivity } from "@/lib/activity";
import { sendEmail } from "@/lib/notifications";
import { createNotification } from "@/app/actions/notification";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");

    // Case 1: Checking booked slots for booking
    if (doctorId && date) {
      const result = await getBookedSlots(doctorId, date);
      return NextResponse.json(result);
    }

    // Case 2: Fetching user's appointments (patient or doctor)
    const userId = req.headers.get("x-user-id") || searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID'si gereklidir." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    });

    if (!user) {
      return NextResponse.json({ error: "Kullanıcı bulunamadı." }, { status: 404 });
    }

    let appointments = [];
    const now = new Date();

    if (user.role === "DOCTOR") {
      appointments = await prisma.appointment.findMany({
        where: { doctorId: userId },
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true }
          },
          review: true
        },
        orderBy: [
          { date: "desc" },
          { time: "desc" }
        ]
      });
    } else {
      appointments = await prisma.appointment.findMany({
        where: { userId },
        include: {
          doctor: {
            select: { id: true, name: true, specialty: true }
          },
          review: true
        },
        orderBy: [
          { date: "desc" },
          { time: "desc" }
        ]
      });
    }

    // Map status for timeout if pending and date passed
    const mappedAppointments = appointments.map(app => {
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

    return NextResponse.json({ success: true, appointments: mappedAppointments });
  } catch (error) {
    console.error("MOBILE_GET_APPOINTMENTS_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    const body = await req.json();
    const { service, date, time, doctorId, doctorName, name, imageUrl } = body;

    if (!service || !date || !time) {
      return NextResponse.json({ error: "Eksik bilgi (hizmet, tarih ve saat gereklidir)." }, { status: 400 });
    }

    // Verify slot is still available
    if (doctorId) {
      const existing = await prisma.appointment.findFirst({
        where: {
          doctorId,
          date,
          time,
          status: { not: "İptal Edildi" }
        }
      });

      if (existing) {
        return NextResponse.json({ error: "Bu saat dilimi az önce başkası tarafından alındı." }, { status: 400 });
      }
    }

    // Get user details if authenticated
    let patientUser = null;
    if (userId) {
      patientUser = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true }
      });
    }

    const appointment = await prisma.appointment.create({
      data: {
        service,
        date,
        time,
        doctorId: doctorId || null,
        userId: userId || null,
        name: name || (patientUser ? patientUser.name : "Anonim"),
        imageUrl: imageUrl || null
      }
    });

    const patientName = name || (patientUser ? patientUser.name : "Anonim");
    await logActivity("APPOINTMENT_NEW", `${patientName} ${date} tarihine randevu oluşturdu.`);

    let finalDoctorName = doctorName || "Belirlenmedi";
    if (doctorId && (!doctorName || doctorName === "Belirlenmedi")) {
      const doc = await prisma.user.findUnique({ where: { id: doctorId }, select: { name: true } });
      if (doc) finalDoctorName = doc.name || "Hekim";
    }

    if (doctorId) {
      await createNotification(
        doctorId,
        "Yeni Randevu Talebi 📅",
        `${patientName}, ${date} ${time} tarihi için randevu oluşturdu.`,
        "APPOINTMENT",
        "/doctor"
      );
    }

    const emailTo = patientUser?.email || body.email;
    if (emailTo) {
      await sendEmail({
        to: emailTo,
        subject: "Randevu Talebiniz Alındı - GingivaX",
        body: `Sayın ${patientName}, randevu başvurunuz başarıyla sistemimize ulaşmıştır. Hekimimiz onayladıktan sonra size tekrar bildirim gönderilecektir.`,
        details: {
          date,
          time,
          service,
          doctor: finalDoctorName
        }
      });
    }

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error("MOBILE_CREATE_APPOINTMENT_ERROR", error);
    return NextResponse.json({ error: "Randevu oluşturulamadı." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = req.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ error: "Kullanıcı ID'si gereklidir." }, { status: 400 });
    }

    const requester = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, name: true }
    });

    if (!requester || requester.role !== "DOCTOR") {
      return NextResponse.json({ error: "Yetkisiz erişim. Sadece hekimler bu işlemi yapabilir." }, { status: 403 });
    }

    const body = await req.json();
    const { appointmentId, status, clinicalNote } = body;

    if (!appointmentId) {
      return NextResponse.json({ error: "Randevu ID'si gereklidir." }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: Number(appointmentId) },
      include: { user: true }
    });

    if (!appointment) {
      return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 });
    }

    if (appointment.doctorId !== userId) {
      return NextResponse.json({ error: "Yetkisiz erişim. Bu randevu size ait değil." }, { status: 403 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (clinicalNote !== undefined) updateData.clinicalNote = clinicalNote;

    const updated = await prisma.appointment.update({
      where: { id: Number(appointmentId) },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    await logActivity("APPOINTMENT_STATUS", `Randevu durumu '${status}' olarak güncellendi (Mobil, ID: ${appointmentId})`);

    if (status && updated.user) {
      if (status === 'Onaylandı' && updated.user.email) {
        await sendEmail({
          to: updated.user.email,
          subject: "Randevunuz Onaylandı! - GingivaX",
          body: `Sayın ${updated.user.name}, randevunuz hekimimiz ${requester.name} tarafından onaylanmıştır.`,
          details: {
            date: updated.date,
            time: updated.time,
            service: updated.service,
            doctor: requester.name || "Hekim"
          }
        });

        await createNotification(
          updated.user.id,
          "Randevunuz Onaylandı 🔔",
          `${updated.date} ${updated.time} tarihli randevunuz hekim tarafından onaylanmıştır.`,
          "APPOINTMENT",
          "/profile"
        );
      } else if (status === 'İptal Edildi' && updated.user.email) {
        await sendEmail({
          to: updated.user.email,
          subject: "Randevunuz İptal Edildi - GingivaX",
          body: `Sayın ${updated.user.name}, randevunuz hekimimiz ${requester.name} tarafından iptal edilmiştir.`,
          details: {
            date: updated.date,
            time: updated.time,
            service: updated.service,
            doctor: requester.name || "Hekim"
          }
        });

        await createNotification(
          updated.user.id,
          "Randevunuz İptal Edildi ❌",
          `${updated.date} ${updated.time} tarihli randevunuz iptal edilmiştir.`,
          "APPOINTMENT",
          "/profile"
        );
      }
    }

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("MOBILE_UPDATE_APPOINTMENT_ERROR", error);
    return NextResponse.json({ error: "Randevu güncellenemedi." }, { status: 500 });
  }
}
