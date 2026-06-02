import type { Metadata } from "next";
import { Geist, Geist_Mono, Merriweather } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: "700",
});

const siteUrl = "https://www.thegoodifound.com";
const siteTitle = "The Good I Found";
const siteDescription = "Your daily dose of good news — uplifting, heartwarming, and inspiring stories from around the world. No politics, no negativity, just the good stuff.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteTitle} | Good News Every Day`,
    template: `%s | ${siteTitle}`,
  },
  description: siteDescription,
  keywords: [
    "good news", "positive news", "uplifting stories", "heartwarming news",
    "inspiring stories", "happy news", "good news today", "positive stories",
    "feel good news", "good news website", "daily good news", "world good news",
    "kindness stories", "hopeful news", "good news only",
  ],
  authors: [{ name: "The Good I Found", url: siteUrl }],
  creator: "The Good I Found",
  publisher: "The Good I Found",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: siteTitle,
    title: `${siteTitle} | Good News Every Day`,
    description: siteDescription,
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "The Good I Found — Good News Every Day",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteTitle} | Good News Every Day`,
    description: siteDescription,
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: siteUrl,
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
      className={`${geistSans.variable} ${geistMono.variable} ${merriweather.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
