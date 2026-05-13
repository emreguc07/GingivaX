import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Providers } from "@/components/Providers";

import DrPerioBot from "@/components/DrPerioBot";

export const metadata: Metadata = {
  title: "GingivaX | Premium Diş Kliniği & Randevu Sistemi",
  description: "Modern diş kliniği deneyimi, kolay randevu ve profesyonel takip.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Providers>
          <Navbar />
          <main style={{ marginTop: '80px', flex: 1 }}>
            {children}
          </main>
          <WhatsAppButton />
          <DrPerioBot />
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

