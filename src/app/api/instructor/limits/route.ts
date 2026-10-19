import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getInstructorUsage } from "@/lib/limits";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (session.role !== "instructor" && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json(
        { success: false, error: "Authentication as instructor required" },
        { status: 401 }
      );
    }

    const usage = await getInstructorUsage(session.userId);

    return NextResponse.json({
      success: true,
      usage,
    });
  } catch (error: any) {
    console.error("Instructor usage GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load quota usage" },
      { status: 500 }
    );
  }
}
