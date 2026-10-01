import type { AdCampaign, Business, BusinessConfig, Lead, LeadStatus, Metrics, Review } from "@/lib/types";

export type ReviewQuery = {
  businessId?: string;
  minRating?: number;
  maxRating?: number;
  search?: string;
  limit?: number;
  offset?: number;
};

export type BusinessQuery = {
  search?: string;
  sort?: "name" | "expiry" | "reviews" | "rating" | "created";
  dir?: "asc" | "desc";
  activeOnly?: boolean;
};

export type NewReview = {
  businessId: string;
  rating: 1 | 2 | 3 | 4 | 5;
  initialClick: 1 | 2 | 3 | 4 | 5 | null;
  name: string;
  email: string;
  message: string;
};

export type NewBusiness = {
  name: string;
  ownerEmail: string;
  linkExpiresAt: string | null;
  config: Partial<BusinessConfig>;
};

export type NewLead = Omit<Lead, "id" | "status" | "notes" | "createdAt">;

export class ReadOnlyError extends Error {
  constructor() {
    super("Preview mode is read-only. Connect Supabase to enable changes.");
    this.name = "ReadOnlyError";
  }
}

export interface Repo {
  readonly mode: "preview" | "supabase";

  listBusinesses(q?: BusinessQuery): Promise<Business[]>;
  getBusiness(id: string): Promise<Business | null>;
  getBusinessByOwnerEmail(email: string): Promise<Business | null>;
  createBusiness(input: NewBusiness): Promise<Business>;
  updateBusiness(id: string, patch: Partial<Omit<Business, "id">>): Promise<Business>;
  deleteBusiness(id: string): Promise<void>;

  listReviews(q?: ReviewQuery): Promise<Review[]>;
  countReviews(q?: ReviewQuery): Promise<number>;
  createReview(input: NewReview): Promise<Review>;
  deleteReview(id: string): Promise<void>;

  listLeads(): Promise<Lead[]>;
  createLead(input: NewLead): Promise<Lead>;
  updateLead(id: string, patch: { status?: LeadStatus; notes?: string }): Promise<Lead>;

  listCampaigns(activeOnly?: boolean): Promise<AdCampaign[]>;
  saveCampaign(c: Omit<AdCampaign, "id" | "createdAt"> & { id?: string }): Promise<AdCampaign>;
  deleteCampaign(id: string): Promise<void>;

  getMetrics(): Promise<Metrics>;
}
