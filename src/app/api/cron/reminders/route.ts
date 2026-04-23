// src/app/api/cron/reminders/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/notifications';

export async function GET(request: Request) {
  // CRON_SECRET check for security (Configure this in Vercel env)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    // Get today's date in "YYYY-MM-DD" format
    const today = new Date().toISOString().split('T')[0];

    // Find "Approved" (Onaylandı) appointments for today
    const appointments = await prisma.appointment.findMany({
      where: {
        date: today,
        status: "Onaylandı"
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        doctor: {
          select: {
            name: true
          }
        }
      }
    });

    if (appointments.length === 0) {
      return NextResponse.json({ message: "Hatırlatılacak randevu bulunamadı." });
    }

    let sentCount = 0;

    for (const app of appointments) {
      if (app.user?.email) {
        await sendEmail({
          to: app.user.email,
          subject: "Randevu Hatırlatması - Bugün Randevunuz Var!",
          body: `Sayın ${app.user.name}, bugün şubemizde randevunuz bulunmaktadır. Detaylar aşağıdadır. Sizi bekliyoruz!`,
          details: {
            date: app.date,
            time: app.time,
            service: app.service,
            doctor: app.doctor?.name || "Belirlenmiş Hekim"
          }
        });
        sentCount++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      sentCount, 
      message: `${sentCount} adet hatırlatma maili başarıyla gönderildi.` 
    });

  } catch (error) {
    console.error("CRON_REMINDERS_ERROR", error);
    return NextResponse.json({ error: "Hatırlatma işlemi sırasında bir hata oluştu." }, { status: 500 });
  }
}
