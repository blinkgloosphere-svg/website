import { randomInt } from "node:crypto";
import type { AdCampaign, Business, BusinessConfig, Lead, LeadStatus, LeadTool, Metrics, Rating, Review, SocialLink } from "@/lib/types";
import type { AdCampaignRow, BusinessInsert, BusinessRow, Json, LeadRow, ReviewRow } from "@/lib/supabase/database.types";
import { siteUrl } from "@/lib/supabase/env";
import { createServiceClient, type TypedClient } from "@/lib/supabase/server";
import type { BusinessQuery, NewBusiness, NewLead, NewReview, Repo, ReviewQuery } from "./repo";

// ---------------------------------------------------------------------------
// Row -> domain mapping
// ---------------------------------------------------------------------------

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null && !Array.isArray(v);
const str = (v: unknown, fallback = ""): string => (typeof v === "string" ? v : fallback);
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};
const numOrNull = (v: unknown): number | null => (v == null || v === "" ? null : num(v));
const iso = (v: string | null | undefined): string | null => (v ? new Date(v).toISOString() : null);
const clampRating = (v: unknown): Rating => Math.min(5, Math.max(1, Math.round(num(v)))) as Rating;

export function defaultConfig(name: string): BusinessConfig {
  return {
    companyName: name,
    companyLogoUrl: null,
    voucherImageUrl: null,
    mainHeadline: "Share your experience with us",
    mainSubhead: "Let us know how we did. Your feedback matters.",
    positiveHeadline: "Thank you for the high rating!",
    positiveSubhead: "We've opened our review page for you.",
    negativeHeadline: "We're sorry to hear that",
    negativeSubhead: "Please let us know what we can do to improve.",
    feedbackSuccessText: "Thank you. Your feedback has been sent to the team.",
    reviewLink: "",
    socialLinks: [],
  };
}

function parseSocialLinks(raw: unknown): SocialLink[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(isRecord).flatMap((s) => (typeof s.url === "string" && s.url ? [{ type: str(s.type, "website"), url: s.url }] : []));
}

function parseConfig(json: Json, name: string): BusinessConfig {
  const d = defaultConfig(name);
  if (!isRecord(json)) return d;
  return {
    companyName: str(json.companyName, d.companyName),
    companyLogoUrl: strOrNull(json.companyLogoUrl),
    voucherImageUrl: strOrNull(json.voucherImageUrl),
    mainHeadline: str(json.mainHeadline, d.mainHeadline),
    mainSubhead: str(json.mainSubhead, d.mainSubhead),
    positiveHeadline: str(json.positiveHeadline, d.positiveHeadline),
    positiveSubhead: str(json.positiveSubhead, d.positiveSubhead),
    negativeHeadline: str(json.negativeHeadline, d.negativeHeadline),
    negativeSubhead: str(json.negativeSubhead, d.negativeSubhead),
    feedbackSuccessText: str(json.feedbackSuccessText, d.feedbackSuccessText),
    reviewLink: str(json.reviewLink),
    socialLinks: parseSocialLinks(json.socialLinks),
  };
}

function parseDistribution(json: Json): Record<Rating, number> {
  const d = isRecord(json) ? json : {};
  return { 1: num(d["1"]), 2: num(d["2"]), 3: num(d["3"]), 4: num(d["4"]), 5: num(d["5"]) };
}

export function toBusiness(row: BusinessRow): Business {
  return {
    id: row.id,
    name: row.name,
    ownerEmail: row.owner_email,
    isActive: row.is_active,
    linkExpiresAt: iso(row.link_expires_at),
    createdAt: iso(row.created_at),
    sendEmailNotifications: row.send_email_notifications,
    gatingEnabled: row.gating_enabled,
    totalReviews: num(row.total_reviews),
    averageRating: num(row.average_rating),
    ratingDistribution: parseDistribution(row.rating_distribution),
    config: parseConfig(row.config, row.name),
  };
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    businessId: row.business_id,
    rating: clampRating(row.rating),
    initialClick: row.initial_click == null ? null : clampRating(row.initial_click),
    name: row.name,
    email: row.email,
    message: row.message,
    createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
  };
}

const LEAD_STATUSES: readonly LeadStatus[] = ["new", "contacted", "won", "lost"];
const toLeadStatus = (v: string): LeadStatus => (LEAD_STATUSES.includes(v as LeadStatus) ? (v as LeadStatus) : "new");
const toLeadTool = (v: string): LeadTool => (v === "calculator" ? "calculator" : "qr");

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    tool: toLeadTool(row.tool),
    businessName: row.business_name,
    placeId: row.place_id,
    reviewLink: row.review_link,
    currentRating: numOrNull(row.current_rating),
    currentCount: numOrNull(row.current_count),
    targetRating: numOrNull(row.target_rating),
    reviewsNeeded: numOrNull(row.reviews_needed),
    contactName: row.contact_name,
    phone: row.phone,
    email: row.email,
    consentMarketing: row.consent_marketing,
    status: toLeadStatus(row.status),
    notes: row.notes,
    createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
  };
}

