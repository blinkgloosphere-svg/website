import { AppShell } from "@/components/app/shell";
import { BarChart, Inbox, Megaphone, MessageSquareQuote, Users } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const principal = await requireAdmin();
  return (
    <AppShell
      title="Admin"
      preview={principal.preview}
      userLabel={principal.preview ? "Preview (no login)" : principal.user.email ?? "Admin"}
      items={[
        { href: "/admin", label: "Overview", icon: <BarChart />, exact: true },
        { href: "/admin/businesses", label: "Businesses", icon: <Users /> },
        { href: "/admin/reviews", label: "Reviews", icon: <MessageSquareQuote /> },
        { href: "/admin/leads", label: "Leads", icon: <Inbox /> },
        { href: "/admin/campaigns", label: "Campaigns", icon: <Megaphone /> },
      ]}
    >
      {children}
    </AppShell>
  );
}
