import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Category, Course } from "@/models";

export async function GET() {
  try {
    await connectDB();
    const categories = await Category.find().sort({ displayOrder: 1 }).lean();

    // Attach real course count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (cat) => {
        const count = await Course.countDocuments({
          category: { $regex: new RegExp(`^${cat.name}$`, "i") },
          status: "published",
        });
        return {
          ...cat,
          courseCount: count,
        };
      })
    );

    return NextResponse.json({ success: true, categories: categoriesWithCount });
  } catch (error: any) {
    console.error("Categories fetch error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
