import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Cart, Course, Enrollment, Coupon, User } from "@/models";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({
        success: true,
        items: [],
        subtotal: 0,
        discountAmount: 0,
        finalTotal: 0,
        coupon: null,
      });
    }

    await connectDB();
    let cart = await Cart.findOne({ userId: session.userId }).lean();
    if (!cart) {
      return NextResponse.json({
        success: true,
        items: [],
        subtotal: 0,
        discountAmount: 0,
        finalTotal: 0,
        coupon: null,
      });
    }

    // Get user active enrollments to flag already enrolled courses
    const enrollments = await Enrollment.find({
      userId: session.userId,
      status: { $in: ["active", "completed"] },
    }).select("courseId").lean();
    const enrolledCourseIds = new Set(enrollments.map((e) => e.courseId.toString()));

    const courseIds = (cart.items || []).map((i) => i.courseId);
    const courses = await Course.find({ _id: { $in: courseIds } })
      .populate("instructor", "name avatar")
      .lean();

    const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

    let subtotal = 0;
    const validatedItems: any[] = [];

    for (const item of cart.items || []) {
      const course: any = courseMap.get(item.courseId.toString());
      if (!course) continue;

      const isEnrolled = enrolledCourseIds.has(course._id.toString());
      const effectivePrice = course.isFree ? 0 : (course.discountPrice ?? course.price);

      if (!isEnrolled) {
        subtotal += effectivePrice;
      }

      validatedItems.push({
        courseId: course._id,
        title: course.title,
        slug: course.slug,
        thumbnail: course.thumbnail,
        category: course.category,
        level: course.level,
        instructorName: course.instructor?.name || "CodeMentors Instructor",
        price: course.price,
        discountPrice: course.discountPrice,
        effectivePrice,
        isFree: course.isFree,
        isAlreadyEnrolled: isEnrolled,
      });
    }

    // Validate attached coupon
    let discountAmount = 0;
    let couponDetails = null;

    if (cart.couponCode && subtotal > 0) {
      const coupon = await Coupon.findOne({
        code: cart.couponCode.trim().toUpperCase(),
        isActive: true,
        validUntil: { $gte: new Date() },
      }).lean();

      if (coupon && (!coupon.maxUses || coupon.currentUses < coupon.maxUses)) {
        if (coupon.discountType === "percentage") {
          discountAmount = Math.round((subtotal * coupon.discountValue) / 100);
        } else {
          discountAmount = Math.min(subtotal, coupon.discountValue);
        }
        couponDetails = {
          code: coupon.code,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          discountAmount,
        };
      }
    }

    const finalTotal = Math.max(0, subtotal - discountAmount);

    return NextResponse.json({
      success: true,
      items: validatedItems,
      subtotal,
      discountAmount,
      finalTotal,
      coupon: couponDetails,
    });
  } catch (error: any) {
    console.error("Cart GET error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load cart" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Authentication required to add items to cart" },
        { status: 401 }
      );
    }

    const { courseId } = await req.json();
    if (!courseId) {
      return NextResponse.json(
        { success: false, error: "Course ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json(
        { success: false, error: "Course not found" },
        { status: 404 }
      );
    }

    // Check if user is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      userId: session.userId,
      courseId,
      status: { $in: ["active", "completed"] },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { success: false, error: "You are already enrolled in this course!", isAlreadyEnrolled: true },
        { status: 400 }
      );
    }

    let cart = await Cart.findOne({ userId: session.userId });
    if (!cart) {
      cart = new Cart({
        userId: session.userId,
        items: [{ courseId, addedAt: new Date() }],
      });
    } else {
      const alreadyInCart = cart.items.some(
        (i) => i.courseId.toString() === courseId.toString()
      );
      if (!alreadyInCart) {
        cart.items.push({ courseId, addedAt: new Date() });
      }
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      message: `"${course.title}" added to your cart`,
      cartCount: cart.items.length,
    });
  } catch (error: any) {
    console.error("Cart POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update cart" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const searchParams = req.nextUrl.searchParams;
    const courseId = searchParams.get("courseId");
    const clearAll = searchParams.get("clear") === "true";

    const cart = await Cart.findOne({ userId: session.userId });
    if (!cart) {
      return NextResponse.json({ success: true, cartCount: 0 });
    }

    if (clearAll) {
      cart.items = [];
      cart.couponCode = "";
    } else if (courseId) {
      cart.items = cart.items.filter(
        (i) => i.courseId.toString() !== courseId.toString()
      );
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Cart updated",
      cartCount: cart.items.length,
    });
  } catch (error: any) {
    console.error("Cart DELETE error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
