import Image from "next/image";
import Link from "next/link";
import { ArrowRight, MapPin, MessageSquareQuote, Search } from "@/components/ui/icons";
import { site } from "@/lib/site";
import { Stars } from "@/components/ui/stars";

export function Hero() {
  return (
    <section className="border-b border-border">
      <div className="container-x flex flex-col items-center pb-16 pt-14 text-center sm:pt-20">
        <p className="t-eyebrow">{site.tagline}</p>
        <Image
          src="/brand/blink-logo-stacked.png"
          alt="Blink"
          width={987}
          height={772}
          priority
          className="mt-8 h-auto w-[200px] sm:w-[240px]"
        />
        <Stars value={5} size={36} className="mt-6" />
        <h1 className="t-display mt-6 max-w-4xl text-balance">Get seen. Build trust. Grow.</h1>
        <p className="t-lead mt-5 max-w-2xl text-pretty">
          Bring customer reviews, local SEO and search visibility together with Blink.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/#demo" className="btn btn-primary btn-lg">
            Book a demo
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link href="/#solutions" className="btn btn-secondary btn-lg">
            Explore solutions
          </Link>
        </div>
      </div>

      <div className="border-t border-border bg-bg-subtle">
        <div className="container-x grid gap-6 py-8 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
          <Pillar icon={<MessageSquareQuote className="size-5" aria-hidden />} title="Customer reviews">
            Turn real customer feedback into a stronger local reputation.
          </Pillar>
          <Pillar icon={<MapPin className="size-5" aria-hidden />} title="Local SEO">
            Be found by more people in your local area.
          </Pillar>
          <Pillar icon={<Search className="size-5" aria-hidden />} title="Search visibility">
            Show up where it matters and attract the right customers.
          </Pillar>
        </div>
      </div>
    </section>
  );
}

function Pillar({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 sm:px-8 first:sm:pl-0 last:sm:pr-0">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand-soft text-fg">{icon}</span>
      <div>
        <h3 className="t-title-3">{title}</h3>
        <p className="t-ui mt-1 text-fg-secondary">{children}</p>
      </div>
    </div>
  );
}
