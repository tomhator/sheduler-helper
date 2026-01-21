import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Goal Scheduler",
  description: "AI-powered goal oriented scheduler",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Goal Scheduler",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} h-full antialiased`}>
        <main className="mx-auto max-w-md min-h-screen bg-background relative pb-20 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
