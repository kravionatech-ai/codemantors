import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRedirect extends Document {
  sourcePath: string;
  destinationPath: string;
  statusCode: 301 | 302;
  isActive: boolean;
  hitCount: number;
  lastUsedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RedirectSchema = new Schema<IRedirect>(
  {
    sourcePath: { type: String, required: true, unique: true, trim: true, index: true },
    destinationPath: { type: String, required: true, trim: true },
    statusCode: { type: Number, enum: [301, 302], default: 301 },
    isActive: { type: Boolean, default: true, index: true },
    hitCount: { type: Number, default: 0 },
    lastUsedAt: { type: Date },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

export const Redirect: Model<IRedirect> =
  mongoose.models.Redirect || mongoose.model<IRedirect>("Redirect", RedirectSchema);

export default Redirect;
