import Link from "next/link";
import { ReviewList } from "@/components/app/bits";
import { PageHeader } from "@/components/app/shell";
import { requireOwnerBusiness } from "@/lib/auth";
import { getRepo } from "@/lib/data";

const PAGE = 50;

export default async function DashboardReviews({ searchParams }: { searchParams: Promise<{ page?: string; f?: string }> }) {
  const business = (await requireOwnerBusiness())!;
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const filter = sp.f === "neg" ? { maxRating: 3 } : sp.f === "pos" ? { minRating: 4 } : {};
  const repo = await getRepo();
  const [reviews, total] = await Promise.all([
    repo.listReviews({ businessId: business.id, ...filter, limit: PAGE, offset: (page - 1) * PAGE }),
    repo.countReviews({ businessId: business.id, ...filter }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: number, f = sp.f) => `/dashboard/reviews?${new URLSearchParams({ ...(f ? { f } : {}), page: String(p) })}`;

  return (
    <>
      <PageHeader title="Reviews" description={`${total.toLocaleString()} ratings and messages left on your page`} />
      <div className="mb-4 flex gap-1">
        <Link href={href(1, undefined)} className={`btn btn-sm ${!sp.f ? "btn-primary" : "btn-secondary"}`}>All</Link>
        <Link href={href(1, "pos")} className={`btn btn-sm ${sp.f === "pos" ? "btn-primary" : "btn-secondary"}`}>4 to 5 stars</Link>
        <Link href={href(1, "neg")} className={`btn btn-sm ${sp.f === "neg" ? "btn-primary" : "btn-secondary"}`}>1 to 3 stars</Link>
      </div>
      <div className="card overflow-hidden">
        <ReviewList reviews={reviews} />
      </div>
      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <span className="t-small text-fg-tertiary">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 ? <Link href={href(page - 1)} className="btn btn-secondary btn-sm">Previous</Link> : null}
            {page < pages ? <Link href={href(page + 1)} className="btn btn-secondary btn-sm">Next</Link> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
