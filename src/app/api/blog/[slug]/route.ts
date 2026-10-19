import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { BlogPost } from "@/models/BlogPost";
import { Redirect } from "@/models/Redirect";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const { slug } = await params;

    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { _id: slug } : { slug: slug.toLowerCase() };

    const post = await BlogPost.findOne(query).populate("authorId", "name avatar headline bio").lean();
    if (!post) {
      return NextResponse.json({ success: false, error: "Blog post not found" }, { status: 404 });
    }

    // Increment views count non-blockingly
    BlogPost.findByIdAndUpdate(post._id, { $inc: { viewsCount: 1 } }).catch(() => {});

    return NextResponse.json({ success: true, post });
  } catch (error: any) {
    console.error("Blog post GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load blog post" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { _id: slug } : { slug: slug.toLowerCase() };

    const post = await BlogPost.findOne(query);
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    // Must be author or have cms.manage permission
    const isAuthor = post.authorId.toString() === session.userId;
    const canManage = hasPermission(session, "cms.manage");
    if (!isAuthor && !canManage) {
      return NextResponse.json({ success: false, error: "Forbidden: You cannot edit another author's post" }, { status: 403 });
    }

    const body = await req.json();
    const { title, slug: newSlug, excerpt, content, category, tags, coverImage, status, readingTimeMinutes, seo } = body;

    const oldSlug = post.slug;

    if (title) post.title = title.trim();
    if (excerpt) post.excerpt = excerpt.trim();
    if (content) post.content = content;
    if (category) post.category = category;
    if (tags !== undefined) post.tags = tags;
    if (coverImage !== undefined) post.coverImage = coverImage;
    if (readingTimeMinutes) post.readingTimeMinutes = readingTimeMinutes;
    if (seo) post.seo = { ...post.seo, ...seo };

    if (status) {
      if (status === "published" && post.status !== "published") {
        post.publishedAt = new Date();
      }
      post.status = status;
    }

    // Handle slug change & auto-generate 301 redirect
    if (newSlug && newSlug.trim().toLowerCase() !== oldSlug) {
      const cleanSlug = newSlug.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-");
      const conflict = await BlogPost.findOne({ slug: cleanSlug, _id: { $ne: post._id } });
      if (conflict) {
        return NextResponse.json({ success: false, error: `Slug "${cleanSlug}" is already taken.` }, { status: 400 });
      }

      post.slug = cleanSlug;

      try {
        await Redirect.findOneAndUpdate(
          { sourcePath: `/blog/${oldSlug}` },
          {
            sourcePath: `/blog/${oldSlug}`,
            destinationPath: `/blog/${cleanSlug}`,
            statusCode: 301,
            isActive: true,
            notes: "Auto-generated redirect after blog post slug change",
          },
          { upsert: true }
        );
      } catch (redirErr) {
        console.warn("Could not register automatic redirect for blog post:", redirErr);
      }
    }

    await post.save();

    await logAuditEvent({
      action: "blog_post_update",
      category: "cms",
      resourceId: post._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Updated blog post "${post.title}" (${post.slug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: "Post updated successfully",
      post,
    });
  } catch (error: any) {
    console.error("Blog post PUT error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update blog post" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const isObjectId = mongoose.Types.ObjectId.isValid(slug);
    const query = isObjectId ? { _id: slug } : { slug: slug.toLowerCase() };

    const post = await BlogPost.findOne(query);
    if (!post) {
      return NextResponse.json({ success: false, error: "Post not found" }, { status: 404 });
    }

    const isAuthor = post.authorId.toString() === session.userId;
    const canManage = hasPermission(session, "cms.manage");
    if (!isAuthor && !canManage) {
      return NextResponse.json({ success: false, error: "Forbidden: Cannot delete another author's post" }, { status: 403 });
    }

    await BlogPost.findByIdAndDelete(post._id);

    await logAuditEvent({
      action: "blog_post_delete",
      category: "cms",
      resourceId: post._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Deleted blog post "${post.title}" (${post.slug})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Blog post "${post.title}" deleted successfully`,
    });
  } catch (error: any) {
    console.error("Blog post DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete blog post" },
      { status: 500 }
    );
  }
}
