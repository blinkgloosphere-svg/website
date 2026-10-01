import { ReviewList } from "@/components/app/bits";
import { PageHeader } from "@/components/app/shell";
import { requireOwnerBusiness } from "@/lib/auth";
import { getRepo } from "@/lib/data";

export default async function FeedbackPage() {
  const business = (await requireOwnerBusiness())!;
  const repo = await getRepo();
  const feedback = await repo.listReviews({ businessId: business.id, maxRating: 3, limit: 200 });
  const withMessage = feedback.filter((r) => r.message.trim());
  return (
    <>
      <PageHeader
        title="Private feedback"
        description="Customers who rated 1 to 3 stars were asked what went wrong instead of being sent to Google. Only you can see these."
      />
      <div className="card overflow-hidden">
        <ReviewList reviews={withMessage} emptyText="No private feedback yet. That's a good sign." />
      </div>
      {feedback.length > withMessage.length ? (
        <p className="t-small mt-3 text-fg-tertiary">{feedback.length - withMessage.length} low ratings had no message.</p>
      ) : null}
    </>
  );
}
