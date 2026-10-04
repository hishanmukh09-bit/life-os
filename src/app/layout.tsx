import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LifeOSProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "LIFE OS — Build better days together",
  description: "A private digital life-management platform for exactly two people. Plan, track, study, move, reflect, and support each other.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
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
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <LifeOSProvider>
          {children}
        </LifeOSProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(reg) {
                    console.log('LifeOS PWA ServiceWorker active:', reg.scope);
                  }).catch(function(err) {
                    console.log('PWA ServiceWorker registration note:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
