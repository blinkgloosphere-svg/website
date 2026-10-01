import Image from "next/image";
import Link from "next/link";
import { ArrowRight, LogIn } from "@/components/ui/icons";
import { nav } from "@/lib/site";

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/90 backdrop-blur">
      <div className="container-x flex h-16 items-center justify-between gap-6">
        <Link href="/" className="flex items-center" aria-label="Blink Reviews home">
          <Image src="/brand/logo-horizontal.png" alt="Blink" width={140} height={44} priority className="h-9 w-auto" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Main">
          {nav.map((item) => (
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
