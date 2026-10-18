import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IRefund extends Document {
  paymentId: Types.ObjectId;
  enrollmentId: Types.ObjectId;
  userId: Types.ObjectId;
  courseId: Types.ObjectId;
  amount: number;
  reason: string;
  status: "requested" | "approved" | "processing" | "succeeded" | "rejected" | "failed";
  adminNotes?: string;
  providerRefundId?: string;
  requestedAt: Date;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RefundSchema = new Schema<IRefund>(
  {
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", required: true, index: true },
    enrollmentId: { type: Schema.Types.ObjectId, ref: "Enrollment", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true, index: true },
    amount: { type: Number, required: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["requested", "approved", "processing", "succeeded", "rejected", "failed"],
      default: "requested",
      index: true,
    },
    adminNotes: { type: String, default: "" },
    providerRefundId: { type: String },
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
  },
  { timestamps: true }
);

export const Refund: Model<IRefund> =
  mongoose.models.Refund || mongoose.model<IRefund>("Refund", RefundSchema);

export default Refund;
