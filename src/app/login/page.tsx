import Image from "next/image";
import Link from "next/link";
import { isPreview } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Login" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const preview = isPreview();
  return (
    <main className="grid min-h-dvh place-items-center bg-bg-subtle p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" aria-label="Blink home">
            <Image src="/brand/logo-stacked.png" alt="Blink" width={160} height={120} className="mx-auto h-auto w-32" priority />
          </Link>
          <h1 className="t-title-2 mt-4">Business login</h1>
          <p className="t-ui mt-1 text-fg-secondary">Sign in to see your reviews and manage your page.</p>
        </div>
        <div className="card p-6">
          {preview ? (
            <div className="space-y-4 text-center">
              <p className="t-ui text-fg-secondary">Preview mode. Login is switched on once Supabase is connected. Open the screens directly:</p>
              <div className="flex flex-col gap-2">
                <Link href="/admin" className="btn btn-primary">Super admin</Link>
                <Link href="/dashboard" className="btn btn-secondary">Client dashboard (sample)</Link>
              </div>
            </div>
          ) : (
            <LoginForm next={sp.next ?? "/dashboard"} initialError={sp.error ?? null} />
          )}
        </div>
        <p className="t-small mt-6 text-center text-fg-tertiary">
          Not a client yet?{" "}
          <Link href="/#demo" className="underline">
            Book a demo
          </Link>
        </p>
      </div>
    </main>
  );
}
