"use server";

import { revalidatePath } from "next/cache";
import { requireOwnerBusiness } from "@/lib/auth";
import { configFromForm } from "@/lib/business-form";
import { getRepo, ReadOnlyError } from "@/lib/data";
import type { ActionResult } from "@/app/admin/actions";
import type { UploadResult } from "@/lib/upload-image";

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

/** Stores an uploaded logo or voucher for the signed-in owner's business. */
export async function uploadImageAction(kind: "logo" | "voucher", fd: FormData): Promise<UploadResult> {
  const business = await requireOwnerBusiness();
  if (!business) return { ok: false, error: "No business linked to this login." };
  const { storeBusinessImage } = await import("@/lib/upload-image");
  return storeBusinessImage(business.id, kind, fd);
}
