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
};

import { SmoothScroller } from "@/components/animations/SmoothScroller";
import { ImageProtector } from "@/components/ui/ImageProtector";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${bricolage.variable}`}>
      <body className="min-h-screen flex flex-col antialiased">
        <SmoothScroller />
        <ImageProtector />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
