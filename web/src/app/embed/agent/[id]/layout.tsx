import type { Metadata } from "next";
import "@/app/globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { ToasterProvider } from "@/components/toaster-provider";

export const metadata: Metadata = {
  title: "Agent Chat | LaunchpadAI",
  description: "Chat with an AI agent powered by LaunchpadAI",
};

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} h-full w-full overflow-hidden antialiased`}
        suppressHydrationWarning
      >
        <div className="h-[100vh] w-full">{children}</div>
        <ToasterProvider />
      </body>
    </html>
  );
}
