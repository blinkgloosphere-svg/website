
export type PlaceSuggestion = {
  placeId: string;
  name: string;
  address: string;
};

export type PlaceDetails = PlaceSuggestion & {
  rating: number | null;
  reviewCount: number | null;
  reviewLink: string;
  mapsUrl: string | null;
};

const KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? "";
export const placesConfigured = () => KEY.length > 0;

/** Google review link for a place. Same format the printed QR codes use. */
export function reviewLinkFor(placeId: string) {
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;
}

/**
 * Sample results used while no Google key is configured, so the tools can be
 * demonstrated end to end.
 */
const SAMPLE: PlaceDetails[] = [
  { placeId: "sample-copper-ladle", name: "Copper Ladle Kitchen", address: "12 Joo Chiat Rd, Singapore", rating: 4.3, reviewCount: 127, reviewLink: reviewLinkFor("sample-copper-ladle"), mapsUrl: null },
  { placeId: "sample-lion-city", name: "Lion City Chicken Rice & Hotpot", address: "Blk 7 Maxwell Rd, Singapore", rating: 4.6, reviewCount: 412, reviewLink: reviewLinkFor("sample-lion-city"), mapsUrl: null },
  { placeId: "sample-glow-skin", name: "Glow Skin Lab", address: "Orchard Central, Singapore", rating: 4.1, reviewCount: 58, reviewLink: reviewLinkFor("sample-glow-skin"), mapsUrl: null },
];

/** Reads Google's error message so the tools can say what is wrong (bad key, API not enabled, billing). */
async function googleError(res: Response, what: string): Promise<Error> {
  let detail = "";
  try {
    const j = (await res.json()) as { error?: { message?: string; status?: string } };
    detail = j.error?.message ?? j.error?.status ?? "";
  } catch {
    /* not JSON */
  }
  return new Error(`Google ${what} failed (${res.status})${detail ? `: ${detail}` : ""}`);
}

type Prediction = {
  placeId: string;
  types?: string[];
  structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
};

/**
 * Business search (Places API New, Autocomplete). `session` groups the typing
 * and the final pick into one billed session, which keeps the cost down.
 */
export async function searchPlaces(query: string, session?: string): Promise<PlaceSuggestion[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  if (!placesConfigured()) {
    return SAMPLE.filter((s) => s.name.toLowerCase().includes(q.toLowerCase())).map(({ placeId, name, address }) => ({ placeId, name, address }));
  }
  const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": KEY },
    body: JSON.stringify({
      input: q,
      includedRegionCodes: ["sg"],
      locationBias: { circle: { center: { latitude: 1.3521, longitude: 103.8198 }, radius: 30000 } },
      ...(session ? { sessionToken: session } : {}),
    }),
    cache: "no-store",
  });
  if (!res.ok) throw await googleError(res, "search");
  const json = (await res.json()) as { suggestions?: Array<{ placePrediction?: Prediction }> };
  const all = (json.suggestions ?? []).map((x) => x.placePrediction).filter((p): p is Prediction => !!p);
  // Prefer businesses over plain street addresses.
  const businesses = all.filter((p) => p.types?.some((t) => t === "establishment" || t === "point_of_interest"));
  return (businesses.length ? businesses : all).map((p) => ({
    placeId: p.placeId,
    name: p.structuredFormat?.mainText?.text ?? "",
    address: p.structuredFormat?.secondaryText?.text ?? "",
  }));
}

export async function placeDetails(placeId: string, session?: string): Promise<PlaceDetails | null> {
  if (!placesConfigured()) return SAMPLE.find((s) => s.placeId === placeId) ?? null;
  const qs = session ? `?sessionToken=${encodeURIComponent(session)}` : "";
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${qs}`, {
    headers: {
      "X-Goog-Api-Key": KEY,
      "X-Goog-FieldMask": "id,displayName,formattedAddress,rating,userRatingCount,googleMapsUri",
    },
    cache: "no-store",
  });
  if (res.status === 404) return null;
  if (!res.ok) throw await googleError(res, "place lookup");
  const p = (await res.json()) as {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
  };
  return {
    placeId: p.id,
    name: p.displayName?.text ?? "",
    address: p.formattedAddress ?? "",
    rating: p.rating ?? null,
    reviewCount: p.userRatingCount ?? null,
    reviewLink: reviewLinkFor(p.id),
    mapsUrl: p.googleMapsUri ?? null,
  };
}

/**
 * How many 5-star reviews are needed to lift `current` (over `count` reviews)
 * to `target`. Returns 0 when already there, null when impossible (target >= 5).
 */
export function fiveStarsNeeded(current: number, count: number, target: number): number | null {
  if (target <= current) return 0;
  if (target >= 5) return null;
  // (current*count + 5n) / (count + n) >= target  =>  n >= count*(target-current)/(5-target)
  return Math.ceil((count * (target - current)) / (5 - target));
}
