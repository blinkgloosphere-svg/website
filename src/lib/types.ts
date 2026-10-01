export type Rating = 1 | 2 | 3 | 4 | 5;

export type SocialLink = {
  type: "facebook" | "instagram" | "tiktok" | "website" | string;
  url: string;
};

export type BusinessConfig = {
  companyName: string;
  companyLogoUrl: string | null;
  voucherImageUrl: string | null;
  mainHeadline: string;
  mainSubhead: string;
  positiveHeadline: string;
  positiveSubhead: string;
  negativeHeadline: string;
  negativeSubhead: string;
  feedbackSuccessText: string;
  reviewLink: string;
  socialLinks: SocialLink[];
};

export type Business = {
  /** Legacy ID. Printed QR codes point at this, so it never changes. */
  id: string;
  name: string;
  ownerEmail: string;
  isActive: boolean;
  /** ISO date or null when there is no expiry. */
  linkExpiresAt: string | null;
  createdAt: string | null;
  sendEmailNotifications: boolean;
  /** When false, every rating goes to the Google review page. */
  gatingEnabled: boolean;
  totalReviews: number;
  averageRating: number;
  ratingDistribution: Record<Rating, number>;
  config: BusinessConfig;
};

export type Review = {
  id: string;
  businessId: string;
  rating: Rating;
  /** The first star the customer tapped before adjusting. */
  initialClick: Rating | null;
  name: string;
  email: string;
  message: string;
  createdAt: string;
};

export type LeadTool = "qr" | "calculator";
export type LeadStatus = "new" | "contacted" | "won" | "lost";

export type Lead = {
  id: string;
  tool: LeadTool;
  businessName: string;
  placeId: string | null;
  reviewLink: string | null;
  currentRating: number | null;
  currentCount: number | null;
  targetRating: number | null;
  reviewsNeeded: number | null;
  contactName: string;
  phone: string;
  email: string;
  consentMarketing: boolean;
  status: LeadStatus;
  notes: string;
  createdAt: string;
};

export type AdCampaign = {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  createdAt: string;
};

export type Metrics = {
  totalBusinesses: number;
  activeBusinesses: number;
  totalReviews: number;
  averageRating: number;
  negativeReviews: number;
  reviewsLast30Days: number;
};

export type BusinessSummary = Pick<
  Business,
  "id" | "name" | "ownerEmail" | "isActive" | "linkExpiresAt" | "totalReviews" | "averageRating"
> & { logoUrl: string | null };

export type SubscriptionState = "active" | "expiring" | "expired" | "inactive";

export function subscriptionState(b: Pick<Business, "isActive" | "linkExpiresAt">, now = new Date()): SubscriptionState {
  if (!b.isActive) return "inactive";
  if (!b.linkExpiresAt) return "active";
  const exp = new Date(b.linkExpiresAt).getTime();
  if (exp < now.getTime()) return "expired";
  const days = (exp - now.getTime()) / 86_400_000;
  return days <= 30 ? "expiring" : "active";
}
