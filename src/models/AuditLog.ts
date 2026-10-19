import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type AuditLogCategory =
  | "auth"
  | "course"
  | "payment"
  | "refund"
  | "admin"
  | "security"
  | "user"
  | "permission"
  | "cms"
  | "seo"
  | "settings";

export interface IAuditLog extends Document {
  action: string;
  category: AuditLogCategory;
  userId?: Types.ObjectId;
  actorId?: string;
  actorRole?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
  resourceId?: string;
  resourceType?: string;
  details?: any;
  metadata?: Record<string, any>;
  status: "success" | "failure" | "warning";
  createdAt: Date;
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, required: true, index: true },
    category: {
      type: String,
      enum: ["auth", "course", "payment", "refund", "admin", "security", "user", "permission", "cms", "seo", "settings"],
      default: "admin",
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    actorId: { type: String, default: "" },
    actorRole: { type: String, default: "" },
    userEmail: { type: String, default: "" },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    resourceId: { type: String, index: true },
    resourceType: { type: String, default: "" },
    details: { type: Schema.Types.Mixed },
    metadata: { type: Schema.Types.Mixed, default: {} },
    status: {
      type: String,
      enum: ["success", "failure", "warning"],
      default: "success",
    },
  },
  { timestamps: true }
);

export const AuditLog: Model<IAuditLog> =
  mongoose.models.AuditLog || mongoose.model<IAuditLog>("AuditLog", AuditLogSchema);

export default AuditLog;
