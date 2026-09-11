import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://ncsciencesociety.com"),
  title: {
    template: "%s | Nalanda College Science Society",
    default: "Nalanda College Science Society",
  },
  description: "Official website of the Nalanda College Science Society (NCSS). Fostering scientific inquiry, critical thinking, and innovation among students since its inception.",
  keywords: ["Nalanda College", "Science Society", "NCSS", "Science", "Students", "Sri Lanka", "Education"],
  openGraph: {
    title: "Nalanda College Science Society",
    description: "Official website of the Nalanda College Science Society (NCSS).",
    url: "https://ncsciencesociety.com",
    siteName: "NCSS",
    locale: "en_US",
    type: "website",
    images: ["/cover.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nalanda College Science Society",
    description: "Official website of the Nalanda College Science Society (NCSS).",
    images: ["/cover.jpg"],
  },
  applicationName: "NCSS",
  appleWebApp: {
    title: "NCSS",
    statusBarStyle: "default",
    capable: true,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

import { SmoothScroller } from "@/components/animations/SmoothScroller";
import { ImageProtector } from "@/components/ui/ImageProtector";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable}`} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col antialiased" suppressHydrationWarning>
        <SmoothScroller />
        <ImageProtector />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
