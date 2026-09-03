import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f172a",
};

export const metadata: Metadata = {
  title: {
    default: "FinTech Loan Management System",
    template: "%s | FinTech LMS",
  },
  description:
    "Enterprise Loan Management System — End-to-end loan origination, credit appraisal, disbursements, repayments, and portfolio servicing platform.",
  applicationName: "FinTech LMS",
  authors: [{ name: "FinTech Lending Solutions" }],
  keywords: [
    "Loan Management System",
    "LMS",
    "Fintech",
    "Banking",
    "Credit Appraisal",
    "Loan Servicing",
    "Disbursements",
  ],
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FinTech Loan Management System",
    description: "Enterprise Lending & Loan Servicing Platform",
    type: "website",
    locale: "en_IN",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
