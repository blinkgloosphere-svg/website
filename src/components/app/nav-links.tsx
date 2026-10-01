"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export type NavItem = { href: string; label: string; icon: React.ReactNode; exact?: boolean };

export function NavLinks({ items }: { items: NavItem[] }) {
  const path = usePathname();
  return (
    <nav className="flex gap-1 overflow-x-auto p-3 md:flex-col md:overflow-visible" aria-label="Sections">
      {items.map((it) => {
        const active = it.exact ? path === it.href : path === it.href || path.startsWith(`${it.href}/`);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-md px-3 py-2 text-[14px] font-medium",
              active ? "bg-bg-muted text-fg" : "text-fg-secondary hover:bg-bg-subtle hover:text-fg",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className="text-fg-tertiary [&>svg]:size-4">{it.icon}</span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
