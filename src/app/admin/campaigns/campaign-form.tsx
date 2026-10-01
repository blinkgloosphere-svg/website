"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/app/action-button";
import { Field, Notice } from "@/components/app/bits";
import { Loader, Trash } from "@/components/ui/icons";
import { deleteCampaignAction, saveCampaignAction, type ActionResult } from "@/app/admin/actions";

export function CampaignForm({ preview }: { preview: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(saveCampaignAction, null);
  return (
    <form action={action} className="space-y-4">
      <fieldset className="space-y-4" disabled={preview}>
        <Field label="Title" htmlFor="title">
          <input id="title" name="title" className="input" required />
        </Field>
        <Field label="Message" htmlFor="body">
          <textarea id="body" name="body" className="textarea min-h-28" />
        </Field>
        <Field label="Image URL (optional)" htmlFor="imageUrl">
          <input id="imageUrl" name="imageUrl" className="input" placeholder="https://…" />
        </Field>
        <Field label="Link (optional)" htmlFor="linkUrl">
          <input id="linkUrl" name="linkUrl" className="input" placeholder="https://…" />
        </Field>
        <label className="flex items-center gap-3 text-[14px]">
          <input type="checkbox" name="isActive" defaultChecked className="size-4 accent-ink" /> Show to clients now
        </label>
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || preview} className="btn btn-primary">
          {pending ? <Loader className="size-4 animate-spin" /> : null}
          Save campaign
        </button>
        {state ? <Notice kind={state.ok ? "success" : "error"}>{state.ok ? state.message : state.error}</Notice> : null}
      </div>
    </form>
  );
}

export function DeleteCampaign({ id, disabled }: { id: string; disabled: boolean }) {
  const router = useRouter();
  return (
    <ActionButton disabled={disabled} confirm="Delete this campaign?" action={() => deleteCampaignAction(id)} onResult={() => router.refresh()} className="btn btn-ghost btn-sm text-danger">
      <Trash className="size-4" /> Delete
    </ActionButton>
  );
}
