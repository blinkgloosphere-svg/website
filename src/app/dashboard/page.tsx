import Link from "next/link";
import { Distribution, ReviewList, StatusBadge } from "@/components/app/bits";
import { PageHeader, Stat } from "@/components/app/shell";
import { requireOwnerBusiness } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { daysUntil, fmtDate, fmtNumber, fmtRating } from "@/lib/format";
import { site, whatsappLink } from "@/lib/site";
import { subscriptionState } from "@/lib/types";

export default async function DashboardHome() {
  const business = (await requireOwnerBusiness())!;
  const repo = await getRepo();
  const [recent, feedbackCount, campaigns, recentCount] = await Promise.all([
    repo.listReviews({ businessId: business.id, limit: 6 }),
    repo.countReviews({ businessId: business.id, maxRating: 3 }),
    repo.listCampaigns(true),
    repo.countReviews({ businessId: business.id }),
  ]);
  const state = subscriptionState(business);
  const days = daysUntil(business.linkExpiresAt);

  return (
    <>
      <PageHeader
        title={business.config.companyName}
        description="Your review page at a glance."
        actions={
          <>
            <StatusBadge business={business} />
            <Link href={`/r/${business.id}`} target="_blank" className="btn btn-secondary btn-sm">
              View my review page
            </Link>
          </>
        }
      />

      {state === "expiring" || state === "expired" ? (
        <div className={`mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 ${state === "expired" ? "border-[#f3c9c9] bg-[#fff3f3]" : "border-[#f3e2b8] bg-[#fff8e8]"}`}>
          <p className="t-ui">
            {state === "expired" ? "Your subscription has ended and your review page is paused." : `Your subscription ends in ${days} days, on ${fmtDate(business.linkExpiresAt)}.`}
          </p>
          <a href={whatsappLink(`Hi ${site.brand}, I'd like to renew Blink Reviews for ${business.config.companyName}.`)} target="_blank" rel="noopener" className="btn btn-primary btn-sm">
            Renew on WhatsApp
          </a>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total reviews" value={fmtNumber(recentCount)} />
        <Stat label="Average rating" value={fmtRating(business.averageRating)} hint="from ratings on your page" />
        <Stat label="Private feedback" value={fmtNumber(feedbackCount)} hint="kept off Google" />
        <Stat label="Subscription ends" value={fmtDate(business.linkExpiresAt)} hint={days != null && days > 0 ? `${days} days left` : undefined} />
      </div>

      {campaigns.length ? (
        <section className="mt-6 grid gap-3 md:grid-cols-2">
          {campaigns.map((c) => (
            <article key={c.id} className="card border-brand/40 bg-brand-soft p-5">
              <p className="t-small font-medium uppercase tracking-wider text-warning">From Blink</p>
              <h3 className="t-title-3 mt-1">{c.title}</h3>
              <p className="t-ui mt-1 whitespace-pre-line text-fg-secondary">{c.body}</p>
              {c.linkUrl ? (
                <a href={c.linkUrl} target="_blank" rel="noopener" className="btn btn-primary btn-sm mt-3">
                  Learn more
                </a>
              ) : null}
            </article>
          ))}
        </section>
      ) : null}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="t-title-3">Latest reviews</h2>
            <Link href="/dashboard/reviews" className="t-ui text-fg-secondary hover:text-fg">
              View all
            </Link>
          </header>
          <ReviewList reviews={recent} />
        </section>
        <section className="card self-start p-5">
          <h2 className="t-title-3 mb-4">Rating breakdown</h2>
          <Distribution dist={business.ratingDistribution} total={business.totalReviews} />
        </section>
      </div>
    </>
  );
}
