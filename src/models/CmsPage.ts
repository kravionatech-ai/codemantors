import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface IPageSection {
  id: string;
  type: "hero" | "text_block" | "course_grid" | "faq" | "testimonials" | "cta_banner" | "features" | "gallery";
  title?: string;
  subtitle?: string;
  content?: string; // Rich markdown or HTML content
  config?: Record<string, any>; // e.g. layout, category filter, button text, links
  order: number;
  isVisible: boolean;
}

export interface ICmsPage extends Document {
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  sections: IPageSection[];
  featuredImage?: string;
  publishedAt?: Date;
  authorId?: Types.ObjectId;
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

const PageSectionSchema = new Schema<IPageSection>(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["hero", "text_block", "course_grid", "faq", "testimonials", "cta_banner", "features", "gallery"],
      required: true,
    },
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    content: { type: String, default: "" },
    config: { type: Schema.Types.Mixed, default: {} },
    order: { type: Number, default: 0 },
    isVisible: { type: Boolean, default: true },
  },
  { _id: false }
);

const CmsPageSchema = new Schema<ICmsPage>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    sections: [PageSectionSchema],
    featuredImage: { type: String, default: "" },
    publishedAt: { type: Date },
    authorId: { type: Schema.Types.ObjectId, ref: "User" },
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

export const CmsPage: Model<ICmsPage> =
  mongoose.models.CmsPage || mongoose.model<ICmsPage>("CmsPage", CmsPageSchema);

export default CmsPage;
