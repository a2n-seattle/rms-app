import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ConfigureAmplify } from "@/components/ConfigureAmplify";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RMS",
  description: "Reservation Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <ConfigureAmplify />
        {children}
      </body>
    </html>
  );
}
