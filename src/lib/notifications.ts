// src/lib/notifications.ts
import { logActivity } from "./activity";

interface EmailConfig {
  to: string;
  subject: string;
  body: string;
}

/**
 * Mock Email Service
 * In a real app, you would use 'resend', 'nodemailer', or 'sendgrid' here.
 */
export async function sendEmail({ to, subject, body }: EmailConfig) {
  // 1. Simulation Delay
  await new Promise(resolve => setTimeout(resolve, 500));

  // 2. Log to Console (for development viewing)
  console.log(`
    --- MOCK EMAIL SENT ---
    To: ${to}
    Subject: ${subject}
    Body: ${body}
    -----------------------
  `);

  // 3. Log to Activity for Admin
  await logActivity("NOTIFICATION_SENT", `${to} adresine '${subject}' konulu bildirim gönderildi.`);

  return { success: true };
}
