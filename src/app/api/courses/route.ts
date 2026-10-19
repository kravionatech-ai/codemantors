import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course, User } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const level = searchParams.get("level") || "";
    const format = searchParams.get("format") || ""; // "video", "text", "mixed"
    const priceFilter = searchParams.get("price") || ""; // "free", "paid", or ""
    const minRating = parseFloat(searchParams.get("rating") || "0");
    const sort = searchParams.get("sort") || "popular"; // "popular", "newest", "highest_rated", "price_asc", "price_desc"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const status = searchParams.get("status") || "published";

    // Query builder using conditions array to prevent $or collisions
    const conditions: any[] = [{ status }];

    if (search.trim()) {
      const matchingInstructors = await User.find({
        role: "instructor",
        name: { $regex: search.trim(), $options: "i" },
      }).select("_id");
      const instructorIds = matchingInstructors.map((i) => i._id);

      conditions.push({
        $or: [
          { title: { $regex: search.trim(), $options: "i" } },
          { subtitle: { $regex: search.trim(), $options: "i" } },
          { description: { $regex: search.trim(), $options: "i" } },
          { tags: { $in: [new RegExp(search.trim(), "i")] } },
          ...(instructorIds.length > 0 ? [{ instructor: { $in: instructorIds } }] : []),
        ],
      });
    }

    if (category && category !== "all") {
      conditions.push({ category: { $regex: new RegExp(`^${category}$`, "i") } });
    }

    if (level && level !== "all") {
      conditions.push({ level });
    }

    if (format === "video") {
      conditions.push({
        $or: [
          { "modules.lessons.type": "video" },
          { "modules.videoUrl": { $exists: true, $ne: "" } },
        ],
      });
    } else if (format === "text") {
      conditions.push({
        $or: [
          { "modules.lessons.type": "article" },
          { "modules.notes": { $exists: true, $ne: "" } },
        ],
      });
    }

    if (priceFilter === "free") {
      conditions.push({ isFree: true });
    } else if (priceFilter === "paid") {
      conditions.push({ isFree: false });
    }

    if (minRating > 0) {
      conditions.push({ ratingAverage: { $gte: minRating } });
    }

    const query = conditions.length > 1 ? { $and: conditions } : (conditions[0] || { status });

    // Sort order
    let sortObj: Record<string, any> = {};
    switch (sort) {
      case "newest":
        sortObj = { createdAt: -1 };
        break;
      case "highest_rated":
        sortObj = { ratingAverage: -1, ratingCount: -1 };
        break;
      case "price_asc":
        sortObj = { price: 1 };
        break;
      case "price_desc":
        sortObj = { price: -1 };
        break;
      case "popular":
      default:
        sortObj = { enrolledCount: -1, ratingAverage: -1 };
        break;
    }

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(query)
        .populate("instructor", "name avatar headline")
        .select("-modules.lessons.videoUrl -modules.lessons.content") // Protect content in listing
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments(query),
    ]);

    const enrichedCourses = courses.map((c: any) => {
      let hasVideo = false;
      let hasArticle = false;
      if (c.modules && Array.isArray(c.modules)) {
        for (const m of c.modules) {
          if (m.videoUrl) hasVideo = true;
          if (m.notes) hasArticle = true;
          if (m.lessons && Array.isArray(m.lessons)) {
            for (const l of m.lessons) {
              if (l.type === "video" || l.videoUrl) hasVideo = true;
              if (l.type === "article" || l.content) hasArticle = true;
            }
          }
        }
      }
      const detectedFormat = (hasVideo && hasArticle) ? "mixed" : hasVideo ? "video" : hasArticle ? "text" : "mixed";
      return {
        ...c,
        format: detectedFormat,
      };
    });

    return NextResponse.json({
      success: true,
      courses: enrichedCourses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Courses listing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const {
      title,
      subtitle,
      description,
      category,
      subcategory,
      format,
      level,
      price,
      discountPrice,
      isFree,
      thumbnail,
      previewVideoUrl,
      requirements,
      whatYouWillLearn,
      targetAudience,
      accessDurationDays,
      coInstructors,
      seo,
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

    // Enforce Instructor Quotas
    if (session.role === "instructor") {
      const { verifyInstructorQuota } = await import("@/lib/limits");
      const quotaCheck = await verifyInstructorQuota(session.userId, "create_course", {
        price: isFree ? 0 : Number(price || 0),
        category,
      });

      if (!quotaCheck.allowed) {
        return NextResponse.json({ success: false, error: quotaCheck.reason }, { status: 400 });
      }
    }

    // Generate unique slug
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    let slug = baseSlug;
    let count = 1;
    while (await Course.findOne({ slug })) {
      slug = `${baseSlug}-${count++}`;
    }

    const course = await Course.create({
      title: title.trim(),
      slug,
      subtitle: subtitle ? subtitle.trim() : "",
      description: description.trim(),
      category: category.trim(),
      subcategory: subcategory ? subcategory.trim() : "",
      format: format || "Mixed",
      level: level || "All Levels",
      price: isFree ? 0 : Number(price || 0),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      isFree: Boolean(isFree),
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
      previewVideoUrl: previewVideoUrl || "",
      instructor: session.userId,
      coInstructors: Array.isArray(coInstructors) ? coInstructors : [],
      requirements: Array.isArray(requirements) ? requirements : [],
      whatYouWillLearn: Array.isArray(whatYouWillLearn) ? whatYouWillLearn : [],
      targetAudience: Array.isArray(targetAudience) ? targetAudience : [],
      accessDurationDays: Number(accessDurationDays || 0),
      status: "draft",
      seo: {
        title: seo?.title?.trim() || `${title.trim()} | CodeMentors`,
        description: seo?.description?.trim() || description.trim().slice(0, 160),
        keywords: Array.isArray(seo?.keywords) ? seo.keywords : [title.trim(), category.trim()],
        ogImage: seo?.ogImage?.trim() || thumbnail || "",
        canonicalUrl: seo?.canonicalUrl?.trim() || `/courses/${slug}`,
        noIndex: Boolean(seo?.noIndex),
        noFollow: Boolean(seo?.noFollow),
      },
      modules: [],
    });

    const { logAuditEvent } = await import("@/lib/audit");
    await logAuditEvent({
      action: "course_create",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Created new draft course "${title}" (${slug})`,
      req,
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error: any) {
    console.error("Course creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create course" },
      { status: 500 }
    );
  }
}
