import "server-only";
import { getRepo } from "@/lib/data";
import type { Business } from "@/lib/types";

export type ClientBrand = { id: string; name: string; src: string; business: Business };

/** Internal, test and former accounts that must not appear as clients. */
const HIDDEN = /^(blink|purtier|gloosphere)\b/i;

/** Last path segment of a logo URL. Outlets of one brand each store their own copy of the same file. */
const fileKey = (src: string) => decodeURIComponent(src.split("?")[0]).split("/").pop()!.toLowerCase();

/** Brand name without the outlet: "MJL KOREAN FRIED CHICKEN (PLAZA SING)" and "WonderStudioSG.Yishun" collapse to their brand. */
const brandKey = (name: string) =>
  name
    .split(/\s[-–@(]|\(|\.(?=\S)/)[0]
    .toLowerCase()
    .replace(/[^a-z0-9À-ɏḀ-ỿ]+/g, " ")
    .trim();

/**
 * Clients we can show on the marketing site: a rescued logo, not internal, one
 * entry per company (the first outlet by name).
 */
export async function getClientBrands(): Promise<ClientBrand[]> {
  const businesses = await (await getRepo()).listBusinesses({ sort: "name" });
  const seen = new Set<string>();
  const once = (k: string) => (seen.has(k) ? false : (seen.add(k), true));
  return (
    businesses
      // Rescued local files (preview) or the Supabase "logos" bucket (live).
      .filter((b) => {
        const u = b.config.companyLogoUrl ?? "";
        return u.startsWith("/logos/") || u.includes("/storage/v1/object/public/logos/");
      })
      .filter((b) => !HIDDEN.test(b.name.trim()))
      .map((b) => ({ id: b.id, name: b.name, src: b.config.companyLogoUrl as string, business: b }))
      // Several outlets of one brand share a logo; show the brand once.
      .filter((l) => [once(`f:${fileKey(l.src)}`), once(`b:${brandKey(l.name)}`)].every(Boolean))
  );
}
