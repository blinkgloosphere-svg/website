import { NextResponse } from "next/server";
import { placeDetails, placesConfigured, searchPlaces } from "@/lib/places";

/**
 * GET /api/places?q=term        -> suggestions
 * GET /api/places?id=placeId    -> details (rating, count, review link)
 * The Google key never leaves the server.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q");
  const id = url.searchParams.get("id");
  const session = url.searchParams.get("session") ?? undefined;
  try {
    if (id) {
      const details = await placeDetails(id, session);
      if (!details) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ details, sample: !placesConfigured() });
    }
    const suggestions = await searchPlaces(q ?? "", session);
    return NextResponse.json({ suggestions, sample: !placesConfigured() });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Search failed";
    console.error("[places]", message);
    return NextResponse.json({ error: "Google search is unavailable right now.", detail: message }, { status: 502 });
  }
}
