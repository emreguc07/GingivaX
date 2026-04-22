import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { Providers } from "@/components/Providers";

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
          <main style={{ marginTop: '80px' }}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

