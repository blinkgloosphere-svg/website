import Link from "next/link";
import { notFound } from "next/navigation";
import { Distribution, Notice, ReviewList, StatusBadge } from "@/components/app/bits";
import { PageHeader, Stat } from "@/components/app/shell";
import { ExternalLink } from "@/components/ui/icons";
import { isPreview } from "@/lib/auth";
import { getRepo } from "@/lib/data";
import { fmtDate, fmtNumber, fmtRating } from "@/lib/format";
import { site } from "@/lib/site";
import { BusinessEditForm } from "./edit-form";
import { QuickActions } from "./quick-actions";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string; tab?: string }> };

export default async function BusinessDetail({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const repo = await getRepo();
  const business = await repo.getBusiness(id);
  if (!business) notFound();
  const [reviews, feedbackCount] = await Promise.all([repo.listReviews({ businessId: id, limit: 50 }), repo.countReviews({ businessId: id, maxRating: 3 })]);
  const preview = isPreview();
  const reviewUrl = `${site.url}/r/${business.id}`;

  return (
    <>
      <PageHeader
        title={business.name}
        description={business.ownerEmail}
        actions={
          <>
            <StatusBadge business={business} />
            <Link href={`/r/${business.id}`} target="_blank" className="btn btn-secondary btn-sm">
              <ExternalLink className="size-4" /> Open review page
            </Link>
          </>
        }
      />
      {sp.created ? <div className="mb-4"><Notice kind="success">Business created. Share the review link below and send the owner their login invite.</Notice></div> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Total reviews" value={fmtNumber(business.totalReviews)} />
        <Stat label="Average rating" value={fmtRating(business.averageRating)} />
        <Stat label="Private feedback" value={fmtNumber(feedbackCount)} hint="1 to 3 stars" />
        <Stat label="Subscription ends" value={fmtDate(business.linkExpiresAt)} hint={business.createdAt ? `Client since ${fmtDate(business.createdAt)}` : undefined} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="t-title-3">Review link and QR code</h2>
            <p className="t-ui mt-1 text-fg-secondary">Printed QR codes point here. The address never changes.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input readOnly value={reviewUrl} className="input font-mono text-[13px]" />
              <Link href={`/admin/businesses/${business.id}/qr`} className="btn btn-primary shrink-0">
                Download QR poster
              </Link>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="t-title-3">Account and subscription</h2>
            <QuickActions business={business} preview={preview} />
          </section>

          <section className="card p-5">
            <h2 className="t-title-3 mb-4">Review page settings</h2>
            <BusinessEditForm business={business} preview={preview} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="t-title-3 mb-4">Rating breakdown</h2>
            <Distribution dist={business.ratingDistribution} total={business.totalReviews} />
          </section>
          <section className="card overflow-hidden">
            <header className="border-b border-border px-5 py-3">
              <h2 className="t-title-3">Latest reviews</h2>
            </header>
            <div className="max-h-[720px] overflow-y-auto">
              <ReviewList reviews={reviews} />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
