import { NextResponse } from "next/server";
import { getDoctorsList } from "@/app/actions/doctors";

export async function GET() {
  try {
    const result = await getDoctorsList();

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Hekim listesi alınamadı." }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("MOBILE_DOCTORS_ERROR", error);
    return NextResponse.json({ error: "Sunucu hatası." }, { status: 500 });
  }
}
