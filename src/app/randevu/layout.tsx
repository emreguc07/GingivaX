// src/app/randevu/layout.tsx
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

export default async function RandevuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    // Sunucu tarafında giriş kontrolü. Eğer session yoksa, 
    // tarayıcı daha sayfayı indirmeye başlamadan yönlendirme yapılır.
    redirect("/login?callbackUrl=/randevu");
  }

  return <>{children}</>;
}
