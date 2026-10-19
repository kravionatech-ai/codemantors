import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IOrderItem {
  courseId: Types.ObjectId;
  title: string;
  thumbnail: string;
  instructorName?: string;
  price: number;
  discountPrice?: number;
  finalPrice: number;
}

export interface IOrder extends Document {
  orderNumber: string;
  userId: Types.ObjectId;
  items: IOrderItem[];
  subtotal: number;
  discountAmount: number;
  couponCode?: string;
  totalAmount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  paymentMethod?: string;
  errorDetails?: string;
  receipt: string;
  paidAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema<IOrderItem>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    title: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    instructorName: { type: String, default: "" },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    finalPrice: { type: Number, required: true },
  },
  { _id: false }
);

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    discountAmount: { type: Number, default: 0 },
    couponCode: { type: String },
    totalAmount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "cancelled", "refunded"],
      default: "pending",
      index: true,
    },
    razorpayOrderId: { type: String, required: true, unique: true, index: true },
    razorpayPaymentId: { type: String, sparse: true, index: true },
    razorpaySignature: { type: String },
    paymentMethod: { type: String },
    errorDetails: { type: String },
    receipt: { type: String, required: true },
    paidAt: { type: Date },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;
