"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { BusinessSearch, type Suggestion } from "@/components/tools/business-search";

/**
 * Homepage hook for the rating calculator: search a business here and land on
 * the calculator with its Google rating already loading.
 */
export function RatingCheck() {
  const router = useRouter();

  function pick(s: Suggestion, session: string) {
    const qs = new URLSearchParams({ place: s.placeId });
    if (session) qs.set("s", session);
    router.push(`/tools/rating-calculator?${qs}`);
  }

  return (
    <section aria-labelledby="rating-check-title" className="py-16 sm:py-24">
      <div className="container-x">
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-white px-5 py-14 text-center shadow-[0_24px_60px_-36px_rgba(16,17,20,0.25)] sm:px-10 sm:py-20">
          {/* warm glow behind the headline */}
          <div aria-hidden className="pointer-events-none absolute left-1/2 top-0 h-[340px] w-[720px] max-w-full -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(245,180,0,0.22),transparent)]" />

          <div className="relative">
            <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-[#b7791f]">Free rating calculator</p>
            <h2 id="rating-check-title" className="mx-auto mt-4 max-w-3xl text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.025em] text-fg sm:text-[52px]">
              How many{" "}
              <span className="bg-gradient-to-r from-[#e8a100] to-[#c2570c] bg-clip-text text-transparent">5-star reviews</span> do you need to hit{" "}
              <span className="whitespace-nowrap bg-gradient-to-r from-[#e8a100] to-[#c2570c] bg-clip-text text-transparent">4.9★</span>?
            </h2>

            <ul className="mt-7 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5" aria-label="What you get">
              <Chip icon={<GoogleG />}>Your Google rating</Chip>
              <Chip icon={<StarIcon />}>Your target</Chip>
              <Chip icon={<span className="text-[13px] font-bold text-fg">#</span>}>Reviews you need</Chip>
            </ul>

            <div className="mx-auto mt-9 max-w-2xl">
              <div className="flex flex-col gap-2 rounded-[22px] border border-border bg-white p-2 shadow-[0_12px_32px_-18px_rgba(16,17,20,0.35)] sm:flex-row sm:items-center sm:rounded-full sm:pl-3">
                <div className="min-w-0 flex-1">
                  <BusinessSearch bare onSelect={pick} placeholder="Search your business name" />
                </div>
                <Link href="/tools/rating-calculator" className="btn btn-primary btn-lg shrink-0 sm:rounded-full">
                  Check for free
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
              <p className="t-small mt-3 text-fg-tertiary">Pick your business from the list. Takes about 30 seconds.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-white px-3 text-[13px] font-medium sm:h-10 sm:gap-2 sm:px-4 sm:text-[14px] text-fg shadow-[0_1px_2px_rgba(16,17,20,0.06)]">
      <span className="grid size-5 place-items-center">{icon}</span>
      {children}
    </li>
  );
}

function GoogleG() {
  return (
    <svg viewBox="0 0 48 48" className="size-[18px]" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden>
      <path fill="#F5B400" d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6 6 20.9l1.3-6.7-5-4.7 6.8-.8z" />
    </svg>
  );
}
