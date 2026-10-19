import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type PopupEventType =
  | "impression"
  | "click"
  | "dismissal"
  | "cta_primary"
  | "cta_secondary"
  | "frequency_limit";

export interface IPopupEvent extends Document {
  campaignId: Types.ObjectId;
  eventType: PopupEventType;
  pagePath: string;
  visitorId?: string;
  ctaId?: string;
  deviceType?: "desktop" | "mobile" | "tablet";
  dedupKey?: string;
  referrer?: string;
  createdAt: Date;
}

const PopupEventSchema = new Schema<IPopupEvent>(
  {
    campaignId: {
      type: Schema.Types.ObjectId,
      ref: "PopupCampaign",
      required: true,
      index: true,
    },
    eventType: {
      type: String,
      enum: ["impression", "click", "dismissal", "cta_primary", "cta_secondary", "frequency_limit"],
      required: true,
      index: true,
    },
    pagePath: { type: String, default: "/", trim: true },
    visitorId: { type: String, default: "", index: true },
    ctaId: { type: String, default: "" },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet"],
      default: "desktop",
    },
    dedupKey: { type: String, sparse: true, index: true },
    referrer: { type: String, default: "" },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes for analytics aggregation
PopupEventSchema.index({ campaignId: 1, eventType: 1, createdAt: -1 });
PopupEventSchema.index({ campaignId: 1, createdAt: -1 });

export const PopupEvent: Model<IPopupEvent> =
  mongoose.models.PopupEvent ||
  mongoose.model<IPopupEvent>("PopupEvent", PopupEventSchema);

export default PopupEvent;