function toCampaign(row: AdCampaignRow): AdCampaign {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url,
    linkUrl: row.link_url,
    isActive: row.is_active,
    createdAt: iso(row.created_at) ?? new Date(0).toISOString(),
  };
}

// ---------------------------------------------------------------------------
// Domain -> row mapping
// ---------------------------------------------------------------------------

/** BusinessConfig is plain JSON-serialisable data; this just tells TS so. */
const configToJson = (c: BusinessConfig): Json => JSON.parse(JSON.stringify(c)) as Json;

function businessPatchToRow(patch: Partial<Omit<Business, "id">>): Partial<BusinessInsert> {
  const row: Partial<BusinessInsert> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.ownerEmail !== undefined) row.owner_email = patch.ownerEmail.trim().toLowerCase();
  if (patch.isActive !== undefined) row.is_active = patch.isActive;
  if (patch.linkExpiresAt !== undefined) row.link_expires_at = patch.linkExpiresAt;
  if (patch.sendEmailNotifications !== undefined) row.send_email_notifications = patch.sendEmailNotifications;
  if (patch.gatingEnabled !== undefined) row.gating_enabled = patch.gatingEnabled;
  if (patch.config !== undefined) row.config = configToJson(patch.config);
  // Counters (totalReviews etc.) are owned by database triggers and ignored here.
  return row;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Result<T> = { data: T | null; error: { message: string } | null };

function unwrap<T>(res: Result<T>, context: string): NonNullable<T> {
  if (res.error) throw new Error(`${context}: ${res.error.message}`);
  if (res.data === null || res.data === undefined) throw new Error(`${context}: no data returned`);
  return res.data as NonNullable<T>;
}

function unwrapCount(res: { count: number | null; error: { message: string } | null }, context: string): number {
  if (res.error) throw new Error(`${context}: ${res.error.message}`);
  return res.count ?? 0;
}

const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** Same shape as the legacy Firebase ids so new and old QR links look alike. */
export function newBusinessId(): string {
  let out = "";
  for (let i = 0; i < 28; i++) out += ID_ALPHABET[randomInt(ID_ALPHABET.length)];
  return out;
}

/** PostgREST `or()` filters are comma/paren delimited, so strip those from user input. */
function ilikePattern(search: string): string {
  const cleaned = search.replace(/[,()\\]/g, " ").trim();
  return `%${cleaned}%`;
}

function reviewSearchFilter(search: string): string {
  const p = ilikePattern(search);
  return `name.ilike.${p},message.ilike.${p},email.ilike.${p}`;
}

const BUSINESS_SORT: Record<NonNullable<BusinessQuery["sort"]>, keyof BusinessRow> = {
  name: "name",
  expiry: "link_expires_at",
  reviews: "total_reviews",
  rating: "average_rating",
  created: "created_at",
};

const USERS_PAGE_SIZE = 1000;

