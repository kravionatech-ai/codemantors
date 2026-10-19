import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type CampaignType =
  | "offer"
  | "event"
  | "announcement"
  | "course_launch"
  | "webinar"
  | "general";

export type PublicationStatus =
  | "draft"
  | "scheduled"
  | "published"
  | "paused"
  | "expired"
  | "archived";

export type ApprovalStatus = "pending_approval" | "approved" | "rejected";

export type TargetAudience =
  | "all"
  | "guests"
  | "authenticated"
  | "students"
  | "instructors";

export type DeviceTargeting = "all" | "desktop_only" | "mobile_only";

export type DisplayFrequency =
  | "always"
  | "once_per_session"
  | "once_per_day"
  | "once_every_n_days"
  | "once_per_campaign";

export type DismissalBehavior = "close_button" | "outside_click" | "both";

export type PopupLayout =
  | "modal"
  | "banner_top"
  | "banner_bottom"
  | "slide_in_right";

export type ImagePosition = "top" | "left" | "right" | "background" | "none";

export type CtaStyle =
  | "solid_primary"
  | "gradient_navy_blue"
  | "outline"
  | "pill";

export interface IImageAsset {
  url: string;
  assetId?: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  size?: number;
  provider?: string;
}

export interface IEventDetails {
  isEvent: boolean;
  eventName?: string;
  eventType?: "webinar" | "workshop" | "bootcamp" | "hackathon" | "live_qa" | "other";
  eventDescription?: string;
  startDateTime?: Date;
  endDateTime?: Date;
  registrationUrl?: string;
}

export interface IOfferDetails {
  isOffer: boolean;
  offerTitle?: string;
  offerDescription?: string;
  discountType?: "percentage" | "fixed" | "none";
  discountValue?: number;
  couponCode?: string;
  validUntil?: Date;
  terms?: string;
  featuredCourse?: Types.ObjectId;
  featuredCategory?: string;
  price?: number;
  discountPrice?: number;
}

export interface ICtaLink {
  label: string;
  url: string;
  isExternal: boolean;
  openInNewTab: boolean;
  referenceType?: "none" | "course" | "category" | "event" | "custom";
  referenceId?: string;
}

export interface IAppearanceSettings {
  layout: PopupLayout;
  imagePosition: ImagePosition;
  theme: {
    bgColor: string;
    textColor: string;
    accentColor: string;
    borderRadius: "sm" | "md" | "lg" | "xl" | "2xl";
  };
  ctaStyle: CtaStyle;
  showCloseButton: boolean;
  showBackdrop: boolean;
  animation: "fade" | "zoom" | "slide_up" | "slide_down";
  reducedMotion: boolean;
}

export interface IPopupCampaign extends Document {
  campaignId: string;
  internalName: string;
  slug: string;
  type: CampaignType;

  // Content
  content: {
    title: string;
    subtitle?: string;
    description: string;
    badgeText?: string;
    badgeColor?: string;
  };

  // Image assets
  images: {
    primary: IImageAsset;
    desktop?: IImageAsset;
    mobile?: IImageAsset;
  };

  // Event & Offer details
  eventDetails: IEventDetails;
  offerDetails: IOfferDetails;

  // CTAs
  primaryCTA: ICtaLink;
  secondaryCTA?: ICtaLink;

  // Appearance & Styling
  appearance: IAppearanceSettings;

  // Display & Targeting Controls
  targeting: {
    targetAudience: TargetAudience;
    targetPages: string[];
    targetCourses?: Types.ObjectId[];
    excludedPages: string[];
    deviceTargeting: DeviceTargeting;
  };

  // Frequency & Dismissal
  frequency: {
    frequencyType: DisplayFrequency;
    daysInterval: number;
    displayDelaySeconds: number;
    dismissalBehavior: DismissalBehavior;
    maxImpressionsPerVisitor: number;
    maxImpressionsTotal: number;
  };

  // Scheduling
  schedule: {
    startDate: Date;
    endDate: Date;
    timezone: string;
  };

