import type { Metadata, Viewport } from "next";
import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata: Metadata = {
  title: "Chase Zone — Real-Life GPS Chase Game",
  description: "Real-life multiplayer GPS chase game: one fugitive, multiple hunters. Who wins?",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Chase Zone" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="h-full dark">
      <body className="min-h-full flex flex-col bg-black text-gray-100">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
