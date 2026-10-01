import type { Metadata } from "next";
import { RatingCalculator } from "./calculator";

export const metadata: Metadata = {
  title: "Google Rating Calculator",
  description: "See your Google rating and find out exactly how many 5-star reviews you need to reach your target.",
};

export default function RatingCalculatorPage() {
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
          <RatingCalculator />
        </div>
      </div>
    </section>
  );
}
