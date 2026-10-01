"use client";

import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/app/action-button";
import { Key, Power, Trash } from "@/components/ui/icons";
import type { Business } from "@/lib/types";
import { deleteBusinessAction, extendSubscriptionAction, sendPasswordResetAction, toggleActiveAction } from "@/app/admin/actions";

export function QuickActions({ business, preview }: { business: Business; preview: boolean }) {
  const router = useRouter();
  const refresh = () => router.refresh();
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <ActionButton disabled={preview} action={() => extendSubscriptionAction(business.id, 12)} onResult={refresh}>
        Extend 12 months
      </ActionButton>
      <ActionButton disabled={preview} action={() => extendSubscriptionAction(business.id, 6)} onResult={refresh}>
        Extend 6 months
      </ActionButton>
      <ActionButton disabled={preview} action={() => extendSubscriptionAction(business.id, 1)} onResult={refresh}>
        Extend 1 month
      </ActionButton>
      <ActionButton disabled={preview} action={() => sendPasswordResetAction(business.ownerEmail)}>
        <Key className="size-4" /> Send login email
      </ActionButton>
      <ActionButton
        disabled={preview}
        action={() => toggleActiveAction(business.id, !business.isActive)}
        onResult={refresh}
        confirm={business.isActive ? "Deactivate this page? Customers will see the renewal notice." : undefined}
      >
        <Power className="size-4" /> {business.isActive ? "Deactivate" : "Activate"}
      </ActionButton>
      <ActionButton
        disabled={preview}
        className="btn btn-sm border-[#f3c9c9] bg-[#fff3f3] text-danger"
        confirm={`Delete ${business.name} and all ${business.totalReviews} reviews? This cannot be undone.`}
        action={() => deleteBusinessAction(business.id)}
      >
        <Trash className="size-4" /> Delete
      </ActionButton>
    </div>
  );
}
