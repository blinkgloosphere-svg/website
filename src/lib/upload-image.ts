import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

const MAX_BYTES = 5 * 1024 * 1024;

/** Stores a logo or voucher in the public 'logos' bucket under the business and returns its address. */
export async function storeBusinessImage(businessId: string, kind: "logo" | "voucher", fd: FormData): Promise<UploadResult> {
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image first." };
  if (file.size > MAX_BYTES) return { ok: false, error: "Image must be under 5 MB." };
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return { ok: false, error: "Use a PNG, JPG, WEBP or SVG image." };
  try {
    const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${businessId}/${kind}-${Date.now()}.${ext}`;
    const db = createServiceClient();
    const { error } = await db.storage.from("logos").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
    if (error) return { ok: false, error: error.message };
    return { ok: true, url: db.storage.from("logos").getPublicUrl(path).data.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}
