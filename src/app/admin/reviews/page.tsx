import Link from "next/link";
import { ReviewList } from "@/components/app/bits";
import { PageHeader } from "@/components/app/shell";
import { Search } from "@/components/ui/icons";
import { getRepo } from "@/lib/data";
import { withFeedbackPhotos } from "@/lib/feedback-photos";

const PAGE = 50;

export default async function AdminReviews({ searchParams }: { searchParams: Promise<{ q?: string; f?: string; page?: string; b?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? 1));
  const filter = sp.f === "neg" ? { maxRating: 3 } : sp.f === "pos" ? { minRating: 4 } : {};
  const query = { ...filter, search: sp.q, businessId: sp.b };
  const repo = await getRepo();
  const [reviews, total, businesses] = await Promise.all([
    repo.listReviews({ ...query, limit: PAGE, offset: (page - 1) * PAGE }),
    repo.countReviews(query),
    repo.listBusinesses(),
  ]);
  const names = new Map(businesses.map((b) => [b.id, b.name]));
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const href = (p: Record<string, string | undefined>) => `/admin/reviews?${new URLSearchParams(Object.fromEntries(Object.entries({ q: sp.q, f: sp.f, b: sp.b, ...p }).filter(([, v]) => v)) as Record<string, string>)}`;

  return (
    <>
      <PageHeader title="Reviews" description={`${total.toLocaleString()} matching`} />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="relative min-w-[260px] flex-1" action="/admin/reviews">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-tertiary" />
          <input name="q" defaultValue={sp.q ?? ""} className="input h-10 pl-9" placeholder="Search name, email or message…" />
          {sp.f ? <input type="hidden" name="f" value={sp.f} /> : null}
          {sp.b ? <input type="hidden" name="b" value={sp.b} /> : null}
        </form>
        <div className="flex gap-1">
          <Link href={href({ f: undefined, page: undefined })} className={`btn btn-sm ${!sp.f ? "btn-primary" : "btn-secondary"}`}>All</Link>
          <Link href={href({ f: "pos", page: undefined })} className={`btn btn-sm ${sp.f === "pos" ? "btn-primary" : "btn-secondary"}`}>4 to 5 stars</Link>
          <Link href={href({ f: "neg", page: undefined })} className={`btn btn-sm ${sp.f === "neg" ? "btn-primary" : "btn-secondary"}`}>Private feedback</Link>
        </div>
        <form action="/admin/reviews">
          {sp.q ? <input type="hidden" name="q" value={sp.q} /> : null}
          {sp.f ? <input type="hidden" name="f" value={sp.f} /> : null}
          <select name="b" defaultValue={sp.b ?? ""} className="select h-10 w-56">
            <option value="">All businesses</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <button type="submit" className="btn btn-secondary btn-sm ml-2">Filter</button>
        </form>
      </div>

      <div className="card overflow-hidden">
        <ReviewList reviews={await withFeedbackPhotos(reviews)} businessNames={names} showBusiness emptyText="No reviews match." />
      </div>

      {pages > 1 ? (
        <div className="mt-4 flex items-center justify-between">
          <span className="t-small text-fg-tertiary">Page {page} of {pages}</span>
          <div className="flex gap-2">
            {page > 1 ? <Link href={href({ page: String(page - 1) })} className="btn btn-secondary btn-sm">Previous</Link> : null}
            {page < pages ? <Link href={href({ page: String(page + 1) })} className="btn btn-secondary btn-sm">Next</Link> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
