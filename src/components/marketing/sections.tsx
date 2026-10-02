import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check } from "@/components/ui/icons";
import { faqs, plans, site, whatsappLink } from "@/lib/site";

export function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "We set up your page",
      text: "Send us your logo and Google listing. We build your branded review page and print your QR stand.",
    },
    {
      n: "02",
      title: "Customers scan and rate",
      text: "A customer scans at the counter, picks a star rating, and is routed in one tap. Happy to Google, unhappy to you.",
    },
    {
      n: "03",
      title: "You watch your rating climb",
      text: "Every review and every private message lands in your dashboard. You reply, fix issues and keep the stars up.",
    },
  ];
  return (
    <section id="how-it-works" className="border-b border-border py-20">
      <div className="container-x">
        <div className="max-w-3xl">
          <h2 className="t-title-1">Live in a week. Working every day after.</h2>
          <p className="t-lead mt-4">No app for your customers to install, nothing for your staff to learn. Watch the two-minute film.</p>
        </div>
        <div id="film" className="mt-12 overflow-hidden rounded-[24px] border border-border bg-black shadow-card scroll-mt-24">
          <video
            className="block aspect-video w-full"
            src="/video/blink-promo.mp4"
            poster="/video/blink-promo-poster.jpg"
            controls
            playsInline
            preload="none"
            aria-label="Blink Reviews: how it works, 2 minute film with subtitles"
          />
        </div>
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <li key={s.n} className="card p-7">
              <span className="font-mono text-[13px] text-fg-tertiary">{s.n}</span>
              <h3 className="t-title-3 mt-4">{s.title}</h3>
              <p className="t-ui mt-2 text-fg-secondary">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export function Pricing() {
  return (
    <section id="pricing" className="border-b border-border bg-bg-subtle py-20">
      <div className="container-x">
        <div className="max-w-3xl">
          <h2 className="t-title-1">Simple pricing per outlet.</h2>
          <p className="t-lead mt-4">One upfront price per outlet. Setup, printing and support included.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {plans.map((p) => (
            <div key={p.id} className={`card flex flex-col p-8 ${"featured" in p && p.featured ? "border-ink" : ""}`}>
              <div className="flex items-center justify-between">
                <h3 className="t-title-3">
                  {p.icon ? <span className="mr-1.5" aria-hidden>{p.icon}</span> : null}
                  {p.name}
                </h3>
                {"badge" in p && p.badge ? <span className="badge badge-warning">{p.badge}</span> : null}
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="t-title-1">${p.price}</span>
                <span className="t-ui text-fg-secondary">{p.period}</span>
              </div>
              <p className="t-small mt-1 text-fg-tertiary">{p.note}</p>
              <ul className="mt-7 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="t-ui flex items-start gap-3 text-fg-secondary">
                    <Check className="mt-0.5 size-4 shrink-0 text-fg" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href={whatsappLink(`Hi Blink, I'd like to start the ${p.name} plan for my business.`)}
                target="_blank"
                rel="noopener"
                className={`btn mt-8 ${"featured" in p && p.featured ? "btn-primary" : "btn-secondary"}`}
              >
                {p.cta}
                <ArrowRight className="size-4" aria-hidden />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  return (
    <section className="border-b border-border py-20">
      <div className="container-x grid gap-10 md:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="t-title-1">Questions</h2>
          <p className="t-lead mt-4">Anything else, message us on WhatsApp.</p>
        </div>
        <dl className="divide-y divide-border">
          {faqs.map((f) => (
            <div key={f.q} className="py-6 first:pt-0 last:pb-0">
              <dt className="t-title-3">{f.q}</dt>
              <dd className="t-body mt-2 text-fg-secondary">{f.a}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export function DemoCta() {
  return (
    <section id="demo" className="bg-[#0f1012] py-24 text-white sm:py-28">
      <div className="container-x text-center">
        <h2 className="t-title-1 text-balance">See your review page before you pay a cent.</h2>
        <p className="t-lead mx-auto mt-4 max-w-2xl !text-dark-fg-secondary">
          Send us your business name and we will build a live preview with your logo within one working day.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <a
            href={whatsappLink("Hi Blink, I'd like a demo of Blink Reviews for my business.")}
            target="_blank"
            rel="noopener"
            className="btn btn-brand btn-lg"
          >
            Book a demo on WhatsApp
            <ArrowRight className="size-4" aria-hidden />
          </a>
          <Link href="/tools/qr-code-generator" className="btn btn-lg border-white/20 bg-transparent text-white hover:bg-white/10">
            Try the free QR tool
          </Link>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-bg-subtle">
      <div className="container-x grid gap-10 py-14 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Image src="/brand/blink-logo-horizontal.png" alt="Blink" width={152} height={36} className="h-8 w-auto" />
          <p className="t-ui mt-4 max-w-xs text-fg-secondary">
            Customer reviews, local SEO and search visibility for Singapore businesses.
          </p>
        </div>
        <FooterCol
          title="Product"
          links={[
            ["/#solutions", "Solutions"],
            ["/#how-it-works", "How it works"],
            ["/#pricing", "Pricing"],
          ]}
        />
        <FooterCol
          title="Free tools"
          links={[
            ["/tools/qr-code-generator", "Review QR code generator"],
            ["/tools/rating-calculator", "Rating calculator"],
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            ["/admin", "Client login"],
            ["/privacy", "Privacy"],
            ["/terms", "Terms"],
          ]}
        />
      </div>
      <div className="border-t border-border">
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-5 text-[13px] text-fg-tertiary">
          <span>© {new Date().getFullYear()} {site.brand}. Singapore.</span>
          <span>Google is a trademark of Google LLC. Blink is not affiliated with Google.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="t-small font-medium uppercase tracking-wider text-fg-tertiary">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="t-ui text-fg-secondary hover:text-fg">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
