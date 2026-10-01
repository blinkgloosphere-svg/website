import Link from "next/link";
import { StatusBadge } from "@/components/app/bits";
import { Empty, PageHeader } from "@/components/app/shell";
import { Plus, Search } from "@/components/ui/icons";
import { getRepo } from "@/lib/data";
import { fmtDate, fmtRating } from "@/lib/format";
import { isPreview } from "@/lib/auth";

type Sort = "name" | "expiry" | "reviews" | "rating" | "created";
const SORTS: Array<[Sort, string]> = [
  ["name", "Alphabetical"],
  ["expiry", "Subscription end"],
  ["reviews", "Total reviews"],
  ["rating", "Avg. rating"],
  ["created", "Newest"],
];

export default async function BusinessesPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string; dir?: string }> }) {
  const sp = await searchParams;
  const sort = (SORTS.find(([s]) => s === sp.sort)?.[0] ?? "name") as Sort;
  const dir = sp.dir === "desc" || (!sp.dir && (sort === "reviews" || sort === "rating" || sort === "created")) ? "desc" : "asc";
  const repo = await getRepo();
  const rows = await repo.listBusinesses({ search: sp.q, sort, dir });
  const preview = isPreview();

  const link = (s: Sort) => `/admin/businesses?${new URLSearchParams({ ...(sp.q ? { q: sp.q } : {}), sort: s, dir: s === sort && dir === "asc" ? "desc" : "asc" })}`;

  return (
    <>
      <PageHeader
        title="Businesses"
        description={`${rows.length} shown`}
        actions={
          preview ? null : (
            <Link href="/admin/businesses/new" className="btn btn-primary btn-sm">
              <Plus className="size-4" /> New business
            </Link>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <form className="relative min-w-[260px] flex-1" action="/admin/businesses">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-tertiary" />
          <input name="q" defaultValue={sp.q ?? ""} className="input h-10 pl-9" placeholder="Search by name or email…" />
          <input type="hidden" name="sort" value={sort} />
          <input type="hidden" name="dir" value={dir} />
        </form>
        <div className="flex flex-wrap gap-1">
          {SORTS.map(([s, label]) => (
            <Link key={s} href={link(s)} className={`btn btn-sm ${s === sort ? "btn-primary" : "btn-secondary"}`}>
              {label}
              {s === sort ? <span aria-hidden>{dir === "asc" ? "↑" : "↓"}</span> : null}
            </Link>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <Empty title="No businesses match" text="Try a different search." />
      ) : (
        <div className="card overflow-x-auto">
          <table className="table min-w-[760px]">
            <thead>
              <tr>
                <th>Business</th>
                <th>Reviews</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Expires</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr key={b.id}>
                  <td>
                    <Link href={`/admin/businesses/${b.id}`} className="font-medium hover:underline">
                      {b.name}
                    </Link>
                    <div className="t-small text-fg-tertiary">{b.ownerEmail}</div>
                  </td>
                  <td>{b.totalReviews}</td>
                  <td>{fmtRating(b.averageRating)}</td>
                  <td>
                    <StatusBadge business={b} />
                  </td>
                  <td className="whitespace-nowrap">{fmtDate(b.linkExpiresAt)}</td>
                  <td className="text-right">
                    <div className="inline-flex gap-1">
                      <Link href={`/r/${b.id}`} target="_blank" className="btn btn-ghost btn-sm">
                        Page
                      </Link>
                      <Link href={`/admin/businesses/${b.id}`} className="btn btn-secondary btn-sm">
                        Manage
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
