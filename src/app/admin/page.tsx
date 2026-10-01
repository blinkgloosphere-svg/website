import Link from "next/link";
import { ReviewList, StatusBadge } from "@/components/app/bits";
import { PageHeader, Stat } from "@/components/app/shell";
import { getRepo } from "@/lib/data";
import { fmtDate, fmtNumber, fmtRating } from "@/lib/format";
import { subscriptionState } from "@/lib/types";

export default async function AdminOverview() {
  const repo = await getRepo();
  const [metrics, businesses, recent, leads] = await Promise.all([
    repo.getMetrics(),
    repo.listBusinesses({ sort: "expiry", dir: "asc" }),
    repo.listReviews({ limit: 8 }),
    repo.listLeads(),
  ]);
  const names = new Map(businesses.map((b) => [b.id, b.name]));
  const expiring = businesses.filter((b) => ["expiring", "expired"].includes(subscriptionState(b))).slice(0, 8);
  const newLeads = leads.filter((l) => l.status === "new").length;

  return (
    <>
      <PageHeader title="Overview" description="Everything across all Blink clients." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Stat label="Businesses" value={fmtNumber(metrics.totalBusinesses)} hint={`${metrics.activeBusinesses} active`} />
        <Stat label="Total reviews" value={fmtNumber(metrics.totalReviews)} hint={`${fmtNumber(metrics.reviewsLast30Days)} in the last 30 days`} />
        <Stat label="Average rating" value={fmtRating(metrics.averageRating)} hint="across all reviews" />
        <Stat label="Private feedback" value={fmtNumber(metrics.negativeReviews)} hint="1 to 3 star, kept off Google" />
        <Stat label="New leads" value={fmtNumber(newLeads)} hint="from the free tools" />
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_380px]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="t-title-3">Latest reviews</h2>
            <Link href="/admin/reviews" className="t-ui text-fg-secondary hover:text-fg">
              View all
            </Link>
          </header>
          <ReviewList reviews={recent} businessNames={names} showBusiness />
        </section>

        <section className="card overflow-hidden self-start">
          <header className="flex items-center justify-between border-b border-border px-5 py-3">
            <h2 className="t-title-3">Renewals due</h2>
            <Link href="/admin/businesses?sort=expiry" className="t-ui text-fg-secondary hover:text-fg">
              All
            </Link>
          </header>
          {expiring.length ? (
            <ul className="divide-y divide-border">
              {expiring.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/admin/businesses/${b.id}`} className="t-ui block truncate font-medium hover:underline">
                      {b.name}
                    </Link>
                    <p className="t-small text-fg-tertiary">Ends {fmtDate(b.linkExpiresAt)}</p>
                  </div>
                  <StatusBadge business={b} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-ui p-6 text-center text-fg-tertiary">Nothing expiring in the next 30 days.</p>
          )}
        </section>
      </div>
    </>
  );
}
