import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";
import { site } from "@/lib/site";
import { Stars } from "@/components/ui/stars";
import { HeroReviews } from "@/components/marketing/hero-reviews";

export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="relative flex flex-col overflow-hidden">
        <HeroReviews />
        <div className="container-x relative flex flex-col items-center pb-16 pt-14 text-center sm:pb-20 sm:pt-20">
          <p className="t-eyebrow" data-intro style={{ "--d": "0ms" } as React.CSSProperties}>
            {site.tagline}
          </p>
          {/* The intro preloader lands exactly on this block, then hands over to it. */}
          <div data-hero-mark className="mt-8 flex w-[240px] flex-col items-center">
            <Image src="/brand/intro-full.png" alt="Blink" width={1200} height={941} priority className="h-auto w-[240px]" />
            <Stars value={5} size={36} className="mt-6" />
          </div>
          <h1 className="t-display mt-6 max-w-4xl text-balance" data-intro style={{ "--d": "80ms" } as React.CSSProperties}>
            Get seen. Build trust. Grow.
          </h1>
          <p className="t-lead mt-5 max-w-2xl text-pretty" data-intro style={{ "--d": "180ms" } as React.CSSProperties}>
            Bring customer reviews, local SEO and search visibility together with Blink.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3" data-intro style={{ "--d": "280ms" } as React.CSSProperties}>
            <Link href="/#demo" className="btn btn-primary btn-lg">
              Book a demo
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link href="/#film" className="btn btn-secondary btn-lg">
              <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
                <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
              </svg>
              Watch the film
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
