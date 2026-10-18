import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { SupportTicket } from "@/models/SupportTicket";
import { getSessionUser } from "@/lib/auth";

const SupportSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(3, "Subject is required"),
  message: z.string().min(10, "Message must be at least 10 characters"),
  category: z.enum(["technical", "billing", "course_content", "general"]).default("general"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    const body = await req.json();

    const validation = SupportSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { success: false, errors: validation.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();
    const { name, email, subject, message, category } = validation.data;

    const ticket = await SupportTicket.create({
      userId: session?.userId,
      name,
      email,
      subject,
      message,
      category,
      status: "open",
      priority: "medium",
    });

    return NextResponse.json({
      success: true,
      message: "Your support request has been submitted. Our team will contact you shortly.",
      ticketId: ticket._id,
    });
  } catch (error: any) {
    console.error("Support ticket error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit support ticket" },
      { status: 500 }
    );
  }
}
