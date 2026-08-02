import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "VICOBA Community Hub",
    short_name: "VICOBA Hub",
    description: "Manage VICOBA savings, loans, fines, meetings, members, wallets, and reports securely.",
    start_url: "/home?source=pwa",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#ffffff",
    theme_color: "#c2410c",
    lang: "en-TZ",
    categories: ["finance", "business", "productivity"],
    icons: [
      ...[72, 96, 128, 144, 152, 192, 384, 512].map((size) => ({
        src: `/icons/icon-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
        purpose: "any" as const,
      })),
      {
        src: "/icons/maskable-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable" as const,
      },
      {
        src: "/icons/maskable-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable" as const,
      },
    ],
    screenshots: [
      {
        src: "/screenshots/vicoba-wide.png",
        sizes: "1280x720",
        type: "image/png",
        form_factor: "wide",
        label: "VICOBA Community Hub dashboard",
      },
      {
        src: "/screenshots/vicoba-mobile.png",
        sizes: "750x1334",
        type: "image/png",
        form_factor: "narrow",
        label: "VICOBA Community Hub on mobile",
      },
    ],
    shortcuts: [
      {
        name: "Dashboard",
        short_name: "Dashboard",
        description: "Open your VICOBA dashboard",
        url: "/home?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-dashboard-192x192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Groups",
        short_name: "Groups",
        description: "Open your VICOBA groups",
        url: "/groups?source=pwa-shortcut",
        icons: [{ src: "/icons/shortcut-groups-192x192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  }
}
