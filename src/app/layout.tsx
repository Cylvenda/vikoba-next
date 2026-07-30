import type { Metadata } from "next";
import { Poppins, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { LanguageProvider } from "@/components/language/language-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vikoba.cylvenda.co.tz";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


// Configure Poppins
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"], // optional: 400=regular, 500=medium, 700=bold
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "VICOBA Community Hub | Village Community Banking",
    template: "%s | VICOBA Community Hub",
  },
  description:
    "VICOBA Community Hub helps village savings groups manage michango, hisa, mikopo, meetings, members, and records securely online.",
  applicationName: "VICOBA Community Hub",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
      { url: "/icon.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full antialiased", poppins.variable, "font-sans", inter.variable)}>
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
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
