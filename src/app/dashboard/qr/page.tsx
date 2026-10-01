import { QrDownload } from "@/components/app/qr-download";
import { PageHeader } from "@/components/app/shell";
import { requireOwnerBusiness } from "@/lib/auth";
import { site, whatsappLink } from "@/lib/site";

export default async function DashboardQrPage() {
  const business = (await requireOwnerBusiness())!;
  return (
    <>
      <PageHeader
        title="QR code and link"
        description="Print it, stick it at the counter, or paste the link into WhatsApp messages and receipts."
        actions={
          <a href={whatsappLink(`Hi ${site.brand}, please print a new QR stand for ${business.config.companyName}.`)} target="_blank" rel="noopener" className="btn btn-secondary btn-sm">
            Order a printed stand
          </a>
        }
      />
      <QrDownload businessName={business.config.companyName} url={`${site.url}/r/${business.id}`} />
    </>
  );
}
