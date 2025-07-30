import type React from "react";
import type { Metadata, Viewport } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

const jetbrain = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: "Управление задачами",
  description: "Система управления задачами и документами",
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#000000',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={jetbrain.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Analytics />
            <SpeedInsights />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
