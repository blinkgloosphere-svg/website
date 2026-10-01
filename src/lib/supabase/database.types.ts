/**
 * Hand-written schema types matching supabase/migrations/0001_init.sql.
 * Replace with `supabase gen types typescript` output once the project exists;
 * the shape below follows the generated layout so that swap is a no-op.
 *
 * Note: PostgREST serialises `numeric` columns as strings, hence `number | string`.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type BusinessRow = {
  id: string;
  owner_id: string | null;
  name: string;
  owner_email: string;
  is_active: boolean;
  link_expires_at: string | null;
  created_at: string;
  send_email_notifications: boolean;
  gating_enabled: boolean;
  total_reviews: number;
  average_rating: number | string;
  rating_distribution: Json;
  config: Json;
};

export type BusinessInsert = {
  id: string;
  owner_id?: string | null;
  name: string;
  owner_email: string;
  is_active?: boolean;
  link_expires_at?: string | null;
  created_at?: string;
  send_email_notifications?: boolean;
  gating_enabled?: boolean;
  total_reviews?: number;
  average_rating?: number;
  rating_distribution?: Json;
  config?: Json;
};

export type ReviewRow = {
  id: string;
  business_id: string;
  rating: number;
  initial_click: number | null;
  name: string;
  email: string;
  message: string;
  created_at: string;
};

export type ReviewInsert = {
  id?: string;
  business_id: string;
  rating: number;
  initial_click?: number | null;
  name?: string;
  email?: string;
  message?: string;
  created_at?: string;
};

export type LeadRow = {
  id: string;
  tool: string;
  business_name: string;
  place_id: string | null;
  review_link: string | null;
  current_rating: number | string | null;
  current_count: number | null;
  target_rating: number | string | null;
  reviews_needed: number | null;
  contact_name: string;
  phone: string;
  email: string;
  consent_marketing: boolean;
  status: string;
  notes: string;
  created_at: string;
};

export type LeadInsert = {
  id?: string;
  tool: string;
  business_name: string;
  place_id?: string | null;
  review_link?: string | null;
  current_rating?: number | null;
  current_count?: number | null;
  target_rating?: number | null;
  reviews_needed?: number | null;
  contact_name?: string;
  phone?: string;
  email?: string;
  consent_marketing?: boolean;
  status?: string;
  notes?: string;
  created_at?: string;
};

export type AdCampaignRow = {
  id: string;
  title: string;
  body: string;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  created_at: string;
};

export type AdCampaignInsert = {
  id?: string;
  title: string;
  body: string;
  image_url?: string | null;
  link_url?: string | null;
  is_active?: boolean;
  created_at?: string;
};

export type AdminUserRow = {
  user_id: string;
  email: string;
  created_at: string;
};

export type BusinessPublicRow = Pick<BusinessRow, "id" | "name" | "is_active" | "link_expires_at" | "gating_enabled" | "config">;

export type Database = {
  public: {
    Tables: {
      businesses: {
        Row: BusinessRow;
        Insert: BusinessInsert;
        Update: Partial<BusinessInsert>;
        Relationships: [];
      };
      reviews: {
        Row: ReviewRow;
        Insert: ReviewInsert;
        Update: Partial<ReviewInsert>;
        Relationships: [];
      };
      leads: {
        Row: LeadRow;
        Insert: LeadInsert;
        Update: Partial<LeadInsert>;
        Relationships: [];
      };
      ad_campaigns: {
        Row: AdCampaignRow;
        Insert: AdCampaignInsert;
        Update: Partial<AdCampaignInsert>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUserRow;
        Insert: { user_id: string; email?: string; created_at?: string };
        Update: { user_id?: string; email?: string; created_at?: string };
        Relationships: [];
      };
    };
    Views: {
      business_public: {
        Row: BusinessPublicRow;
        Relationships: [];
      };
    };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      recompute_business_stats: { Args: Record<PropertyKey, never>; Returns: number };
      recompute_business_stats_for: { Args: { p_business_id: string }; Returns: undefined };
      submit_review: {
        Args: {
          business_id: string;
          rating: number;
          initial_click?: number | null;
          name?: string;
          email?: string;
          message?: string;
        };
        Returns: string;
      };
      submit_lead: {
        Args: {
          tool: string;
          business_name: string;
          contact_name: string;
          phone: string;
          email: string;
          place_id?: string | null;
          review_link?: string | null;
          current_rating?: number | null;
          current_count?: number | null;
          target_rating?: number | null;
          reviews_needed?: number | null;
          consent_marketing?: boolean;
        };
        Returns: string;
      };
      can_write_logo_folder: { Args: { folder: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
