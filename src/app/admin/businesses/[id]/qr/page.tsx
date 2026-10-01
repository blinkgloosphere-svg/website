import Link from "next/link";
import { notFound } from "next/navigation";
import { QrDownload } from "@/components/app/qr-download";
import { PageHeader } from "@/components/app/shell";
import { ArrowLeft } from "@/components/ui/icons";
import { getRepo } from "@/lib/data";
import { site } from "@/lib/site";

export default async function BusinessQrPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const business = await (await getRepo()).getBusiness(id);
  if (!business) notFound();
  return (
    <>
      <PageHeader
        title={`QR poster · ${business.name}`}
        actions={
          <Link href={`/admin/businesses/${business.id}`} className="btn btn-ghost btn-sm">
            <ArrowLeft className="size-4" /> Back
          </Link>
        }
      />
      <QrDownload businessName={business.config.companyName} url={`${site.url}/r/${business.id}`} />
    </>
  );
}
