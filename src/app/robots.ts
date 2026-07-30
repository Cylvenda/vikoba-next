import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://vikoba.cylvenda.co.tz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/home/", "/group/", "/api/"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
