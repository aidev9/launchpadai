import "./globals.css";

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
import Providers from "./providers";
// import FirestoreInit from "@/components/FirestoreInit"; // Removed unused import

// const geistSans = GeistSans({
//   subsets: ["latin"],
//   variable: "--font-sans",
// });
// const geistMono = GeistMono({
//   subsets: ["latin"],
//   variable: "--font-mono",
// });

export const metadata: Metadata = {
  title: "LaunchpadAI",
  description: "The easiest way to build AI apps",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {/* <FirestoreInit /> */}
        {children}
      </body>
    </html>
  );
}
