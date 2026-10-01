import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { BarChart, Inbox, MessageSquareQuote, QrCode, Settings } from "@/components/ui/icons";
import { isPreview, requireOwnerBusiness, viewAsBusinessId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await requireOwnerBusiness();
  const preview = isPreview();
  const viewingAs = business && (await viewAsBusinessId()) === business.id;

  if (!business) {
    return (
      <main className="grid min-h-dvh place-items-center p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="t-title-3">No business linked to this login yet</h1>
          <p className="t-ui mt-2 text-fg-secondary">Ask Blink to connect your account, or sign in with the email your business was registered with.</p>
          <Link href="/login" className="btn btn-secondary mt-5">
            Back to login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <AppShell
      title="Dashboard"
      preview={preview}
      userLabel={business.ownerEmail}
      items={[
        { href: "/dashboard", label: "Overview", icon: <BarChart />, exact: true },
        { href: "/dashboard/reviews", label: "Reviews", icon: <MessageSquareQuote /> },
        { href: "/dashboard/feedback", label: "Private feedback", icon: <Inbox /> },
        { href: "/dashboard/qr", label: "QR code & link", icon: <QrCode /> },
        { href: "/dashboard/settings", label: "Review page", icon: <Settings /> },
      ]}
    >
      {viewingAs ? (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#cfe0ff] bg-[#f0f6ff] px-4 py-2.5 text-[13px] text-[#1e4fa8]">
          <span>
            You are viewing <b>{business.name}</b>&apos;s dashboard as Blink admin. Changes you save here apply to this client.
          </span>
          <a href="/dashboard/exit-view-as" className="btn btn-secondary btn-sm">
            Back to admin
          </a>
        </div>
      ) : null}
      {children}
    </AppShell>
  );
}
