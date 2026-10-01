"use client";

import { useActionState } from "react";
import { Field, Notice } from "@/components/app/bits";
import { ConfigFields } from "@/components/app/config-fields";
import { Loader } from "@/components/ui/icons";
import { toDateInput } from "@/lib/format";
import type { Business } from "@/lib/types";
import { updateBusinessAction, type ActionResult } from "@/app/admin/actions";

export function BusinessEditForm({ business, preview }: { business: Business; preview: boolean }) {
  const [state, action, pending] = useActionState<ActionResult | null, FormData>(updateBusinessAction.bind(null, business.id), null);
  return (
    <form action={action} className="space-y-8">
      <fieldset className="space-y-4" disabled={preview}>
        <legend className="t-title-3 mb-2">Account</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name (internal)" htmlFor="name">
            <input id="name" name="name" className="input" defaultValue={business.name} required />
          </Field>
          <Field label="Owner login email" htmlFor="ownerEmail" hint="Changing this changes who can log in.">
            <input id="ownerEmail" name="ownerEmail" type="email" className="input" defaultValue={business.ownerEmail} required />
          </Field>
          <Field label="Subscription ends" htmlFor="linkExpiresAt" hint="Leave empty for no expiry.">
            <input id="linkExpiresAt" name="linkExpiresAt" type="date" className="input" defaultValue={toDateInput(business.linkExpiresAt)} />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Toggle name="isActive" label="Page is active" hint="Off shows the renewal notice." defaultChecked={business.isActive} />
          <Toggle name="gatingEnabled" label="Smart routing" hint="1 to 3 stars go to private feedback." defaultChecked={business.gatingEnabled} />
          <Toggle name="sendEmailNotifications" label="Email every rating" hint="Feedback emails are always sent." defaultChecked={business.sendEmailNotifications} />
        </div>
      </fieldset>

      <ConfigFields config={business.config} disabled={preview} />

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

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  return (
    <label className="card flex cursor-pointer items-start gap-3 p-3">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1 size-4 accent-ink" />
      <span>
        <span className="t-ui block font-medium">{label}</span>
        <span className="t-small text-fg-tertiary">{hint}</span>
      </span>
    </label>
  );
}
