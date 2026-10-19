import { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Course, CmsPage, BlogPost, SiteSettings } from "@/models";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const defaultBaseUrl = process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3005";

  try {
    await connectDB();
    const settings = await SiteSettings.findOne({ key: "global_config" }).lean();
    const baseUrl = settings?.seoDefaults?.canonicalDomain || defaultBaseUrl;

    const staticRoutes: MetadataRoute.Sitemap = [
      {
        url: `${baseUrl}`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${baseUrl}/courses`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
      {
        url: `${baseUrl}/learning-paths`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      },
      {
        url: `${baseUrl}/blog`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.8,
      },
      {
        url: `${baseUrl}/certificates/verify`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.7,
      },
      {
        url: `${baseUrl}/about`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/help`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/faq`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
      },
      {
        url: `${baseUrl}/contact`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.5,
      },
      {
        url: `${baseUrl}/terms`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/privacy`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.3,
      },
      {
        url: `${baseUrl}/refund-policy`,
        lastModified: new Date(),
        changeFrequency: "yearly",
        priority: 0.3,
      },
    ];

    // Query PageSeo overrides to check for noIndex
    const { PageSeo, Category, LearningPath } = await import("@/models");
    const noIndexOverrides = await PageSeo.find({ noIndex: true }).select("path").lean();
    const noIndexSet = new Set(noIndexOverrides.map((o) => o.path.toLowerCase()));

    // Filter static routes if marked noIndex
    const filteredStaticRoutes = staticRoutes.filter(
      (r) => !noIndexSet.has(new URL(r.url).pathname.toLowerCase())
    );

    // 1. Published Courses (exclude noIndex)
    const publishedCourses = await Course.find({
      status: "published",
      "seo.noIndex": { $ne: true },
    })
      .select("slug updatedAt")
      .lean();

    const courseRoutes: MetadataRoute.Sitemap = publishedCourses
      .filter((c) => !noIndexSet.has(`/courses/${c.slug}`.toLowerCase()))
      .map((c) => ({
        url: `${baseUrl}/courses/${c.slug}`,
        lastModified: c.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.85,
      }));

    // 2. Categories
    const categories = await Category.find({
      status: { $ne: "archived" },
      "seo.noIndex": { $ne: true },
    })
      .select("slug updatedAt")
      .lean();
    const categoryRoutes: MetadataRoute.Sitemap = categories
      .filter((cat) => !noIndexSet.has(`/categories/${cat.slug}`.toLowerCase()))
      .map((cat) => ({
        url: `${baseUrl}/categories/${cat.slug}`,
        lastModified: cat.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      }));

    // 3. Learning Paths
    const learningPaths = await LearningPath.find({ isPublished: true }).select("slug updatedAt").lean();
    const pathRoutes: MetadataRoute.Sitemap = learningPaths
      .filter((lp) => !noIndexSet.has(`/learning-paths/${lp.slug}`.toLowerCase()))
      .map((lp) => ({
        url: `${baseUrl}/learning-paths/${lp.slug}`,
        lastModified: lp.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      }));

    // 4. Published CMS Pages (exclude noIndex)
    const publishedPages = await CmsPage.find({
      status: "published",
      "seo.noIndex": { $ne: true },
    })
      .select("slug updatedAt")
      .lean();

    const pageRoutes: MetadataRoute.Sitemap = publishedPages
      .filter((p) => !noIndexSet.has(`/pages/${p.slug}`.toLowerCase()))
      .map((p) => ({
        url: `${baseUrl}/pages/${p.slug}`,
        lastModified: p.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.75,
      }));

    // 5. Published Blog Posts (exclude noIndex)
    const publishedPosts = await BlogPost.find({
      status: "published",
      "seo.noIndex": { $ne: true },
    })
      .select("slug updatedAt")
      .lean();

    const blogRoutes: MetadataRoute.Sitemap = publishedPosts
      .filter((b) => !noIndexSet.has(`/blog/${b.slug}`.toLowerCase()))
      .map((b) => ({
        url: `${baseUrl}/blog/${b.slug}`,
        lastModified: b.updatedAt || new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    return [
      ...filteredStaticRoutes,
      ...courseRoutes,
      ...categoryRoutes,
      ...pathRoutes,
      ...pageRoutes,
      ...blogRoutes,
    ];
  } catch (err) {
    console.error("Dynamic sitemap generation error:", err);
    return [
      {
        url: defaultBaseUrl,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 1.0,
      },
      {
        url: `${defaultBaseUrl}/courses`,
        lastModified: new Date(),
        changeFrequency: "daily",
        priority: 0.9,
      },
    ];
  }
}
