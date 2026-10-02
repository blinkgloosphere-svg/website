import Image from "next/image";
import { site, whatsappLink } from "@/lib/site";

/** Shown instead of the rating screen when a subscription has ended or is paused. */
export function ExpiredNotice({ businessName, logo }: { businessName: string; logo: string | null }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center backdrop-blur">
      {logo ? (
        <div className="mx-auto mb-6 inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3">
          <Image src={logo} unoptimized={logo.startsWith("http")} alt={businessName} width={240} height={90} className="h-auto max-h-20 w-auto object-contain" />
        </div>
      ) : null}
      <h1 className="text-[26px] font-semibold leading-tight tracking-tight">This review page is paused</h1>
      <p className="mt-3 text-[15px] text-white/60">
        {businessName}&apos;s Blink subscription has ended. Reviews are kept safe and the page returns the moment it is renewed.
      </p>
      <a href={whatsappLink(`Hi ${site.brand}, I'd like to renew the Blink Reviews subscription for ${businessName}.`)} target="_blank" rel="noopener" className="btn btn-brand btn-lg mt-6 w-full">
        Renew on WhatsApp
      </a>
    </section>
  );
}
