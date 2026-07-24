import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Presentation Timer | จับเวลาการนำเสนอ",
  description:
    "เว็บแอปจับเวลาการนำเสนอ (Presentation Timer) พร้อม visual feedback แบบ real-time สำหรับผู้นำเสนอ",
  keywords: ["timer", "presentation", "countdown", "นำเสนอ", "จับเวลา"],
  authors: [{ name: "Timer SUT" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className={`${outfit.variable} dark`}>
      <body className="min-h-screen animated-bg font-outfit">{children}</body>
    </html>
  );
}
