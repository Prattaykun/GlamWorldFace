import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Geist_Mono } from "next/font/google";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

import "./globals.css";

/* ── Fonts ── */
const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

/* ── Heading font – reuses Inter but could be swapped later ── */
const headingFont = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
  weight: ["600", "700", "800"],
});

/* ── Metadata ── */
export const metadata: Metadata = {
  title: {
    default: "GlamWorldFace — Beauty Pageant Competition Platform",
    template: "%s | GlamWorldFace",
  },
  description:
    "Join beauty pageant competitions, compete in Jury-based or Public Voting events, build your contestant profile, and climb the leaderboards.",
  keywords: [
    "beauty pageant",
    "competition",
    "pageant platform",
    "modeling",
    "voting",
    "leaderboard",
  ],
  authors: [{ name: "GlamWorldFace" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "GlamWorldFace",
    title: "GlamWorldFace — Beauty Pageant Competition Platform",
    description:
      "Join beauty pageant competitions, compete in Jury-based or Public Voting events, and climb the leaderboards.",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf5f0" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1626" },
  ],
  width: "device-width",
  initialScale: 1,
};

/* ── Root Layout ── */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} ${headingFont.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <AuthProvider>
          <ThemeProvider>
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
