import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IUserSession extends Document {
  userId: Types.ObjectId;
  sessionId: string;
  tokenHash: string;
  userAgent: string;
  ipAddress: string;
  deviceType: "desktop" | "mobile" | "tablet";
  browser?: string;
  os?: string;
  location?: string;
  isRevoked: boolean;
  revokedAt?: Date;
  revokedReason?: string;
  lastActiveAt: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSessionSchema = new Schema<IUserSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    sessionId: { type: String, required: true, unique: true, index: true },
    tokenHash: { type: String, required: true, index: true },
    userAgent: { type: String, default: "" },
    ipAddress: { type: String, default: "127.0.0.1" },
    deviceType: {
      type: String,
      enum: ["desktop", "mobile", "tablet"],
      default: "desktop",
    },
    browser: { type: String, default: "Chrome" },
    os: { type: String, default: "Windows" },
    location: { type: String, default: "Local Network" },
    isRevoked: { type: Boolean, default: false, index: true },
    revokedAt: { type: Date },
    revokedReason: { type: String, default: "" },
    lastActiveAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

UserSessionSchema.index({ userId: 1, isRevoked: 1 });

export const UserSession: Model<IUserSession> =
  mongoose.models.UserSession || mongoose.model<IUserSession>("UserSession", UserSessionSchema);

export default UserSession;
