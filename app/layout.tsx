import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LeanME",
  applicationName: "LeanME",
  description: "Un compagno di allenamento intelligente, calmo e personale",
  manifest: "/manifest.json",
  formatDetection: {
    telephone: false
  },
  other: {
    "apple-mobile-web-app-capable": "yes"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LeanME"
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    shortcut: "/icon-192.png",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  }
};

export const viewport: Viewport = {
  themeColor: "#07080c",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
