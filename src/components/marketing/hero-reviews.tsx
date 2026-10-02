import Image from "next/image";
import { Stars } from "@/components/ui/stars";
import { getClientBrands } from "@/lib/client-brands";
import { getRepo } from "@/lib/data";
import { fmtRating, relative } from "@/lib/format";

type Card = { id: string; name: string; src: string; latest: string | null; average: number; total: number };

/**
 * Two faint rows of review cards drifting in opposite directions behind the
 * hero. Every card is real: a client, its latest 5-star rating and its
 * average, straight from the database. Decorative, so hidden from screen readers.
 */
export async function HeroReviews() {
  const [brands, fives] = await Promise.all([getClientBrands(), getRepo().then((r) => r.listReviews({ minRating: 5, limit: 1000 }))]);

  // Newest 5-star rating per business (the list is newest first).
  const latest = new Map<string, string>();
  for (const r of fives) if (!latest.has(r.businessId)) latest.set(r.businessId, r.createdAt);

  const cards: Card[] = brands
    .filter((b) => b.business.totalReviews >= 5 && b.business.averageRating >= 4)
    .map((b) => ({
      id: b.id,
      name: b.name,
      src: b.src,
      latest: latest.get(b.id) ?? null,
      average: b.business.averageRating,
      total: b.business.totalReviews,
    }))
    .sort((a, b) => (b.latest ?? "").localeCompare(a.latest ?? ""));

  if (cards.length < 8) return null;

  // Alternate so neighbouring brands land in different rows.
  const rowA = cards.filter((_, i) => i % 2 === 0);
  const rowB = cards.filter((_, i) => i % 2 === 1);

  return (
    <div aria-hidden className="hero-reviews pointer-events-none order-last select-none pb-12 sm:absolute sm:inset-x-0 sm:top-1/2 sm:order-none sm:-translate-y-1/2 sm:pb-0">
      <div data-intro style={{ "--d": "420ms" } as React.CSSProperties} className="flex flex-col gap-5">
        <Row cards={rowA} direction="left" />
        <Row cards={rowB} direction="right" />
      </div>
    </div>
  );
}

function Row({ cards, direction }: { cards: Card[]; direction: "left" | "right" }) {
  return (
    <div className="overflow-hidden">
      <div className={`hero-reviews-track ${direction === "left" ? "hero-reviews-left" : "hero-reviews-right"}`}>
        {[...cards, ...cards].map((c, i) => (
          <ReviewCard key={`${c.id}-${i}`} card={c} />
        ))}
      </div>
    </div>
  );
}

/** Styled after a Google review: avatar, name, time, star row. */
function ReviewCard({ card }: { card: Card }) {
  return (
    <div className="flex w-[300px] shrink-0 flex-col gap-3 rounded-2xl border border-border bg-white p-4 text-left shadow-[0_10px_30px_-14px_rgba(16,17,20,0.28)]">
      <div className="flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-white">
          <Image src={card.src} alt="" width={40} height={40} sizes="40px" className="size-full object-contain p-0.5" draggable={false} loading="lazy" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold leading-tight text-fg">{card.name}</p>
          <p className="mt-0.5 text-[12px] leading-tight text-fg-tertiary">{card.latest ? `New 5-star rating · ${relative(card.latest)}` : "5-star rating"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Stars value={5} size={15} className="gap-0.5" />
        <span className="text-[12px] text-fg-secondary">
          {fmtRating(card.average)} average · {card.total.toLocaleString("en-SG")} ratings
        </span>
      </div>
    </div>
  );
}
