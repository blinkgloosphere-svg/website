import { SiteNav } from "@/components/marketing/nav";
import { SiteFooter } from "@/components/marketing/sections";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteNav />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
