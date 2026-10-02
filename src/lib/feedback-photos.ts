import "server-only";
import { hasSupabase } from "@/lib/data";
import { createServiceClient } from "@/lib/supabase/server";
import type { Review } from "@/lib/types";

/**
 * Photos customers attach to private (1 to 3 star) feedback.
 *
 * Stored in a private bucket at `{businessId}/{reviewId}/{n}.jpg`, so no
 * database column is needed: the folder is the link to the review. Pages get
 * short-lived signed URLs, and only after their own access checks.
 */
const BUCKET = "feedback-photos";
export const MAX_PHOTOS = 3;
export const MAX_PHOTO_BYTES = 2_500_000;
const LINK_TTL = 60 * 60; // 1 hour

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const db = createServiceClient();
  const { error } = await db.storage.createBucket(BUCKET, { public: false, fileSizeLimit: MAX_PHOTO_BYTES, allowedMimeTypes: ["image/jpeg"] });
  if (error && !/already exists/i.test(error.message)) throw new Error(`feedback bucket: ${error.message}`);
  bucketReady = true;
}

/** True for JPEG data. The review page converts every photo to JPEG before upload. */
export const isJpeg = (b: Uint8Array) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff;

export async function saveFeedbackPhotos(businessId: string, reviewId: string, photos: Uint8Array[]): Promise<number> {
  if (!photos.length) return 0;
  await ensureBucket();
  const db = createServiceClient();
  let saved = 0;
  for (const [i, bytes] of photos.slice(0, MAX_PHOTOS).entries()) {
    const { error } = await db.storage.from(BUCKET).upload(`${businessId}/${reviewId}/${i + 1}.jpg`, bytes, { contentType: "image/jpeg", upsert: true });
    if (error) console.error("[feedback photo]", error.message);
    else saved++;
  }
  return saved;
}

/** Adds signed photo URLs to low-rating reviews. Callers must have checked access to these reviews. */
export async function withFeedbackPhotos(reviews: Review[]): Promise<Review[]> {
  if (!hasSupabase()) return reviews;
  // Photos are extra; a storage hiccup must never break the page.
  return attachPhotos(reviews).catch((e) => {
    console.error("[feedback photos]", e);
    return reviews;
  });
}

async function attachPhotos(reviews: Review[]): Promise<Review[]> {
  const low = reviews.filter((r) => r.rating <= 3);
  if (!low.length) return reviews;
  const db = createServiceClient().storage.from(BUCKET);
  const wanted = new Set(low.map((r) => r.id));
  const paths = new Map<string, string[]>();

  // One listing per business finds which reviews have a photo folder; only those are opened.
  for (const businessId of new Set(low.map((r) => r.businessId))) {
    const { data: folders } = await db.list(businessId, { limit: 1000 });
    for (const f of folders ?? []) {
      if (!wanted.has(f.name)) continue;
      const { data: files } = await db.list(`${businessId}/${f.name}`, { sortBy: { column: "name", order: "asc" } });
      const list = (files ?? []).filter((x) => x.name.endsWith(".jpg")).map((x) => `${businessId}/${f.name}/${x.name}`);
      if (list.length) paths.set(f.name, list);
    }
  }
  if (!paths.size) return reviews;

  const all = [...paths.values()].flat();
  const { data: signed } = await db.createSignedUrls(all, LINK_TTL);
  const url = new Map((signed ?? []).filter((s) => s.signedUrl).map((s) => [s.path, s.signedUrl]));
  return reviews.map((r) => {
    const p = paths.get(r.id);
    return p ? { ...r, photos: p.map((x) => url.get(x)).filter((x): x is string => !!x) } : r;
  });
}

export async function deleteFeedbackPhotos(businessId: string, reviewId: string) {
  const db = createServiceClient().storage.from(BUCKET);
  const { data } = await db.list(`${businessId}/${reviewId}`);
  if (data?.length) await db.remove(data.map((f) => `${businessId}/${reviewId}/${f.name}`));
}
