import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FloBoats - Florida\'s Premier Boat Marketplace & Community",
  description: "Find boats for sale, discover marinas, connect with the boating community, and explore events across Florida. Your one-stop destination for all things boating in the Sunshine State.",
  keywords: "boats for sale Florida, Florida marinas, boat marketplace, boating community, Florida boat dealers",
  authors: [{ name: "FloBoats Team" }],
  creator: "FloBoats",
  publisher: "FloBoats",
  openGraph: {
    title: "FloBoats - Florida\'s Premier Boat Marketplace & Community",
    description: "Find boats for sale, discover marinas, connect with the boating community, and explore events across Florida.",
    url: "https://floboats.com",
    siteName: "FloBoats",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FloBoats - Florida\'s Premier Boat Marketplace & Community",
    description: "Find boats for sale, discover marinas, connect with the boating community, and explore events across Florida.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// TODO: Add global providers (auth, theme, query client)
// TODO: Implement error boundary
// TODO: Add analytics tracking

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AuthProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
