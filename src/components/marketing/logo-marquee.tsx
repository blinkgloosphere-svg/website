import Image from "next/image";
import { getRepo } from "@/lib/data";

type Logo = { id: string; name: string; src: string };

/**
 * Two rows of client logos sliding in opposite directions. Colour logos, no
 * hover effects. Only businesses with a rescued local logo file are shown.
 */
export async function LogoMarquee() {
  const repo = await getRepo();
  const businesses = await repo.listBusinesses({ sort: "name" });
  const seen = new Set<string>();
  const logos: Logo[] = businesses
    .filter((b) => b.config.companyLogoUrl?.startsWith("/logos/"))
    // Internal and test accounts are not clients.
    .filter((b) => !/^blink\b/i.test(b.name.trim()))
    .map((b) => ({ id: b.id, name: b.name, src: b.config.companyLogoUrl as string }))
    // Several outlets of one brand share a logo; show it once.
    .filter((l) => (seen.has(l.src) ? false : (seen.add(l.src), true)));

  if (logos.length === 0) return null;

  const half = Math.ceil(logos.length / 2);
  const rowA = logos.slice(0, half);
  const rowB = logos.slice(half);

  return (
    <section aria-label="Businesses using Blink" className="border-b border-border py-12">
      <p className="t-eyebrow mb-8 text-center">Trusted by {logos.length}+ businesses in Singapore</p>
      <div className="flex flex-col gap-8 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
        <Row logos={rowA} direction="left" />
        <Row logos={rowB} direction="right" />
      </div>
    </section>
  );
}

function Row({ logos, direction }: { logos: Logo[]; direction: "left" | "right" }) {
  const doubled = [...logos, ...logos];
  return (
    <div className="overflow-hidden">
      <div className={`marquee-track ${direction === "left" ? "marquee-left" : "marquee-right"}`}>
        {doubled.map((l, i) => (
          <div key={`${l.id}-${i}`} className="flex h-16 w-[150px] shrink-0 items-center justify-center" title={l.name}>
            <Image
              src={l.src}
              alt={l.name}
              width={150}
              height={64}
              sizes="150px"
              className="h-auto max-h-16 w-auto max-w-[150px] object-contain"
              draggable={false}
              loading="eager"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
