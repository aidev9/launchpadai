import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import type { Metadata } from "next";
// import { Toaster } from "@/components/ui/toaster"; // Remove direct import
import { ToasterProvider } from "@/components/toaster-provider"; // Import the wrapper

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
        {/* <Toaster /> */}
        <ToasterProvider /> {/* Use the wrapper component */}
      </body>
    </html>
  );
}
