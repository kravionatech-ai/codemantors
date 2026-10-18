import { NextResponse } from "next/server";
import { runDatabaseSeed } from "@/lib/seed";

export async function POST() {
  try {
    const result = await runDatabaseSeed();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Seed execution error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const result = await runDatabaseSeed();
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Seed execution error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to seed database" },
      { status: 500 }
    );
  }
}
