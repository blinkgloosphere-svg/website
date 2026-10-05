"use client";

import { useActionState, useState } from "react";
import { Field, Notice } from "@/components/app/bits";
import { Loader } from "@/components/ui/icons";
import { ReviewLinkField } from "@/components/app/review-link-field";
import { createBusinessAction, type ActionResult } from "@/app/admin/actions";

export function NewBusinessForm({ preview }: { preview: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(createBusinessAction, null);
  const [name, setName] = useState("");
  return (
    <form action={action} className="space-y-5">
      <fieldset className="space-y-5" disabled={preview}>
        <Field label="Business name" htmlFor="name">
          <input id="name" name="name" className="input" required placeholder="Copper Ladle Kitchen" value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Owner email" htmlFor="ownerEmail" hint="This becomes their login. They receive an email to set a password.">
          <input id="ownerEmail" name="ownerEmail" type="email" className="input" required placeholder="owner@business.sg" />
        </Field>
        {/* Picking the business fills the review link, and the name if it is still empty. */}
        <ReviewLinkField initial="" disabled={preview} onPick={(s) => setName((n) => n || s.name)} />
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
