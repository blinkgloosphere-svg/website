import Image from "next/image";
import Link from "next/link";

/** Centered Blink card used by the email-link pages. */
export function AuthCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-subtle p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" aria-label="Blink home">
            <Image src="/brand/blink-logo-stacked.png" alt="Blink" width={987} height={772} className="mx-auto h-auto w-28" priority />
          </Link>
          <h1 className="t-title-2 mt-4 text-balance">{title}</h1>
          {description ? <p className="t-ui mt-1 text-fg-secondary">{description}</p> : null}
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </main>
  );
}
