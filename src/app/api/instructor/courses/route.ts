import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";
import { verifyInstructorQuota } from "@/lib/limits";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { searchParams } = req.nextUrl;

    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "all";
    const format = searchParams.get("format") || "all";
    const level = searchParams.get("level") || "all";
    const category = searchParams.get("category") || "all";
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));

    const query: any = { instructor: session.userId };

    if (status && status !== "all") {
      query.status = status;
    }

    if (category && category !== "all") {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (level && level !== "all") {
      query.level = level;
    }

    if (format && format !== "all") {
      query.format = { $regex: new RegExp(`^${format}$`, "i") };
    }

    if (search.trim()) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: term, $options: "i" } },
        { subtitle: { $regex: term, $options: "i" } },
        { description: { $regex: term, $options: "i" } },
        { slug: { $regex: term, $options: "i" } },
      ];
    }

    // Sort options
    let sortObj: any = { createdAt: -1 };
    if (sort === "oldest") sortObj = { createdAt: 1 };
    else if (sort === "enrolled_desc") sortObj = { enrolledCount: -1 };
    else if (sort === "rating_desc") sortObj = { ratingAverage: -1 };
    else if (sort === "title_asc") sortObj = { title: 1 };
    else if (sort === "updated_desc") sortObj = { updatedAt: -1 };

    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      Course.find(query).sort(sortObj).skip(skip).limit(limit).lean(),
      Course.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Instructor courses listing error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load instructor courses" },
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
      seo,
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

    // Verify quota
    if (session.role === "instructor") {
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
      description: sanitizeHtml(description.trim()),
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

    await logAuditEvent({
      action: "course_create",
      category: "course",
      resourceId: course._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Created draft course "${title}" (${slug})`,
      req,
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error: any) {
    console.error("Instructor course creation error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create course" },
      { status: 500 }
    );
  }
}
