import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRole extends Document {
  name: string;
  slug: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "" },
    isSystem: { type: Boolean, default: false },
    permissions: [{ type: String }],
  },
  { timestamps: true }
);

export const Role: Model<IRole> =
  mongoose.models.Role || mongoose.model<IRole>("Role", RoleSchema);

export default Role;
