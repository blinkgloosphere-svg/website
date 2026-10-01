import fs from "node:fs";
import path from "node:path";
import type { AdCampaign, Business, Lead, Metrics, Review } from "@/lib/types";
import { normalizeBusiness, normalizeReview, type ExportFile } from "./normalize";
import { ReadOnlyError, type BusinessQuery, type Repo, type ReviewQuery } from "./repo";

/**
 * Read-only repository backed by the Firestore export. Used until Supabase is
 * connected so the whole site can be previewed with the real customer data.
 */
class PreviewRepo implements Repo {
  readonly mode = "preview" as const;
  private businesses: Business[] = [];
  private reviews: Review[] = [];
  private loaded = false;

  private load() {
    if (this.loaded) return;
    const file = process.env.DATA_EXPORT_PATH ?? path.join(process.cwd(), "data", "gloosphere-export.json");
    if (!fs.existsSync(file)) {
      this.loaded = true;
      return;
    }
    const raw = JSON.parse(fs.readFileSync(file, "utf8")) as ExportFile;
    this.businesses = (raw.collections.businesses ?? []).map(normalizeBusiness);
    this.reviews = (raw.collections.reviews ?? []).map(normalizeReview).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    this.loaded = true;
  }

  async listBusinesses(q: BusinessQuery = {}) {
    this.load();
    let rows = this.businesses.slice();
    if (q.activeOnly) rows = rows.filter((b) => b.isActive);
    if (q.search) {
      const s = q.search.toLowerCase();
      rows = rows.filter((b) => b.name.toLowerCase().includes(s) || b.ownerEmail.includes(s));
    }
    const dir = q.dir === "desc" ? -1 : 1;
    const key = q.sort ?? "name";
    rows.sort((a, b) => {
      switch (key) {
        case "expiry":
          return dir * ((a.linkExpiresAt ?? "9999").localeCompare(b.linkExpiresAt ?? "9999"));
        case "reviews":
          return dir * (a.totalReviews - b.totalReviews);
        case "rating":
          return dir * (a.averageRating - b.averageRating);
        case "created":
          return dir * ((a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
        default:
          return dir * a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
      }
    });
    return rows;
  }

  async getBusiness(id: string) {
    this.load();
    return this.businesses.find((b) => b.id === id) ?? null;
  }

  async getBusinessByOwnerEmail(email: string) {
    this.load();
    const e = email.trim().toLowerCase();
    return this.businesses.find((b) => b.ownerEmail === e) ?? null;
  }

  async listReviews(q: ReviewQuery = {}) {
    this.load();
    let rows = this.reviews;
    if (q.businessId) rows = rows.filter((r) => r.businessId === q.businessId);
    if (q.minRating) rows = rows.filter((r) => r.rating >= q.minRating!);
    if (q.maxRating) rows = rows.filter((r) => r.rating <= q.maxRating!);
    if (q.search) {
      const s = q.search.toLowerCase();
      rows = rows.filter((r) => r.name.toLowerCase().includes(s) || r.message.toLowerCase().includes(s) || r.email.toLowerCase().includes(s));
    }
    const offset = q.offset ?? 0;
    return rows.slice(offset, q.limit ? offset + q.limit : undefined);
  }

  async countReviews(q: ReviewQuery = {}) {
    return (await this.listReviews({ ...q, limit: undefined, offset: 0 })).length;
  }

  async listLeads(): Promise<Lead[]> {
    return [];
  }

  async listCampaigns(): Promise<AdCampaign[]> {
    return [];
  }

  async getMetrics(): Promise<Metrics> {
    this.load();
    const live = new Set(this.businesses.map((b) => b.id));
    const reviews = this.reviews.filter((r) => live.has(r.businessId));
    const cutoff = Date.now() - 30 * 86_400_000;
    return {
      totalBusinesses: this.businesses.length,
      activeBusinesses: this.businesses.filter((b) => b.isActive).length,
      totalReviews: reviews.length,
      averageRating: reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0,
      negativeReviews: reviews.filter((r) => r.rating <= 3).length,
      reviewsLast30Days: reviews.filter((r) => new Date(r.createdAt).getTime() >= cutoff).length,
    };
  }

  // Writes are not available in preview mode.
  async createBusiness(): Promise<Business> {
    throw new ReadOnlyError();
  }
  async updateBusiness(): Promise<Business> {
    throw new ReadOnlyError();
  }
  async deleteBusiness(): Promise<void> {
    throw new ReadOnlyError();
  }
  async createReview(): Promise<Review> {
    throw new ReadOnlyError();
  }
  async deleteReview(): Promise<void> {
    throw new ReadOnlyError();
  }
  async createLead(): Promise<Lead> {
    throw new ReadOnlyError();
  }
  async updateLead(): Promise<Lead> {
    throw new ReadOnlyError();
  }
  async saveCampaign(): Promise<AdCampaign> {
    throw new ReadOnlyError();
  }
  async deleteCampaign(): Promise<void> {
    throw new ReadOnlyError();
  }
}

let instance: PreviewRepo | null = null;
export function previewRepo(): Repo {
  if (!instance) instance = new PreviewRepo();
  return instance;
}
