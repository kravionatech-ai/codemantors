import { Metadata } from "next";
import { connectDB } from "@/lib/db";
import { PageSeo, IPageSeo } from "@/models/PageSeo";
import { SiteSettings } from "@/models/SiteSettings";

export interface SeoFallback {
  title?: string;
  description?: string;
  ogImage?: string;
  canonicalPath?: string;
  entityType?: string;
  keywords?: string[];
  noIndex?: boolean;
}

export function auditSeoMetadata(data: {
  title?: string;
  description?: string;
  canonicalUrl?: string;
  ogImage?: string;
  noIndex?: boolean;
  noFollow?: boolean;
}): { score: number; issues: string[] } {
  const issues: string[] = [];
  let score = 100;

  const title = data.title?.trim() || "";
  const desc = data.description?.trim() || "";
  const canonical = data.canonicalUrl?.trim() || "";
  const ogImg = data.ogImage?.trim() || "";

  // Title validation
  if (!title) {
    issues.push("Missing SEO Title: Search engines will fall back to site defaults or page content.");
    score -= 30;
  } else if (title.length < 30) {
    issues.push(`SEO Title is short (${title.length} chars). Target 45–60 characters for maximum search visibility.`);
    score -= 10;
  } else if (title.length > 65) {
    issues.push(`SEO Title is long (${title.length} chars). It will likely be truncated on Google desktop/mobile SERPs.`);
    score -= 10;
  }

  // Description validation
  if (!desc) {
    issues.push("Missing Meta Description: Social cards and search snippet will lack an authoritative summary.");
    score -= 30;
  } else if (desc.length < 80) {
    issues.push(`Meta Description is too concise (${desc.length} chars). Aim for 120–160 characters.`);
    score -= 10;
  } else if (desc.length > 165) {
    issues.push(`Meta Description exceeds 165 characters (${desc.length} chars) and may get cut off on search results.`);
    score -= 10;
  }

  // Open Graph Image
  if (!ogImg) {
    issues.push("Missing Open Graph Image: Social shares (Twitter/LinkedIn/Facebook) will show empty media previews.");
    score -= 15;
  }

  // Canonical URL validation
  if (canonical && !canonical.startsWith("http://") && !canonical.startsWith("https://") && !canonical.startsWith("/")) {
    issues.push("Invalid Canonical URL format: Must be an absolute URL or root-relative path.");
    score -= 15;
  }

  // Indexing warning
  if (data.noIndex) {
    issues.push("Robots 'noindex' directive is active: This page will be completely excluded from search engine indexes.");
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
  };
}

export async function resolvePageSeo(
  path: string,
  fallback: SeoFallback = {}
): Promise<Metadata> {
  const defaultBaseUrl =
    process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

  let siteDefaults = {
    defaultTitle: "CodeMentors — Learn to Code. Build Real Skills. Grow Your Career.",
    titleTemplate: "%s | CodeMentors",
    defaultDescription:
      "Master modern software engineering, web frameworks, and system architecture with video lessons, articles, quizzes, and certificates.",
    defaultOgImage: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1200&h=630&fit=crop",
    canonicalDomain: defaultBaseUrl,
  };

  let pageOverride: IPageSeo | null = null;

  try {
    await connectDB();
    const [settingsDoc, foundOverride] = await Promise.all([
      SiteSettings.findOne({ key: "global_config" }).lean(),
      PageSeo.findOne({ path: path.toLowerCase() }).lean(),
    ]);

    if (settingsDoc?.seoDefaults) {
      siteDefaults = {
        ...siteDefaults,
        ...settingsDoc.seoDefaults,
        canonicalDomain: settingsDoc.seoDefaults.canonicalDomain || defaultBaseUrl,
      };
    }

    if (foundOverride && foundOverride.status !== "archived") {
      pageOverride = foundOverride as unknown as IPageSeo;
    }
  } catch (err) {
    console.warn(`[SEO] Failed to fetch SEO metadata for path "${path}":`, err);
  }

  const baseUrl = siteDefaults.canonicalDomain.replace(/\/+$/, "");

  // Resolve Title
  const resolvedTitle =
    pageOverride?.title?.trim() ||
    fallback.title?.trim() ||
    siteDefaults.defaultTitle;

  // Resolve Description
  const resolvedDescription =
    pageOverride?.description?.trim() ||
    fallback.description?.trim() ||
    siteDefaults.defaultDescription;

  // Resolve Canonical URL
  let resolvedCanonical = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  if (pageOverride?.canonicalUrl?.trim()) {
    const rawCan = pageOverride.canonicalUrl.trim();
    resolvedCanonical = rawCan.startsWith("http") ? rawCan : `${baseUrl}${rawCan.startsWith("/") ? rawCan : `/${rawCan}`}`;
  } else if (fallback.canonicalPath) {
    const cp = fallback.canonicalPath;
    resolvedCanonical = cp.startsWith("http") ? cp : `${baseUrl}${cp.startsWith("/") ? cp : `/${cp}`}`;
  }

  // Resolve OG & Twitter Image
  const resolvedOgImage =
    pageOverride?.ogImage?.trim() ||
    pageOverride?.twitterImage?.trim() ||
    fallback.ogImage?.trim() ||
    siteDefaults.defaultOgImage;

  // Resolve Robots
  const isNoIndex = pageOverride ? Boolean(pageOverride.noIndex) : Boolean(fallback.noIndex);
  const isNoFollow = pageOverride ? Boolean(pageOverride.noFollow) : false;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: resolvedCanonical,
    },
    robots: {
      index: !isNoIndex,
      follow: !isNoFollow,
      googleBot: {
        index: !isNoIndex,
        follow: !isNoFollow,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      title: pageOverride?.ogTitle?.trim() || resolvedTitle,
      description: pageOverride?.ogDescription?.trim() || resolvedDescription,
      url: resolvedCanonical,
      siteName: "CodeMentors",
      images: [
        {
          url: resolvedOgImage,
          width: 1200,
          height: 630,
          alt: resolvedTitle,
        },
      ],
      type: "website",
    },
    twitter: {
      card: (pageOverride?.twitterCard as any) || "summary_large_image",
      title: pageOverride?.twitterTitle?.trim() || resolvedTitle,
      description: pageOverride?.twitterDescription?.trim() || resolvedDescription,
      images: [resolvedOgImage],
    },
  };
}
