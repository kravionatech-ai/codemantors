import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/svg+xml",
  "image/gif",
];

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".svg", ".gif"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No image file provided" },
        { status: 400 }
      );
    }

    // 1. Validate File Size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `File size exceeds the 5MB maximum limit (received ${(
            file.size /
            (1024 * 1024)
          ).toFixed(2)} MB)`,
        },
        { status: 400 }
      );
    }

    // 2. Validate MIME Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file format "${file.type}". Allowed formats: JPEG, PNG, WebP, SVG, GIF.`,
        },
        { status: 400 }
      );
    }

    // 3. Validate Extension
    const rawFilename = file.name || "popup-image.jpg";
    const ext = path.extname(rawFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid file extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 4. Sanitize Filename & Target Destination
    const baseCleanName = path
      .basename(rawFilename, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 40);
    const uniqueFilename = `${Date.now()}-${baseCleanName || "popup"}${ext}`;

    const uploadsDir = path.join(process.cwd(), "public", "uploads", "popups");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, uniqueFilename);
    const buffer = Buffer.from(await file.arrayBuffer());

    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/popups/${uniqueFilename}`;
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      assetId,
      filename: uniqueFilename,
      originalName: rawFilename,
      size: file.size,
      mimeType: file.type,
      provider: "local",
      dimensions: { width: 1200, height: 630 },
    });
  } catch (error: any) {
    console.error("Popup image upload error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to upload image file" },
      { status: 500 }
    );
  }
}
