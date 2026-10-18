import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const searchParams = req.nextUrl.searchParams;

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const level = searchParams.get("level") || "";
    const priceFilter = searchParams.get("price") || ""; // "free", "paid", or ""
    const minRating = parseFloat(searchParams.get("rating") || "0");
    const sort = searchParams.get("sort") || "popular"; // "popular", "newest", "highest_rated", "price_asc", "price_desc"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12")));
    const status = searchParams.get("status") || "published";

    // Query builder
    const query: Record<string, any> = { status };

    if (search.trim()) {
      query.$or = [
        { title: { $regex: search.trim(), $options: "i" } },
        { subtitle: { $regex: search.trim(), $options: "i" } },
        { description: { $regex: search.trim(), $options: "i" } },
      ];
    }

    if (category && category !== "all") {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    if (level && level !== "all") {
      query.level = level;
    }

    if (priceFilter === "free") {
      query.isFree = true;
    } else if (priceFilter === "paid") {
      query.isFree = false;
    }

    if (minRating > 0) {
      query.ratingAverage = { $gte: minRating };
    }

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
    if (!session || (session.role !== "instructor" && session.role !== "admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const {
      title,
      subtitle,
      description,
      category,
      level,
      price,
      discountPrice,
      isFree,
      thumbnail,
      previewVideoUrl,
      requirements,
      whatYouWillLearn,
      targetAudience,
    } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, error: "Title, description, and category are required" },
        { status: 400 }
      );
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
      title,
      slug,
      subtitle: subtitle || "",
      description,
      category,
      level: level || "All Levels",
      price: isFree ? 0 : Number(price || 0),
      discountPrice: discountPrice ? Number(discountPrice) : undefined,
      isFree: Boolean(isFree),
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=450&fit=crop",
      previewVideoUrl: previewVideoUrl || "",
      instructor: session.userId,
      requirements: requirements || [],
      whatYouWillLearn: whatYouWillLearn || [],
      targetAudience: targetAudience || [],
      status: "draft",
      modules: [],
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
