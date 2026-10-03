import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LifeOSProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "LIFE OS — Build better days together",
  description: "A private digital life-management platform for exactly two people. Plan, track, study, move, reflect, and support each other.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LIFE OS",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <LifeOSProvider>
          {children}
        </LifeOSProvider>
      </body>
    </html>
  );
}
