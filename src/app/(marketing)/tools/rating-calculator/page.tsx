import type { Metadata } from "next";
import { RatingCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Google Rating Calculator",
  description: "See your Google rating and find out exactly how many 5-star reviews you need to reach your target.",
};

export default async function RatingCalculatorPage({ searchParams }: { searchParams: Promise<{ place?: string; s?: string }> }) {
  const sp = await searchParams;
  // A business picked in the homepage rating check opens here already loaded.
  const initial = sp.place && /^[\w-]{10,300}$/.test(sp.place) ? { placeId: sp.place, session: sp.s && /^[\w-]{8,64}$/.test(sp.s) ? sp.s : "" } : null;
  return (
    <section className="py-14 sm:py-20">
      <div className="container-x">
        <div className="max-w-3xl">
          <p className="t-eyebrow">Free tool</p>
          <h1 className="t-title-1 mt-3">Google Rating Calculator</h1>
          <p className="t-lead mt-4">
            Search your business, see where you stand on Google, and get the exact number of 5-star reviews needed to hit your
            target rating.
          </p>
        </div>
        <div className="mt-12">
          <RatingCalculator initial={initial} />
        </div>
      </div>
    </section>
  );
}
