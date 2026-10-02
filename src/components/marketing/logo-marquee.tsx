import Image from "next/image";
import { getClientBrands } from "@/lib/client-brands";

type Logo = { id: string; name: string; src: string };

/**
 * Two rows of client logos sliding in opposite directions. Colour logos, no
 * hover effects. One logo per company, and each logo sits in only one row.
 */
export async function LogoMarquee() {
  const logos: Logo[] = (await getClientBrands()).map(({ id, name, src }) => ({ id, name, src }));

  if (logos.length === 0) return null;

  const half = Math.ceil(logos.length / 2);
  const rowA = logos.slice(0, half);
  const rowB = logos.slice(half);

  return (
    <section aria-labelledby="clients-title" className="border-b border-border bg-bg-subtle py-20 sm:py-24">
      <div className="container-x mb-12 text-center sm:mb-14">
        <p className="t-eyebrow">Our clients</p>
        <h2 id="clients-title" className="t-title-1 mt-3 text-balance">
          Singapore businesses grow with Blink
        </h2>
        <p className="t-lead mx-auto mt-4 max-w-2xl text-pretty">From restaurants and salons to movers, clinics and repair shops.</p>
      </div>
      <div className="flex flex-col gap-12 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
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
          <div key={`${l.id}-${i}`} className="flex h-20 w-[170px] shrink-0 items-center justify-center" title={l.name}>
            <Image
              src={l.src}
              alt={l.name}
              width={170}
              height={80}
              sizes="170px"
              className="h-auto max-h-20 w-auto max-w-[170px] object-contain"
              draggable={false}
              loading="eager"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
