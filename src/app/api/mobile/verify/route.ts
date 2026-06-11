import { NextResponse } from "next/server";
import { verifyCode } from "@/app/actions/auth";

export async function POST(req: Request) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json({ error: "Eksik bilgi (email ve kod gereklidir)." }, { status: 400 });
    }

    const result = await verifyCode(email, token);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.success });
  } catch (error) {
    console.error("MOBILE_VERIFY_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
