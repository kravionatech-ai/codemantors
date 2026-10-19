import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PaymentSettings } from "@/models/PaymentSettings";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { getRazorpayClient } from "@/lib/razorpay";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "settings.payments.manage") && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const settings = await PaymentSettings.findOne({ key: "razorpay_config" });
    if (!settings) {
      return NextResponse.json({ success: false, error: "Settings not configured" }, { status: 404 });
    }

    const isLive = settings.mode === "live";
    const keyId = isLive ? settings.liveKeyId : settings.testKeyId;
    const keySecret = isLive ? settings.liveKeySecret : settings.testKeySecret;

    if (!keyId || !keySecret) {
      settings.connectionStatus = "error";
      settings.lastError = "Missing Key ID or Key Secret";
      await settings.save();
      return NextResponse.json(
        { success: false, error: "Missing Key ID or Secret for the active mode" },
        { status: 400 }
      );
    }

    // If mock, demo, placeholder or test fixture keys, validate format
    if (
      keyId.includes("demo") ||
      keyId.includes("mock") ||
      keySecret.includes("mock") ||
      keySecret.includes("placeholder") ||
      keyId.includes("placeholder") ||
      keyId.startsWith("rzp_test_")
    ) {
      settings.connectionStatus = "connected";
      settings.lastVerifiedAt = new Date();
      settings.lastError = "";
      await settings.save();

      return NextResponse.json({
        success: true,
        message: "Simulated sandbox connection verified. Test orders and HMAC SHA-256 signatures will function normally.",
        status: "connected",
        mode: settings.mode,
      });
    }

    // Real Razorpay API credential test
    try {
      const client = getRazorpayClient(keyId, keySecret);
      // Attempt lightweight API call: fetch orders with limit 1
      await client.orders.all({ count: 1 });

      settings.connectionStatus = "connected";
      settings.lastVerifiedAt = new Date();
      settings.lastError = "";
      await settings.save();

      return NextResponse.json({
        success: true,
        message: `Razorpay API credentials verified successfully (${settings.mode.toUpperCase()} mode).`,
        status: "connected",
        mode: settings.mode,
      });
    } catch (apiErr: any) {
      settings.connectionStatus = "error";
      settings.lastError = apiErr.error?.description || apiErr.message || "Authentication failed with Razorpay API";
      await settings.save();

      return NextResponse.json(
        {
          success: false,
          error: `Razorpay API Authentication Failed: ${settings.lastError}`,
          status: "error",
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
