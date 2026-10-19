import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { SiteSettings } from "@/models/SiteSettings";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const defaultBaseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

  let canonicalDomain = defaultBaseUrl;

  try {
    await connectDB();
    const settings = await SiteSettings.findOne({ key: "global_config" }).lean();
    if (settings?.seoDefaults?.canonicalDomain) {
      canonicalDomain = settings.seoDefaults.canonicalDomain;
    }
  } catch (err) {
    console.error("Robots.txt settings query error:", err);
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/student/",
          "/admin/",
          "/instructor/",
          "/api/",
          "/learn/",
          "/checkout",
          "/cart",
          "/course-basket",
          "/orders/",
          "/order-confirmation/",
        ],
      },
    ],
    sitemap: `${canonicalDomain}/sitemap.xml`,
  };
}
