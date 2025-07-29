import type React from "react";
import type { Metadata } from "next";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next"

const jetbrain = JetBrains_Mono({ subsets: ["latin", "cyrillic"] });

export const metadata: Metadata = {
  title: "Управление задачами",
  description: "Система управления задачами и документами",
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
            {process.env.NODE_ENV === 'production' && <Analytics />}
            {process.env.NODE_ENV === 'production' && <SpeedInsights />}
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
