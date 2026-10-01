import Link from "next/link";
import { AppShell } from "@/components/app/shell";
import { BarChart, Inbox, MessageSquareQuote, QrCode, Settings } from "@/components/ui/icons";
import { isPreview, requireOwnerBusiness } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const business = await requireOwnerBusiness();
  const preview = isPreview();

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
      {children}
    </AppShell>
  );
}