  // Publication State
  publicationStatus: PublicationStatus;
  isEnabled: boolean; // STRICT DEFAULT FALSE
  priority: number;
  approvalStatus: ApprovalStatus;
  adminNotes?: string;
  assignedAdmin?: Types.ObjectId;

  // SEO & Social
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    socialImage?: string;
    canonicalUrl?: string;
  };

  // Aggregate Counters (synced from events)
  impressions: number;
  clicks: number;
  dismissals: number;

  // Auditing & Lifecycle
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  softDeleted: boolean;
  deletedAt?: Date;
  publishedAt?: Date;
  archivedAt?: Date;
  version: number;

  createdAt: Date;
  updatedAt: Date;

  // Flat aliases for existing code and backward compatibility
  name: string;
  headline: string;
  description: string;
  badgeText?: string;
  badgeColor?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  imageAlt: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  startDate: Date;
  endDate: Date;
  status: "draft" | "published" | "archived";
  targetAudience: TargetAudience;
  targetPages: string[];
  excludedPages: string[];
  displayFrequency: DisplayFrequency;
  displayDelaySeconds: number;
  dismissalBehavior: DismissalBehavior;
  maxImpressionsTotal?: number;
}

const ImageAssetSchema = new Schema<IImageAsset>(
  {
    url: { type: String, default: "" },
    assetId: { type: String, default: "" },
    alt: { type: String, default: "" },
    caption: { type: String, default: "" },
    width: { type: Number },
    height: { type: Number },
    size: { type: Number },
    provider: { type: String, default: "local" },
  },
  { _id: false }
);

const CtaLinkSchema = new Schema<ICtaLink>(
  {
    label: { type: String, default: "Explore Courses" },
    url: { type: String, default: "/courses" },
    isExternal: { type: Boolean, default: false },
    openInNewTab: { type: Boolean, default: false },
    referenceType: {
      type: String,
      enum: ["none", "course", "category", "event", "custom"],
      default: "none",
    },
    referenceId: { type: String, default: "" },
  },
  { _id: false }
);

