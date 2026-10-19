import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPaymentSettings extends Document {
  key: string; // "razorpay_config"
  isEnabled: boolean;
  mode: "test" | "live";
  testKeyId: string;
  testKeySecret: string;
  liveKeyId: string;
  liveKeySecret: string;
  testWebhookSecret: string;
  liveWebhookSecret: string;
  defaultCurrency: string;
  supportedCurrencies: string[];
  merchantName: string;
  merchantDescription: string;
  themeColor: string;
  webhookUrl: string;
  refundWindowDays: number;
  autoRefundApproval: boolean;
  lastVerifiedAt?: Date;
  lastWebhookAt?: Date;
  connectionStatus: "connected" | "unverified" | "error";
  lastError?: string;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSettingsSchema = new Schema<IPaymentSettings>(
  {
    key: { type: String, required: true, unique: true, default: "razorpay_config", index: true },
    isEnabled: { type: Boolean, default: true },
    mode: { type: String, enum: ["test", "live"], default: "test" },
    testKeyId: { type: String, default: "" },
    testKeySecret: { type: String, default: "" },
    liveKeyId: { type: String, default: "" },
    liveKeySecret: { type: String, default: "" },
    testWebhookSecret: { type: String, default: "" },
    liveWebhookSecret: { type: String, default: "" },
    defaultCurrency: { type: String, default: "INR" },
    supportedCurrencies: { type: [String], default: ["INR", "USD"] },
    merchantName: { type: String, default: "CodeMentors" },
    merchantDescription: { type: String, default: "Production-Grade Developer Education & Masterclasses" },
    themeColor: { type: String, default: "#172554" },
    webhookUrl: { type: String, default: "/api/payments/razorpay/webhook" },
    refundWindowDays: { type: Number, default: 7 },
    autoRefundApproval: { type: Boolean, default: false },
    lastVerifiedAt: { type: Date },
    lastWebhookAt: { type: Date },
    connectionStatus: {
      type: String,
      enum: ["connected", "unverified", "error"],
      default: "unverified",
    },
    lastError: { type: String, default: "" },
    updatedBy: { type: String, default: "" },
  },
  { timestamps: true }
);

export const PaymentSettings: Model<IPaymentSettings> =
  mongoose.models.PaymentSettings ||
  mongoose.model<IPaymentSettings>("PaymentSettings", PaymentSettingsSchema);

export default PaymentSettings;
