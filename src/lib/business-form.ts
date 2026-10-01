import { z } from "zod";
import type { BusinessConfig } from "@/lib/types";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const urlOrEmpty = z.string().trim().url().or(z.literal(""));
const imageUrl = urlOrEmpty.or(z.string().regex(/^\/logos\//));

export const configSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  companyLogoUrl: imageUrl,
  voucherImageUrl: imageUrl,
  mainHeadline: z.string().trim().min(1).max(160),
  mainSubhead: z.string().trim().max(240),
  positiveHeadline: z.string().trim().min(1).max(160),
  positiveSubhead: z.string().trim().max(240),
  negativeHeadline: z.string().trim().min(1).max(160),
  negativeSubhead: z.string().trim().max(240),
  feedbackSuccessText: z.string().trim().max(240),
  reviewLink: urlOrEmpty,
  facebook: urlOrEmpty,
  instagram: urlOrEmpty,
  website: urlOrEmpty,
});

/** Builds a BusinessConfig from the shared review-page form. */
export function configFromForm(fd: FormData, current: BusinessConfig): BusinessConfig {
  const parsed = configSchema.parse({
    companyName: str(fd, "companyName"),
    companyLogoUrl: str(fd, "companyLogoUrl"),
    voucherImageUrl: str(fd, "voucherImageUrl"),
    mainHeadline: str(fd, "mainHeadline"),
    mainSubhead: str(fd, "mainSubhead"),
    positiveHeadline: str(fd, "positiveHeadline"),
    positiveSubhead: str(fd, "positiveSubhead"),
    negativeHeadline: str(fd, "negativeHeadline"),
    negativeSubhead: str(fd, "negativeSubhead"),
    feedbackSuccessText: str(fd, "feedbackSuccessText"),
    reviewLink: str(fd, "reviewLink"),
    facebook: str(fd, "facebook"),
    instagram: str(fd, "instagram"),
    website: str(fd, "website"),
  });
  const { facebook, instagram, website, ...rest } = parsed;
  const socialLinks = [
    facebook ? { type: "facebook", url: facebook } : null,
    instagram ? { type: "instagram", url: instagram } : null,
    website ? { type: "website", url: website } : null,
  ].filter((s): s is { type: string; url: string } => !!s);
  return { ...current, ...rest, companyLogoUrl: rest.companyLogoUrl || null, voucherImageUrl: rest.voucherImageUrl || null, socialLinks };
}
