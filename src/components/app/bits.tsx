import Link from "next/link";
import { Stars } from "@/components/ui/stars";
import { fmtDate, relative } from "@/lib/format";
import { subscriptionState, type Business, type Review } from "@/lib/types";

export function StatusBadge({ business }: { business: Pick<Business, "isActive" | "linkExpiresAt"> }) {
  const s = subscriptionState(business);
  const map = {
    active: ["badge-success", "Active"],
    expiring: ["badge-warning", "Expiring soon"],
    expired: ["badge-danger", "Expired"],
    inactive: ["badge-muted", "Inactive"],
  } as const;
  const [cls, label] = map[s];
  return <span className={`badge badge-dot ${cls}`}>{label}</span>;
}

export function RatingPill({ rating }: { rating: number }) {
  const cls = rating >= 4 ? "badge-success" : rating === 3 ? "badge-warning" : "badge-danger";
  return <span className={`badge ${cls}`}>{rating}★</span>;
}

export function ReviewList({ reviews, businessNames, showBusiness = false, emptyText = "No reviews yet." }: { reviews: Review[]; businessNames?: Map<string, string>; showBusiness?: boolean; emptyText?: string }) {
  if (!reviews.length) return <p className="t-ui p-6 text-center text-fg-tertiary">{emptyText}</p>;
  return (
    <ul className="divide-y divide-border">
      {reviews.map((r) => (
        <li key={r.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-start sm:gap-4">
          <div className="flex shrink-0 items-center gap-3 sm:w-44 sm:flex-col sm:items-start sm:gap-1">
            <Stars value={r.rating} size={14} />
            <span className="t-small text-fg-tertiary" title={fmtDate(r.createdAt)}>
              {relative(r.createdAt)}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="t-ui">
              <span className="font-medium text-fg">{r.name || "Anonymous"}</span>
              {r.email ? <span className="text-fg-tertiary"> · {r.email}</span> : null}
              {showBusiness && businessNames ? (
                <>
                  {" "}
                  <span className="text-fg-tertiary">·</span>{" "}
                  <Link href={`/admin/businesses/${r.businessId}`} className="text-fg-secondary underline-offset-2 hover:underline">
                    {businessNames.get(r.businessId) ?? "Deleted business"}
                  </Link>
                </>
              ) : null}
            </p>
            {r.message ? <p className="t-ui mt-1 whitespace-pre-line text-fg-secondary">{r.message}</p> : <p className="t-small mt-1 text-fg-tertiary">{r.rating <= 3 ? "Low rating. Left without writing feedback." : "Rating only, sent to Google."}</p>}
            {r.photos?.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {r.photos.map((src, i) => (
                  <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block size-20 overflow-hidden rounded-lg border border-border bg-bg-subtle" aria-label={`Open photo ${i + 1} from ${r.name || "customer"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed link from private storage */}
                    <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                  </a>
                ))}
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Distribution({ dist, total }: { dist: Record<1 | 2 | 3 | 4 | 5, number>; total: number }) {
  return (
    <ul className="space-y-2">
      {([5, 4, 3, 2, 1] as const).map((s) => {
        const n = dist[s] ?? 0;
        const pct = total ? Math.round((n / total) * 100) : 0;
        return (
          <li key={s} className="flex items-center gap-3 text-[13px]">
            <span className="w-6 text-fg-secondary">{s}★</span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-muted">
              <div className={`h-full ${s >= 4 ? "bg-brand" : s === 3 ? "bg-warning" : "bg-danger"}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="w-16 text-right text-fg-tertiary">
              {n} · {pct}%
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="t-small mt-1 text-fg-tertiary">{hint}</p> : null}
    </div>
  );
}

export function Notice({ kind, children }: { kind: "success" | "error" | "info"; children: React.ReactNode }) {
  const cls = kind === "success" ? "border-[#cdebd9] bg-[#f0faf4] text-success" : kind === "error" ? "border-[#f3c9c9] bg-[#fff3f3] text-danger" : "border-border bg-bg-subtle text-fg-secondary";
  return <div className={`rounded-md border px-3 py-2 text-[13px] ${cls}`}>{children}</div>;
}
