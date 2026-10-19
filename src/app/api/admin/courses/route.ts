import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Course } from "@/models/Course";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const status = searchParams.get("status") || "";

    const query: Record<string, any> = {};
    if (status && status !== "all") {
      query.status = status;
    }

    const courses = await Course.find(query)
      .populate("instructor", "name email avatar")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, courses });
  } catch (error: any) {
    console.error("Admin courses list error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch courses" },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const { courseId, status, isFeatured } = await req.json();

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (status && ["draft", "pending_review", "published", "archived"].includes(status)) {
      updates.status = status;
    }
    if (typeof isFeatured === "boolean") {
      updates.isFeatured = isFeatured;
    }

    const course = await Course.findByIdAndUpdate(courseId, { $set: updates }, { returnDocument: "after" })
      .populate("instructor", "name email")
      .lean();

    return NextResponse.json({ success: true, course });
  } catch (error: any) {
    console.error("Admin course update error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to moderate course" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin" && session.role !== "instructor")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { title, subtitle, description, category, level, price, isFree, thumbnail } = body;

    if (!title || !description || !category) {
      return NextResponse.json(
        { success: false, error: "Title, description, and category are required" },
        { status: 400 }
      );
    }

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
      isFree: Boolean(isFree),
      thumbnail: thumbnail || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80",
      instructor: session.userId,
      status: "draft",
      modules: [],
    });

    return NextResponse.json({ success: true, course }, { status: 201 });
  } catch (error: any) {
    console.error("Admin course create error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create course" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");

    if (!courseId) {
      return NextResponse.json({ success: false, error: "Course ID is required" }, { status: 400 });
    }

    await Course.findByIdAndDelete(courseId);
    return NextResponse.json({ success: true, message: "Course deleted successfully" });
  } catch (error: any) {
    console.error("Admin course delete error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete course" },
      { status: 500 }
    );
  }
}

