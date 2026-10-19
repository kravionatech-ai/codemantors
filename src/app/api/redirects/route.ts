import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Redirect } from "@/models/Redirect";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "seo.manage_any")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const redirects = await Redirect.find().sort({ updatedAt: -1 }).lean();
    return NextResponse.json({ success: true, redirects });
  } catch (error: any) {
    console.error("Redirects GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load redirects" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "seo.manage_any")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    const body = await req.json();
    let { sourcePath, destinationPath, statusCode, notes } = body;

    if (!sourcePath || !destinationPath) {
      return NextResponse.json(
        { success: false, error: "Source path and destination path are required" },
        { status: 400 }
      );
    }

    // Normalize paths
    sourcePath = sourcePath.trim();
    destinationPath = destinationPath.trim();
    if (!sourcePath.startsWith("/")) sourcePath = `/${sourcePath}`;
    if (!destinationPath.startsWith("/")) destinationPath = `/${destinationPath}`;

    // Loop Prevention Rule 1: Source cannot equal destination
    if (sourcePath.toLowerCase() === destinationPath.toLowerCase()) {
      return NextResponse.json(
        { success: false, error: "Loop detected: Source path cannot be identical to destination path." },
        { status: 400 }
      );
    }

    // Loop Prevention Rule 2: Destination cannot already redirect back to source
    const inverseRedirect = await Redirect.findOne({
      sourcePath: destinationPath,
      destinationPath: sourcePath,
    });

    if (inverseRedirect) {
      return NextResponse.json(
        {
          success: false,
          error: `Circular redirect loop detected: "${destinationPath}" already redirects back to "${sourcePath}".`,
        },
        { status: 400 }
      );
    }

    const redirect = await Redirect.findOneAndUpdate(
      { sourcePath },
      {
        sourcePath,
        destinationPath,
        statusCode: statusCode === 302 ? 302 : 301,
        notes: notes || "",
        isActive: true,
      },
      { upsert: true, new: true }
    );

    await logAuditEvent({
      action: "redirect_create",
      category: "seo",
      resourceId: redirect._id.toString(),
      actorId: session.userId,
      actorRole: session.role,
      details: `Configured ${redirect.statusCode} redirect: ${sourcePath} -> ${destinationPath}`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Redirect configured: ${sourcePath} -> ${destinationPath}`,
      redirect,
    });
  } catch (error: any) {
    console.error("Redirect POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create redirect" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    const session = await getSessionUser(req);
    if (!session || !hasPermission(session, "seo.manage_any")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Redirect ID required" }, { status: 400 });
    }

    const deleted = await Redirect.findByIdAndDelete(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Redirect not found" }, { status: 404 });
    }

    await logAuditEvent({
      action: "redirect_delete",
      category: "seo",
      resourceId: id,
      actorId: session.userId,
      actorRole: session.role,
      details: `Removed redirect: ${deleted.sourcePath} -> ${deleted.destinationPath}`,
      req,
    });

    return NextResponse.json({ success: true, message: "Redirect removed successfully" });
  } catch (error: any) {
    console.error("Redirect DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete redirect" },
      { status: 500 }
    );
  }
}
