import crypto from "crypto";
import Razorpay from "razorpay";
import { connectDB } from "@/lib/db";
import { PaymentSettings } from "@/models/PaymentSettings";

const KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_codementors_demo";
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "codementors_secret_key_mock_12345";

export const isRazorpayConfigured = Boolean(
  process.env.RAZORPAY_KEY_ID &&
  process.env.RAZORPAY_KEY_SECRET &&
  !process.env.RAZORPAY_KEY_ID.includes("demo")
);

let razorpayInstance: Razorpay | null = null;

export function getRazorpayClient(customKeyId?: string, customKeySecret?: string): Razorpay {
  const activeKey = customKeyId || KEY_ID;
  const activeSecret = customKeySecret || KEY_SECRET;

  return new Razorpay({
    key_id: activeKey,
    key_secret: activeSecret,
  });
}

export interface DynamicRazorpayConfig {
  isEnabled: boolean;
  mode: "test" | "live";
  keyId: string;
  keySecret: string;
  webhookSecret: string;
  currency: string;
  merchantName: string;
  merchantDescription: string;
  themeColor: string;
}

export async function getDynamicRazorpayConfig(): Promise<DynamicRazorpayConfig> {
  try {
    await connectDB();
    const settings = await PaymentSettings.findOne({ key: "razorpay_config" }).lean();
    if (settings) {
      const isLive = settings.mode === "live";
      const keyId = isLive ? settings.liveKeyId : settings.testKeyId;
      const keySecret = isLive ? settings.liveKeySecret : settings.testKeySecret;
      const webhookSecret = isLive ? settings.liveWebhookSecret : settings.testWebhookSecret;

      return {
        isEnabled: settings.isEnabled !== false,
        mode: (settings.mode as "test" | "live") || "test",
        keyId: keyId || process.env.RAZORPAY_KEY_ID || KEY_ID,
        keySecret: keySecret || process.env.RAZORPAY_KEY_SECRET || KEY_SECRET,
        webhookSecret: webhookSecret || process.env.RAZORPAY_WEBHOOK_SECRET || "codementors_webhook_secret_mock_12345",
        currency: settings.defaultCurrency || "INR",
        merchantName: settings.merchantName || "CodeMentors",
        merchantDescription: settings.merchantDescription || "Production-Grade Developer Education",
        themeColor: settings.themeColor || "#172554",
      };
    }
  } catch (err) {
    console.warn("Failed to query dynamic payment settings from DB, falling back to process.env:", err);
  }

  return {
    isEnabled: true,
    mode: "test",
    keyId: process.env.RAZORPAY_KEY_ID || KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET || KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "codementors_webhook_secret_mock_12345",
    currency: "INR",
    merchantName: "CodeMentors",
    merchantDescription: "Production-Grade Developer Education",
    themeColor: "#172554",
  };
}

export interface CreateOrderParams {
  amount: number; // in INR
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  keyId: string;
}

export async function createRazorpayOrder(params: CreateOrderParams): Promise<RazorpayOrderResult> {
  const config = await getDynamicRazorpayConfig();

  if (!config.isEnabled) {
    throw new Error("Razorpay gateway is currently disabled by administrator.");
  }

  const amountInPaise = Math.round(params.amount * 100);
  const activeKeyId = config.keyId;
  const activeSecret = config.keySecret;

  const isRealKey = Boolean(
    activeKeyId &&
    activeSecret &&
    !activeKeyId.includes("demo") &&
    !activeKeyId.includes("mock")
  );

  if (isRealKey) {
    try {
      const client = getRazorpayClient(activeKeyId, activeSecret);
      const order = await client.orders.create({
        amount: amountInPaise,
        currency: params.currency || config.currency || "INR",
        receipt: params.receipt,
        notes: params.notes,
      });

      return {
        id: order.id,
        amount: Number(order.amount) / 100,
        currency: order.currency,
        receipt: order.receipt || params.receipt,
        status: order.status,
        keyId: activeKeyId,
      };
    } catch (error) {
      console.warn("Razorpay API call failed, falling back to secure simulated test order:", error);
    }
  }

  // Test mode fallback order
  const mockOrderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return {
    id: mockOrderId,
    amount: params.amount,
    currency: params.currency || config.currency || "INR",
    receipt: params.receipt,
    status: "created",
    keyId: activeKeyId,
  };
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secretOverride?: string
): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  const activeSecret = secretOverride || KEY_SECRET;

  try {
    const text = `${orderId}|${paymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", activeSecret)
      .update(text)
      .digest("hex");

    const genBuf = Buffer.from(generatedSignature, "utf8");
    const sigBuf = Buffer.from(signature, "utf8");

    if (genBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(genBuf, sigBuf);
  } catch (err) {
    console.error("Signature verification error:", err);
    return false;
  }
}

export function generateRazorpaySignature(
  orderId: string,
  paymentId: string,
  secretOverride?: string
): string {
  const activeSecret = secretOverride || KEY_SECRET;
  return crypto
    .createHmac("sha256", activeSecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
}

export function verifyRazorpayWebhookSignature(
  rawBody: string,
  signature: string,
  secretOverride?: string
): boolean {
  const webhookSecret =
    secretOverride ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    "codementors_webhook_secret_mock_12345";

  if (!rawBody || !signature) return false;

  try {
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const expBuf = Buffer.from(expectedSignature, "utf8");
    const sigBuf = Buffer.from(signature, "utf8");

    if (expBuf.length !== sigBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(expBuf, sigBuf);
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}

export function generateRazorpayWebhookSignature(
  rawBody: string,
  secretOverride?: string
): string {
  const webhookSecret =
    secretOverride ||
    process.env.RAZORPAY_WEBHOOK_SECRET ||
    "codementors_webhook_secret_mock_12345";

  return crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");
}
