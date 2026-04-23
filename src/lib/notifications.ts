// src/lib/notifications.ts
import { Resend } from 'resend';
import { logActivity } from "./activity";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

interface EmailConfig {
  to: string;
  subject: string;
  body: string;
  details?: {
    date: string;
    time: string;
    service: string;
    doctor: string;
  }
}

export async function sendEmail({ to, subject, body, details }: EmailConfig) {
  try {
    const detailsHtml = details ? `
      <div style="margin-top: 20px; padding: 15px; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h4 style="margin: 0 0 10px 0; color: #00CED1;">Randevu Detayları:</h4>
        <p style="margin: 5px 0; font-size: 14px;"><b>📅 Tarih:</b> ${details.date}</p>
        <p style="margin: 5px 0; font-size: 14px;"><b>⏰ Saat:</b> ${details.time}</p>
        <p style="margin: 5px 0; font-size: 14px;"><b>🦷 Hizmet:</b> ${details.service}</p>
        <p style="margin: 5px 0; font-size: 14px;"><b>👨‍⚕️ Hekim:</b> ${details.doctor}</p>
      </div>
    ` : '';

    if (resend) {
      await resend.emails.send({
        from: 'GingivaX Klinik <on-boarding@resend.dev>',
        to: to,
        subject: subject,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #eee; border-radius: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #00CED1; margin: 0;">GingivaX</h1>
              <p style="color: #666; font-style: italic;">Gülüşünüz Emanetimizdir</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 16px;">
              <h2 style="margin-top: 0; font-size: 20px;">${subject}</h2>
              <p style="line-height: 1.6; font-size: 16px;">${body}</p>
              ${detailsHtml}
            </div>
            <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #999;">
              <p>&copy; 2026 GingivaX Klinik Yönetim Sistemi. Tüm hakları saklıdır.</p>
              <p>Cumhuriyet Cad. No:123, İstanbul</p>
            </div>
          </div>
        `,
      });
    } else {
      // Fallback for development: just log
      console.log(`
        --- [RESEND KEY MISSING] MOCK EMAIL ---
        To: ${to}
        Subject: ${subject}
        Body: ${body}
        --------------------------------------
      `);
    }

    await logActivity("NOTIFICATION_SENT", `${to} adresine bildirim gönderildi (${subject}).`);
    return { success: true };
  } catch (error) {
    console.error("EMAIL_ERROR", error);
    return { success: false, error };
  }
}
