import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PopupAuditAction =
  | "create"
  | "update"
  | "publish"
  | "disable"
  | "schedule"
  | "archive"
  | "delete"
  | "duplicate"
  | "preview"
  | "image_upload"
  | "image_remove"
  | "targeting_change"
  | "cta_change"
  | "permission_denied";

export interface IPopupAuditLog extends Document {
  campaignId: Types.ObjectId | string;
  campaignName?: string;
  campaignSlug?: string;
  actorId?: string;
  actorRole?: string;
  actorEmail?: string;
  action: PopupAuditAction;
  changedFields?: string[];
  beforeValues?: Record<string, any>;
  afterValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  status: "success" | "failure";
  details?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const PopupAuditLogSchema = new Schema<IPopupAuditLog>(
  {
    campaignId: { type: Schema.Types.Mixed, required: true, index: true },
    campaignName: { type: String, default: "" },
    campaignSlug: { type: String, default: "" },
    actorId: { type: String, default: "", index: true },
    actorRole: { type: String, default: "" },
    actorEmail: { type: String, default: "" },
    action: {
      type: String,
      enum: [
        "create",
        "update",
        "publish",
        "disable",
        "schedule",
        "archive",
        "delete",
        "duplicate",
        "preview",
        "image_upload",
        "image_remove",
        "targeting_change",
        "cta_change",
        "permission_denied",
      ],
      required: true,
      index: true,
    },
    changedFields: { type: [String], default: [] },
    beforeValues: { type: Schema.Types.Mixed },
    afterValues: { type: Schema.Types.Mixed },
    ipAddress: { type: String, default: "" },
    userAgent: { type: String, default: "" },
    status: {
      type: String,
      enum: ["success", "failure"],
      default: "success",
      index: true,
    },
    details: { type: String, default: "" },
    metadata: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

PopupAuditLogSchema.index({ campaignId: 1, createdAt: -1 });
PopupAuditLogSchema.index({ action: 1, createdAt: -1 });

export const PopupAuditLog: Model<IPopupAuditLog> =
  mongoose.models.PopupAuditLog ||
  mongoose.model<IPopupAuditLog>("PopupAuditLog", PopupAuditLogSchema);

export default PopupAuditLog;
