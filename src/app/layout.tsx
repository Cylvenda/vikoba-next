import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LanguageProvider } from "@/components/language/language-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import PwaManager from "@/components/pwa/PwaManager";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vikoba.cylvenda.co.tz";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VICOBA Community Hub | Village Community Banking",
    template: "%s | VICOBA Community Hub",
  },
  description:
    "VICOBA Community Hub helps village savings groups manage michango, hisa, mikopo, meetings, members, and records securely online.",
  applicationName: "VICOBA Community Hub",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "VICOBA Hub",
    startupImage: [
      { url: "/screenshots/vicoba-mobile.png" },
    ],
  },
  formatDetection: { telephone: false },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  keywords: [
    "VICOBA",
    "vikoba Tanzania",
    "village community banking",
    "village savings group",
    "mfumo wa VICOBA",
    "vikundi vya akiba",
    "mikopo ya VICOBA",
    "michango na hisa",
    "community banking platform",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "VICOBA Community Hub",
    title: "VICOBA Community Hub | Digital Village Banking",
    description:
      "Manage VICOBA savings, loans, meetings, members, and records in one secure platform. Simamia akiba, mikopo na mikutano ya kikundi chako.",
    locale: "en_TZ",
    alternateLocale: "sw_TZ",
    images: [
      {
        url: "/logo.png",
        width: 1024,
        height: 1024,
        alt: "VICOBA Community Hub logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VICOBA Community Hub | Digital Village Banking",
    description:
      "Manage VICOBA savings, loans, meetings, members, and records in one secure platform.",
    images: ["/logo.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  category: "finance",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#c2410c" },
    { media: "(prefers-color-scheme: dark)", color: "#7c2d12" },
  ],
  colorScheme: "light dark",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full font-sans antialiased">
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider >
          <LanguageProvider>
            <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar
              newestOnTop
              pauseOnHover
              theme="colored"
              className="cursor-pointer"
            />
            <TooltipProvider>
              {children}
            </TooltipProvider>
            <PwaManager />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
