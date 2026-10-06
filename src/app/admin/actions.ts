"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getRepo, ReadOnlyError } from "@/lib/data";
import { addMonths } from "@/lib/format";
import type { LeadStatus } from "@/lib/types";
import { configFromForm } from "@/lib/business-form";
import type { UploadResult } from "@/lib/upload-image";

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

function fail(e: unknown): ActionResult {
  if (e instanceof ReadOnlyError) return { ok: false, error: e.message };
  return { ok: false, error: e instanceof Error ? e.message : "Something went wrong." };
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const bool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
const urlOrEmpty = z.string().trim().url().or(z.literal(""));

export async function createBusinessAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const name = str(fd, "name");
    const ownerEmail = z.string().email().parse(str(fd, "ownerEmail").toLowerCase());
    const months = Number(str(fd, "months") || 12);
    const reviewLink = urlOrEmpty.parse(str(fd, "reviewLink"));
    const repo = await getRepo();
    const b = await repo.createBusiness({
      name,
      ownerEmail,
      linkExpiresAt: addMonths(new Date(), months).toISOString(),
      config: { companyName: name, reviewLink },
    });
    if (bool(fd, "invite")) {
      const { sendAccessLink } = await import("@/lib/auth-links");
      await sendAccessLink(ownerEmail, "invite");
    }
    revalidatePath("/admin/businesses");
    redirect(`/admin/businesses/${b.id}?created=1`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect()
    return fail(e);
  }
}

export async function updateBusinessAction(id: string, _: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const repo = await getRepo();
    const current = await repo.getBusiness(id);
    if (!current) return { ok: false, error: "Business not found." };
    const expiry = str(fd, "linkExpiresAt");
    await repo.updateBusiness(id, {
      name: str(fd, "name") || current.name,
      ownerEmail: z.string().email().parse(str(fd, "ownerEmail").toLowerCase()),
      isActive: bool(fd, "isActive"),
      sendEmailNotifications: bool(fd, "sendEmailNotifications"),
      gatingEnabled: bool(fd, "gatingEnabled"),
      linkExpiresAt: expiry ? new Date(`${expiry}T23:59:59+08:00`).toISOString() : null,
      config: configFromForm(fd, current.config),
    });
    revalidatePath(`/admin/businesses/${id}`);
    revalidatePath(`/r/${id}`);
    return { ok: true, message: "Saved." };
  } catch (e) {
    return fail(e);
  }
}

/** Admin upload of a client's logo or voucher. */
export async function adminUploadImageAction(businessId: string, kind: "logo" | "voucher", fd: FormData): Promise<UploadResult> {
  await requireAdmin();
  const { storeBusinessImage } = await import("@/lib/upload-image");
  return storeBusinessImage(businessId, kind, fd);
}

export async function extendSubscriptionAction(id: string, months: number): Promise<ActionResult> {
  await requireAdmin();
  try {
    const repo = await getRepo();
    const b = await repo.getBusiness(id);
    if (!b) return { ok: false, error: "Business not found." };
    const base = b.linkExpiresAt && new Date(b.linkExpiresAt) > new Date() ? new Date(b.linkExpiresAt) : new Date();
    await repo.updateBusiness(id, { linkExpiresAt: addMonths(base, months).toISOString(), isActive: true });
    revalidatePath(`/admin/businesses/${id}`);
    revalidatePath(`/r/${id}`);
    return { ok: true, message: `Extended by ${months} months.` };
  } catch (e) {
    return fail(e);
  }
}

export async function toggleActiveAction(id: string, isActive: boolean): Promise<ActionResult> {
  await requireAdmin();
  try {
    const repo = await getRepo();
    const before = await repo.getBusiness(id);
    const after = await repo.updateBusiness(id, { isActive });
    // Same as the old system: tell the owner when an active page is switched off.
    if (before?.isActive && !isActive) {
      const { sendRenewalEmail } = await import("@/lib/renewals");
      await sendRenewalEmail(after, "deactivated");
    }
    revalidatePath(`/admin/businesses/${id}`);
    revalidatePath(`/r/${id}`);
    return { ok: true, message: isActive ? "Activated." : "Deactivated." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBusinessAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await (await getRepo()).deleteBusiness(id);
    revalidatePath("/admin/businesses");
    redirect("/admin/businesses?deleted=1");
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e;
    return fail(e);
  }
}

export async function sendPasswordResetAction(email: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    const { sendAccessLink } = await import("@/lib/auth-links");
    const sent = await sendAccessLink(email, "reset");
    return sent ? { ok: true, message: `Login email sent to ${email}.` } : { ok: false, error: `${email} has no login yet. Save the business first.` };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteReviewAction(id: string, businessId: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await (await getRepo()).deleteReview(id);
    const { deleteFeedbackPhotos } = await import("@/lib/feedback-photos");
    await deleteFeedbackPhotos(businessId, id).catch(() => undefined);
    revalidatePath(`/admin/businesses/${businessId}`);
    revalidatePath("/admin/reviews");
    return { ok: true, message: "Review deleted." };
  } catch (e) {
    return fail(e);
  }
}

export async function updateLeadAction(id: string, status: LeadStatus, notes?: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await (await getRepo()).updateLead(id, { status, notes });
    revalidatePath("/admin/leads");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

export async function saveCampaignAction(_: ActionResult | null, fd: FormData): Promise<ActionResult> {
  await requireAdmin();
  try {
    const id = str(fd, "id") || undefined;
    await (await getRepo()).saveCampaign({
      id,
      title: z.string().min(1).max(120).parse(str(fd, "title")),
      body: str(fd, "body"),
      imageUrl: urlOrEmpty.parse(str(fd, "imageUrl")) || null,
      linkUrl: urlOrEmpty.parse(str(fd, "linkUrl")) || null,
      isActive: bool(fd, "isActive"),
    });
    revalidatePath("/admin/campaigns");
    return { ok: true, message: "Campaign saved." };
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCampaignAction(id: string): Promise<ActionResult> {
  await requireAdmin();
  try {
    await (await getRepo()).deleteCampaign(id);
    revalidatePath("/admin/campaigns");
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}
