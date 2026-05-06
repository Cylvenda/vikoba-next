import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ToastContainer } from "react-toastify";
import { ThemeProvider, themeScript } from "@/components/theme/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

// Configure Poppins
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "700"], // optional: 400=regular, 500=medium, 700=bold
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Meeting Hub",
    template: "%s | Meeting Hub",
  },
  description: "Secure web-based virtual meeting system",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={cn("h-full antialiased", poppins.variable)}>
      <head>
        <Script id="theme-script" strategy="beforeInteractive">
          {themeScript}
        </Script>
      </head>
      <body className="min-h-screen bg-background font-sans">
        <ThemeProvider >
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
        </ThemeProvider>
      </body>
    </html>
  );
}
