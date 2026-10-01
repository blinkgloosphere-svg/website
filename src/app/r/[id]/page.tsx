import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRepo } from "@/lib/data";
import { subscriptionState } from "@/lib/types";
import { ReviewFlow } from "./review-flow";
import { ExpiredNotice } from "./expired";
import { PoweredByBlink } from "@/components/ui/powered-by";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const b = await (await getRepo()).getBusiness(id);
  return {
    title: b ? `${b.config.companyName} · Leave a review` : "Leave a review",
    robots: { index: false },
  };
}

export default async function ReviewPage({ params }: Props) {
  const { id } = await params;
  const business = await (await getRepo()).getBusiness(id);
  if (!business) notFound();

  const state = subscriptionState(business);
  const live = state === "active" || state === "expiring";

  return (
    <main className="min-h-dvh bg-[#0d0f1a] px-4 py-8 text-white sm:py-14" style={{ background: "radial-gradient(120% 80% at 50% 0%, #1c1f3a 0%, #0d0f1a 60%)" }}>
      <div className="mx-auto w-full max-w-md">
        {live ? (
          <ReviewFlow
            businessId={business.id}
            config={business.config}
            gatingEnabled={business.gatingEnabled}
          />
        ) : (
          <ExpiredNotice businessName={business.config.companyName} logo={business.config.companyLogoUrl} />
        )}
        <div className="mt-8 flex justify-center">
          <Link href="/" aria-label="Powered by Blink">
            <PoweredByBlink size="sm" />
          </Link>
        </div>
      </div>
    </main>
  );
}