/** The admin API has no lookup-by-email, so page through users until found. */
export async function findAuthUserIdByEmail(db: TypedClient, email: string): Promise<string | null> {
  const target = email.trim().toLowerCase();
  for (let page = 1; ; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: USERS_PAGE_SIZE });
    if (error) throw new Error(`listUsers: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === target);
    if (match) return match.id;
    if (data.users.length < USERS_PAGE_SIZE) return null;
  }
}

/** Returns the auth user id for the email, creating a confirmed user when needed. */
export async function ensureAuthUser(db: TypedClient, email: string): Promise<string> {
  const normalised = email.trim().toLowerCase();
  const existing = await findAuthUserIdByEmail(db, normalised);
  if (existing) return existing;
  const { data, error } = await db.auth.admin.createUser({ email: normalised, email_confirm: true });
  if (error) throw new Error(`createUser: ${error.message}`);
  return data.user.id;
}

/**
 * Sends the owner an email to set their password. Brand-new users get an
 * invite; users we created with `email_confirm` (or who already signed up)
 * get a password reset, since invites are rejected for existing accounts.
 */
export async function inviteOwner(email: string): Promise<"invited" | "reset"> {
  const db = createServiceClient();
  const normalised = email.trim().toLowerCase();
  const base = siteUrl();
  const redirectTo = base ? `${base}/auth/callback?next=/dashboard/password` : undefined;

  const existing = await findAuthUserIdByEmail(db, normalised);
  if (!existing) {
    const { error } = await db.auth.admin.inviteUserByEmail(normalised, { redirectTo });
    if (error) throw new Error(`inviteUserByEmail: ${error.message}`);
    return "invited";
  }
  const { error } = await db.auth.resetPasswordForEmail(normalised, { redirectTo });
  if (error) throw new Error(`resetPasswordForEmail: ${error.message}`);
  return "reset";
}

/** Used by auth helpers to resolve the signed-in owner's business. */
export async function getBusinessByOwnerId(ownerId: string): Promise<Business | null> {
  const db = createServiceClient();
  const { data, error } = await db.from("businesses").select("*").eq("owner_id", ownerId).limit(1).maybeSingle();
  if (error) throw new Error(`getBusinessByOwnerId: ${error.message}`);
  return data ? toBusiness(data) : null;
}

// ---------------------------------------------------------------------------
// Repo
// ---------------------------------------------------------------------------

class SupabaseRepo implements Repo {
  readonly mode = "supabase" as const;

  private get db(): TypedClient {
    return createServiceClient();
  }

  // businesses ---------------------------------------------------------------

  async listBusinesses(q: BusinessQuery = {}): Promise<Business[]> {
    let query = this.db.from("businesses").select("*");
    if (q.activeOnly) query = query.eq("is_active", true);
    if (q.search) {
      const p = ilikePattern(q.search);
      query = query.or(`name.ilike.${p},owner_email.ilike.${p}`);
    }
    const ascending = q.dir !== "desc";
    // Businesses without an expiry sort as "far future", matching the preview repo.
    query = query.order(BUSINESS_SORT[q.sort ?? "name"], { ascending, nullsFirst: !ascending });
    const rows = unwrap(await query, "listBusinesses");
    return rows.map(toBusiness);
  }

  async getBusiness(id: string): Promise<Business | null> {
    const { data, error } = await this.db.from("businesses").select("*").eq("id", id).maybeSingle();
    if (error) throw new Error(`getBusiness: ${error.message}`);
    return data ? toBusiness(data) : null;
  }

  async getBusinessByOwnerEmail(email: string): Promise<Business | null> {
    const e = email.trim().toLowerCase();
    if (!e) return null;
    const { data, error } = await this.db.from("businesses").select("*").eq("owner_email", e).maybeSingle();
    if (error) throw new Error(`getBusinessByOwnerEmail: ${error.message}`);
    return data ? toBusiness(data) : null;
  }

  async createBusiness(input: NewBusiness): Promise<Business> {
    const ownerEmail = input.ownerEmail.trim().toLowerCase();
    const ownerId = ownerEmail ? await ensureAuthUser(this.db, ownerEmail) : null;
    const config: BusinessConfig = { ...defaultConfig(input.name), ...input.config };
    const row: BusinessInsert = {
      id: newBusinessId(),
      owner_id: ownerId,
      name: input.name,
      owner_email: ownerEmail,
      link_expires_at: input.linkExpiresAt,
      config: configToJson(config),
    };
    const created = unwrap(await this.db.from("businesses").insert(row).select("*").single(), "createBusiness");
    return toBusiness(created);
  }

  async updateBusiness(id: string, patch: Partial<Omit<Business, "id">>): Promise<Business> {
    const row = businessPatchToRow(patch);
    // Keep owner_id in step when an admin reassigns the owner email.
    if (row.owner_email !== undefined) row.owner_id = row.owner_email ? await ensureAuthUser(this.db, row.owner_email) : null;
    if (Object.keys(row).length === 0) {
      const current = await this.getBusiness(id);
      if (!current) throw new Error(`updateBusiness: business ${id} not found`);
      return current;
    }
    const updated = unwrap(await this.db.from("businesses").update(row).eq("id", id).select("*").single(), "updateBusiness");
    return toBusiness(updated);
  }

  async deleteBusiness(id: string): Promise<void> {
    const { error } = await this.db.from("businesses").delete().eq("id", id);
    if (error) throw new Error(`deleteBusiness: ${error.message}`);
  }

  // reviews ------------------------------------------------------------------

  async listReviews(q: ReviewQuery = {}): Promise<Review[]> {
    let query = this.db.from("reviews").select("*");
    if (q.businessId) query = query.eq("business_id", q.businessId);
    if (q.minRating) query = query.gte("rating", q.minRating);
    if (q.maxRating) query = query.lte("rating", q.maxRating);
    if (q.search) query = query.or(reviewSearchFilter(q.search));
    query = query.order("created_at", { ascending: false });
    const offset = q.offset ?? 0;
    if (q.limit) query = query.range(offset, offset + q.limit - 1);
    else if (offset) query = query.range(offset, offset + 9999);
    const rows = unwrap(await query, "listReviews");
    return rows.map(toReview);
  }

  async countReviews(q: ReviewQuery = {}): Promise<number> {
    let query = this.db.from("reviews").select("id", { count: "exact", head: true });
    if (q.businessId) query = query.eq("business_id", q.businessId);
    if (q.minRating) query = query.gte("rating", q.minRating);
    if (q.maxRating) query = query.lte("rating", q.maxRating);
    if (q.search) query = query.or(reviewSearchFilter(q.search));
    return unwrapCount(await query, "countReviews");
  }

  /** Counters on the business row are maintained by triggers. */
  async createReview(input: NewReview): Promise<Review> {
    const created = unwrap(
      await this.db
        .from("reviews")
        .insert({
          business_id: input.businessId,
          rating: input.rating,
          initial_click: input.initialClick,
          name: input.name,
          email: input.email,
          message: input.message,
        })
        .select("*")
        .single(),
      "createReview",
    );
    return toReview(created);
  }

  async deleteReview(id: string): Promise<void> {
    const { error } = await this.db.from("reviews").delete().eq("id", id);
    if (error) throw new Error(`deleteReview: ${error.message}`);
  }

  // leads --------------------------------------------------------------------

  async listLeads(): Promise<Lead[]> {
    const rows = unwrap(await this.db.from("leads").select("*").order("created_at", { ascending: false }), "listLeads");
    return rows.map(toLead);
  }

  async createLead(input: NewLead): Promise<Lead> {
    const created = unwrap(
      await this.db
        .from("leads")
        .insert({
          tool: input.tool,
          business_name: input.businessName,
          place_id: input.placeId,
          review_link: input.reviewLink,
          current_rating: input.currentRating,
          current_count: input.currentCount,
          target_rating: input.targetRating,
          reviews_needed: input.reviewsNeeded,
          contact_name: input.contactName,
          phone: input.phone,
          email: input.email.trim().toLowerCase(),
          consent_marketing: input.consentMarketing,
        })
        .select("*")
        .single(),
      "createLead",
    );
    return toLead(created);
  }

  async updateLead(id: string, patch: { status?: LeadStatus; notes?: string }): Promise<Lead> {
    const updated = unwrap(
      await this.db.from("leads").update({ status: patch.status, notes: patch.notes }).eq("id", id).select("*").single(),
      "updateLead",
    );
    return toLead(updated);
  }

  // campaigns ----------------------------------------------------------------

  async listCampaigns(activeOnly = false): Promise<AdCampaign[]> {
    let query = this.db.from("ad_campaigns").select("*").order("created_at", { ascending: false });
    if (activeOnly) query = query.eq("is_active", true);
    const rows = unwrap(await query, "listCampaigns");
    return rows.map(toCampaign);
  }

  async saveCampaign(c: Omit<AdCampaign, "id" | "createdAt"> & { id?: string }): Promise<AdCampaign> {
    const values = { title: c.title, body: c.body, image_url: c.imageUrl, link_url: c.linkUrl, is_active: c.isActive };
    const res = c.id
      ? await this.db.from("ad_campaigns").update(values).eq("id", c.id).select("*").single()
      : await this.db.from("ad_campaigns").insert(values).select("*").single();
    return toCampaign(unwrap(res, "saveCampaign"));
  }

  async deleteCampaign(id: string): Promise<void> {
    const { error } = await this.db.from("ad_campaigns").delete().eq("id", id);
    if (error) throw new Error(`deleteCampaign: ${error.message}`);
  }

  // metrics ------------------------------------------------------------------

  async getMetrics(): Promise<Metrics> {
    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const db = this.db;
    const [total, active, reviews, negative, recent, distributions] = await Promise.all([
      db.from("businesses").select("id", { count: "exact", head: true }),
      db.from("businesses").select("id", { count: "exact", head: true }).eq("is_active", true),
      db.from("reviews").select("id", { count: "exact", head: true }),
      db.from("reviews").select("id", { count: "exact", head: true }).lte("rating", 3),
      db.from("reviews").select("id", { count: "exact", head: true }).gte("created_at", since),
      db.from("businesses").select("rating_distribution"),
    ]);

    // The per-business distributions are exact integer counts, so summing them
    // gives the true average without pulling every review row.
    let sum = 0;
    let count = 0;
    for (const row of unwrap(distributions, "getMetrics")) {
      const d = parseDistribution(row.rating_distribution);
      for (const r of [1, 2, 3, 4, 5] as const) {
        sum += r * d[r];
        count += d[r];
      }
    }

    return {
      totalBusinesses: unwrapCount(total, "getMetrics"),
      activeBusinesses: unwrapCount(active, "getMetrics"),
      totalReviews: unwrapCount(reviews, "getMetrics"),
      averageRating: count ? sum / count : 0,
      negativeReviews: unwrapCount(negative, "getMetrics"),
      reviewsLast30Days: unwrapCount(recent, "getMetrics"),
    };
  }
}

let instance: SupabaseRepo | null = null;
export function supabaseRepo(): Repo {
  if (!instance) instance = new SupabaseRepo();
  return instance;
}
