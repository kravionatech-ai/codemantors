import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { PaymentSettings } from "@/models/PaymentSettings";
import { getSessionUser } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { logAuditEvent } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "settings.payments.manage") && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    let settings = await PaymentSettings.findOne({ key: "razorpay_config" });

    if (!settings) {
      settings = await PaymentSettings.create({
        key: "razorpay_config",
        isEnabled: true,
        mode: "test",
        testKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_codementors_demo",
        testKeySecret: process.env.RAZORPAY_KEY_SECRET || "codementors_secret_key_mock_12345",
        testWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "codementors_webhook_secret_mock_12345",
        liveKeyId: "",
        liveKeySecret: "",
        liveWebhookSecret: "",
        defaultCurrency: "INR",
        merchantName: "CodeMentors",
        merchantDescription: "Production-Grade Developer Education & Masterclasses",
        themeColor: "#172554",
        webhookUrl: "/api/payments/razorpay/webhook",
        refundWindowDays: 7,
        connectionStatus: "connected",
        lastVerifiedAt: new Date(),
      });
    }

    // Mask secrets so sensitive keys are NEVER returned in plaintext to the browser
    const mask = (val?: string) => {
      if (!val || val.length <= 4) return "••••••••••••";
      return `••••••••••••${val.slice(-4)}`;
    };

    return NextResponse.json({
      success: true,
      settings: {
        _id: settings._id,
        isEnabled: settings.isEnabled,
        mode: settings.mode,
        testKeyId: settings.testKeyId,
        testKeySecretMasked: mask(settings.testKeySecret),
        hasTestSecret: Boolean(settings.testKeySecret),
        liveKeyId: settings.liveKeyId,
        liveKeySecretMasked: mask(settings.liveKeySecret),
        hasLiveSecret: Boolean(settings.liveKeySecret),
        testWebhookSecretMasked: mask(settings.testWebhookSecret),
        liveWebhookSecretMasked: mask(settings.liveWebhookSecret),
        defaultCurrency: settings.defaultCurrency,
        supportedCurrencies: settings.supportedCurrencies,
        merchantName: settings.merchantName,
        merchantDescription: settings.merchantDescription,
        themeColor: settings.themeColor,
        webhookUrl: settings.webhookUrl,
        refundWindowDays: settings.refundWindowDays,
        autoRefundApproval: settings.autoRefundApproval,
        connectionStatus: settings.connectionStatus,
        lastVerifiedAt: settings.lastVerifiedAt,
        lastWebhookAt: settings.lastWebhookAt,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionUser(req);
    if (!session || (!hasPermission(session, "settings.payments.manage") && session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();

    const {
      isEnabled,
      mode,
      testKeyId,
      testKeySecret,
      liveKeyId,
      liveKeySecret,
      testWebhookSecret,
      liveWebhookSecret,
      defaultCurrency,
      merchantName,
      merchantDescription,
      themeColor,
      refundWindowDays,
      autoRefundApproval,
      confirmLiveMode,
    } = body;

    let settings = await PaymentSettings.findOne({ key: "razorpay_config" });
    if (!settings) {
      settings = new PaymentSettings({ key: "razorpay_config" });
    }

    // Safety check: Switching to live mode requires explicit confirmation and live keys
    if (mode === "live") {
      const activeLiveKey = liveKeyId !== undefined ? liveKeyId.trim() : settings.liveKeyId;
      const activeLiveSecret = liveKeySecret ? liveKeySecret.trim() : settings.liveKeySecret;

      if (!activeLiveKey || !activeLiveSecret) {
        return NextResponse.json(
          {
            success: false,
            error: "Cannot activate Live Mode: Live Key ID and Live Key Secret are required.",
          },
          { status: 400 }
        );
      }

      if (!confirmLiveMode && settings.mode !== "live") {
        return NextResponse.json(
          {
            success: false,
            error: "Explicit confirmation is required before switching payment gateway from Test to Live mode.",
          },
          { status: 400 }
        );
      }
    }

    if (isEnabled !== undefined) settings.isEnabled = Boolean(isEnabled);
    if (mode !== undefined) settings.mode = mode;
    if (testKeyId !== undefined) settings.testKeyId = testKeyId.trim();
    if (testKeySecret && !testKeySecret.includes("••••")) settings.testKeySecret = testKeySecret.trim();
    if (liveKeyId !== undefined) settings.liveKeyId = liveKeyId.trim();
    if (liveKeySecret && !liveKeySecret.includes("••••")) settings.liveKeySecret = liveKeySecret.trim();
    if (testWebhookSecret && !testWebhookSecret.includes("••••")) settings.testWebhookSecret = testWebhookSecret.trim();
    if (liveWebhookSecret && !liveWebhookSecret.includes("••••")) settings.liveWebhookSecret = liveWebhookSecret.trim();
    if (defaultCurrency !== undefined) settings.defaultCurrency = defaultCurrency.trim().toUpperCase();
    if (merchantName !== undefined) settings.merchantName = merchantName.trim();
    if (merchantDescription !== undefined) settings.merchantDescription = merchantDescription.trim();
    if (themeColor !== undefined) settings.themeColor = themeColor.trim();
    if (refundWindowDays !== undefined) settings.refundWindowDays = Number(refundWindowDays);
    if (autoRefundApproval !== undefined) settings.autoRefundApproval = Boolean(autoRefundApproval);

    settings.updatedBy = session.userId;
    await settings.save();

    await logAuditEvent({
      action: "razorpay_settings_update",
      category: "settings",
      resourceId: "razorpay_config",
      actorId: session.userId,
      actorRole: session.role,
      details: {
        isEnabled: settings.isEnabled,
        mode: settings.mode,
        currency: settings.defaultCurrency,
      },
      req,
    });

    return NextResponse.json({
      success: true,
      message: `Razorpay payment gateway configuration saved (${settings.mode.toUpperCase()} mode).`,
      mode: settings.mode,
      isEnabled: settings.isEnabled,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
