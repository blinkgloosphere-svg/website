"use client";

import { useActionState } from "react";
import { Field, Notice } from "@/components/app/bits";
import { Loader } from "@/components/ui/icons";
import { createBusinessAction, type ActionResult } from "@/app/admin/actions";

export function NewBusinessForm({ preview }: { preview: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createBusinessAction, null);
  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-5" disabled={preview}>
        <Field label="Business name" htmlFor="name">
          <input id="name" name="name" className="input" required placeholder="Copper Ladle Kitchen" />
        </Field>
        <Field label="Owner email" htmlFor="ownerEmail" hint="This becomes their login. They receive an email to set a password.">
          <input id="ownerEmail" name="ownerEmail" type="email" className="input" required placeholder="owner@business.sg" />
        </Field>
        <Field label="Google review link" htmlFor="reviewLink" hint="Find it with the free QR tool, or leave blank and add it later.">
          <input id="reviewLink" name="reviewLink" className="input" placeholder="https://search.google.com/local/writereview?placeid=…" />
        </Field>
        <Field label="Subscription length" htmlFor="months">
          <select id="months" name="months" className="select" defaultValue="12">
            <option value="1">1 month (trial)</option>
            <option value="6">6 months</option>
            <option value="12">12 months</option>
            <option value="24">24 months</option>
          </select>
        </Field>
        <label className="flex items-center gap-3 text-[14px]">
          <input type="checkbox" name="invite" defaultChecked className="size-4 accent-ink" />
          Send the login invitation email now
        </label>
      </fieldset>
      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending || preview} className="btn btn-primary">
          {pending ? <Loader className="size-4 animate-spin" /> : null}
          Create business
        </button>
        {state && !state.ok ? <Notice kind="error">{state.error}</Notice> : null}
        {preview ? <span className="t-small text-fg-tertiary">Disabled in preview mode.</span> : null}
      </div>
    </form>
  );
}
