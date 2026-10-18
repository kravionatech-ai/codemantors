import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ISupportResponse {
  senderRole: "student" | "instructor" | "admin";
  senderName: string;
  message: string;
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  userId?: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: "technical" | "billing" | "course_content" | "general";
  status: "open" | "in_progress" | "resolved";
  priority: "low" | "medium" | "high";
  responses: ISupportResponse[];
  createdAt: Date;
  updatedAt: Date;
}

const SupportResponseSchema = new Schema<ISupportResponse>(
  {
    senderRole: { type: String, enum: ["student", "instructor", "admin"], required: true },
    senderName: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    category: {
      type: String,
      enum: ["technical", "billing", "course_content", "general"],
      default: "general",
    },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved"],
      default: "open",
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    responses: [SupportResponseSchema],
  },
  { timestamps: true }
);

export const SupportTicket: Model<ISupportTicket> =
  mongoose.models.SupportTicket ||
  mongoose.model<ISupportTicket>("SupportTicket", SupportTicketSchema);

export default SupportTicket;
