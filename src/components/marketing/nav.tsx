import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, LogIn, QrCode, Star } from "@/components/ui/icons";
import { nav } from "@/lib/site";

const SOLUTIONS = [
  { href: "/#solutions", title: "Blink Reviews", text: "Review page, QR stand, smart routing and dashboard.", icon: <Star className="size-5" /> },
  { href: "/tools/qr-code-generator", title: "QR code generator", text: "Free Google review QR poster in seconds.", icon: <QrCode className="size-5" /> },
  {
    href: "/tools/rating-calculator",
    title: "Rating calculator",
    text: "How many 5-star reviews you need to hit your goal.",
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M8 18h2M12 18h4" />
      </svg>
    ),
  },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center" aria-label="Blink Reviews home">
          <Image src="/brand/blink-logo-horizontal.png" alt="Blink" width={152} height={36} priority className="h-8 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {/* Solutions: hover or keyboard-focus opens the tools menu */}
          <div className="group relative">
            <Link href="/#solutions" className="t-ui flex items-center gap-1 py-5 text-fg-secondary hover:text-fg group-focus-within:text-fg" aria-haspopup="true">
              Solutions
              <ChevronDown className="size-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180" aria-hidden />
            </Link>
            <div className="invisible absolute left-1/2 top-full z-50 w-[340px] -translate-x-1/2 translate-y-1 opacity-0 transition duration-150 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100">
              <div className="card p-2 shadow-card">
                {SOLUTIONS.map((s) => (
                  <Link key={s.href} href={s.href} className="flex items-start gap-3 rounded-md p-3 hover:bg-bg-subtle focus:bg-bg-subtle focus:outline-none">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-soft text-fg">{s.icon}</span>
                    <span>
                      <span className="t-ui block font-medium text-fg">{s.title}</span>
                      <span className="t-small block text-fg-secondary">{s.text}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          {nav
            .filter((item) => item.label !== "Solutions")
            .map((item) => (
              <Link key={item.href} href={item.href} className="t-ui text-fg-secondary hover:text-fg">
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/admin" className="btn btn-ghost btn-sm" aria-label="Client login">
            <LogIn className="size-4" aria-hidden />
            <span className="hidden sm:inline">Login</span>
          </Link>
          <Link href="/#demo" className="btn btn-primary btn-sm sm:h-10 sm:px-4 sm:text-sm">
            Book a demo
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </header>
  );
}
