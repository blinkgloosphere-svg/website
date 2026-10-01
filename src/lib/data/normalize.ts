import mediaMap from "@/content/media-map.json";
import type { Business, BusinessConfig, Rating, Review, SocialLink } from "@/lib/types";

/** Shape of the Firestore export produced by the browser export script. */
export type ExportDoc = { id: string; data: Record<string, unknown> };
export type ExportFile = {
  exportedAt: string;
  collections: { businesses?: ExportDoc[]; reviews?: ExportDoc[]; adCampaigns?: ExportDoc[] };
};

type Encoded = { __type: "timestamp"; value: string } | string | number | null | undefined;

function toIso(v: Encoded): string | null {
  if (v == null) return null;
  if (typeof v === "object" && v.__type === "timestamp") return v.value;
  if (typeof v === "number") return new Date(v).toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  return null;
}

const LOCAL_MEDIA = mediaMap as Record<string, string>;

/**
 * Old logos lived on gloosphere.com. We rescued them into /public/logos, so any
 * address we have a local copy for is swapped to the local file. Unknown
 * addresses are kept as they are. Placeholders are dropped.
 */
export function localizeImage(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null;
  if (url.includes("placehold.co") || url.includes("example.com")) return null;
  // Gloosphere's old default logo (a smiley) was used when a client had none.
  if (/gloosphere-business-reply-logo/i.test(url)) return null;
  const local = LOCAL_MEDIA[url] ?? LOCAL_MEDIA[url.replace(/^http:/, "https:")];
  if (local) return local;
  try {
    const decoded = decodeURIComponent(url);
    if (LOCAL_MEDIA[decoded]) return LOCAL_MEDIA[decoded];
  } catch {
    /* ignore */
  }
  return url;
}

function socialLinks(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((s) => (s && typeof s === "object" ? (s as Record<string, unknown>) : null))
    .filter((s): s is Record<string, unknown> => !!s && typeof s.url === "string" && !!s.url)
    .filter((s) => !String(s.url).includes("yourpage"))
    .map((s) => ({ type: String(s.type ?? "website"), url: String(s.url) }));
}

function distribution(raw: unknown): Record<Rating, number> {
  const d = (raw && typeof raw === "object" ? raw : {}) as Record<string, number>;
  return { 1: d["1"] ?? 0, 2: d["2"] ?? 0, 3: d["3"] ?? 0, 4: d["4"] ?? 0, 5: d["5"] ?? 0 };
}

export function normalizeBusiness(doc: ExportDoc): Business {
  const d = doc.data;
  const c = (d.config ?? {}) as Record<string, unknown>;
  const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
  const config: BusinessConfig = {
    companyName: str(c.companyName, str(d.name)),
    companyLogoUrl: localizeImage(c.companyLogoUrl),
    voucherImageUrl: localizeImage(c.voucherImageUrl),
    mainHeadline: str(c.mainHeadline, "Share your experience with us"),
    mainSubhead: str(c.mainSubhead, "Let us know how we did. Your feedback matters."),
    positiveHeadline: str(c.positiveHeadline, "Thank you for the high rating!"),
    positiveSubhead: str(c.positiveSubhead, "We've opened our review page for you."),
    negativeHeadline: str(c.negativeHeadline, "We're sorry to hear that"),
    negativeSubhead: str(c.negativeSubhead, "Please let us know what we can do to improve."),
    feedbackSuccessText: str(c.feedbackSuccessText, "Thank you. Your feedback has been sent to the team."),
    reviewLink: str(c.reviewLink),
    socialLinks: socialLinks(c.socialLinks),
  };
  return {
    id: doc.id,
    name: str(d.name, config.companyName),
    ownerEmail: str(d.ownerEmail).trim().toLowerCase(),
    isActive: d.isActive !== false,
    linkExpiresAt: toIso(d.linkExpiresAt as Encoded),
    createdAt: toIso(d.createdAt as Encoded),
    sendEmailNotifications: d.sendEmailNotifications === true,
    gatingEnabled: d.gatingEnabled !== false,
    totalReviews: Number(d.totalReviews ?? 0),
    averageRating: Number(d.averageRating ?? 0),
    ratingDistribution: distribution(d.ratingDistribution),
    config,
  };
}

export function normalizeReview(doc: ExportDoc): Review {
  const d = doc.data;
  const rating = Math.min(5, Math.max(1, Number(d.rating ?? 5))) as Rating;
  const ic = d.initialClick == null ? null : (Math.min(5, Math.max(1, Number(d.initialClick))) as Rating);
  return {
    id: doc.id,
    businessId: String(d.businessId ?? ""),
    rating,
    initialClick: ic,
    name: typeof d.name === "string" ? d.name : "",
    email: typeof d.email === "string" ? d.email : "",
    message: typeof d.message === "string" ? d.message : "",
    createdAt: toIso(d.createdAt as Encoded) ?? new Date(0).toISOString(),
  };
}
