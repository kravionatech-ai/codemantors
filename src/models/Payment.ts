import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPayment extends Document {
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  orderId: string; // Razorpay order_id
  paymentId?: string; // Razorpay payment_id
  signature?: string; // Razorpay signature
  amount: number; // in INR
  originalPrice: number;
  discountAmount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded";
  couponCode?: string;
  provider: "razorpay" | "manual" | "free";
  receipt: string;
  paymentMethod?: string;
  errorDescription?: string;
  refundId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    paymentId: { type: String, sparse: true, index: true },
    signature: { type: String },
    amount: { type: Number, required: true },
    originalPrice: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    couponCode: { type: String },
    provider: { type: String, default: "razorpay" },
    receipt: { type: String, required: true },
    paymentMethod: { type: String },
    errorDescription: { type: String },
    refundId: { type: Schema.Types.ObjectId, ref: "Refund" },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Payment: Model<IPayment> =
  mongoose.models.Payment || mongoose.model<IPayment>("Payment", PaymentSchema);

export default Payment;
