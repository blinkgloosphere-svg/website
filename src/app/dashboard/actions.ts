"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerBusiness } from "@/lib/auth";
import { configFromForm } from "@/lib/business-form";
import { getRepo, ReadOnlyError } from "@/lib/data";
import type { ActionResult } from "@/app/admin/actions";

/** Owners may change their review page content, but not their subscription or status. */
export async function saveMyPageAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const business = await requireOwnerBusiness();
  if (!business) return { ok: false, error: "No business linked to this login." };
  try {
    const repo = await getRepo();
    await repo.updateBusiness(business.id, {
      config: configFromForm(fd, business.config),
      sendEmailNotifications: fd.get("sendEmailNotifications") === "on",
    });
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    revalidatePath(`/r/${business.id}`);
    return { ok: true, message: "Saved. Your review page is updated." };
  } catch (e) {
    if (e instanceof ReadOnlyError) return { ok: false, error: e.message };
    return { ok: false, error: e instanceof Error ? e.message : "Could not save." };
  }
}

/** Stores an uploaded logo or voucher in the public 'logos' bucket and returns its URL. */
export async function uploadImageAction(kind: "logo" | "voucher", fd: FormData): Promise<ActionResult & { url?: string }> {
  const business = await requireOwnerBusiness();
  if (!business) return { ok: false, error: "No business linked to this login." };
  const file = fd.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: "Choose an image first." };
  if (file.size > 3 * 1024 * 1024) return { ok: false, error: "Image must be under 3 MB." };
  if (!/^image\/(png|jpe?g|webp|svg\+xml)$/.test(file.type)) return { ok: false, error: "Use a PNG, JPG, WEBP or SVG image." };
  try {
    const { createServiceClient } = await import("@/lib/supabase/server");
    const ext = file.type === "image/svg+xml" ? "svg" : file.type.split("/")[1].replace("jpeg", "jpg");
    const path = `${business.id}/${kind}-${Date.now()}.${ext}`;
    const db = createServiceClient();
    const { error } = await db.storage.from("logos").upload(path, Buffer.from(await file.arrayBuffer()), { contentType: file.type, upsert: true });
    if (error) return { ok: false, error: error.message };
    const { data } = db.storage.from("logos").getPublicUrl(path);
    return { ok: true, url: data.publicUrl };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Upload failed." };
  }
}
