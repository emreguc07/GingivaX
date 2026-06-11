import { NextResponse } from "next/server";
import { resendVerificationCode } from "@/app/actions/auth";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email gereklidir." }, { status: 400 });
    }

    const result = await resendVerificationCode(email);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.success });
  } catch (error) {
    console.error("MOBILE_RESEND_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
