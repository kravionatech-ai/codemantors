import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICategory extends Document {
  name: string;
  slug: string;
  shortDescription?: string;
  description: string;
  detailedDescription?: string;
  thumbnail?: string;
  bannerImage?: string;
  icon?: string;
  parentCategory?: Types.ObjectId | null;
  displayOrder: number;
  status: "active" | "draft" | "archived";
  isFeatured: boolean;
  courseCount: number;
  seo?: {
    title?: string;
    description?: string;
    keywords?: string[];
    ogImage?: string;
    canonicalUrl?: string;
    noIndex?: boolean;
    noFollow?: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    slug: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
    shortDescription: { type: String, default: "" },
    description: { type: String, default: "" },
    detailedDescription: { type: String, default: "" },
    thumbnail: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    icon: { type: String, default: "Code" },
    parentCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    displayOrder: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "active",
      index: true,
    },
    isFeatured: { type: Boolean, default: false, index: true },
    courseCount: { type: Number, default: 0 },
    seo: {
      title: { type: String, default: "" },
      description: { type: String, default: "" },
      keywords: [{ type: String }],
      ogImage: { type: String, default: "" },
      canonicalUrl: { type: String, default: "" },
      noIndex: { type: Boolean, default: false },
      noFollow: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

export const Category: Model<ICategory> =
  mongoose.models.Category || mongoose.model<ICategory>("Category", CategorySchema);

export default Category;