const PopupCampaignSchema = new Schema<IPopupCampaign>(
  {
    campaignId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    internalName: { type: String, required: true, trim: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["offer", "event", "announcement", "course_launch", "webinar", "general"],
      default: "offer",
      index: true,
    },

    // Content subdocument
    content: {
      title: { type: String, required: true, trim: true },
      subtitle: { type: String, default: "", trim: true },
      description: { type: String, required: true, trim: true },
      badgeText: { type: String, default: "", trim: true },
      badgeColor: { type: String, default: "#2563EB" },
    },

    // Images subdocument
    images: {
      primary: { type: ImageAssetSchema, default: () => ({ url: "", alt: "" }) },
      desktop: { type: ImageAssetSchema },
      mobile: { type: ImageAssetSchema },
    },

    // Event & Offer details
    eventDetails: {
      isEvent: { type: Boolean, default: false },
      eventName: { type: String, default: "" },
      eventType: {
        type: String,
        enum: ["webinar", "workshop", "bootcamp", "hackathon", "live_qa", "other"],
        default: "webinar",
      },
      eventDescription: { type: String, default: "" },
      startDateTime: { type: Date },
      endDateTime: { type: Date },
      registrationUrl: { type: String, default: "" },
    },

    offerDetails: {
      isOffer: { type: Boolean, default: false },
      offerTitle: { type: String, default: "" },
      offerDescription: { type: String, default: "" },
      discountType: {
        type: String,
        enum: ["percentage", "fixed", "none"],
        default: "none",
      },
      discountValue: { type: Number, default: 0 },
      couponCode: { type: String, default: "" },
      validUntil: { type: Date },
      terms: { type: String, default: "" },
      featuredCourse: { type: Schema.Types.ObjectId, ref: "Course" },
      featuredCategory: { type: String, default: "" },
      price: { type: Number, default: 0 },
      discountPrice: { type: Number, default: 0 },
    },

    // CTAs
    primaryCTA: {
      type: CtaLinkSchema,
      default: () => ({
        label: "Explore Courses",
        url: "/courses",
        isExternal: false,
        openInNewTab: false,
      }),
    },
    secondaryCTA: {
      type: CtaLinkSchema,
      default: () => ({
        label: "",
        url: "",
        isExternal: false,
        openInNewTab: false,
      }),
    },

    // Appearance
    appearance: {
      layout: {
        type: String,
        enum: ["modal", "banner_top", "banner_bottom", "slide_in_right"],
        default: "modal",
      },
      imagePosition: {
        type: String,
        enum: ["top", "left", "right", "background", "none"],
        default: "top",
      },
      theme: {
        bgColor: { type: String, default: "#FFFFFF" },
        textColor: { type: String, default: "#0F172A" },
        accentColor: { type: String, default: "#2563EB" },
        borderRadius: {
          type: String,
          enum: ["sm", "md", "lg", "xl", "2xl"],
          default: "xl",
        },
      },
      ctaStyle: {
        type: String,
        enum: ["solid_primary", "gradient_navy_blue", "outline", "pill"],
        default: "solid_primary",
      },
      showCloseButton: { type: Boolean, default: true },
      showBackdrop: { type: Boolean, default: true },
      animation: {
        type: String,
        enum: ["fade", "zoom", "slide_up", "slide_down"],
        default: "zoom",
      },
      reducedMotion: { type: Boolean, default: false },
    },

    // Targeting
    targeting: {
      targetAudience: {
        type: String,
        enum: ["all", "guests", "authenticated", "students", "instructors"],
        default: "all",
      },
      targetPages: { type: [String], default: ["all"] },
      targetCourses: [{ type: Schema.Types.ObjectId, ref: "Course" }],
      excludedPages: {
        type: [String],
        default: [
          "/checkout",
          "/order-confirmation",
          "/learn",
          "/login",
          "/register",
          "/admin",
          "/cart",
          "/course-basket",
        ],
      },
      deviceTargeting: {
        type: String,
        enum: ["all", "desktop_only", "mobile_only"],
        default: "all",
      },
    },

    // Frequency
    frequency: {
      frequencyType: {
        type: String,
        enum: ["always", "once_per_session", "once_per_day", "once_every_n_days", "once_per_campaign"],
        default: "once_per_session",
      },
      daysInterval: { type: Number, default: 1 },
      displayDelaySeconds: { type: Number, default: 3, min: 0, max: 60 },
      dismissalBehavior: {
        type: String,
        enum: ["close_button", "outside_click", "both"],
        default: "both",
      },
      maxImpressionsPerVisitor: { type: Number, default: 0 },
      maxImpressionsTotal: { type: Number, default: 0 },
    },

    // Schedule
    schedule: {
      startDate: { type: Date, required: true, default: Date.now },
      endDate: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      timezone: { type: String, default: "UTC" },
    },

    // Publication Status
    publicationStatus: {
      type: String,
      enum: ["draft", "scheduled", "published", "paused", "expired", "archived"],
      default: "draft",
      index: true,
    },
    isEnabled: { type: Boolean, default: false, index: true }, // STRICT DEFAULT FALSE
    priority: { type: Number, default: 1, index: true },
    approvalStatus: {
      type: String,
      enum: ["pending_approval", "approved", "rejected"],
      default: "approved",
    },
    adminNotes: { type: String, default: "" },
    assignedAdmin: { type: Schema.Types.ObjectId, ref: "User" },

    // SEO
    seo: {
      metaTitle: { type: String, default: "" },
      metaDescription: { type: String, default: "" },
      socialImage: { type: String, default: "" },
      canonicalUrl: { type: String, default: "" },
    },

    // Counters
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
    dismissals: { type: Number, default: 0 },

    // Lifecycle
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    softDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date },
    publishedAt: { type: Date },
    archivedAt: { type: Date },
    version: { type: Number, default: 1 },

    // Flat backward-compatibility fields
    name: { type: String, trim: true },
    headline: { type: String, trim: true },
    description: { type: String, trim: true },
    badgeText: { type: String, default: "" },
    badgeColor: { type: String, default: "#2563EB" },
    imageUrl: { type: String, default: "" },
    mobileImageUrl: { type: String, default: "" },
    imageAlt: { type: String, default: "" },
    ctaText: { type: String, default: "Explore Courses" },
    ctaUrl: { type: String, default: "/courses" },
    secondaryCtaText: { type: String, default: "" },
    secondaryCtaUrl: { type: String, default: "" },
    startDate: { type: Date, default: Date.now },
    endDate: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    targetAudience: {
      type: String,
      enum: ["all", "guests", "authenticated", "students", "instructors"],
      default: "all",
    },
    targetPages: { type: [String], default: ["all"] },
    excludedPages: {
      type: [String],
      default: [
        "/checkout",
        "/order-confirmation",
        "/learn",
        "/login",
        "/register",
        "/admin",
        "/cart",
        "/course-basket",
      ],
    },
    displayFrequency: {
      type: String,
      enum: ["always", "once_per_session", "once_per_day", "once_every_n_days", "once_per_campaign"],
      default: "once_per_session",
    },
    displayDelaySeconds: { type: Number, default: 3 },
    dismissalBehavior: {
      type: String,
      enum: ["close_button", "outside_click", "both"],
      default: "both",
    },
    maxImpressionsTotal: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

// Pre-save synchronization hook: keep structured and flat fields bidirectional and consistent
PopupCampaignSchema.pre("save", function () {
  // Sync top-level -> structured
  if (!this.internalName && this.name) this.internalName = this.name;
  if (!this.name && this.internalName) this.name = this.internalName;

  if (!this.content) {
    this.content = {
      title: this.headline || this.name || "Special Announcement",
      subtitle: "",
      description: this.description || "",
      badgeText: this.badgeText || "",
      badgeColor: this.badgeColor || "#2563EB",
    };
  } else {
    if (!this.content.title && this.headline) this.content.title = this.headline;
    if (!this.headline && this.content.title) this.headline = this.content.title;
    if (!this.content.description && this.description) this.content.description = this.description;
    if (!this.description && this.content.description) this.description = this.content.description;
    if (this.badgeText !== undefined) this.content.badgeText = this.badgeText;
    if (this.badgeColor !== undefined) this.content.badgeColor = this.badgeColor;
  }

  // Sync images
  if (!this.images) {
    this.images = {
      primary: {
        url: this.imageUrl || "",
        alt: this.imageAlt || this.headline || "Campaign Image",
      },
      mobile: {
        url: this.mobileImageUrl || "",
        alt: this.imageAlt || "",
      },
    };
  } else {
    if (!this.images.primary) {
      this.images.primary = {
        url: this.imageUrl || "",
        alt: this.imageAlt || "Campaign Image",
      };
    }
    if (this.imageUrl && !this.images.primary.url) this.images.primary.url = this.imageUrl;
    if (this.images.primary.url && !this.imageUrl) this.imageUrl = this.images.primary.url;
    if (this.imageAlt && !this.images.primary.alt) this.images.primary.alt = this.imageAlt;
    if (this.images.primary.alt && !this.imageAlt) this.imageAlt = this.images.primary.alt;

    if (this.mobileImageUrl && (!this.images.mobile || !this.images.mobile.url)) {
      this.images.mobile = {
        url: this.mobileImageUrl,
        alt: this.imageAlt || "",
      };
    } else if (this.images.mobile?.url && !this.mobileImageUrl) {
      this.mobileImageUrl = this.images.mobile.url;
    }
  }

  // Sync CTAs
  if (!this.primaryCTA) {
    this.primaryCTA = {
      label: this.ctaText || "Explore Courses",
      url: this.ctaUrl || "/courses",
      isExternal: false,
      openInNewTab: false,
    };
  } else {
    if (this.isModified("ctaText") && this.ctaText) {
      this.primaryCTA.label = this.ctaText;
    } else if (this.primaryCTA.label && !this.ctaText) {
      this.ctaText = this.primaryCTA.label;
    }
    if (this.isModified("ctaUrl") && this.ctaUrl) {
      this.primaryCTA.url = this.ctaUrl;
    } else if (this.primaryCTA.url && !this.ctaUrl) {
      this.ctaUrl = this.primaryCTA.url;
    }
  }

  if (this.secondaryCtaText && !this.secondaryCTA?.label) {
    this.secondaryCTA = {
      label: this.secondaryCtaText,
      url: this.secondaryCtaUrl || "",
      isExternal: false,
      openInNewTab: false,
    };
  }

  // Sync Schedule
  if (!this.schedule) {
    this.schedule = {
      startDate: this.startDate || new Date(),
      endDate: this.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      timezone: "UTC",
    };
  } else {
    if (this.startDate && !this.schedule.startDate) this.schedule.startDate = this.startDate;
    if (this.schedule.startDate) this.startDate = this.schedule.startDate;
    if (this.endDate && !this.schedule.endDate) this.schedule.endDate = this.endDate;
    if (this.schedule.endDate) this.endDate = this.schedule.endDate;
  }

  // Sync Status
  if (this.isModified("status") && !this.isModified("publicationStatus")) {
    this.publicationStatus = this.status as any;
  } else if (this.isModified("publicationStatus") && !this.isModified("status")) {
    if (this.publicationStatus === "published") this.status = "published";
    else if (this.publicationStatus === "archived") this.status = "archived";
    else this.status = "draft";
  } else if (!this.publicationStatus) {
    this.publicationStatus = this.status || "draft";
  } else {
    if (this.publicationStatus === "published") this.status = "published";
    else if (this.publicationStatus === "archived") this.status = "archived";
    else this.status = "draft";
  }

  // Sync Targeting & Frequency
  if (!this.targeting) {
    this.targeting = {
      targetAudience: this.targetAudience || "all",
      targetPages: this.targetPages || ["all"],
      excludedPages: this.excludedPages || ["/checkout", "/order-confirmation", "/learn", "/login", "/register", "/admin", "/cart"],
      deviceTargeting: "all",
    };
  } else {
    if (this.isModified("targetAudience") && this.targetAudience) {
      this.targeting.targetAudience = this.targetAudience;
    } else {
      this.targetAudience = this.targeting.targetAudience;
    }
    if (this.isModified("targetPages") && this.targetPages) {
      this.targeting.targetPages = this.targetPages;
    } else {
      this.targetPages = this.targeting.targetPages;
    }
    if (this.isModified("excludedPages") && this.excludedPages) {
      this.targeting.excludedPages = this.excludedPages;
    } else {
      this.excludedPages = this.targeting.excludedPages;
    }
  }

  if (!this.frequency) {
    this.frequency = {
      frequencyType: this.displayFrequency || "once_per_session",
      daysInterval: 1,
      displayDelaySeconds: this.displayDelaySeconds || 3,
      dismissalBehavior: this.dismissalBehavior || "both",
      maxImpressionsPerVisitor: 0,
      maxImpressionsTotal: this.maxImpressionsTotal || 0,
    };
  } else {
    this.displayFrequency = this.frequency.frequencyType;
    this.displayDelaySeconds = this.frequency.displayDelaySeconds;
    this.dismissalBehavior = this.frequency.dismissalBehavior;
  }

  // Auto generate slug if missing
  if (!this.slug) {
    const baseSlug = (this.internalName || this.name || "campaign")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    this.slug = `${baseSlug}-${Math.random().toString(36).substring(2, 7)}`;
  }

  // Auto generate unique campaignId if missing
  if (!this.campaignId) {
    const year = new Date().getFullYear();
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.campaignId = `CMP-${year}-${rand}`;
  }
});

PopupCampaignSchema.index({ isEnabled: 1, publicationStatus: 1, "schedule.startDate": 1, "schedule.endDate": 1, priority: -1 });
PopupCampaignSchema.index({ isEnabled: 1, status: 1, startDate: 1, endDate: 1, priority: -1 });

export const PopupCampaign: Model<IPopupCampaign> =
  mongoose.models.PopupCampaign ||
  mongoose.model<IPopupCampaign>("PopupCampaign", PopupCampaignSchema);

export default PopupCampaign;
