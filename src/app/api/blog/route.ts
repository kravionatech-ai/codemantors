import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models/BlogPost";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";
import { sanitizeHtml } from "@/lib/sanitize-html";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    const { searchParams } = new URL(req.url);

    const category = searchParams.get("category");
    const tag = searchParams.get("tag");
    const search = searchParams.get("search");
    const includeDrafts = searchParams.get("all") === "true" && session && hasPermission(session, "cms.manage");

    const query: any = includeDrafts ? {} : { status: "published" };

    if (category) query.category = category;
    if (tag) query.tags = tag;
    if (search) {
      query.$text = { $search: search };
    }

    const posts = await BlogPost.find(query)
      .populate("authorId", "name avatar headline")
      .sort({ publishedAt: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, posts });
  } catch (error: any) {
    console.error("Blog GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load blog posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "cms.manage") && session.role !== "instructor" && session.role !== "admin")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to publish blog posts" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { title, slug, excerpt, content, category, tags, coverImage, status, readingTimeMinutes, seo } = body;

    if (!title || !slug || !content) {
      return NextResponse.json(
        { success: false, error: "Title, slug, and content are required" },
        { status: 400 }
      );
    }

    const cleanSlug = slug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");

    const existing = await BlogPost.findOne({ slug: cleanSlug });
    if (existing) {
      return NextResponse.json(
        { success: false, error: `Blog post with slug "${cleanSlug}" already exists.` },
        { status: 400 }
      );
    }

    const post = await BlogPost.create({
      title: title.trim(),
      slug: cleanSlug,
      excerpt: excerpt?.trim() || title.trim(),
      content: sanitizeHtml(content),
      authorId: session.userId,
      category: category || "Engineering",
      tags: tags || [],
      coverImage: coverImage || "",
      readingTimeMinutes: readingTimeMinutes || Math.max(2, Math.ceil(content.split(/\s+/).length / 200)),
      status: status || "draft",
      publishedAt: status === "published" ? new Date() : undefined,
      seo: seo || {
        title,
        description: excerpt,
      },
    });

    await logAuditEvent({
      action: "blog_post_create",
      category: "cms",
      resourceId: post._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Created blog post "${title}" (${cleanSlug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Blog post created successfully!",
      post,
    });
  } catch (error: any) {
    console.error("Blog POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create blog post" },
      { status: 500 }
    );
  }
}
