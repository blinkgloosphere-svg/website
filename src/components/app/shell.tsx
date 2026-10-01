import Image from "next/image";
import Link from "next/link";
import { AlertTriangle, LogOut } from "@/components/ui/icons";
import { NavLinks, type NavItem } from "./nav-links";

type Props = {
  title: string;
  items: NavItem[];
  preview: boolean;
  userLabel: string;
  children: React.ReactNode;
};

/** Sidebar layout shared by the super admin and the client dashboard. */
export function AppShell({ title, items, preview, userLabel, children }: Props) {
  return (
    <div className="min-h-dvh bg-bg-subtle md:grid md:grid-cols-[240px_1fr]">
      <aside className="flex flex-col border-b border-border bg-white md:sticky md:top-0 md:h-dvh md:border-b-0 md:border-r">
        <div className="flex h-16 items-center justify-between gap-3 border-b border-border px-5">
          <Link href="/" aria-label="Blink home">
            <Image src="/brand/blink-logo-horizontal.png" alt="Blink" width={118} height={28} className="h-7 w-auto" priority />
          </Link>
          <span className="t-small rounded-md bg-bg-muted px-2 py-0.5 font-medium text-fg-secondary">{title}</span>
        </div>
        <NavLinks items={items} />
        <div className="mt-auto border-t border-border p-4">
          <p className="t-small truncate text-fg-tertiary" title={userLabel}>
            {userLabel}
          </p>
          {preview ? null : (
            <form action="/auth/signout" method="post" className="mt-2">
              <button type="submit" className="btn btn-ghost btn-sm -ml-2">
                <LogOut className="size-4" /> Sign out
              </button>
            </form>
          )}
        </div>
      </aside>
      <div className="min-w-0">
        {preview ? (
          <div className="flex items-center gap-2 border-b border-[#f3e2b8] bg-[#fff8e8] px-6 py-2 text-[13px] text-warning">
            <AlertTriangle className="size-4 shrink-0" />
            Preview mode: showing the imported data read-only. Connect Supabase to enable login, editing and new reviews.
          </div>
        ) : null}
        <main className="container-x max-w-[1400px] py-8">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="t-title-2">{title}</h1>
        {description ? <p className="t-ui mt-1 text-fg-secondary">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-5">
      <p className="t-small text-fg-tertiary">{label}</p>
      <p className="mt-1 text-[28px] font-semibold leading-none tracking-tight">{value}</p>
      {hint ? <p className="t-small mt-2 text-fg-secondary">{hint}</p> : null}
    </div>
  );
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="card grid place-items-center p-12 text-center">
      <p className="t-title-3">{title}</p>
      {text ? <p className="t-ui mt-1 max-w-sm text-fg-secondary">{text}</p> : null}
    </div>
  );
}
