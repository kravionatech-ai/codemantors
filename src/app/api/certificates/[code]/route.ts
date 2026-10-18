import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Certificate, Course } from "@/models";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await props.params;
    await connectDB();

    const certificate = await Certificate.findOne({
      certificateCode: code.toUpperCase().trim(),
    })
      .populate("userId", "name avatar")
      .populate("courseId", "title slug thumbnail")
      .lean();

    if (!certificate) {
      return NextResponse.json(
        { success: false, error: "Certificate not found or invalid verification code" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      certificate,
    });
  } catch (error: any) {
    console.error("Certificate verification error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify certificate" },
      { status: 500 }
    );
  }
}
