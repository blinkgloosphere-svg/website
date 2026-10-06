"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, Trash } from "@/components/ui/icons";
import { deleteReviewAction } from "@/app/admin/actions";

/** Admin only: removes one review (and its photos) after a second tap to confirm. */
export function DeleteReviewButton({ reviewId, businessId }: { reviewId: string; businessId: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await deleteReviewAction(reviewId, businessId).catch(() => ({ ok: false as const, error: "Could not delete. Try again." }));
    setBusy(false);
    if (!res.ok) return setError(res.error);
    setAsking(false);
    router.refresh();
  }

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className="btn btn-ghost btn-sm shrink-0 text-fg-tertiary hover:text-danger" aria-label="Delete this review">
        <Trash className="size-4" aria-hidden />
        <span className="sr-only sm:not-sr-only">Delete</span>
      </button>
    );
  }
  return (
    <div className="flex shrink-0 flex-col items-end gap-1.5">
      <span className="t-small font-medium text-danger">Delete this review?</span>
      <div className="flex gap-1.5">
        <button type="button" onClick={() => setAsking(false)} disabled={busy} className="btn btn-secondary btn-sm">
          Cancel
        </button>
        <button type="button" onClick={remove} disabled={busy} className="btn btn-sm bg-danger text-white hover:opacity-90">
          {busy ? <Loader className="size-4 animate-spin" /> : null}
          Yes, delete
        </button>
      </div>
      {error ? <span className="t-small text-danger">{error}</span> : null}
    </div>
  );
}
