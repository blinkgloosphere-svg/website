"use client";

import { useActionState } from "react";
import { Notice } from "@/components/app/bits";
import { ConfigFields } from "@/components/app/config-fields";
import { Loader } from "@/components/ui/icons";
import type { Business } from "@/lib/types";
import type { ActionResult } from "@/app/admin/actions";
import { saveMyPageAction, uploadImageAction } from "@/app/dashboard/actions";

export function SettingsForm({ business, preview }: { business: Business; preview: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveMyPageAction, null);
  return (
    <form action={action} className="space-y-8">
      <ConfigFields config={business.config} disabled={preview} uploadImage={uploadImageAction} />

      <label className="flex items-start gap-3 text-[14px]">
        <input type="checkbox" name="sendEmailNotifications" defaultChecked={business.sendEmailNotifications} disabled={preview} className="mt-1 size-4 accent-ink" />
        <span>
          <span className="block font-medium">Email me about low ratings</span>
          <span className="t-small text-fg-tertiary">Every 1 to 3 star rating is sent to {business.ownerEmail}.</span>
        </span>
      </label>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || preview} className="btn btn-primary">
          {pending ? <Loader className="size-4 animate-spin" /> : null}
          Save changes
        </button>
        {state ? <Notice kind={state.ok ? "success" : "error"}>{state.ok ? state.message : state.error}</Notice> : null}
        {preview ? <span className="t-small text-fg-tertiary">Editing is disabled in preview mode.</span> : null}
      </div>
    </form>
  );
}
